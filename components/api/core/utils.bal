import ballerina/io;
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

function addOrgUserMapping(string userId, string orgName, string role) returns http:Response {
    var orgUserRes = db:insertOrgUserMapping(userId, orgName, role);
    if (orgUserRes is error) {
        log:printError(io:sprintf("Unexpected error occured while inserting org-user mapping. user : %s, Organization : %s", userId, orgName),
                                err = orgUserRes);
        return buildUnknownErrorResponse();
    } else {
        log:printDebug(io:sprintf("New organization \'%s\' added to REGISTRY_ORG_USER_MAPPING. Author : %s", orgName, userId));
        return buildSuccessResponse();
    }
}

function updatePayloadWithUserInfo(json payload, string field) returns error? {
    string userId = payload[field].toString();
    idp:UserInfo | error? modifiedRes = idp:getUserInfo(userId);
    if (modifiedRes is idp:UserInfo) {
        payload[field] = check json.convert(modifiedRes);
        log:printDebug(io:sprintf("Modifying response by adding userInformation for user ID : %s", userId));
    } else {
        payload[field] = {};
        log:printDebug(io:sprintf("Response modification failed : User information not found for user : \'%s\'", userId));
    }
}

function getUserToken(string authorizationHeader, string cookieHeader) returns string {
    string token = "";
    string[] splittedToken = authorizationHeader.split(" ");
    if splittedToken.length() != 2 || !(splittedToken[0].equalsIgnoreCase(constants:TOKEN_BEARER_KEY)) {
        log:printError("Did not receive the token in proper format");
    }
    string lastTokenElement = splittedToken[1];
    string | error firstTokenElement = filter:getCookie(cookieHeader);
    if (firstTokenElement is error) {
        log:printError("Cookie value could not be resolved. Passing to the next filter", err = firstTokenElement);
    } else {
        token = io:sprintf("%s%s", firstTokenElement, lastTokenElement);
        if "" == token {
            log:printDebug("Did not receive any token. Passing the request to the next filter");
        }
    }
    return token;
}

function deleteArtifactFromRegistry(http:Request deleteArtifactReq, string orgName, string imageName, string artifactVersion) returns error? {
    string userId = deleteArtifactReq.getHeader(constants:AUTHENTICATED_USER);
    string token = getUserToken(deleteArtifactReq.getHeader(constants:AUTHORIZATION_HEADER),
    deleteArtifactReq.getHeader(constants:COOKIE_HEADER));

    log:printInfo(io:sprintf("Attempting to delete the artifact \'%s/%s:%s\' from the registry", orgName, imageName, artifactVersion));
    string | error manifestDigest = getManifestDigest(orgName, imageName, artifactVersion, userId, token);
    if (manifestDigest is string) {
        log:printDebug(io:sprintf("Retrived digest : %s", manifestDigest));
        boolean | error isArtifactDeleted = deleteManifest(orgName, imageName, manifestDigest, userId, token);
        if (isArtifactDeleted is boolean && isArtifactDeleted) {
            log:printDebug(io:sprintf("Artifact \'%s/%s:%s\' is successfully deleted from the registry", orgName, imageName, artifactVersion));
        } else if (isArtifactDeleted is error) {
            return isArtifactDeleted;
        }
    } else {
        return manifestDigest;
    }
}

function getManifestDigest(string orgName, string imageName, string artifactVersion, string bearerToken = "", string userId, string token)
returns string | error {
    var responseForGetManifest = docker_registry:getResponseFromManifestAPI(orgName, imageName, artifactVersion = artifactVersion, bearerToken = bearerToken);
    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest request: %d", responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForGetManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for getManifestDigest request: %s", payload));
                string registryScopeForGetManifest = buildRegistryScope(payload);
                log:printDebug(io:sprintf("Registry scope for getManifest : %s", registryScopeForGetManifest));

                string tokenToGetManifestDigest = docker_registry:getTokenFromDockerAuth(userId, token, registryScopeForGetManifest);
                log:printDebug("Retrived a token to get manifest digest");
                return getManifestDigest(orgName, imageName, artifactVersion, bearerToken = tokenToGetManifestDigest, userId, token);
            } else {
                error er = error("Failed to extract json payload from getManifest response");
                return er;
            }
        } else if (responseForGetManifest.statusCode == http:OK_200) {
            log:printDebug(io:sprintf("Successfully retrieved the digest of the atifact \'%s/%s:%s\'", orgName, imageName, artifactVersion));
            return responseForGetManifest.getHeader("Docker-Content-Digest");
        } else {
            error er = error("Failed to fetch the digest of docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while fetching digest of docker manifest. %s", responseForGetManifest));
        return er;
    }
}

function deleteManifest(string orgName, string imageName, string manifestdigest, string bearerToken = "", string userId, string token)
returns boolean | error {
    log:printDebug(io:sprintf("Digest received by deleteManifest : \'%s\'", manifestdigest));
    var responseForDeleteManifest = docker_registry:getResponseFromManifestAPI(orgName, imageName, digest = manifestdigest, bearerToken = bearerToken);
    if (responseForDeleteManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for deleteManifestDigest request: %d", responseForDeleteManifest.statusCode));
        if (responseForDeleteManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForDeleteManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for deleteManifest request: %s", payload));
                string registryScopeForDeleteManifest = buildRegistryScope(payload);
                log:printDebug(io:sprintf("Registry scope for deleteManifest request: %s", registryScopeForDeleteManifest));

                string tokenToDeleteManifest = docker_registry:getTokenFromDockerAuth(userId, token, registryScopeForDeleteManifest);
                log:printDebug("Retrived a token to delete manifest");

                return deleteManifest(orgName, imageName, manifestdigest, bearerToken = tokenToDeleteManifest, userId, token);
            } else {
                error er = error("Failed to extract json payload from deleteManifest response");
                return er;
            }
        } else if (responseForDeleteManifest.statusCode == http:ACCEPTED_202) {
            log:printDebug(io:sprintf("Deleted the artifact \'%s/%s\'. Digest : %s", orgName, imageName, manifestdigest));
            return true;
        } else {
            error er = error("Failed to delete the docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while deleting docker manifest. %s", responseForDeleteManifest));
        return er;
    }
}

function buildRegistryScope(json payload) returns string {
    log:printDebug("Building scopes requested by the docker registry");
    string requestType = payload["errors"][0]["detail"][0]["Type"].toString();
    string name = payload["errors"][0]["detail"][0]["Name"].toString();
    string actions = payload["errors"][0]["detail"][0]["Action"].toString();

    return io:sprintf("%s:%s:%s", requestType, name, actions);
}

public function deleteImageFromResitry(string orgName, string imageName) returns error? {
    string imageDirectoryPath = io:sprintf("%s/%s/%s", constants:DOCKER_REGISTRY_REPOSITORIES_FILEPATH, orgName, imageName);
    log:printInfo(io:sprintf("Deleting the image \'%s/%s\' from the registry. Image directory : %s", orgName, imageName, imageDirectoryPath));
    internal:Path directoryToBeDeleted = new (imageDirectoryPath);

    if (directoryToBeDeleted.isDirectory()) {
        var deleteResult = directoryToBeDeleted.delete();

        if (deleteResult is error) {
            error er = error("Unexpected error while deleting the image from the registry");
            return er;
        } else {
            log:printInfo(io:sprintf("Image \'%s/%s\' is successfully deleted from the registry", orgName, imageName));
        }
    } else {
        error er = error(io:sprintf("Image directory \'%s\' is not found in the registry", imageDirectoryPath));
        return er;
    }
}

public function deleteOrganizationFromResitry(string orgName) returns error? {
    string orgDirectoryPath = io:sprintf("%s/%s", constants:DOCKER_REGISTRY_REPOSITORIES_FILEPATH, orgName);
    log:printInfo(io:sprintf("Deleting the organization \'%s\' from the registry. Organization directory : %s", orgName, orgDirectoryPath));
    internal:Path directoryToBeDeleted = new (orgDirectoryPath);

    if (directoryToBeDeleted.isDirectory()) {
        var deleteResult = directoryToBeDeleted.delete();

        if (deleteResult is error) {
            error er = error("Unexpected error while deleting the organization from the registry");
            return er;
        } else {
            log:printInfo(io:sprintf("Organization \'%s\' is successfully deleted from the registry", orgName));
        }
    } else {
        log:printInfo(io:sprintf("Organization directory \'%s\' is not found in the registry", orgDirectoryPath));
    }
}
