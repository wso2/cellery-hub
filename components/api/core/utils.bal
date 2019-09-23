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

import ballerina/io;

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

function deleteArtifactFromRegistry(string orgName, string imageName, string artifactVersion, string userId, string
userToken) returns error? {
    log:printDebug(io:sprintf("Attempting to delete the artifact \'%s/%s:%s\' from the registry", orgName, imageName,
    artifactVersion));
    string registryScopeForGetNDeleteManifest = io:sprintf("repository:%s/%s:%s,%s", orgName, imageName,
    constants:DELETE_ACTION, constants:PULL_ACTION);

    log:printDebug(io:sprintf("Registry scope for get and delete manifest digest from registry api : %s",
    registryScopeForGetNDeleteManifest));

    string | error? getTokenResult = docker_registry:getTokenFromDockerAuth(userId, userToken,
    registryScopeForGetNDeleteManifest);

    if (getTokenResult is string) {
        log:printDebug("Retrived a token from docker auth to invoke getManifestDigest and deleteManifest endpoints");

        string | error getManifestDigestResult = docker_registry:getManifestDigest(orgName, imageName, artifactVersion,
        getTokenResult);

        if (getManifestDigestResult is string) {
            log:printDebug(io:sprintf("Received digest of the artifact \'%s/%s:%s\': %s", orgName, imageName,
            artifactVersion, getManifestDigestResult));
            error? artifactDeleteResult = docker_registry:deleteManifest(orgName, imageName, getManifestDigestResult,
            getTokenResult);

            if (artifactDeleteResult is error) {
                return artifactDeleteResult;
            } else {
                log:printDebug(io:sprintf("Artifact \'%s/%s:%s\' is successfully deleted from the registry", orgName,
                imageName, artifactVersion));
            }
        } else {
            return getManifestDigestResult;
        }
    } else {
        return getTokenResult;
    }
}

public function deleteImageFromResitry(string orgName, string imageName) returns error? {
    if (orgName != "" && imageName != "") {
        string imageDirectoryPath = io:sprintf("%s/%s/%s", constants:DOCKER_REGISTRY_REPOSITORIES_FILEPATH, orgName,
        imageName);
        log:printDebug(io:sprintf("Deleting the image \'%s/%s\' from the registry. Image directory : %s", orgName,
        imageName, imageDirectoryPath));
        internal:Path directoryToBeDeleted = new (imageDirectoryPath);

        if (directoryToBeDeleted.isDirectory()) {
            var deleteResult = directoryToBeDeleted.delete();
            if (deleteResult is error) {
                error er = error("Unexpected error while deleting the image from the registry");
                return er;
            } else {
                log:printDebug(io:sprintf("Image \'%s/%s\' is successfully deleted from the registry", orgName,
                imageName));
            }
        } else {
            error er = error(io:sprintf("Image directory \'%s\' is not found in the registry", imageDirectoryPath));
            return er;
        }
    } else {
        error er = error("Received image name or org name is empty");
        return er;
    }
}

public function deleteOrganizationFromResitry(string orgName) returns error? {
    if (orgName != "") {
        string orgDirectoryPath = io:sprintf("%s/%s", constants:DOCKER_REGISTRY_REPOSITORIES_FILEPATH, orgName);
        log:printDebug(io:sprintf("Deleting the organization \'%s\' from the registry. Organization directory : %s",
        orgName, orgDirectoryPath));
        internal:Path directoryToBeDeleted = new (orgDirectoryPath);

        if (directoryToBeDeleted.isDirectory()) {
            var deleteResult = directoryToBeDeleted.delete();
            if (deleteResult is error) {
                error er = error("Unexpected error while deleting the organization from the registry");
                return er;
            } else {
                log:printDebug(io:sprintf("Organization \'%s\' is successfully deleted from the registry", orgName));
            }
        } else {
            log:printDebug(io:sprintf("Organization directory \'%s\' is not found in the registry", orgDirectoryPath));
        }
    } else {
        error er = error("Received org name is empty");
        return er;  
    }
}
