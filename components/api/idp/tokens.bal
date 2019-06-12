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
import celllery_hub/constants;
import celllery_hub/gen;

public function getTokens(string authCode, string callbackUrl) returns (gen:TokensResponse|error) {
    http:Request tokenReq = new;
    var reqBody = io:sprintf("grant_type=authorization_code&code=%s&redirect_uri=%s", authCode, callbackUrl);
    tokenReq.setTextPayload(reqBody, contentType = constants:APPLICATION_URL_ENCODED_CONTENT_TYPE);
    var response = check oidcProviderClientEP->post(config:getAsString("idp.token.endpoint"), tokenReq);

    var responsePayload = check response.getJsonPayload();
    if (responsePayload["error"] != null) {
        error err = error(io:sprintf("Failed to call IdP token endpoint with error \"%s\" due to \"%s\"", <string>responsePayload["error"],
            <string>responsePayload.error_description));
        return err;
    } else if (response.statusCode >= 400) {
        error err = error(io:sprintf("Failed to call IdP token endpoint with status code ", response.statusCode));
        return err;
    } else {
        gen:TokensResponse tokens = {
            accessToken: <string>responsePayload.access_token,
            idToken: <string>responsePayload.id_token
        };
        log:printDebug("Successfully retrieved tokens from IdP");
        return tokens;
    }
}
