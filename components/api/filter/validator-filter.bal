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
import cellery_hub_api/validator;
import cellery_hub_api/constants;
import ballerina/mysql;
import ballerina/sql;

public type validateRequestFilter object {
    public function filterRequest(http:Caller caller, http:Request request,
    http:FilterContext context) returns boolean {
        log:printDebug("Request was intercepted to validate the token ......");
        string headerUsername = "";
        if(request.hasHeader(constants:AUTHENTICATED_USER)) {
            headerUsername = request.getHeader(constants:AUTHENTICATED_USER);
            request.removeHeader(constants:AUTHENTICATED_USER);
        }
        string token = "";
        if(request.hasHeader(constants:AUTHORIZATION_HEADER)) {
            string tokenHeaderValue = request.getHeader(constants:AUTHORIZATION_HEADER);
            string[] splittedToken = tokenHeaderValue.split(" ");
            if splittedToken.length() != 2 || !(splittedToken[0] == "Bearer" || splittedToken[0] == "bearer") {
                log:printError("Not not receive the token in proper format");
                return true;
            }
            token = splittedToken[1];
            if "" == token {
                log:printDebug("Did not receive any token. Passing the request to the next filter");
                return true;
            }
            validator:Conf|error conf = untaint validator:getAuthConfig();
            if conf is validator:Conf {
                string|error username = validator:validateAndGetUsername(untaint token, headerUsername ,conf);
                if (username is string) {
                    if username != "" {
                        request.setHeader(constants:AUTHENTICATED_USER, username);
                        log:printInfo(io:sprintf("The token is successfully validated for the user %s", username));
                        return true;
                    } else {
                        log:printError("The token is not valid");
                        return true;
                    }
                } else {
                    log:printError("When validating the token something went wrong", err = username);
                    return true;
                }
            } else {
                log:printError("Error received while calling loadConfig. Passing the request to the next filter", err = conf);
                return true;
            }

        } else {
            log:printDebug("Did not receive any token. Passing the request to the next filter");
            return true;
        }
    }

    public function filterResponse(http:Response response,
                                   http:FilterContext context)
                                    returns boolean {
        return true;
    }
};
