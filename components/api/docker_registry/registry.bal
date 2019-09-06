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

http:Client dockerRegistryClientEP = new(config:getAsString("docker.registry.url"), config = {
    secureSocket: {
        trustStore: {
            path: config:getAsString("security.truststore"),
            password: config:getAsString("security.truststorepass")
        },
        verifyHostname: false
    }
});

public function getScopeForFetchManifest(string orgName, string imageName, string artifactVersion, string userId, string token)
returns string | error {
    log:printDebug(io:sprintf("Invoking getManifest end point of registry API without a docker auth token. orgName: %s,
    imageName: %s, artifactVersion: %s",
    orgName, imageName, artifactVersion));
    string getManifestEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, artifactVersion);
    var responseForGetManifest = dockerRegistryClientEP->get(getManifestEndPoint, message = "");

    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest request: %d", responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForGetManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for getManifestDigest request: %s", payload));
                return buildRegistryScope(payload);
            } else {
                error er = error("Failed to extract json payload from getManifest response");
                return er;
            }
        } else {
            error er = error("Failed to fetch the digest of docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while fetching digest of docker manifest. %s", responseForGetManifest));
        return er;
    }
}

public function getManifestDigest(string orgName, string imageName, string artifactVersion, string bearerToken)
returns string | error {
    log:printDebug(io:sprintf("Invoking getManifest end point of registry API with a docker auth token. orgName: %s,
    imageName: %s, artifactVersion: %s",
    orgName, imageName, artifactVersion));
    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader(constants:AUTHORIZATION_HEADER, constants:BEARER_HEADER + " " + bearerToken);
    string getManifestEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, artifactVersion);
    var responseForGetManifest = dockerRegistryClientEP->get(getManifestEndPoint, message = dockerRegistryRequest);

    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest request: %d", responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:OK_200) {
            log:printDebug(io:sprintf("Successfully retrieved the digest of the atifact \'%s/%s:%s\'. ", orgName, imageName, artifactVersion));
            return responseForGetManifest.getHeader(constants:REGISTRY_DIGEST_HEADER);
        } else {
            error er = error("Failed to fetch the digest of docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while fetching digest of docker manifest. %s", responseForGetManifest));
        return er;
    }
}

public function getScopeForDeleteManifest(string orgName, string imageName, string manifestdigest, string userId, string token)
returns string | error {
    log:printDebug(io:sprintf("Invoking deleteManifest end point of registry API without a docker auth token. orgName: %s, imageName: %s, digest: %s",
    orgName, imageName, manifestdigest));
    string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, manifestdigest);
    var responseForDeleteManifest = dockerRegistryClientEP->delete(deleteEndPoint, "");

    if (responseForDeleteManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for deleteManifestDigest request: %d", responseForDeleteManifest.statusCode));
        if (responseForDeleteManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForDeleteManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for deleteManifest request: %s", payload));
                return buildRegistryScope(payload);
            } else {
                error er = error("Failed to extract json payload from deleteManifest response");
                return er;
            }
        } else {
            error er = error("Failed to fetch scope for delete the docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while fetching scope for delete the docker manifest. %s", responseForDeleteManifest));
        return er;
    }
}

public function deleteManifest(string orgName, string imageName, string manifestdigest, string bearerToken)
returns error? {
    log:printDebug(io:sprintf("Invoking deleteManifest end point of registry API with a docker auth token. orgName: %s, imageName: %s, digest: %s",
    orgName, imageName, manifestdigest));
    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader(constants:AUTHORIZATION_HEADER, constants:BEARER_HEADER + " " + bearerToken);
    string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, manifestdigest);
    var responseForDeleteManifest = dockerRegistryClientEP->delete(deleteEndPoint, dockerRegistryRequest);

    if (responseForDeleteManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for deleteManifes request: %d", responseForDeleteManifest.statusCode));
        if (responseForDeleteManifest.statusCode == http:ACCEPTED_202) {
            log:printDebug(io:sprintf("Deleted the artifact \'%s/%s\'. Digest : %s", orgName, imageName, manifestdigest));
        } else {
            error er = error("Failed to delete the docker manifest. This may be due to an unknown manifest");
            return er;
        }
    } else {
        error er = error(io:sprintf("Error while deleting docker manifest. %s", responseForDeleteManifest));
        return er;
    }
}

function buildRegistryScope(json registryChallengePayload) returns string {
    log:printDebug("Building scopes requested by the docker registry");
    string requestType = registryChallengePayload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_TYPE_FIELD].toString();
    string name = registryChallengePayload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_NAME_FIELD].toString();
    string actions = registryChallengePayload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_ACTION_FIELD].toString();

    return io:sprintf("%s:%s:%s", requestType, name, actions);
}
