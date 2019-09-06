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

function getUserToken(string authorizationHeader, string cookieHeader) returns string | error? {
    string[] splittedToken = authorizationHeader.split(" ");
    if splittedToken.length() != 2 || !(splittedToken[0].equalsIgnoreCase(constants:BEARER_HEADER)) {
        error er = error("Did not receive the token in proper format");
        return er;
    }
    string lastTokenElement = splittedToken[1];
    string | error firstTokenElement = filter:getCookie(cookieHeader);
    if (firstTokenElement is error) {
        error er = error(io:sprintf("Cookie value could not be resolved. %s", firstTokenElement.reason()));
        return er;
    } else {
        string token = io:sprintf("%s%s", firstTokenElement, lastTokenElement);
        if "" == token {
            error er = error("Did not receive any token");
            return er;
        }
        return token;
    }
}

function deleteArtifactFromRegistry(http:Request deleteArtifactReq, string orgName, string imageName, string artifactVersion) returns error? {
    string userId = deleteArtifactReq.getHeader(constants:AUTHENTICATED_USER);
    var token = getUserToken(deleteArtifactReq.getHeader(constants:AUTHORIZATION_HEADER),
    deleteArtifactReq.getHeader(constants:COOKIE_HEADER));

    if (token is string) {
        log:printInfo(io:sprintf("Attempting to delete the artifact \'%s/%s:%s\' from the registry", orgName, imageName, artifactVersion));
        string | error registryScopeForGetManifest = docker_registry:getScopeForFetchManifest(orgName, imageName, artifactVersion, userId, token);

        if (registryScopeForGetManifest is string) {
            log:printDebug(io:sprintf("Registry scope for getting manifest digest from registry api : %s", registryScopeForGetManifest));

            string | error? tokenToGetManifestDigest = docker_registry:getTokenFromDockerAuth(userId, token, registryScopeForGetManifest);

            if (tokenToGetManifestDigest is string) {
                log:printDebug("Retrived a token from docker auth to invoke getManifestDigest end point");

                string | error manifestDigest = docker_registry:getManifestDigest(orgName, imageName, artifactVersion, tokenToGetManifestDigest);

                if (manifestDigest is string) {
                    string | error registryScopeForDeleteManifest = docker_registry:getScopeForDeleteManifest(orgName, imageName, manifestDigest, userId, token);

                    if (registryScopeForDeleteManifest is string) {
                        log:printDebug(io:sprintf("Registry scope for deleting manifest from registry api: %s", registryScopeForDeleteManifest));

                        string | error? tokenToDeleteManifest = docker_registry:getTokenFromDockerAuth(userId, token, registryScopeForDeleteManifest);

                        if (tokenToDeleteManifest is string) {
                            log:printDebug("Retrived a token from docker auth to invoke deleteManifest end point");   

                            error? artifactDeleteResult = docker_registry:deleteManifest(orgName, imageName, manifestDigest, tokenToDeleteManifest);

                            if (artifactDeleteResult is error) {
                                return artifactDeleteResult;
                            } else {
                                log:printDebug(io:sprintf("Artifact \'%s/%s:%s\' is successfully deleted from the registry", orgName, imageName, artifactVersion));
                            }
                        } else {
                            return tokenToDeleteManifest;
                        }                        
                    } else {
                        return registryScopeForDeleteManifest;
                    }                
                } else {
                    return manifestDigest;
                }
            } else {
                return tokenToGetManifestDigest;
            }            
        } else {
            return registryScopeForGetManifest;
        }
    } else {
        return token;
    }
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
