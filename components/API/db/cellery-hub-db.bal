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
    log:printInfo("Performing organization search");
    return connection->select("SELECT ORG_NAME, CREATED_DATE FROM REGISTRY_ORGANIZATION WHERE REGEXP_LIKE(ORG_NAME, ?)",gen:organizationResponse,name, loadToMemory = true);
}

public function selectArtifact(string qry, string[] params)
 returns table<record {}>|error{
    log:printInfo("Performing artifact search");
    return connection->select(qry,gen:artifactListResponse, ...params, loadToMemory = true);
}

public function updateArtifact(string des, string id) returns sql:UpdateResult|error{
    log:printInfo("Performing update on artifact");
    return connection->update("UPDATE REGISTRY_ARTIFACT SET DESCRIPTION  = ? WHERE ARTIFACT_ID = ?",des,id);
}
