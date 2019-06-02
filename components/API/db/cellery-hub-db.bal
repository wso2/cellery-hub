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
import cellery/gen;
import ballerina/utils;

public function insertOrganization(string org, string des, string dv) returns sql:UpdateResult|error{
    log:printInfo("Performing Organization insertion");
    return connection->update("INSERT INTO REGISTRY_ORGANIZATION(ORG_NAME,DESCRIPTION,DEFAULT_IMAGE_VISIBILITY)VALUES(?,?,?)",org,des,dv);
}

public function selectOrg(string name) returns table<record {}>|error{
    log:printInfo("Performing organization search for Org name " + name);
    return connection->select("SELECT ORG_NAME, CREATED_DATE FROM REGISTRY_ORGANIZATION WHERE REGEXP_LIKE(ORG_NAME, ?)",gen:organizationResponse,name, loadToMemory = true);
}

public function selectArtifact(string qry, string[] params)
 returns table<record {}>|error{
    log:printInfo("Performing artifact search");
    return connection->select(qry,gen:artifactListResponse, ...params, loadToMemory = true);
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
                ,gen:artifactResponse,id, loadToMemory = true);
}
