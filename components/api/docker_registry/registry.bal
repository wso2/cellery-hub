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

public function getResponseFromManifestAPI(string orgName, string imageName, string artifactVersion = "", string digest = "", string bearerToken = "")
returns http:Response? | error?  {
    log:printDebug(io:sprintf("Invoking docker registry API. orgName: %s, imageName: %s, artifactVersion: %s, digest: %s",
    orgName, imageName, artifactVersion, digest));

    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader("Authorization", "Bearer " + bearerToken);

    if (artifactVersion != "") {
        string getManifestEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, artifactVersion);
        log:printDebug("Calling getDockerManifestDigest end point");
        return dockerRegistryClientEP->get(getManifestEndPoint, message = dockerRegistryRequest);
    } else if (digest != "") {
        string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, digest);
        log:printDebug("Calling deleteDockerManifest end point");
        return dockerRegistryClientEP->delete(deleteEndPoint, dockerRegistryRequest);
    }
}

public function getManifestDigest(string orgName, string imageName, string artifactVersion, string bearerToken = "", string userId, string token)
returns string | error {
    var responseForGetManifest = getResponseFromManifestAPI(orgName, imageName, artifactVersion = artifactVersion, bearerToken = bearerToken);
    if (responseForGetManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for getManifestDigest request: %d", responseForGetManifest.statusCode));
        if (responseForGetManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForGetManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for getManifestDigest request: %s", payload));
                string registryScopeForGetManifest = buildRegistryScope(payload);
                log:printDebug(io:sprintf("Registry scope for getManifest : %s", registryScopeForGetManifest));

                string tokenToGetManifestDigest = getTokenFromDockerAuth(userId, token, registryScopeForGetManifest);
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

public function deleteManifest(string orgName, string imageName, string manifestdigest, string bearerToken = "", string userId, string token)
returns boolean | error {
    log:printDebug(io:sprintf("Digest received by deleteManifest : \'%s\'", manifestdigest));
    var responseForDeleteManifest = getResponseFromManifestAPI(orgName, imageName, digest = manifestdigest, bearerToken = bearerToken);
    if (responseForDeleteManifest is http:Response) {
        log:printDebug(io:sprintf("Received status code for deleteManifestDigest request: %d", responseForDeleteManifest.statusCode));
        if (responseForDeleteManifest.statusCode == http:UNAUTHORIZED_401) {
            var payload = responseForDeleteManifest.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry for deleteManifest request: %s", payload));
                string registryScopeForDeleteManifest = buildRegistryScope(payload);
                log:printDebug(io:sprintf("Registry scope for deleteManifest request: %s", registryScopeForDeleteManifest));

                string tokenToDeleteManifest = getTokenFromDockerAuth(userId, token, registryScopeForDeleteManifest);
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
    string requestType = payload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_TYPE_FIELD].toString();
    string name = payload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_NAME_FIELD].toString();
    string actions = payload[constants:REGISTRY_RESPONSE_ERRORS_FIELD][0][constants:REGISTRY_RESPONSE_DETAIL_FIELD][0]
    [constants:REGISTRY_RESPONSE_ACTION_FIELD].toString();

    return io:sprintf("%s:%s:%s", requestType, name, actions);
}