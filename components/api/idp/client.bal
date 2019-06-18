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

function getOidcProviderClientEP() returns http:Client {
    http:Client oidcProviderClientEP = new(config:getAsString("idp.endpoint"), config = {
        secureSocket: {
            trustStore: {
                path: config:getAsString("security.truststore"),
                password: config:getAsString("security.truststorepass")
            },
            verifyHostname: false
        },
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: config:getAsString("idp.oidc.clientid"),
                password: config:getAsString("idp.oidc.clientsecret")
            }
        }
    });
    return oidcProviderClientEP;
}

function getClientEP() returns http:Client {
    http:Client idpClientEP = new(config:getAsString("idp.endpoint"), config = {
        secureSocket: {
            trustStore: {
                path: config:getAsString("security.truststore"),
                password: config:getAsString("security.truststorepass")
            },
            verifyHostname: false
        },
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: config:getAsString("idp.username"),
                password: config:getAsString("idp.password")
            }
        }
    });
    return idpClientEP;
}
