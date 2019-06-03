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

import ballerina/io;
import ballerina/log;
import ballerina/mysql;
import ballerina/sql;
import ballerina/http;
import ballerina/time;
import cellery/pkg;


public function insertOrganization(string org, string des, string dv) returns sql:UpdateResult|error{
    log:printInfo("Performing Organization insertion");
    return connection->update("INSERT INTO REGISTRY_ORGANIZATION(ORG_NAME,DESCRIPTION,DEFAULT_IMAGE_VISIBILITY)VALUES(?,?,?)",org,des,dv);
}

public function selectOrg(string name) returns json|error{
    log:printDebug("Performing organization search for Org name in REGISTRY_ORGANIZATION table " + name);
    var res =  connection->select(pkg:GET_ORG_QUERY,pkg:organizationResponse,name, loadToMemory = true);

    if (res is table<record {}>) {
        io:println(res.count());
        pkg:organizationListResponse orgListRes = {organizationresponseList : []};
        foreach int i in 0...res.count()-1{
            orgListRes.organizationresponseList[i] = check pkg:organizationResponse.convert(res.getNext());
        }
        json resPayload = check json.convert(orgListRes);
        log:printDebug("Fetching data from REGISTRY_ORGANIZATION for getOrg EP is successful");  
        return resPayload;       
    }
    else{
        log:printDebug("Error occured while fetching data from REGISTRY_ORGANIZATION for getOrg EP");  
        return res;              
    }
}

public function selectArtifact(string qry, string[] params)
 returns table<record {}>|error{
    log:printInfo("Performing artifact search");
    return connection->select(qry,pkg:artifactListResponse, ...params, loadToMemory = true);
}

public function updateArtifact(string des, string id) returns sql:UpdateResult|error{
    log:printInfo("Performing update on artifact " + id);
    return connection->update("UPDATE REGISTRY_ARTIFACT SET DESCRIPTION  = ? WHERE ARTIFACT_ID = ?",des,id);
}

public function retrieveArtifact(string id) returns table<record {}>|error{
    log:printInfo("Performing data retrieval for articat " + id);
    return connection->select("SELECT REGISTRY_ARTIFACT.ARTIFACT_ID, REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME,
                 REGISTRY_ARTIFACT.VERSION, REGISTRY_ARTIFACT.DESCRIPTION, REGISTRY_ARTIFACT.PULL_COUNT, REGISTRY_ARTIFACT.PUSH_COUNT,
                 REGISTRY_ARTIFACT_IMAGE.VISIBILITY, REGISTRY_ARTIFACT_IMAGE.LICENSE_IDENTIFIER,     
                 REGISTRY_ARTIFACT.FIRST_AUTHOR, REGISTRY_ARTIFACT.LAST_AUTHOR, REGISTRY_ARTIFACT.CREATED_DATE,
                 REGISTRY_ARTIFACT.UPDATED_DATE, REGISTRY_ARTIFACT.STATEFUL, REGISTRY_ARTIFACT.VERIFIED, 
                 REGISTRY_ARTIFACT_INGRESS.INGRESS_TYPE, REGISTRY_ARTIFACT_LABEL.LABEL_KEY, REGISTRY_ARTIFACT_LABEL.LABEL_VALUE  
                FROM REGISTRY_ARTIFACT INNER JOIN
                REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT.ARTIFACT_IMAGE_ID=REGISTRY_ARTIFACT_IMAGE.ARTIFACT_IMAGE_ID
                LEFT JOIN
                REGISTRY_ARTIFACT_LABEL ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_LABEL.ARTIFACT_ID
                LEFT JOIN
                REGISTRY_ARTIFACT_INGRESS ON REGISTRY_ARTIFACT.ARTIFACT_ID=REGISTRY_ARTIFACT_INGRESS.ARTIFACT_ID
                WHERE REGISTRY_ARTIFACT.ARTIFACT_ID=?;"
                ,pkg:artifactResponse, id, loadToMemory = true);
}
