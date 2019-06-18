// ------------------------------------------------------------------------
//
// Copyright 2019 WSO2, Inc. (http://wso2.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License
//
// ------------------------------------------------------------------------

import ballerina/http;
import ballerina/io;
import ballerina/log;
import ballerina/mysql;
import ballerina/transactions;
import cellery_hub_api/constants;
import cellery_hub_api/db;
import cellery_hub_api/idp;

# Get Auth Tokens.
#
# + getTokensReq - getTokensReq Parameter Description
# + return - Return Value Description
public function getTokens (http:Request getTokensReq) returns http:Response {
    var queryParams = getTokensReq.getQueryParams();
    var authCode = queryParams.authCode;
    var callbackUrl = queryParams.callbackUrl;

    var tokens = idp:getTokens(authCode, callbackUrl);
    if (tokens is gen:TokensResponse) {
        var accessTokenLength = tokens.accessToken.length();
        var accessTokenForCookie = tokens.accessToken.substring(0, accessTokenLength / 2);
        var accessTokenForResponse = tokens.accessToken.substring(accessTokenLength / 2, accessTokenLength);
        tokens.accessToken = accessTokenForResponse;

        var jsonPayload = json.convert(tokens);
        if (jsonPayload is json) {
            http:Response getTokensRes = new;
            getTokensRes.statusCode = http:OK_200;
            getTokensRes.setJsonPayload(untaint jsonPayload);
            getTokensRes.setHeader(constants:SET_COOKIE_HEADER,
                io:sprintf("chpat=%s; Secure; HttpOnly; Path=/", accessTokenForCookie));
            return getTokensRes;
        } else {
            log:printError("Failed to convert tokens response to JSON", err = jsonPayload);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Failed to fetch tokens from the IdP", err = tokens);
        return buildUnknownErrorResponse();
    }
}

# Search based on organization name
#
# + listOrgsReq - Received query parameters
# + return - http response which cater to the request
public function listOrgs(http:Request listOrgsReq, string orgName, int offset, int resultLimit) returns http:Response {
    json | error res = db:searchOrganizations(orgName, offset, resultLimit);
    if (res is json) {
        log:printDebug(io:sprintf("Received json payload for org name \'%s\'", orgName));
        return buildSuccessResponse(jsonResponse = res);
    } else {
        log:printError("Unable to perform search on organizations", err = res);
        return buildUnknownErrorResponse();
    }
}

# Create a new organization
#
# + createOrgReq - received query parameters
# + createOrgsBody - received request body
# + return - http response which cater to the request
public function createOrg(http:Request createOrgReq, gen:OrgCreateRequest createOrgsBody) returns http:Response {
    if (createOrgReq.hasHeader(constants:AUTHENTICATED_USER)) {
        boolean | error isMatch = createOrgsBody.orgName.matches("^[a-z0-9]+(-[a-z0-9]+)*$");
        if (isMatch is boolean){
            if (isMatch) {
                log:printDebug(io:sprintf("\'%s\' is a valid organization name", createOrgsBody.orgName));
                string userId = createOrgReq.getHeader(constants:AUTHENTICATED_USER);
                if (createOrgsBody.defaultVisibility == "") {
                    createOrgsBody.defaultVisibility = constants:DEFAULT_IMAGE_VISIBILITY;
                }
                http:Response ? resp = ();
                transaction {
                    var transactionId = transactions:getCurrentTransactionId();
                    log:printDebug("Started transaction " + transactionId + " for creating organization " + createOrgsBody.orgName);

                    json|error orgRes = db:insertOrganization(userId, createOrgsBody);
                    if (orgRes is error) {
                        log:printError(io:sprintf("Unexpected error occured while inserting organization %s", untaint createOrgsBody.orgName), err = orgRes);
                        abort;
                    } else {
                        log:printDebug(io:sprintf("New organization \'%s\' added to REGISTRY_ORGANIZATION. Author : %s", createOrgsBody.orgName, userId));
                        resp = addOrgUserMapping(userId, createOrgsBody.orgName, untaint constants:ROLE_ADMIN);
                    }
                } onretry {
                    log:printDebug(io:sprintf("Retrying creating organization \'%s\' for transaction %s", createOrgsBody.orgName,
                    transactions:getCurrentTransactionId()));
                } committed {
                    log:printDebug(io:sprintf("Creating Organization \'%s\' successful for transaction %s", createOrgsBody.orgName,
                    transactions:getCurrentTransactionId()));
                } aborted {
                    log:printError(io:sprintf("Creating Organization \'%s\' aborted for transaction %s", createOrgsBody.orgName,
                    transactions:getCurrentTransactionId()));
                }
                return resp ?: buildUnknownErrorResponse();
            } else {
                log:printError(io:sprintf("Insertion denied : \'%s\' is an invalid organization name", createOrgsBody.orgName));
                return buildErrorResponse(http:METHOD_NOT_ALLOWED_405, constants:API_ERROR_CODE, "Unable to create organization",
                "Organization name is not valid");
            }
        } else {
            log:printError("Unable to create organization", err = isMatch);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Unauthenticated request for createOrg: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to create organization",
                                                            "Unauthenticated request. Auth token is not provided");
    }
}

public function getOrg(http:Request getOrgReq, string orgName) returns http:Response {
    json | error res = db:getOrganization(orgName);
    if (res is json) {
        if (res != null) {
            log:printDebug(io:sprintf("Successfully fetched organization \'%s\'", orgName));
            error? err = updatePayloadWithUserInfo(untaint res, "author");
            if (err is error) {
                log:printError("Error occured while adding userInfo to getOrg response", err = err);
                return buildUnknownErrorResponse();
            } else {
                log:printDebug("Successfully modified getOrg response with user info");
                return buildSuccessResponse(jsonResponse = res);
            }
        } else {
            string errDes = io:sprintf("There is no organization named \'%s\'", orgName);
            log:printError("Unable to fetch organization" + " : " + errDes);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, "Unable to fetch organization", errDes);
        }
    } else {
        log:printError("Unable to fetch organization", err = res);
        return buildUnknownErrorResponse();
    }
}

public function getImageByImageName(http:Request getImageRequest, string orgName, string imageName) returns http:Response {
    log:printDebug("Searching images for organization \'" + orgName + "\' imageName : " + imageName);
    table<gen:Image> | error imageResults;
    if (getImageRequest.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = getImageRequest.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug("get Image request with authenticated User : " + userId);
        imageResults = db:getUserImage(orgName, imageName, userId);
    } else {
        log:printDebug("get Image request without an authenticated user");
        imageResults = db:getPublicImage(orgName, imageName);
    }

    if (imageResults is table<gen:Image>) {
        log:printDebug("Number of results found for search : " + imageResults.count());
        if (imageResults.count() == 0) {
            string errMsg = "No image found with given image name and organization";
            log:printError(errMsg);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, errMsg, errMsg);
        } else if (imageResults.count() > 1) {
            log:printError("Found more than one result for image GET: Number of results : " + imageResults.count());
            return buildUnknownErrorResponse();
        }
        if (imageResults.hasNext()) {
            gen:Image image = <gen:Image>imageResults.getNext();
            imageResults.close();
            table<gen:StringRecord> | error keywordsResult = db:getImageKeywords(image.imageId);
            string[] keywords = [];
            if (keywordsResult is table<gen:StringRecord>) {
                log:printDebug("Recieved results for keywords for image size: " + keywordsResult.count());
                int keyWorkdsCount = 0;
                while (keywordsResult.hasNext()) {
                    io:println(keyWorkdsCount);
                    gen:StringRecord keyword = <gen:StringRecord>keywordsResult.getNext();
                    keywords[keyWorkdsCount] = keyword.value;
                    keyWorkdsCount += 1;
                }
                keywordsResult.close();
            } else {
                log:printError("Error while converting payload to json. Labels will be empty : image ID :" + imageName, err = keywordsResult);
            }
            gen:ImageResponse imageResponse = {
                imageId: image.imageId,
                orgName: image.orgName,
                imageName: image.imageName,
                description: image.description,
                firstAuthor: image.firstAuthor,
                visibility: image.visibility,
                pushCount: image.pushCount,
                pullCount: image.pullCount,
                keywords: keywords
            };
            json | error resPayload =  json.convert(imageResponse);
            if (resPayload is json) {
                return buildSuccessResponse(jsonResponse = resPayload);

            } else {
                log:printError("Error while retriving image keywords" + imageName, err = resPayload);
            }

        }
    } else {
        log:printError("Error while retriving image" + imageName, err = imageResults);
    }
    return buildUnknownErrorResponse();
}

# Search all artifacts with given image and artifact version in a given organization
#
# + offset - offset value
# + resultLimit - resultLimit value
# + getImageRequest - recevied getImage request
# + orgName - Organization name
# + imageName - Image Name
# + artifactVersion - Exact Artifact version or a regex of artifact version
# + return - Return Value Description
public function getArtifactsOfImage(http:Request getImageRequest, string orgName, string imageName, string artifactVersion,
int offset, int resultLimit) returns http:Response {

    log:printDebug("Listing artifacts for organization \'" + orgName + "\' imageName : " + imageName + ", version: " + artifactVersion
    + ", offset: " + offset + ", limit: " + resultLimit);

    table<gen:ArtifactListResponse> | error artifactListResults;

    if (getImageRequest.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = getImageRequest.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug("List artifacts of image request with authenticated User : " + userId);
        artifactListResults = db:getArtifactsOfUserImage(orgName, imageName, userId, artifactVersion, offset, resultLimit);
    } else {
        log:printDebug("List artifacts of image request without an authenticated user");
        artifactListResults = db:getArtifactsOfPublicImage(orgName, imageName, artifactVersion, offset, resultLimit);
    }

    if (artifactListResults is table<gen:ArtifactListResponse>) {
        log:printDebug("Number of results found for list image ======== : " + artifactListResults.count());
        gen:ArtifactListResponse[] responseArray = [];
        int counter = 0;
        gen:ArtifactListArrayResponse response = {
            count: 0,
            data: responseArray
        };

        if(artifactListResults.count() == 0) {
            log:printError("No image found with given image name and organization");
        } else {
            log:printError(io:sprintf("Found %d result(s) for artifact list", artifactListResults.count()));
            string artifactImageId = "";
            while (artifactListResults.hasNext()) {
                gen:ArtifactListResponse result = <gen:ArtifactListResponse> artifactListResults.getNext();
                responseArray[counter] = result;
                counter += 1;
            }
        }

        response.count = artifactListResults.count();
        response.data = responseArray;
        artifactListResults.close();
        json | error resPayload =  json.convert(response);
        if (resPayload is json) {
            log:printInfo(resPayload.toString());
            return buildSuccessResponse(jsonResponse = resPayload);
        } else {
            log:printError("Error while converting payload to json" + imageName, err = resPayload);
            return buildUnknownErrorResponse();
        }

    } else {
        log:printError("Error while retriving image" + imageName, err = artifactListResults);
        return buildUnknownErrorResponse();
    }
}

public function getArtifact (http:Request getArtifactReq, string orgName, string imageName, string artifactVersion) returns http:Response {
    json | error res;
    if (getArtifactReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = getArtifactReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("get Artifact request with authenticated User : %s", userId));
        res = db:getUserArtifact(userId, orgName, imageName, artifactVersion);
    } else {
        log:printDebug("get Artifact request without an authenticated user");
        res = db:getPublicArtifact(orgName, imageName, artifactVersion);
    }
    if (res is json) {
        if (res != null) {
            log:printDebug(io:sprintf("Successfully fetched artifact \'%s/%s:%s\' ", orgName, imageName, artifactVersion));
            string userId = res.lastAuthor.toString();
            log:printDebug("Last Author\'s User ID :"+ userId);
            error? err = updatePayloadWithUserInfo(untaint res, "lastAuthor");
            if (err is error) {
                log:printError("Error occured while adding userInfo to getArtifact response", err = err);
                return buildUnknownErrorResponse();
            } else {
                log:printDebug(io:sprintf("Successfully modified getArtifact response for user id \'%s\'", userId));
                return buildSuccessResponse(jsonResponse = res);
            }
        } else {
            string errMsg = "Unable to fetch artifact. ";
            string errDes = io:sprintf("There is no artifact named \'%s/%s:%s\'" ,orgName, imageName, artifactVersion);
            log:printError(errMsg + errDes);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, errMsg, errDes);
        }
    } else {
        log:printError("Unable to fetch artifact", err = res);
        return buildUnknownErrorResponse();
    }
}


public function getOrganizationUsers(http:Request _orgUserRequest, string orgName, int offset, int resultLimit)
returns http:Response {

    table<gen:User> | error userResults;

    if (_orgUserRequest.hasHeader(constants:AUTHENTICATED_USER)) {
        gen:UserResponse[] users = [];
        int userCount = 0;
        string userId = _orgUserRequest.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("get organization request with authenticated User : %s, for organization : ",
        userId, orgName));
        userResults = db:getMemberOrgsUsers(userId, orgName, offset, resultLimit);
        if (userResults is table<gen:User>) {
            log:printDebug(io:sprintf("Number of users in the organization : %d", userResults.count()));
            int counter = 0;
            while (userResults.hasNext()) {
                // TODO: do this parallelly when there are multiple users in an organization.
                gen:User user = <gen:User> userResults.getNext();
                log:printDebug(io:sprintf("Retriving user info for org, user: %s" , user.userId));
                idp:UserInfo? | error userinfoResponse = idp:getUserInfo(untaint user.userId);

                if (userinfoResponse is idp:UserInfo) {
                    gen:UserResponse userResponse = {
                        userId: user.userId,
                        displayName: userinfoResponse.displayName,
                        firstName: userinfoResponse.firstName,
                        lastName: userinfoResponse.lastName,
                        email: userinfoResponse.email,
                        roles: user.roles
                    };
                    users[counter] = userResponse;
                    counter += 1;
                } else {
                    log:printError(io:sprintf("Error while retriving user info for user %s", user.userId),
                    err = userinfoResponse);
                }
            }
            userResults.close();
            table<gen:Count> | error countResults = db:getMemberCountOfOrg(orgName);
            if (countResults is table<gen:Count>) {
                if (countResults.hasNext()) {
                    gen:Count countFromDB = <gen:Count> countResults.getNext();
                    userCount = countFromDB.count;
                }
                countResults.close();
            }
            gen:UserListResponse userInfoListResponse = {
                count: userCount,
                users: users
            };
            json | error resPayload =  json.convert(userInfoListResponse);
            if (resPayload is json) {
                log:printInfo(resPayload.toString());
                return buildSuccessResponse(jsonResponse = resPayload);
            } else {
                log:printError("Error while converting payload to json for organization's user request", err = resPayload);
                return buildUnknownErrorResponse();
            }
        } else {

            log:printError(io:sprintf("Error occured while retriving users from DB for organization %s : user %s",
            orgName, userId));
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("get org user request without an authenticated user");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to fetch organization users",
        "Unauthenticated request. No valid token is not provided");
    }
}

# Search all organizations the user is a member of.
#
# + getUserOrgsReq - received request which contains header
# + userId - userId of user whose organizations are being search
# + orgName - regex for search organization
# + offset - offset value
# + resultLimit - resultLimit value
# + return - http response which cater to the request
public function getUserOrgs (http:Request getUserOrgsReq, string userId,  string orgName, int offset, int resultLimit)
returns http:Response {
    if (getUserOrgsReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string apiUserId = getUserOrgsReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("User %s is fetching organizations of user with the userId %s for orgName \'%s\'",
        apiUserId, userId, orgName));
        json | error res = db:searchUserOrganizations(userId, apiUserId, orgName, offset, resultLimit);
        if (res is json) {
            log:printDebug(io:sprintf("Received json payload for userId %s and org name \'%s\'",userId, orgName));
            return buildSuccessResponse(jsonResponse = res);
        } else {
            log:printError("Unable to perform search on user\'s organizations", err = res);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Unauthenticated request for getUserOrgs: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to retrieve user\'s organizations",
                                                            "Unauthenticated request. Auth token is not provided");
    }
}

# Search all images belong to a given organization
#
# + listOrgImagesReq - received request which contains header 
# + orgName - organization name which seaerching images should belong to
# + imageName - regex for search images
# + orderBy - orderBy enum value 
# + offset - offset value 
# + resultLimit - esultLimit value 
# + return - http response which cater to the request
public function listOrgImages (http:Request listOrgImagesReq, string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns http:Response {
    log:printDebug(io:sprintf("Listing images for orgName : %s, imageName : %s, orderBy : %s, offset : %d, limit : %d, ", orgName, 
    imageName, orderBy, offset, resultLimit));
    json | error orgImagesListResult;
    if (listOrgImagesReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = listOrgImagesReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("List org images request with an authenticated user : %s", userId));        
        orgImagesListResult = db:getUserImagesOfORG(userId, orgName, imageName, orderBy, offset, resultLimit);
    } else {
        log:printDebug("List org images request with an unauthenticated user");
        orgImagesListResult = db:getPublicImagesOfORG(orgName, imageName, orderBy, offset, resultLimit);
    }
    if (orgImagesListResult is json) {
        return buildSuccessResponse(jsonResponse = orgImagesListResult);
    }
    else {
        log:printError(io:sprintf("Error occured while retrieving images with name \'%s\' for organization \'%s\'", imageName, orgName), 
        err = orgImagesListResult);
        return buildUnknownErrorResponse();
    }
}
