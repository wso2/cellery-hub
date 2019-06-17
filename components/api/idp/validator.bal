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

public type TokenDetail record {
    string username;
    int expiryTime;
};

# This is used to validate the token comming in and returning token detail consists of expiry time and username
# + token - access token to be validated
# + return - returns a token detail if an access token is valid otherwise retuns a error
public function getTokenDetails(string token) returns (TokenDetail)|error {
    log:printDebug("Access token validator reached and token will be validated");
    http:Request req = new;
    req.setPayload(io:sprintf("token=" + token));
    error ? x = req.setContentType(constants:APPLICATION_URL_ENCODED_CONTENT_TYPE);
    // TODO There is a bug on ballerina that when there are more than one global client endpoints,
    // we have to reinitialize the endpoint. Need to remove this after the bug on this in ballerina is fixed
    http:Client idpClientEP = getClientEP();
    var response = idpClientEP->post(config:getAsString(constants:IDP_INTROSPCET_VAR), req);
    if (response is http:Response) {
        if (response.statusCode < 200 && response.statusCode > 300){
            log:printError("Something went wrong while connecting to introspection endpoint");
        }
        json result = check response.getJsonPayload();
        log:printDebug(io:sprintf("Response json from the introspection endpoint is %s", check string.convert(result)));
        var isValid = check boolean.convert(result.active);
        var fullyQualifiedUsername = check string.convert(result.username);
        TokenDetail tokenDetail = {
            username: fullyQualifiedUsername.split("@")[0],
            expiryTime: check int.convert(result.exp)
        };
        if (isValid) {
            if (tokenDetail.username != "") || (tokenDetail.expiryTime == 0) {
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
