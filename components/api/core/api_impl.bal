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

public function createOrg(http:Request createOrgReq, gen:OrgCreateRequest createOrgsBody) returns http:Response {
    if (createOrgReq.hasHeader(USER_ID)) {
        string userId = createOrgReq.getHeader(USER_ID);
        var res = db:insertOrganization(userId, createOrgsBody);
        if (res is error) {
            log:printError("Unexpected error occured while inserting organization " + untaint createOrgsBody.orgName, err = res);
            return buildUnknownErrorResponse();
        } else {
            http:Response createOrgRes = new;
            createOrgRes.statusCode = http:OK_200;
            log:printDebug("Organization \'" + createOrgsBody.orgName + "\' is created. Author : " + userId);
            return createOrgRes;
        }
    } else {
        log:printError("Unauthenticated request. Username is not found");
        return buildErrorResponse(http:UNAUTHORIZED_401, API_ERROR_CODE, "Unable to create organization", 
                                                            "Unauthenticated request. Auth token is not provided");
    }
}

public function getOrg(http:Request getOrgReq, string orgName) returns http:Response {    
    json | error res = db:getOrganization(orgName);
    if (res is json) {
        if (res != null) {
            http:Response getOrgRes = new;
            getOrgRes.statusCode = http:OK_200;
            getOrgRes.setJsonPayload(untaint res);
            log:printDebug("Successfully fetched organization " + orgName);
            return getOrgRes;
        } else {
            string errMsg = "Unable to fetch organization. ";
            string errDes = "There is no organization named \'" + orgName + "\'";
            log:printError(errMsg + errDes);
            return buildErrorResponse(http:NOT_FOUND_404, API_ERROR_CODE, errMsg, errDes);
        }
    } else {
        log:printError("Unable to fetch organization", err = res);
        return buildUnknownErrorResponse();
    }
}
