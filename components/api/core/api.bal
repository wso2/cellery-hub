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
import ballerina/mime;
import ballerina/openapi;
import cellery_hub_api/gen;
import cellery_hub_api/filter;
import cellery_hub_api/constants;

http:ServiceEndpointConfiguration celleryHubAPIEPConfig = {
    secureSocket: {
        certFile: config:getAsString("security.certfile"),
        keyFile: config:getAsString("security.keyfile")
    },
    filters: [
        new filter:CaptchaRequestFilter()
    ]
};

listener http:Listener ep = new(9090, config = celleryHubAPIEPConfig);

@openapi:ServiceInfo {
    title: "Cellery Hub API",
    description: "Cellery Hub API",
    serviceVersion: "0.1.0",
    contact: {name: "", email: "architecture@wso2.com", url: ""},
    license: {name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0"}
}
@http:ServiceConfig {
    basePath: "/api/0.1.0",
    cors: {
        allowOrigins: [config:getAsString("portal.publicurl")],
        allowCredentials: true
    }
}
service CelleryHubAPI on ep {

    @openapi:ResourceInfo {
        summary: "Create organization"
    }
    @http:ResourceConfig {
        methods:["POST"],
        path:"/orgs",
        body:"_createOrgBody"
    }
    resource function createOrg (http:Caller outboundEp, http:Request _createOrgReq, gen:OrgCreateRequest _createOrgBody) returns error? {
        http:Response _createOrgRes = createOrg(_createOrgReq, untaint _createOrgBody);
        error? x = outboundEp->respond(_createOrgRes);
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
        http:Response _getOrgRes = getOrg(_getOrgReq, untaint orgName);
        error? x = outboundEp->respond(_getOrgRes);
    }

    @openapi:ResourceInfo {
        summary: "Get a specific Image with versions",
        parameters: [
        {
            name: "orgName",
            inInfo: "path",
            paramType: "string",
            description: "Name of the organization which the image belogs to",
            required: true,
            allowEmptyValue: ""
        },
        {
            name: "imageName",
            inInfo: "path",
            paramType: "string",
            description: "Name of the image",
            required: true,
            allowEmptyValue: ""
        }
        ]
    }
    @http:ResourceConfig {
        methods: ["GET"],
        path: "/images/{orgName}/{imageName}"
    }
    resource function getImage(http:Caller outboundEp, http:Request _getImageReq, string orgName, string imageName)
    returns error? {
        map<string> queryParams = _getImageReq.getQueryParams();
        int offset = 0;
        int resultLimit = 10;
        if (queryParams.hasKey(constants:OFFSET)) {
            int | error offsetQueryParam = int.convert(queryParams.offset);
            if (offsetQueryParam is int) {
                offset = offsetQueryParam;
            }
        }
        if (queryParams.hasKey(constants:RESULT_LIMIT)) {

            int | error resultLimitQueryParam = int.convert(queryParams.
            resultLimit);
            if (resultLimitQueryParam is int) {
                resultLimit = resultLimitQueryParam;
            }
        }

        http:Response _getImageRes = getImageByImageName(_getImageReq, untaint orgName, untaint imageName, offset, resultLimit);
        error? x = outboundEp->respond(_getImageRes);
    }
}
