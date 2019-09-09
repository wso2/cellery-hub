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
import cellery_hub_api/constants;

public function getTokenFromDockerAuth(string userName, string token, string registryScope) returns string | error? {
    log:printInfo(io:sprintf("Invoking docker auth API for get token for scope : %s", registryScope));

    string | error registryServiceName = http:encode(constants:DOCKER_REGISTRY_SERVICE_NAME, "utf-8");

    if (registryServiceName is string) {
        string getTokenPathParams = io:sprintf("/auth?service=%s&scope=%s", registryServiceName, registryScope);
        http:Client dockerAuthClient = getDockerAuthClient(userName, token);
        var authResponse = dockerAuthClient->get(getTokenPathParams, message = "");
        if (authResponse is http:Response) {
            var authPayload = authResponse.getJsonPayload();
            if (authPayload is json) {
                return authPayload["token"].toString();
            }
        } else {
            error er = error(io:sprintf("Error when calling the dockerAuthClient. %s", authResponse.reason()));
            return er;
        }
    } else {
        error er = error(io:sprintf("Error when encoding the registry service name. %s", registryServiceName.reason()));
        return er;
    }
}
