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

function addOrgUserMapping(string userId, string orgName, string role) returns http:Response{
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

function updatePayloadWithUserInfo (json payload, string field) returns error? {
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
    if splittedToken.length() != 2 || !(splittedToken[0].equalsIgnoreCase("Bearer")) {
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

function deleteArtifactFromRegistry (http:Request deleteArtifactReq, string orgName, string imageName, string artifactVersion) {
    string userId = deleteArtifactReq.getHeader(constants:AUTHENTICATED_USER);
    string token = getUserToken(deleteArtifactReq.getHeader(constants:AUTHORIZATION_HEADER),
    deleteArtifactReq.getHeader(constants:COOKIE_HEADER));

    log:printInfo(io:sprintf("Deleting the artifact \'%s/%s:%s\' from the registry", orgName, imageName, artifactVersion));

    string manifestDigest = getManifestDigest(orgName, imageName, artifactVersion, "", userId, token);

    log:printDebug(io:sprintf("Manifest digest : %s", manifestDigest));

    string registryScopeForDelete = docker_registry:deleteArtifactFromRegistry(orgName, imageName, manifestDigest);
    log:printDebug(io:sprintf("Registry scope for delete : %s", registryScopeForDelete));

    string tokenToDeleteManifest = docker_registry:getTokenFromDockerAuthForGetManifest(userId, token, registryScopeForDelete);
    log:printDebug(io:sprintf("Token to delete manifest : %s", tokenToDeleteManifest));

    int deleteStatusCode = docker_registry:deleteManifestFromDockerRegistry(orgName, imageName, manifestDigest, tokenToDeleteManifest);

    if (deleteStatusCode == http:ACCEPTED_202){
        log:printDebug(io:sprintf("Artifact \'%s/%s:%s\' is successfully deleted from the registry", orgName, imageName, artifactVersion));
    } else {
        log:printError(io:sprintf("Failed to delete artifact \'%s/%s:%s\' from the registry", orgName, imageName, artifactVersion));
    }
}

function getManifestDigest (string orgName, string imageName, string artifactVersion, string bearerToken, string userId, string token) returns string {
    string manifestDigest = "";

    var responseForGetManifest = docker_registry:getDockerManifestDigest(orgName, imageName, artifactVersion, bearerToken = bearerToken);
    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest: %d", responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForGetManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry: %s", payload));
                string requestType = payload["errors"][0]["detail"][0]["Type"].toString();
                string name = payload["errors"][0]["detail"][0]["Name"].toString();
                string actions = payload["errors"][0]["detail"][0]["Action"].toString();
                string registryScopeForGetManifest = io:sprintf("%s:%s:%s", requestType, name, actions);

                log:printDebug(io:sprintf("Registry scope for getManifest : %s", registryScopeForGetManifest));       

                string tokenToGetManifestDigest = docker_registry:getTokenFromDockerAuthForGetManifest(userId, token, registryScopeForGetManifest);
                log:printDebug(io:sprintf("Token to get manifest digest : %s", tokenToGetManifestDigest));        

                return getManifestDigest (orgName, imageName, artifactVersion, tokenToGetManifestDigest, userId, token); 
            }
        } else if (responseForGetManifest.statusCode == http:OK_200) {
            manifestDigest = responseForGetManifest.getHeader("Docker-Content-Digest");
            log:printDebug(io:sprintf("Manifest Digest: %s", manifestDigest));
            return manifestDigest;
        }
    }
    return manifestDigest;    
}
