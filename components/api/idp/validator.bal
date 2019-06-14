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

public type TokenDetail record { 
    string username;
    int expiryTime;
};

// http:Client introspectionEP3 = new(config:getAsString(constants:IDP_INTROSPCET_VAR));

# Description
#
# + token - access token to be validated
# + username - username to be validated
# + return - returns a token detail if an access token is valid otherwise retuns a error
public function validateAndGetTokenDetails(string token, string username) returns (TokenDetail)|error {
    log:printDebug("Access token validator reached and token will be validated");
    // TODO There is a bug on ballerina that when there are more than 
    // one global client endpoints, we have to reinitialize the endpoint 
    // Need to remove this after the bug on this in ballerina is fixed
    if !isIntrospectionEPInitialized {
        var endPointUrl = config:getAsString(constants:IDP_ENDPOINT_VAR);
        idpClientEP = new(endPointUrl , config = {
            secureSocket: {
                verifyHostname :false,
                trustStore: {
                    path: config:getAsString("security.truststore"),
                    password: config:getAsString("security.truststorepass")
                }
            },
            auth: {
                scheme: http:BASIC_AUTH,
                config: {
                    username: config:getAsString("idp.username"),
                    password: config:getAsString("idp.password")
                }
            }
        });
    isIntrospectionEPInitialized = true;
    }

    http:Request req = new;
    req.setPayload(io:sprintf("token=" + token));
    error ? x = req.setContentType(constants:APPLICATION_URL_ENCODED_CONTENT_TYPE);
    var response = idpClientEP->post(config:getAsString(constants:IDP_INTROSPCET_VAR), req);
    var isValid = false;
    if (response is http:Response) {
        if (response.statusCode < 200 && response.statusCode > 300){
            log:printError("Something went wrong while connecting to introspection endpoint");
        }
        json result = check response.getJsonPayload();
        log:printDebug(io:sprintf("Response json from the introspection endpoint is %s", check string.convert(result)));
        isValid = check boolean.convert(result.active);
        TokenDetail tokenDetail = {
            username: check string.convert(result.username),
            expiryTime: check int.convert(result.exp)
        };
        if (isValid) {
            if (tokenDetail.username != "") || (tokenDetail.expiryTime == 0) {
                return tokenDetail;
            } else if (username == "") {
                return tokenDetail;
            } else {
                log:printError("Provided username does not match with the username in the token");
                UsernameNotFoundErrorData errorDetail = {
                    errUsername: tokenDetail.username
                };
                UsernameNotFoundError userNotFoundError =
                                        error("Provided username does not match with the username in the token", errorDetail);
                return userNotFoundError;
            }
        }
        log:printError("Token is not active");
        return tokenDetail;
    } else {
        log:printError("Failed to call the introspection endpoint", err = response);
        return response;
    }
}

type UsernameNotFoundErrorData record {
    string errUsername;
};

type UsernameNotFoundError error<string, UsernameNotFoundErrorData>;
