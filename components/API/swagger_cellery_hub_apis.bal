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
import cellery/gen;
import cellery/impl;
import ballerina/time;
import cellery/reader;
import cellery/model;
import cellery/validator;
import ballerina/io;

final string filter_name_header = "isValidToken";

public type RequestFilter object {
    public function filterRequest(http:Caller caller, http:Request request,
                        http:FilterContext context)
                        returns boolean {
        log:printInfo("Request Interceptor......");
        var params = request.getQueryParams();
        var token = <string>params.token;
        var username = <string>params.username;
        var isValid = validator:validateAccessToken(username, token);
        string|error validStr = string.convert(isValid);
        if (validStr is string){
            request.setHeader(filter_name_header, validStr);
        }
        else{
            request.setHeader(filter_name_header, "false");
        }
        return true;
    }

    public function filterResponse(http:Response response,
                                   http:FilterContext context)
                                    returns boolean {
        log:printInfo("Interceptor Response......");
        return true;
    }
};

RequestFilter filter = new;

listener http:Listener echoListener = new http:Listener(9090,
                                            config = { filters: [filter]});

@openapi:ServiceInfo {
    title: "Swagger Cellery Hub APIs",
    description: "Cellery Hub APIs",
    serviceVersion: "1.0.0",
    termsOfService: "http://swagger.io/terms/",
    contact: {name: "", email: "architecture@wso2.com", url: ""},
    license: {name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0.html"},
    tags: [
        {name: "Cellery Hub", description: "Cellery Hub APIs swagger", externalDocs: {description: "Cellery API docs", url: "http://swagger.io"}}
    ]
}
@http:ServiceConfig {
    basePath: "/CelleryHubAPI/1.0.0"
}
service SwaggerCelleryHubAPIs on echoListener {

    @openapi:ResourceInfo {
        summary: "Retrieve organizations",
        tags: ["Cellery Hub"],
        description: "Retrieve organizations",
        parameters: [
            {
                name: "name",
                inInfo: "query",
                paramType: "string",
                description: "name of the organization/image",
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/orgs"
    }
    resource function getOrg (http:Caller outboundEp, http:Request _getOrgReq) returns error? {
        http:Response|error _getOrgRes = impl:getOrg(_getOrgReq);
        if(_getOrgRes is http:Response){
            error? x = outboundEp->respond(_getOrgRes);
        }
        else{
            io:println("Error occured");
        }
    }

    @openapi:ResourceInfo {
        summary: "Add a new organization",
        tags: ["Cellery Hub"],
        description: "Add a new organization"
    }
    @http:ResourceConfig {
        methods:["POST"],
        path:"/orgs",
        body:"_addOrgBody"
    }
    resource function addOrg (http:Caller outboundEp, http:Request _addOrgReq, gen:organizationRequest _addOrgBody) returns error? {
        http:Response|error _addOrgRes = impl:addOrg(_addOrgReq, _addOrgBody);
        if _addOrgRes is http:Response{
            error? x = outboundEp->respond(_addOrgRes);
        }
        else{
            io:println(_addOrgRes.detail().messege);
        }
    }

    @openapi:ResourceInfo {
        summary: "search artifact",
        tags: ["Cellery Hub"],
        description: "search artifact",
        parameters: [
            {
                name: "name",
                inInfo: "query",
                paramType: "string",
                description: "name of the organization/image",
                allowEmptyValue: ""
            },
            {
                name: "userId",
                inInfo: "query",
                paramType: "string",
                description: "user Id",
                allowEmptyValue: ""
            },
            {
                name: "labels",
                inInfo: "query",
                paramType: "string",
                description: "list of labels parsed as json labels &#x3D; [{&quot;key&quot; &#x3D; &quot;vaue&quot;}]",
                allowEmptyValue: ""
            },
            {
                name: "artifactIngresses",
                inInfo: "query",
                paramType: "string",
                description: "list of keywords comma separated.",
                allowEmptyValue: ""
            },
            {
                name: "artifactVerified",
                inInfo: "query",
                paramType: "string",
                description: "artifact verified or not.",
                allowEmptyValue: ""
            },
            {
                name: "artifactStateful",
                inInfo: "query",
                paramType: "string",
                description: "whether the artifact is stateful or not.",
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/artifact"
    }
    resource function searchArtifact (http:Caller outboundEp, http:Request _searchArtifactReq) returns error? {
        http:Response|error _searchArtifactRes = impl:searchArtifact(_searchArtifactReq);
        if(_searchArtifactRes is http:Response){
            error? x = outboundEp->respond(_searchArtifactRes);
        }
        else{
            io:println("Error occured");
        }
    }

    @openapi:ResourceInfo {
        summary: "Add a new artifact",
        tags: ["Cellery Hub"],
        description: "Add a new artifact"
    }
    @http:ResourceConfig {
        methods:["POST"],
        path:"/artifact",
        body:"_addArtifactBody"
    }
    resource function addArtifact (http:Caller outboundEp, http:Request _addArtifactReq, gen:createArtifactRequest _addArtifactBody) returns error? {
        http:Response _addArtifactRes = impl:addArtifact(_addArtifactReq, _addArtifactBody);
        error? x = outboundEp->respond(_addArtifactRes);
    }

    @openapi:ResourceInfo {
        summary: "retrieve artifact",
        tags: ["Cellery Hub"],
        description: "Retrieve artifact",
        parameters: [
            {
                name: "artifactId",
                inInfo: "path",
                paramType: "string",
                description: "artifactId.",
                required: true,
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/artifact/{artifactId}"
    }
    resource function getArtifact (http:Caller outboundEp, http:Request _getArtifactReq, string artifactId) returns error? {
        http:Response _getArtifactRes = impl:getArtifact(_getArtifactReq, artifactId);
        error? x = outboundEp->respond(_getArtifactRes);
    }

    @openapi:ResourceInfo {
        summary: "update an existing artifact",
        tags: ["Cellery Hub"],
        description: "update an existing artifact",
        parameters: [
            {
                name: "artifactId",
                inInfo: "path",
                paramType: "string",
                description: "artifactId.",
                required: true,
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["PUT"],
        path:"/artifact/{artifactId}",
        body:"_updateArtifactBody"
    }
    resource function updateArtifact (http:Caller outboundEp, http:Request _updateArtifactReq, string artifactId, gen:updateArtifactRequest _updateArtifactBody) returns error? {
        http:Response _updateArtifactRes = impl:updateArtifact(_updateArtifactReq, artifactId, _updateArtifactBody);
        error? x = outboundEp->respond(_updateArtifactRes);
    }

    @openapi:ResourceInfo {
        summary: "search images",
        tags: ["Cellery Hub"],
        description: "search images",
        parameters: [
            {
                name: "name",
                inInfo: "query",
                paramType: "string",
                description: "name of the organization/image",
                allowEmptyValue: ""
            },
            {
                name: "labels",
                inInfo: "query",
                paramType: "string",
                description: "list of labels parsed as json labels &#x3D; [{&quot;key&quot; &#x3D; &quot;vaue&quot;}]",
                allowEmptyValue: ""
            },
            {
                name: "keywords",
                inInfo: "query",
                paramType: "string",
                description: "list of keywords comma separated.",
                allowEmptyValue: ""
            },
            {
                name: "artifactIngresses",
                inInfo: "query",
                paramType: "string",
                description: "list of keywords comma separated.",
                allowEmptyValue: ""
            },
            {
                name: "artifactVerified",
                inInfo: "query",
                paramType: "string",
                description: "artifact verified or not.",
                allowEmptyValue: ""
            },
            {
                name: "artifactStateful",
                inInfo: "query",
                paramType: "string",
                description: "whether the artifact is stateful or not.",
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/images"
    }
    resource function searchImage (http:Caller outboundEp, http:Request _searchImageReq) returns error? {
        http:Response _searchImageRes = impl:searchImage(_searchImageReq);
        error? x = outboundEp->respond(_searchImageRes);
    }

    @openapi:ResourceInfo {
        summary: "retrieve image with given id",
        tags: ["Cellery Hub"],
        description: "Retrieve image",
        parameters: [
            {
                name: "imageId",
                inInfo: "path",
                paramType: "string",
                description: "imageId.",
                required: true,
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["GET"],
        path:"/images/{imageId}"
    }
    resource function getImage (http:Caller outboundEp, http:Request _getImageReq, string imageId) returns error? {
        http:Response _getImageRes = impl:getImage(_getImageReq, imageId);
        error? x = outboundEp->respond(_getImageRes);
    }

    @openapi:ResourceInfo {
        summary: "update an existing artifact",
        tags: ["Cellery Hub"],
        description: "update an existing artifact",
        parameters: [
            {
                name: "imageId",
                inInfo: "path",
                paramType: "string",
                description: "imageId.",
                required: true,
                allowEmptyValue: ""
            }
        ]
    }
    @http:ResourceConfig {
        methods:["PUT"],
        path:"/images/{imageId}",
        body:"_updateImageBody"
    }
    resource function updateImage (http:Caller outboundEp, http:Request _updateImageReq, string imageId, gen:updateArtifactRequest _updateImageBody) returns error? {
        http:Response _updateImageRes = impl:updateImage(_updateImageReq, imageId, _updateImageBody);
        error? x = outboundEp->respond(_updateImageRes);
    }

}

