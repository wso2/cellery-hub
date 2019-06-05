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
import cellery_hub_api/db;
import ballerina/http;

public function createOrgs (http:Request _createOrgsReq, gen:OrgCreateRequest _createOrgsBody) returns http:Response {
    // stub code - fill as necessary
    http:Response _createOrgsRes = new;
    string _createOrgsPayload = "Sample createOrgs Response";
    _createOrgsRes.setTextPayload(_createOrgsPayload);
	return _createOrgsRes;
}
public function getOrg (http:Request getOrgReq, string orgName) returns http:Response {
    http:Response _getOrgRes = new;
    json | error res = db:getOrganization(orgName);
    if (res is json){
        _getOrgRes.statusCode = http:OK_200; 
        _getOrgRes.setJsonPayload(untaint res);
        log:printDebug("Successfully fetched organization " +orgName );        
        return _getOrgRes;
    } else {      
        string errMsg = "Unexpected error occured while fetching data";
        log:printError(errMsg , err = res);        
        return buildErrorResponse(API_DEFAULT_STATUSCODE, errMsg, untaint <string>res.detail().message); 
    } 
}
