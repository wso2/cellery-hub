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
import cellery_hub_api/db;
import cellery_hub_api/constants;
import ballerina/log;
import ballerina/mysql;
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

public function createOrg(http:Request createOrgReq, gen:OrgCreateRequest createOrgsBody) returns http:Response {
    if (createOrgReq.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = createOrgReq.getHeader(constants:AUTHENTICATED_USER);
        var res = db:insertOrganization(userId, createOrgsBody);
        if (res is error) {
            log:printError("Unexpected error occured while inserting organization " + untaint createOrgsBody.orgName, err = res);
            return buildUnknownErrorResponse();
        } else {
            http:Response createOrgRes = new;
            createOrgRes.statusCode = http:OK_200;
            log:printDebug(io:sprintf("Organization \'%s\' is created. Author : %s", createOrgsBody.orgName, userId));
            return createOrgRes;
        }
    } else {
        log:printError("Unauthenticated request. Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, constants:API_ERROR_CODE, "Unable to create organization",
                                  "Unauthenticated request. Auth token is not provided");
    }
}

public function getOrg(http:Request getOrgReq, string orgName) returns http:Response {
    json | error res = db:getOrganization(orgName);
    if (res is json) {
        if (res != null) {
            http:Response getOrgRes = new;
            getOrgRes.statusCode = http:OK_200;
            getOrgRes.setJsonPayload(untaint res);
            log:printDebug(io:sprintf("Successfully fetched organization \'%s\'", orgName));
            return getOrgRes;
        } else {
            string errMsg = "Unable to fetch organization. ";
            string errDes = io:sprintf("There is no organization named \'%s\'", orgName);
            log:printError(errMsg + errDes);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, errMsg, errDes);
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
                return buildSuccessResponse(resPayload);

            } else {
                log:printError("Error while retriving image keywords" + imageName, err = resPayload);
            }

        }
    } else {
        log:printError("Error while retriving image" + imageName, err = imageResults);
    }
    return buildUnknownErrorResponse();
}

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

        if(artifactListResults.count() == 0) {
            string errMsg = "No image found with given image name and organization";
            log:printError(errMsg);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, errMsg, errMsg);
        } else if (artifactListResults.count() > 1) {
            log:printError("Found more than one result for artifact list: Number of results : " + artifactListResults.count());
            return buildUnknownErrorResponse();
        }

        gen:ArtifactListResponse[] responseArray = [];
        int counter = 0;
        int listLength = 0;
        string artifactImageId = "";
        while (artifactListResults.hasNext()) {
            gen:ArtifactListResponse result = <gen:ArtifactListResponse> artifactListResults.getNext();
            if (artifactImageId == "") {
                artifactImageId = result.artifactImageId;
            }
            responseArray[counter] = result;
            counter += 1;
        }
        if (counter > 0) {
            table<gen:Count> | error countResult = db:getArtifactListLength(artifactImageId, artifactVersion);
            if (countResult is table<gen:Count>) {
                log:printDebug("Successfully fetched length of the list");
                gen:Count countObj = <gen:Count>countResult.getNext();
                listLength = countObj.count;
            } else {
                log:printError("Error while counting number of artifacts for image " + imageName, err = countResult);
            }
        }

        gen:ArtifactListArrayResponse response = {
            count: listLength,
            artifacts: responseArray
        };
        json | error resPayload =  json.convert(response);
        if (resPayload is json) {
            log:printInfo(resPayload.toString());
            return buildSuccessResponse(resPayload);
        } else {
            log:printError("Error while converting payload to json" + imageName, err = resPayload);
        }

    } else {
        log:printError("Error while retriving image" + imageName, err = artifactListResults);
    }
    return buildUnknownErrorResponse();
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
            http:Response getArtifactRes = new;
            getArtifactRes.statusCode = http:OK_200;
            getArtifactRes.setJsonPayload(untaint res);
            log:printDebug(io:sprintf("Successfully fetched artifact \'%s/%s:%s\' ", orgName, imageName, artifactVersion));
            return getArtifactRes;
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
            table<gen:Count> | error countResults = db:getMemberCountOfOrg(orgName);
            if (countResults is table<gen:Count>) {
                if (countResults.hasNext()) {
                    gen:Count countFromDB = <gen:Count> countResults.getNext();
                    userCount = countFromDB.count;
                }
            }
            gen:UserListResponse userInfoListResponse = {
                count: userCount,
                users: users
            };
            json | error resPayload =  json.convert(userInfoListResponse);
            if (resPayload is json) {
                log:printInfo(resPayload.toString());
                return buildSuccessResponse(resPayload);
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
