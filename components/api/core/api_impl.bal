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
import ballerina/sql;
import ballerina/encoding;

# Get Auth Tokens.
#
# + getTokensReq - getTokensReq Parameter Description
# + return - Return Value Description
public function getTokens(http:Request getTokensReq) returns http:Response {
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

# Revoke a token.
#
# + revokeTokenReq - getTokensReq Parameter Description
# + return - Return Value Description
public function revokeToken(http:Request revokeTokenReq, boolean isPortalToken) returns http:Response {

    if (isPortalToken) {
        if(revokeTokenReq.hasHeader(constants:CONSTRUCTED_TOKEN)) {
            var revokeResponse = idp:revokeToken(revokeTokenReq.getHeader(constants:CONSTRUCTED_TOKEN), config:getAsString("idp.oidc.clientid"),
            config:getAsString("idp.oidc.clientsecret"));
            if (revokeResponse is error) {
                log:printError("Error occured while invoking revocation endpoint", err = revokeResponse);
                    return buildErrorResponse(http:INTERNAL_SERVER_ERROR_500, constants:API_ERROR_CODE, 
                    "Error occured while invoking revoke endpoint", "Error occured while invoking revoke endpoint");
            } else {
                return buildSuccessResponse();
            }
        }
        return buildErrorResponse(http:INTERNAL_SERVER_ERROR_500, constants:API_ERROR_CODE, 
            "No valid token found in the get request", "Error occured while invoking revoke endpoint");
    } else if (!revokeTokenReq.hasHeader(constants:AUTHENTICATED_USER)) {
            return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, 
            "Valid username is not found", "Either token is invalid or not present"); 
    } else {
        json | error body = revokeTokenReq.getJsonPayload();
        if (body is error) {
            log:printError("Did not recieve a body in revoke post request", err = body);
            return buildUnknownErrorResponse();
        } else {
            string | error token = string.convert(body.token);
            if (token is error) {
                log:printError("Error occured while converting revoke body to token", err = token);
                return buildUnknownErrorResponse();
            } else {
                var validateUsernameResponse = idp:validateUsername(token, revokeTokenReq.getHeader(constants:AUTHENTICATED_USER));
                if (validateUsernameResponse is error) {
                    log:printError("Error occured while invoking revocation endpoint", err = validateUsernameResponse);
                    return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, 
                    "Error occured while validating username", "Error occured while validating username");
                }
                var revokeResponse = idp:revokeToken(token, config:getAsString("idp.jwt.bearer.grant.clientid"),
                config:getAsString("idp.jwt.bearer.grant.clientsecret"));
                if (revokeResponse is error) {
                    log:printError("Error occured while invoking revocation endpoint", err = revokeResponse);
                    return buildErrorResponse(http:INTERNAL_SERVER_ERROR_500, constants:API_ERROR_CODE, 
                    "Error occured while invoking revoke endpoint", "Probably due to invalid session");
                } else {
                    return buildSuccessResponse();
                }
            }
        }        
    } 
}

# Get Auth Tokens using JWT grant type.
#
# + getTokensReq - JWT Parameter Description
# + return - Return Value Description
public function exchangeTokensWithJWTGrant(http:Request getTokensReq) returns http:Response {

    if (!getTokensReq.hasHeader(constants:AUTHENTICATED_USER)) {
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, 
        "Unable exchange token since no authenticated user found", "Unauthenticated request. Auth token is not provided");
    }

    string userId = getTokensReq.getHeader(constants:AUTHENTICATED_USER);
    json | error body = getTokensReq.getJsonPayload();
    if (body is error) {
        log:printError("Did not recieve a body in token exchange reqeust", err = body);
        return buildUnknownErrorResponse();
    } else {
        string | error jwt = string.convert(body["jwt"]);
        if (jwt is error) {
            log:printError("Error while extracting jwt from request body", err = jwt);
            return buildUnknownErrorResponse();
        } else {
            log:printDebug("JWT token extracted : " + jwt);
            var tokens = idp:exchangeJWTWithToken(jwt, userId);
            if (tokens is gen:TokensResponse) {
                var jsonPayload = json.convert(tokens);
                if (jsonPayload is json) {
                    return buildSuccessResponse(jsonResponse = jsonPayload);
                } else {
                    log:printError("Failed to convert tokens response to JSON", err = jsonPayload);
                    return buildUnknownErrorResponse();
                }
            } else {
                log:printError("Failed to exchange tokens from the IdP", err = tokens);
                return buildUnknownErrorResponse();
            }

        }
    }
}

# Search based on organization name
#
# + listOrgsReq - Received query parameters
# + return - http response which cater to the request
public function listOrgs(http:Request listOrgsReq, string orgName, int offset, int resultLimit) returns http:Response {
    log:printDebug(io:sprintf("Listing organizations for orgName : %s with offset : %d, limit : %d, ", orgName, offset, resultLimit));
    json | error orgsRes;
    if (listOrgsReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = listOrgsReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("list organizations request with an authenticated User : %s", userId));
        orgsRes = db:searchOrganizationsWithAuthenticatedUser(orgName, userId, offset, resultLimit);
    } else {
        log:printDebug("list organizations request with an unauthenticated User");
        orgsRes = db:searchOrganizationsWithoutAuthenticatedUser(orgName, offset, resultLimit);
    }
    if (orgsRes is json) {
        log:printDebug(io:sprintf("Received json payload for org name \'%s\' : %s", orgName, orgsRes));
        return buildSuccessResponse(jsonResponse = orgsRes);
    } else {
        log:printError("Unable to perform search on organizations", err = orgsRes);
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
        boolean | error isOrgAvailable = db:getOrganizationAvailability(createOrgsBody.orgName);
        if (isOrgAvailable is boolean && !isOrgAvailable) {
            boolean | error isMatch = createOrgsBody.orgName.matches("^[a-z0-9]+(-[a-z0-9]+)*$");
            if (isMatch is boolean) {
                if (isMatch) {
                    log:printDebug(io:sprintf("\'%s\' is a valid organization name", createOrgsBody.orgName));
                    string userId = createOrgReq.getHeader(constants:AUTHENTICATED_USER);
                    if (createOrgsBody.defaultVisibility == "") {
                        createOrgsBody.defaultVisibility = constants:DEFAULT_IMAGE_VISIBILITY;
                    }
                    http:Response? resp = ();
                    transaction {
                        var transactionId = transactions:getCurrentTransactionId();
                        log:printDebug("Started transaction " + transactionId + " for creating organization " + createOrgsBody.orgName);

                        json | error orgRes = db:insertOrganization(userId, createOrgsBody);
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
            }
        } else if (isOrgAvailable is boolean && isOrgAvailable) {
            log:printError(io:sprintf("Organization creation failed : orgName \'%s\' is already taken", createOrgsBody.orgName));
            return buildErrorResponse(http:CONFLICT_409, constants:ENTRY_ALREADY_EXISTING_ERROR_CODE, "Unable to create organization",
            "Organization name is already taken");
        } else if (isOrgAvailable is error) {
            log:printError("Error occured while checking the orgName availability", err = isOrgAvailable);
        }
        return buildUnknownErrorResponse();
    } else {
        log:printError("Unauthenticated request for createOrg: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to create organization",
        "Unauthenticated request. Auth token is not provided");
    }
}

public function getOrg(http:Request getOrgReq, string orgName) returns http:Response {
    string userId = "";
    if (getOrgReq.hasHeader(constants:AUTHENTICATED_USER)) {
        userId = getOrgReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("Fetching data of organization \'%s\' by authenticated user %s", orgName, userId));
    } else {
        log:printDebug(io:sprintf("Fetching data of organization \'%s\' by unauthenticated user", orgName));
    }

    json | error res = db:getOrganization(orgName, userId);
    if (res is json) {
        if (res != null) {
            log:printDebug(io:sprintf("Successfully fetched organization \'%s\' for user \'%s\'", orgName, userId));
            error? err = updatePayloadWithUserInfo(untaint res, "firstAuthor");
            if (err is error) {
                log:printError(io:sprintf("Error occured while adding authorInfo to getOrg response for organization \'%s\'", orgName),
                err = err);
                return buildUnknownErrorResponse();
            } else {
                log:printDebug(io:sprintf("Completed the modification of getOrg response for organization \'%s\' with author info",
                orgName));
                return buildSuccessResponse(jsonResponse = res);
            }
        } else {
            string errDes = io:sprintf("There is no organization named \'%s\'", orgName);
            log:printError(io:sprintf("Unable to fetch organization. \'%s\'", errDes));
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
        log:printDebug(io:sprintf("get Image request with authenticated User : %s", userId));
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
                    gen:StringRecord keyword = <gen:StringRecord>keywordsResult.getNext();
                    keywords[keyWorkdsCount] = keyword.value;
                    keyWorkdsCount += 1;
                }
                keywordsResult.close();
            } else {
                log:printError("Error while converting payload to json. Labels will be empty : image ID :" + imageName, err = keywordsResult);
            }
            string description = "";
            if (!(image.description is ())) {
                description = encoding:byteArrayToString(<byte[]>image.description);
            }
            gen:ImageResponse imageResponse = {
                imageId: image.imageId,
                orgName: image.orgName,
                imageName: image.imageName,
                summary: image.summary,
                description: description,
                firstAuthor: image.firstAuthor,
                visibility: image.visibility,
                pushCount: image.pushCount,
                pullCount: image.pullCount,
                keywords: keywords,
                userRole: image.userRole
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
    log:printDebug(io:sprintf("Listing artifacts for organization \'%s\' imageName : \'%s\', version: \'%s\', offset: %d, limit: %d",
    orgName, imageName, artifactVersion, offset, resultLimit));

    table<gen:ArtifactDatum> | error artifactDatumResults;

    if (getImageRequest.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = getImageRequest.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("List artifacts of image request with authenticated User  : %s", userId));
        artifactDatumResults = db:getArtifactsOfUserImage(orgName, imageName, userId, artifactVersion, offset, resultLimit);
    } else {
        log:printDebug("List artifacts of image request without an authenticated user");
        artifactDatumResults = db:getArtifactsOfPublicImage(orgName, imageName, artifactVersion, offset, resultLimit);
    }

    if (artifactDatumResults is table<gen:ArtifactDatum>) {
        log:printDebug(io:sprintf("Number of results found for list image : %d", artifactDatumResults.count()));
        gen:ArtifactDatumResponse[] responseArray = [];
        int counter = 0;
        int listLength = 0;
        string artifactImageId = "";
        gen:ArtifactListArrayResponse response = {
            count: counter,
            data: responseArray
        };

        if (artifactDatumResults.count() == 0) {
            log:printError("No image found with given image name and organization");
        } else {
            log:printError(io:sprintf("Found %d result(s) for artifact list", artifactDatumResults.count()));

            foreach var item in artifactDatumResults {
                gen:ArtifactDatum result = gen:ArtifactDatum.convert(item);
                if (artifactImageId == "") {
                    artifactImageId = result.artifactImageId;
                }
                string description = "";
                if (!(result.description is ())) {
                    description = encoding:byteArrayToString(<byte[]>result.description);
                }
                response.data[counter] = {
                    artifactImageId: result.artifactImageId,
                    artifactId: result.artifactId,
                    description: description,
                    pullCount: result.pullCount,
                    lastAuthor: result.lastAuthor,
                    updatedTimestamp: result.updatedTimestamp,
                    artifactVersion: result.artifactVersion
                };
                counter += 1;
            }
        }

        if counter > 0 {
            int | error countResult = db:getArtifactListLength(artifactImageId, artifactVersion);
            if (countResult is int) {
                listLength = countResult;
            } else {
                log:printError("Error while counting number of artifacts for image " + imageName, err = countResult);
                return buildUnknownErrorResponse();
            }

        }

        response.count = listLength;
        artifactDatumResults.close();
        json | error resPayload =  json.convert(response);
        if (resPayload is json) {
            log:printDebug(io:sprintf("Response payload for list image artifacts request : %s", resPayload.toString()));
            return buildSuccessResponse(jsonResponse = resPayload);
        } else {
            log:printError("Error occured while converting list image artifacts payload to json" + imageName, err = resPayload);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Error occured while retriving image for list image artifacts request" + imageName, err = artifactDatumResults);
        return buildUnknownErrorResponse();
    }
}

public function getArtifact(http:Request getArtifactReq, string orgName, string imageName, string artifactVersion) returns http:Response {
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
            log:printDebug("Last Author\'s User ID :" + userId);
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
            string errDes = io:sprintf("There is no artifact named \'%s/%s:%s\'", orgName, imageName, artifactVersion);
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
                log:printDebug(io:sprintf("Retriving user info for org, user: %s", user.userId));
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
                data: users
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
public function getUserOrgs(http:Request getUserOrgsReq, string userId, string orgName, int offset, int resultLimit)
returns http:Response {
    if (getUserOrgsReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string apiUserId = getUserOrgsReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("User %s is fetching organizations of user with the userId %s for orgName \'%s\'",
        apiUserId, userId, orgName));
        json | error res = db:searchUserOrganizations(userId, apiUserId, orgName, offset, resultLimit);
        if (res is json) {
            log:printDebug(io:sprintf("Received json payload for userId %s and org name \'%s\' : %s", userId, orgName, res));
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
public function listOrgImages(http:Request listOrgImagesReq, string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns http:Response {
    log:printDebug(io:sprintf("Listing images for orgName : %s, imageName : %s, orderBy : %s, offset : %d, limit : %d, ", orgName,
    imageName, orderBy, offset, resultLimit));
    json | error orgImagesListResult;
    if (listOrgImagesReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = listOrgImagesReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("List org images request with an authenticated user : %s", userId));
        orgImagesListResult = db:getUserImagesOfOrg(userId, orgName, imageName, orderBy, offset, resultLimit);
    } else {
        log:printDebug("List org images request with an unauthenticated user");
        orgImagesListResult = db:getPublicImagesOfOrg(orgName, imageName, orderBy, offset, resultLimit);
    }
    if (orgImagesListResult is json) {
        log:printDebug(io:sprintf("Received orgImages json payload for org name \'%s\' and image name \'%s\' : %s", orgName,
        imageName, orgImagesListResult));
        return buildSuccessResponse(jsonResponse = orgImagesListResult);
    } else {
        log:printError(io:sprintf("Error occured while retrieving images with name \'%s\' for organization \'%s\'", imageName, orgName),
        err = orgImagesListResult);
        return buildUnknownErrorResponse();
    }
}

# Search all images belong to any organization
#
# + listImagesReq - received request which contains header
# + orgName - regex for organization name
# + imageName - regex for search images
# + orderBy - orderBy enum value
# + offset - offset value
# + resultLimit - esultLimit value
# + return - http response which cater to the request
public function listImages(http:Request listImagesReq, string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns http:Response {
    log:printDebug(io:sprintf("Listing images for orgName : %s, imageName : %s, orderBy : %s, offset : %d, limit : %d, ", orgName,
    imageName, orderBy, offset, resultLimit));
    json | error imagesListResult;
    if (listImagesReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = listImagesReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("List images request with an authenticated user : %s", userId));
        imagesListResult = db:getUserImages(orgName, userId, imageName, orderBy, offset, resultLimit);
    } else {
        log:printDebug("List images request with an unauthenticated user");
        imagesListResult = db:getPublicImages(orgName, imageName, orderBy, offset, resultLimit);
    }
    if (imagesListResult is json) {
        log:printDebug(io:sprintf("Received images json payload for org name \'%s\' and image name \'%s\' : %s", orgName, imageName, imagesListResult));
        return buildSuccessResponse(jsonResponse = imagesListResult);
    } else {
        log:printError(io:sprintf("Error occured while retrieving images with name \'%s\' for organization \'%s\'", imageName, orgName),
        err = imagesListResult);
        return buildUnknownErrorResponse();
    }
}

# Update an existing image
#
# + updateImageReq - received request which contains header
# + orgName - Organization name
# + imageName - Image ID
# + updateImageBody - received body which contain the description, summary and keywords array
# + return - http response (200 if success, 401, 404 or 500 otherwise)
public function updateImage(http:Request updateImageReq, string orgName, string imageName, gen:ImageUpdateRequest updateImageBody) returns http:Response {
    if (updateImageReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = updateImageReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("Entries to be updated in the image %s/%s by user %s, Description : %s, Summary : %s, Keywords : %s",
        orgName, imageName, userId, updateImageBody.description, updateImageBody.summary, updateImageBody.keywords));

        http:Response resp;
        transaction {
            var transactionId = transactions:getCurrentTransactionId();
            log:printDebug("Started transaction " + transactionId + " for updating image " + imageName);

            sql:UpdateResult | error? updateImageRes = db:updateImageDescriptionNSummary(orgName, imageName, updateImageBody.description, updateImageBody.summary, userId);
            if (updateImageRes is sql:UpdateResult) {
                if (updateImageRes.updatedRowCount == 1) {
                    log:printDebug(io:sprintf("Description and summary of the image %s/%s are successfully updated. Author : %s", orgName, imageName, userId));
                    error? updateImageKeywordsRes = db:updateImageKeywords(orgName, imageName, updateImageBody.keywords, userId);
                    if updateImageKeywordsRes is error {
                        log:printError(io:sprintf("Failed to update image %s/%s for Author %s.", orgName, imageName, userId), err = updateImageKeywordsRes);
                        resp = buildUnknownErrorResponse();
                        abort;
                    } else {
                        log:printDebug(io:sprintf("Successfully updated the keywords of the image %s/%s by %s", orgName, imageName, userId));
                        resp = buildSuccessResponse();
                    }
                } else if (updateImageRes.updatedRowCount == 0) {
                    log:printError(io:sprintf("Failed to update image %s/%s for Author %s : No matching records found",
                    imageName, orgName, userId));
                    resp = buildErrorResponse(http:NOT_FOUND_404, constants:ENTRY_NOT_FOUND_ERROR_CODE, "Unable to update image", "");
                    abort;
                } else {
                    log:printError(io:sprintf("Failed to update image %s/%s for Author %s : More than one matching records found",
                    imageName, orgName, userId));
                    resp = buildUnknownErrorResponse();
                    abort;
                }
            } else {
                log:printError(io:sprintf("Unexpected error occured while updating image %s/%s", imageName, orgName),
                err = updateImageRes);
                resp = buildUnknownErrorResponse();
                abort;
            }
        } onretry {
            log:printDebug(io:sprintf("Retrying updating image %s/%s for transaction %s", orgName, imageName,
            transactions:getCurrentTransactionId()));
        } committed {
            log:printDebug(io:sprintf("Transaction %s successfully commited for updating the image %s/%s", transactions:getCurrentTransactionId(),
            orgName, imageName));
        } aborted {
            log:printError(io:sprintf("Updating image %s/%s aborted for transaction %s", orgName, imageName,
            transactions:getCurrentTransactionId()));
        }
        return resp;
    } else {
        log:printError("Unauthenticated request for updateImage: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to update image",
        "Unauthenticated request. Auth token is not provided");
    }
}

# Update an existing artifact
#
# + updateArtifactBody - received body which contain the description
# + updateArtifactReq - received request which contains header
# + orgName - organization name received as a path parameter
# + imageName - image name received as a path parameter
# + artifactVersion - version of the artifact received as a path parameter
# + return - http response (200 if success, 401, 404 or 500 otherwise)
public function updateArtifact(http:Request updateArtifactReq, string orgName, string imageName, string artifactVersion,
gen:ArtifactUpdateRequest updateArtifactBody) returns http:Response {
    if (updateArtifactReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = updateArtifactReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("Entries to be updated in the artifact \'%s/%s:%s\' by user %s, Description : %s", orgName, imageName,
        artifactVersion, userId, updateArtifactBody.description));

        sql:UpdateResult | error? updateArtifactRes = db:updateArtifactDescription(updateArtifactBody.description, orgName, imageName,
        artifactVersion, userId);
        if (updateArtifactRes is sql:UpdateResult) {
            if (updateArtifactRes.updatedRowCount == 1) {
                log:printDebug(io:sprintf("Description of the artifact \'%s/%s:%s\' is successfully updated. Author : %s", orgName, imageName,
                artifactVersion, userId));
                return buildSuccessResponse();
            } else if (updateArtifactRes.updatedRowCount == 0) {
                log:printError(io:sprintf("Failed to update artifact \'%s/%s:%s\' for Author %s : No matching records found", orgName, imageName,
                artifactVersion, userId));
                return buildErrorResponse(http:NOT_FOUND_404, constants:ENTRY_NOT_FOUND_ERROR_CODE, "Unable to update artifact", "");
            } else {
                log:printError(io:sprintf("Failed to update artifact \'%s/%s:%s\' for Author %s : More than one matching records found", orgName,
                imageName, artifactVersion, userId));
                return buildUnknownErrorResponse();
            }
        } else {
            log:printError(io:sprintf("Unexpected error occured while updating artifact \'%s/%s:%s\'", orgName, imageName, artifactVersion),
            err = updateArtifactRes);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Unauthenticated request for updateArtifact: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to update artifact",
        "Unauthenticated request. Auth token is not provided");
    }
}

# Update an existing organization
#
# + updateOrganizationReq - received request which contains header
# + orgName - organization name received as a path parameter
# + updateOrganizationBody - received body which contain the description and summary
# + return - http response (200 if success, 401, 404 or 500 otherwise)
public function updateOrganization(http:Request updateOrganizationReq, string orgName, gen:OrgUpdateRequest updateOrganizationBody) returns http:Response {
    if (updateOrganizationReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = updateOrganizationReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("Entries to be updated in the organization \'%s\' by user %s, Description: %s, Summary: %s, Url: %s", orgName, userId,
        updateOrganizationBody.description, updateOrganizationBody.summary, updateOrganizationBody.websiteUrl));

        sql:UpdateResult | error? updateOrgRes = db:updateOrgInfo(updateOrganizationBody.description, updateOrganizationBody.summary,
        updateOrganizationBody.websiteUrl, orgName, userId);
        if (updateOrgRes is sql:UpdateResult) {
            if (updateOrgRes.updatedRowCount == 1) {
                log:printDebug(io:sprintf("Description, summary and url of the organization \'%s\' are successfully updated. Author : %s", orgName, userId));
                return buildSuccessResponse();
            } else if (updateOrgRes.updatedRowCount == 0) {
                log:printError(io:sprintf("Failed to update organization \'%s\' for Author %s : No matching records found", orgName, userId));
                return buildErrorResponse(http:NOT_FOUND_404, constants:ENTRY_NOT_FOUND_ERROR_CODE, "Unable to update organization", "");
            } else {
                log:printError(io:sprintf("Failed to update organization \'%s\' for Author %s : More than one matching records found", orgName, userId));
                return buildUnknownErrorResponse();
            }
        } else {
            log:printError(io:sprintf("Unexpected error occured while updating organization \'%s\'", orgName),
            err = updateOrgRes);
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Unauthenticated request for updateOrganization: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to update organization",
        "Unauthenticated request. Auth token is not provided");
    }
}

# Search images belongs to a given user
#
# + listUserImagesReq - received request which contains header
# + userId - userId of user whose images are being searched
# + orgName - regex for organization name
# + imageName - regex for search images
# + orderBy - orderBy enum value
# + offset - offset value
# + resultLimit - esultLimit value
# + return - http response which cater to the request
public function listUserImages(http:Request listUserImagesReq, string userId, string orgName, string imageName, string orderBy, int offset,
int resultLimit) returns http:Response {
    log:printDebug(io:sprintf("Listing images under user : %s, orgName : %s, imageName : %s, orderBy : %s, offset : %d, limit : %d, ", userId,
    orgName, imageName, orderBy, offset, resultLimit));

    json | error imagesListForUserResult;
    if (listUserImagesReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string apiUserId = listUserImagesReq.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug(io:sprintf("List images for userId \'%s\', requested by an authenticated user : %s", userId, apiUserId));
        imagesListForUserResult = db:getImagesForUserIdWithAuthenticatedUser(userId, orgName, imageName, orderBy, offset, resultLimit, untaint apiUserId);
    } else {
        log:printDebug(io:sprintf("List images for userId \'%s\', requested by an unauthenticated user", userId));
        imagesListForUserResult = db:getImagesForUserIdWithoutAuthenticatedUser(userId, orgName, imageName, orderBy, offset, resultLimit);
    }
    if (imagesListForUserResult is json) {
        log:printDebug(io:sprintf("Received user images json payload for user \'%s\', org name \'%s\', image name \'%s\' : %s", userId, orgName,
        imageName, imagesListForUserResult));
        return buildSuccessResponse(jsonResponse = imagesListForUserResult);
    } else {
        log:printError(io:sprintf("Error occured while retrieving images with name \'%s\' for organization \'%s\'", imageName, orgName),
        err = imagesListForUserResult);
        return buildUnknownErrorResponse();
    }
}

# Delete an artifact
#
# + deleteArtifactReq - received request which contains header
# + orgName - organization name that the artifact is belong to
# + imageName - image name of the artifact
# + artifactVersion - version of the artifact
# + return - http resonce (200 if success, 401, 404 or 500 otherwise)
public function deleteArtifact (http:Request deleteArtifactReq, string orgName, string imageName, string artifactVersion) returns http:Response {
    if (deleteArtifactReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = deleteArtifactReq.getHeader(constants:AUTHENTICATED_USER);
        log:printInfo(io:sprintf("User \'%s\' is attempting to delete the artifact \'%s/%s:%s\'", userId, orgName, imageName, artifactVersion));

        int | error? deletedRowCount = db:deleteArtifactFromDb(userId, orgName, imageName, artifactVersion);

        if (deletedRowCount is int) {
            if (deletedRowCount == 1) {
                log:printInfo(io:sprintf("Successfully deleted the artifact \'%s/%s:%s\' by user \'%s\'", orgName, imageName, artifactVersion, userId));
                return buildSuccessResponse();
            } else if (deletedRowCount == 0) {
                log:printDebug(io:sprintf("Failed to delete the artifact \'%s/%s:%s\'. No matching records found", orgName, imageName, artifactVersion));
                return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, "Unable to delete artifact", "No matching records found");
            } else {
                log:printDebug(io:sprintf("Failed to delete the artifact \'%s/%s:%s\'. More than one matching records found", orgName,
                imageName, artifactVersion));
                return buildUnknownErrorResponse();
            }
        } else {
            log:printError(io:sprintf("Unable to delete the artifact \'%s/%s:%s\' : %s", orgName, imageName, artifactVersion, deletedRowCount));
            return buildUnknownErrorResponse();
        }
    } else {
        log:printError("Unauthenticated request for delete artifact: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to delete artifact",
        "Unauthenticated request. Auth token is not provided");
    }
}

# Delete an image
#
# + deleteImageReq - received request which contains header
# + orgName - organization name that the artifact is belong to
# + imageName - image name of the artifact
# + return - http resonce (200 if success, 401, 404 or 500 otherwise)
public function deleteImage (http:Request deleteImageReq, string orgName, string imageName) returns http:Response {
    if (deleteImageReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = deleteImageReq.getHeader(constants:AUTHENTICATED_USER);
        log:printInfo(io:sprintf("User \'%s\' is attempting to delete the image \'%s/%s\'", userId, orgName, imageName));
        http:Response resp;
        transaction {
            var transactionId = transactions:getCurrentTransactionId();
            log:printDebug(io:sprintf("Started transaction \'%s\' for deleting the image \'%s/%s\'", transactionId, orgName, imageName));
            int | error? deletedRowCount = db:deleteImageFromDb(userId, orgName, imageName);
            if (deletedRowCount is int) {
                if (deletedRowCount == 1) {
                    log:printInfo(io:sprintf("Successfully deleted the image \'%s/%s\' by user \'%s\'", orgName, imageName, userId));
                    resp = buildSuccessResponse();           
                } else if (deletedRowCount == 0) {
                    log:printError(io:sprintf("Failed to delete the image \'%s/%s\'. No matching records found", orgName, imageName));
                    resp = buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, "Unable to delete artifact", "No matching records found");
                    abort;
                } else {
                    log:printError(io:sprintf("Failed to delete the image \'%s/%s\'. More than one matching records found", orgName,
                    imageName));
                    resp = buildUnknownErrorResponse();
                    abort;
                }
            } else {
                log:printError(io:sprintf("Unable to delete the image \'%s/%s\' : %s", orgName, imageName, deletedRowCount));
                resp = buildUnknownErrorResponse();
                abort;
            }
        } onretry {
            log:printDebug(io:sprintf("Retrying deleting image \'%s/%s\' for transaction %s", orgName, imageName,
            transactions:getCurrentTransactionId()));
        } committed {
            log:printDebug(io:sprintf("Deleting image \'%s/%s\' successful for transaction %s", orgName, imageName,
            transactions:getCurrentTransactionId()));
        } aborted {
            log:printError(io:sprintf("Deleting image \'%s/%s\' aborted for transaction %s", orgName, imageName,
            transactions:getCurrentTransactionId()));
        }
        return resp;
    } else {
        log:printError("Unauthenticated request for delete image: Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to delete image",
        "Unauthenticated request. Auth token is not provided");
    }
}
