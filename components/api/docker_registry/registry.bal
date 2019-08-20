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

public function getDockerManifestDigest(string orgName, string imageName, string artifactVersion, string bearerToken = "") returns http:Response? | error {
    log:printDebug(io:sprintf("Invoking docker registry get manifests API"));
    string getManifestEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, artifactVersion);
    log:printDebug(io:sprintf("Reached getDockerManifestDigest with bearer token %s", bearerToken));

    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader("Authorization", "Bearer " + bearerToken);

    var response = dockerRegistryClientEP->get(getManifestEndPoint, message = dockerRegistryRequest);

    if (response is http:Response) {
        return response;
    }  else {
        string errMsg = io:sprintf("Error when calling the dockerRegistryClientEP for fetching manifest of \'%s/%s:%s\'", orgName, imageName, artifactVersion);
        log:printError(errMsg, err = response);
        error er = error(errMsg);
        return er;
    }
}

public function deleteArtifactFromRegistry(string orgName, string imageName, string digest) returns string {
    log:printDebug(io:sprintf("Invoking docker registry delete manifests API"));
    string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, digest);
    var response = dockerRegistryClientEP->delete(deleteEndPoint, "");
    string requestType = "";
    string name = "";
    string actions = "";
    if (response is http:Response) {
        log:printDebug(io:sprintf("Received Status Code : %d", response.statusCode));
        if (response.statusCode == http:UNAUTHORIZED_401) {
            var payload = response.getJsonPayload();
            if (payload is json) {
                log:printDebug(io:sprintf("Received payload from docker registry: %s", payload));
                requestType = payload["errors"][0]["detail"][0]["Type"].toString();
                name = payload["errors"][0]["detail"][0]["Name"].toString();
                actions = payload["errors"][0]["detail"][0]["Action"].toString();           
            }
        }
    }  else {
        log:printError(io:sprintf("Error when calling the dockerRegistryClientEP : %s", response.reason()), err = response);
    }
    return io:sprintf("%s:%s:%s", requestType, name, actions);
}

public function getTokenFromDockerAuthForGetManifest(string userName, string token, string registryScope) returns string {
    log:printDebug(io:sprintf("Invoking docker auth API for get token to getManifests"));
    string jwtToken = "";
    http:Client dockerAuthClientEP = new(config:getAsString("docker.auth.url"), config = {
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: userName,
                password: token
            }
        },
        secureSocket: {
            trustStore: {
                path: config:getAsString("security.truststore"),
                password: config:getAsString("security.truststorepass")
            },
            verifyHostname: false
        }
    });

    string getTokenPathParams = "/auth?service=Docker%20registry&scope=" + registryScope;
    var authResponse = dockerAuthClientEP->get(getTokenPathParams, message = "");
    if (authResponse is http:Response) {
        var authPayload = authResponse.getJsonPayload();
        log:printDebug(io:sprintf("Auth payload : %s", authPayload));
        if (authPayload is json) {
            jwtToken = authPayload["token"].toString();
        }              
    } else {
        log:printError(io:sprintf("Error when calling the dockerAuthClientEP : %s", authResponse.reason()), err = authResponse);
    }
    return jwtToken;
}

public function deleteManifestFromDockerRegistry(string orgName, string imageName, string manifestDigest, string bearerToken) returns int {
    log:printDebug(io:sprintf("Invoking docker auth API for deleteManifest"));
    string deleteEndPoint = io:sprintf("/v2/%s/%s/manifests/%s", orgName, imageName, manifestDigest);

    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader("Authorization", "Bearer " + bearerToken);
    var deleteManifestResponse = dockerRegistryClientEP->delete(deleteEndPoint, dockerRegistryRequest);
    log:printDebug(io:sprintf("Registry response for delete manifest : %s", deleteManifestResponse));
    if (deleteManifestResponse is http:Response) {
        int deleteManifestStatusCode = deleteManifestResponse.statusCode;
        return deleteManifestStatusCode;
    } else {
        log:printError(io:sprintf("Error when calling the docker registry with token for delete manifest : %s", deleteManifestResponse.reason()), err = deleteManifestResponse);
        return http:INTERNAL_SERVER_ERROR_500;
    }
}
