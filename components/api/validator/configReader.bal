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
import ballerina/log;
import ballerina/system;
import ballerina/filepath;
import ballerina/config;
import cellery_hub_api/constants;

public type Conf record { |
    string introspectionEp = constants:DEFAULT_IDP_ENDPOINT;
    string username = constants:IDP_DEFAULT_USERNAME;
    string password = constants:IDP_DEFAULT_PASSWORD;
| };

Conf config = {};
boolean configLoaded = false;
public function getAuthConfig() returns (Conf)|error {
    if configLoaded == true {
        return config;
    }
    log:printDebug("Started to read config file");
    if (config:getAsString(constants:IDP_INTROSPCET_VAR) != "" && config:getAsString(constants:IDP_USERNAME_VAR) != "" && 
        config:getAsString(constants:IDP_PASSWORD_VAR) != "") {
        config = {
            introspectionEp:config:getAsString(constants:IDP_ENDPOINT_VAR) + config:getAsString
            (constants:IDP_INTROSPCET_VAR),
            username:config:getAsString(constants:IDP_USERNAME_VAR),
            password:config:getAsString(constants:IDP_PASSWORD_VAR)
        };
    } else {
        log:printInfo("Could not resolve the values from configs. Hence using the default values");
    }
    configLoaded = true;
    return config;
}
