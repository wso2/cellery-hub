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
import ballerina/io;
import ballerina/mysql;
import ballerina/sql;
import ballerina/log;
import ballerina/time;
import cellery/gen;
import cellery/db;
import cellery/utils;

public function getOrg (http:Request _getOrgReq) returns http:Response|error {
    var params = _getOrgReq.getQueryParams();
    string orgName = "";
    http:Response _getOrgRes = new;
    if (params.hasKey(utils:ORG_NAME)){
        orgName = <string>params[utils:ORG_NAME];
    }
    else{
        gen:Error err = {
            code: utils:METHOD_NOT_ALLOWD_STATUSCODE,
            message: "Organization name is not found",
            description: ""
        };
        _getOrgRes.setJsonPayload(check json.convert(err));
        _getOrgRes.statusCode = err.code; 
        return _getOrgRes;
    }
    var res = db:selectOrg(orgName);

    if (res is table<record {}>) {
        gen:organizationListResponse orgListRes = {organizationresponseList : []};
        foreach int i in 0...res.count()-1{
            orgListRes.organizationresponseList[i] = check gen:organizationResponse.convert(res.getNext());
        }
        _getOrgRes.statusCode = utils:SUCCESS_STATUSCODE;
        json resPayload = check json.convert(orgListRes);
        _getOrgRes.setJsonPayload(untaint resPayload.organizationresponseList);
    }

    else {
        log:printError("Select data from REGISTRY_ORGANIZATION table failed: "
                + <string>res.detail().message);
        gen:Error err = {
            code: utils:INTERNAL_ERROR_STATUSCODE,
            message: "Unable to complete request",
            description: untaint <string>res.detail().message
        };
        _getOrgRes.setJsonPayload(check json.convert(err));
        _getOrgRes.statusCode = err.code;        
    } 
	return _getOrgRes;
}

public function addOrg (http:Request _addOrgReq, gen:organizationRequest _addOrgBody) returns http:Response|error {
    http:Response _addOrgRes = new;
    if (_addOrgReq.hasHeader(utils:USERNAME)){
        string userName = _addOrgReq.getHeader(utils:USERNAME);
        log:printInfo(userName + " is attempting to create a new organization");
    }
    else{
        log:printError(" Unauthenticated request : Username is not found");
        gen:Error err = {
            code: utils:UNAUTHORIZED_STATUSCODE,
            message: "Unable to create organization",
            description: "User name is not found"
        };
        _addOrgRes.setPayload(check json.convert(err));
        _addOrgRes.statusCode = err.code;
        return _addOrgRes;
    }
    string orgName = _addOrgBody.name;
    var ret = db:insertOrganization(orgName, _addOrgBody.description, _addOrgBody.defaultImageVisibility);

    if (ret is sql:UpdateResult) {
            log:printInfo(" New organization created with name " + orgName);
            gen:organizationResponse orgResPayload = {
                name: orgName, 
                createdDate: time:toString(time:currentTime())
            };
            _addOrgRes.setJsonPayload(check untaint json.convert(orgResPayload), contentType = "application/json");
            _addOrgRes.statusCode = utils:SUCCESS_STATUSCODE;
    } else {
            log:printError(" failed: " + <string>ret.detail().message);
            gen:Error err = {
                code: utils:METHOD_NOT_ALLOWD_STATUSCODE, 
                message: "Unable to create organization", 
                description : <string>ret.detail().message
            };
            _addOrgRes.setJsonPayload(check json.convert(err));
            _addOrgRes.statusCode = err.code;
        }
	return _addOrgRes;
}

public function searchArtifact (http:Request _searchArtifactReq) returns http:Response|error {
    var params = _searchArtifactReq.getQueryParams();
    http:Response _searchArtifactRes = new;

    // string qry = "SELECT REGISTRY_ARTIFACT.ARTIFACT_ID, REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME, REGISTRY_ARTIFACT.VERSION, 
    //                     REGISTRY_ARTIFACT_IMAGE.ORG_NAME, REGISTRY_ARTIFACT_INGRESS.INGRESS_TYPE, REGISTRY_ARTIFACT.VERIFIED, 
    //                     REGISTRY_ARTIFACT.STATEFUL, REGISTRY_ARTIFACT_LABEL.LABEL_KEY, REGISTRY_ARTIFACT_LABEL.LABEL_VALUE
    //                     FROM REGISTRY_ARTIFACT INNER JOIN
    //                     REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT.ARTIFACT_IMAGE_ID=REGISTRY_ARTIFACT_IMAGE.ARTIFACT_IMAGE_ID
    //                     LEFT JOIN
    //                     REGISTRY_ARTIFACT_LABEL ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_LABEL.ARTIFACT_ID
    //                     LEFT JOIN
    //                     REGISTRY_ARTIFACT_INGRESS ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_INGRESS.ARTIFACT_ID
    //                     WHERE REGISTRY_ARTIFACT.FIRST_AUTHOR=?";
    string qry = "SELECT REGISTRY_ARTIFACT.ARTIFACT_ID, REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME, REGISTRY_ARTIFACT.VERSION
                        FROM REGISTRY_ARTIFACT INNER JOIN
                        REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT.ARTIFACT_IMAGE_ID=REGISTRY_ARTIFACT_IMAGE.ARTIFACT_IMAGE_ID
                        LEFT JOIN
                        REGISTRY_ARTIFACT_LABEL ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_LABEL.ARTIFACT_ID
                        LEFT JOIN
                        REGISTRY_ARTIFACT_INGRESS ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_INGRESS.ARTIFACT_ID
                        WHERE REGISTRY_ARTIFACT.FIRST_AUTHOR=?";

    string[] values = [];
    int paramIndex = 0;
    values[paramIndex] = <string>params.username;        
    
    if (params.hasKey(utils:ORG_NAME)){
        paramIndex += 1;
        values[paramIndex] = <string>params[utils:ORG_NAME];
        qry += " AND REGISTRY_ARTIFACT_IMAGE.ORG_NAME=?";
    }

    if(params.hasKey(utils:IMAGE_NAME)){
        paramIndex += 1;
        values[paramIndex] = <string>params[utils:IMAGE_NAME];
        qry += " AND REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=?";
    }

    if (params.hasKey(utils:VERIFIED)){
        paramIndex += 1;
        values[paramIndex] = <string>params[utils:VERIFIED];
        qry += " AND REGISTRY_ARTIFACT.VERIFIED=?";
    }

    if(params.hasKey(utils:STATEFUL)){
        paramIndex += 1;
        values[paramIndex] = <string>params[utils:STATEFUL];
        qry += " AND REGISTRY_ARTIFACT.STATEFUL=?";
    } 

    if(params.hasKey(utils:INGRESSES)){
        string ingresses = <string>params[utils:INGRESSES];
        string[] ingressesArr = ingresses.split(",");
        string joinWith = " AND (";
        foreach string ing in ingressesArr {
            paramIndex += 1;
            values[paramIndex] = ing;
            qry += joinWith + " REGISTRY_ARTIFACT_INGRESS.INGRESS_TYPE=?";
            joinWith = " OR";
        }
        qry += ")";
    } 

    if(params.hasKey(utils:LABELS)){
        string labelParams = <string>params[utils:LABELS];
        io:StringReader sr = new(labelParams, encoding = "UTF-8");
        json|error labels = sr.readJson();
        if (labels is json) {
            log:printInfo("Received labels"+labels.toString());
            string joinWith = " AND (";
            foreach int i in 0...(labels.length()-1) {
                string key = labels[i].getKeys()[0];
                string value = labels[i][key].toString();
                paramIndex += 2;
                values[paramIndex-1] = key;
                values[paramIndex] = value; 
                qry += joinWith + " (REGISTRY_ARTIFACT_LABEL.LABEL_KEY=? AND REGISTRY_ARTIFACT_LABEL.LABEL_VALUE=?)";
                joinWith = " OR";
            }
            qry += ")";
        } else {
            error er = error(<string>labels.detail().message);
            log:printError("JSON Conversion error", err = er);
        }
    } 
    var res = db:selectArtifact(qry, values) ;  

    if (res is table<record {}>) {
        gen:listArtifactResponse listArtifactRes = {artifactlistresponseList : []};
        foreach int i in 0...res.count()-1{
            listArtifactRes.artifactlistresponseList[i] = check gen:artifactListResponse.convert(res.getNext());
        }
        _searchArtifactRes.statusCode = utils:SUCCESS_STATUSCODE;
        json resPayload = check json.convert(listArtifactRes);
        _searchArtifactRes.setJsonPayload(untaint resPayload.artifactlistresponseList, contentType = "application/json");        
    }
    else {
        log:printError("Select data from REGISTRY_ARTIFACT_IMAGE table failed: "
                + <string>res.detail().message);
        _searchArtifactRes.setPayload({ code: utils:INTERNAL_ERROR_STATUSCODE, message: "Unable to complete search", description : untaint <string>res.detail().message});
        _searchArtifactRes.statusCode = utils:INTERNAL_ERROR_STATUSCODE;
    }
	return _searchArtifactRes;
}

public function addArtifact (http:Request _addArtifactReq, gen:createArtifactRequest _addArtifactBody) returns http:Response {
    // stub code - fill as necessary
    http:Response _addArtifactRes = new;
    string _addArtifactPayload = "Sample addArtifact Response";
    _addArtifactRes.setTextPayload(_addArtifactPayload);

	return _addArtifactRes;
}

public function getArtifact (http:Request _getArtifactReq, string artifactId) returns http:Response {
    // stub code - fill as necessary
    http:Response _getArtifactRes = new;
    string _getArtifactPayload = "Sample getArtifact Response";
    _getArtifactRes.setTextPayload(_getArtifactPayload);

	return _getArtifactRes;
}

public function updateArtifact (http:Request _updateArtifactReq, string artifactId, gen:updateArtifactRequest _updateArtifactBody) returns http:Response {
    // stub code - fill as necessary
    http:Response _updateArtifactRes = new;
    string _updateArtifactPayload = "Sample updateArtifact Response";
    _updateArtifactRes.setTextPayload(_updateArtifactPayload);

	return _updateArtifactRes;
}

public function searchImage (http:Request _searchImageReq) returns http:Response {
    // stub code - fill as necessary
    http:Response _searchImageRes = new;
    string _searchImagePayload = "Sample searchImage Response";
    _searchImageRes.setTextPayload(_searchImagePayload);

	return _searchImageRes;
}

public function getImage (http:Request _getImageReq, string imageId) returns http:Response {
    // stub code - fill as necessary
    http:Response _getImageRes = new;
    string _getImagePayload = "Sample getImage Response";
    _getImageRes.setTextPayload(_getImagePayload);

	return _getImageRes;
}

public function updateImage (http:Request _updateImageReq, string imageId, gen:updateArtifactRequest _updateImageBody) returns http:Response {
    // stub code - fill as necessary
    http:Response _updateImageRes = new;
    string _updateImagePayload = "Sample updateImage Response";
    _updateImageRes.setTextPayload(_updateImagePayload);

	return _updateImageRes;
}

