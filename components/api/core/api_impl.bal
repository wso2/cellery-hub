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

public function createOrg (http:Request createOrgReq, gen:OrgCreateRequest createOrgsBody) returns http:Response{
    http:Response _addOrgRes = new;
    if (createOrgReq.hasHeader(USERNAME)){
        string userName = createOrgReq.getHeader(USERNAME);
        var res = db:insertOrganization(userName, createOrgsBody);
        if (res is error) {
            string errMsg = "Unexpected error occured while inserting organization " + untaint createOrgsBody.orgName;
            log:printError(errMsg, err = res);
            return buildErrorResponse(http:INTERNAL_SERVER_ERROR_500, API_ERROR_CODE, errMsg, "Organization name \'" + 
                                                                    untaint createOrgsBody.orgName+ "\' is already taken");
        } else {        
            _addOrgRes.statusCode = http:OK_200;
            log:printDebug("Organization \'" +createOrgsBody.orgName+ "\' is created. Author : " +userName);   
            return _addOrgRes;
        }
    } else {
        string errDescription = "Unauthenticated request : Username is not found";
        log:printError(errDescription);
        return buildErrorResponse(http:UNAUTHORIZED_401, API_ERROR_CODE, "Unable to create organization", errDescription);
    }    
}

public function getOrg (http:Request getOrgReq, string orgName) returns http:Response {
    http:Response _getOrgRes = new;
    json | error res = db:getOrganization(orgName);
    if (res is json){
        if (res != null){
            _getOrgRes.statusCode = http:OK_200; 
            _getOrgRes.setJsonPayload(untaint res);
            log:printDebug("Successfully fetched organization " +orgName );        
            return _getOrgRes;
        }
        else{
            string errMsg = "Ubable to fetch organization";
            log:printError(errMsg);        
            return buildErrorResponse(http:NOT_FOUND_404, API_ERROR_CODE, errMsg, "There is no organization named \'" +orgName+ "\'"); 
        }
    } else {      
        string errMsg = "Ubable to fetch organization";
        log:printError(errMsg , err = res);        
        return buildErrorResponse(http:INTERNAL_SERVER_ERROR_500, API_ERROR_CODE, errMsg, "Unexpected error occured while fetching data"); 
    } 
}
