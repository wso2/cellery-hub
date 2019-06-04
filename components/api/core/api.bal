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
import ballerina/log;
import ballerina/mime;
import ballerina/openapi;
import cellery_hub_api/gen;

listener http:Listener ep = new(9090, config = {});

@openapi:ServiceInfo {
    title: "Cellery Hub API",
    description: "Cellery Hub API",
    serviceVersion: "0.1.0",
    contact: {name: "", email: "architecture@wso2.com", url: ""},
    license: {name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0"}
}
@http:ServiceConfig {
    basePath: "/api/0.1.0"
}
service CelleryHubAPI on ep {

    @openapi:ResourceInfo {
        summary: "Create organization"
    }
    @http:ResourceConfig {
        methods:["POST"],
        path:"/orgs",
        body:"_createOrgsBody"
    }
    resource function createOrgs (http:Caller outboundEp, http:Request _createOrgsReq, gen:OrgCreateRequest _createOrgsBody) returns error? {
        http:Response _createOrgsRes = createOrgs(_createOrgsReq, _createOrgsBody);
        error? x = outboundEp->respond(_createOrgsRes);
    }

    @openapi:ResourceInfo {
        summary: "Get a specific organization",
        parameters: [
            {
                name: "orgName",
                inInfo: "path",
                paramType: "string",
                description: "Name of the organization",
                required: true,
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/orgs/{orgName}"
    }
    resource function getOrg (http:Caller outboundEp, http:Request _getOrgReq, string orgName) returns error? {
        http:Response _getOrgRes = getOrg(_getOrgReq, orgName);
        error? x = outboundEp->respond(_getOrgRes);
    }
}
