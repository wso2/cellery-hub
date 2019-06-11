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
import ballerina/log;
import ballerina/time;
import ballerina/io;

boolean isIntrospectionEPInitialized = false;

http:Client introspectionEP = new("https://wso2.com" , config = {
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: "",
                password: ""
            }
        }
    });
# Description
#
# + token - access token to be validated
# + conf - authorization configuration struct
# + return - returns whether the access token is valid or not
public function validateAndGetUsername(string token, string username, Conf conf) returns (string)|error {
    log:printDebug("Access token validator reached and token will be validated");
    if !isIntrospectionEPInitialized {
        var endPointUrl = conf.introspectionEp;
        introspectionEP = new(endPointUrl , config = {
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: conf.username,
                password: conf.password
            }
        }
    });
    isIntrospectionEPInitialized = true;
    }
    http:Request req = new;
    req.setPayload(io:sprintf("token=" + token));
    error ? x = req.setContentType(constants:APPLICATION_URL_ENCODED_CONTENT_TYPE);
    var response = introspectionEP->post("", req);
    var isValid = false;
    if (response is http:Response) {
        json result = check response.getJsonPayload();
        log:printDebug(io:sprintf("Response json from the introspection endpoint is %s", check string.convert(result)));
        isValid = check boolean.convert(result.active);
        string|error tokenUsername = string.convert(result.username);
        if (isValid) {
            if (tokenUsername is string) {
                if (username != "") && (username == tokenUsername) {
                    return tokenUsername;
                } else if (username == "") {
                    return tokenUsername;
                } else {
                    log:printError("Provided username does not match with the username in the token");
                    UsernameNotFoundErrorData errorDetail = {
                        errUsername: tokenUsername
                    };
                    UsernameNotFoundError userNotFoundError =
                                            error("Provided username does not match with the username in the token", errorDetail);
                    return userNotFoundError;
                }
            }
            log:printError("Token does not contain username");
        }
        log:printError("Token is not active");
        return tokenUsername;
    } else {
        log:printError("Failed to call the introspection endpoint", err = response);
        return response;
    }
}

type UsernameNotFoundErrorData record {
    string errUsername;
};

type UsernameNotFoundError error<string, UsernameNotFoundErrorData>;
