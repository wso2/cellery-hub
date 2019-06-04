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
import ballerina/mysql;
import ballerina/sql;
import cellery_hub_api/gen;


public function getOrganization (string name) returns json|error{
    log:printDebug("Performing organization search for Org name in REGISTRY_ORGANIZATION table " + name);
    var res =  connection->select(GET_ORG_QUERY,gen:organizationResponse,name, loadToMemory = true);

    if (res is table<record {}>) {
        gen:organizationListResponse orgListRes = {organizationresponseList : []};
        foreach int i in 0...res.count()-1{
            orgListRes.organizationresponseList[i] = check gen:organizationResponse.convert(res.getNext());
        }
        json resPayload = check json.convert(orgListRes);
        log:printDebug("Fetching data for organization " +name+ ", from REGISTRY_ORGANIZATION is successful");  
        return resPayload;       
    }
    else{
        log:printDebug("Error occured while fetching data from REGISTRY_ORGANIZATION for getOrg EP");  
        return res;              
    }
}
