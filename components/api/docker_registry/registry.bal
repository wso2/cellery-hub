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

import ballerina/config;
import ballerina/http;
import ballerina/io;
import ballerina/log;

public function getManifestDigest(string orgName, string imageName, string artifactVersion, string bearerToken)
returns string | error {
    log:printDebug(io:sprintf("Invoking getManifest end point of registry API with a docker auth token. orgName: %s, "+
    "imageName: %s, artifactVersion: %s", orgName, imageName, artifactVersion));
    string getManifestEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, artifactVersion);
    http:Client dockerRegistryClient = getOAuth2RegistryClient(bearerToken);
    var responseForGetManifest = dockerRegistryClient->get(getManifestEndPoint, message = "");

    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest request: %d",
        responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:OK_200) {
            log:printDebug(io:sprintf("Successfully retrieved the digest of the atifact \'%s/%s:%s\'. ", orgName,
            imageName, artifactVersion));
            return responseForGetManifest.getHeader(constants:REGISTRY_DIGEST_HEADER);
        } else {
            error er = error(io:sprintf("Failed to fetch the digest of docker manifest. This may be due to an unknown "+
            "manifest. Status Code : %s", responseForGetManifest.statusCode));
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while fetching digest of docker manifest. %s", responseForGetManifest));
        return er;
    }
}

public function deleteManifest(string orgName, string imageName, string manifestdigest, string bearerToken)
returns error? {
    log:printDebug(io:sprintf("Invoking deleteManifest end point of registry API with a docker auth token. orgName: %s, "+
    "imageName: %s, digest: %s", orgName, imageName, manifestdigest));
    http:Client dockerRegistryClient = getOAuth2RegistryClient(bearerToken);
    string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, manifestdigest);
    var responseForDeleteManifest = dockerRegistryClient->delete(deleteEndPoint, "");

    if (responseForDeleteManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for deleteManifes request: %d",
        responseForDeleteManifest.statusCode));
        if (responseForDeleteManifest.statusCode == http:ACCEPTED_202) {
            log:printDebug(io:sprintf("Deleted the artifact \'%s/%s\'. Digest : %s", orgName, imageName,
            manifestdigest));
        } else {
            error er = error("Failed to delete the docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while deleting docker manifest. %s", responseForDeleteManifest));
        return er;
    }
}
