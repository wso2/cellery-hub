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
import cellery_hub_api/db;
import cellery_hub_api/idp;

# Get Auth Tokens
#
# + getTokensReq - getTokensReq Parameter Description
# + return - Return Value Description
public function getTokens (http:Request getTokensReq) returns http:Response {
    var queryParams = getTokensReq.getQueryParams();
    var authCode = queryParams.authCode;
    var callbackUrl = queryParams.callbackUrl;

    var tokens = idp:getTokens(authCode, callbackUrl);
    if (tokens is gen:TokensResponse) {
        var jsonPayload = json.convert(tokens);
        if (jsonPayload is json) {
            http:Response getTokensRes = new;
            getTokensRes.statusCode = http:OK_200;
            getTokensRes.setJsonPayload(untaint jsonPayload);
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
public function getImageByImageName(http:Request getImageRequest, string orgName, string imageName, int offset, int resultLimit) returns http:Response {


    log:printDebug("Searching images for organization \'" + orgName + "\' imageName : " + imageName + ". Search offset: "
    + offset + ", limit: " + resultLimit);
    table<gen:Image> | error results;
    if (getImageRequest.hasHeader(constants:AUTHENTICATED_USER)) {
        string userId = getImageRequest.getHeader(constants:AUTHENTICATED_USER);
        log:printDebug("get Image request with authenticated User : " + userId);
        results = db:getUserImage(orgName, imageName, userId);
    } else {
        log:printDebug("get Image request without an authenticated user");
        results = db:getPublicImage(orgName, imageName);
    }

    if (results is table<gen:Image>) {
        log:printDebug("Number of results found for search : " + results.count());
        if (results.count() == 0) {
            string errMsg = "No image found with given image name and organization";
            log:printError(errMsg);
            return buildErrorResponse(http:NOT_FOUND_404, constants:API_ERROR_CODE, errMsg, errMsg);
        } else if (results.count() > 1) {
            log:printError("Found more than one result for image GET: Number of results : " + results.count());
            return buildUnknownErrorResponse();
        }
        if (results.hasNext()) {
            gen:Image image = <gen:Image>results.getNext();
            log:printDebug("Found an image with Id: " + image.artifactImageId);
            gen:ImageVersion[] versions = [];
            table<gen:ImageVersion> | error versionsResult = db:getImageVersions(image.artifactImageId, offset, resultLimit);
            if (versionsResult is table<gen:ImageVersion>) {
                int versionResultCount = versionsResult.count();
                log:printDebug("Versions found for image :" + imageName + ": " + versionResultCount);
                int count = 0;
                foreach var imageVersion in versionsResult {
                    log:printDebug("Found version: " + imageVersion.imageVersion);
                    versions[count] = imageVersion;
                    count += 1;
                }
                gen:ImageResponse imageResponse = {
                    artifactImageId: image.artifactImageId,
                    orgName: image.orgName,
                    imageName: image.imageName,
                    description: image.description,
                    firstAuthor: image.firstAuthor,
                    visibility: image.visibility,
                    versions: versions
                };

                json | error resPayload =  json.convert(imageResponse);
                if (resPayload is json) {
                    return buildSuccessResponse(resPayload);
                } else {
                    log:printError("Error while converting payload to json" + imageName, err = resPayload);
                }
            } else {
                log:printError("Error while converting payload to json" + imageName, err = versionsResult);
            }

        }
    } else {
        log:printError("Error while retriving image" + imageName, err = results);
    }

    return buildUnknownErrorResponse();
}

public function getArtifact (http:Request getArtifactReq, string orgName, string imageName, string artifactVersion) returns http:Response{
    json | error res = db:retrieveArtifact(orgName, imageName, artifactVersion);
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
