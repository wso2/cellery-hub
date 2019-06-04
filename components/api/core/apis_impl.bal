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
import ballerina/log;
import cellery_hub_api/db;

public function getOrg (http:Request _getOrgReq) returns http:Response{
    var params = _getOrgReq.getQueryParams();
    http:Response _getOrgRes = new;
    if (params.hasKey(ORG_NAME)){
        string orgName = <string>params[ORG_NAME];

        json|error res = db:getOrganization(orgName);

        if (res is json){
            _getOrgRes.statusCode = SUCCESS_STATUSCODE; 
            _getOrgRes.setJsonPayload(untaint res.organizationresponseList);
            log:printInfo("Successfully fetched organization " +orgName+ " from REGISTRY_ORGANIZATION" );        
            return _getOrgRes;
        }
        else{      
            string errMsg = "Unexpected error occured when fetching data from REGISTRY_ORGANIZATION";
            log:printError(errMsg , err = res);        
            return errorResponse(INTERNAL_ERROR_STATUSCODE, errMsg, untaint <string>res.detail().message); 
        }        
    }
    else{
        string errMsg = "getOrg faild : Organization name is not specified";
        log:printError(errMsg);
        return errorResponse(METHOD_NOT_ALLOWD_STATUSCODE, errMsg, "");
    } 
}

public function addOrg (http:Request _addOrgReq, gen:organizationRequest _addOrgBody) returns http:Response {
    // stub code - fill as necessary
    http:Response _addOrgRes = new;
    string _addOrgPayload = "Sample addOrg Response";
    _addOrgRes.setTextPayload(_addOrgPayload);

	return _addOrgRes;
}

public function searchArtifact (http:Request _searchArtifactReq) returns http:Response {
    // stub code - fill as necessary
    http:Response _searchArtifactRes = new;
    string _searchArtifactPayload = "Sample searchArtifact Response";
    _searchArtifactRes.setTextPayload(_searchArtifactPayload);

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
