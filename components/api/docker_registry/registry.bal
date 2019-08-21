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

public function getTokenFromDockerAuth(string userName, string token, string registryScope) returns string {
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
        if (authPayload is json) {
            jwtToken = authPayload["token"].toString();
        }              
    } else {
        log:printError(io:sprintf("Error when calling the dockerAuthClientEP : %s", authResponse.reason()), err = authResponse);
    }
    return jwtToken;
}
