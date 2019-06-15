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
import ballerina/io;
import ballerina/encoding;

public function getOrganization (string orgName) returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table, Org name : \'%s\': ", orgName));
    table<record {}> res =  check connection->select(GET_ORG_QUERY, gen:OrgResponse, orgName, loadToMemory = true);
    if (res.count() == 1) {
        gen:OrgResponse orgRes = check gen:OrgResponse.convert(res.getNext());
        json resPayload = check json.convert(orgRes);
        log:printDebug(io:sprintf("Fetching data for organization \'%s\' from REGISTRY_ORGANIZATION is successful", orgName));
        return resPayload;       
    } else {
        log:printDebug(io:sprintf("The requested organization \'%s\' was not found in REGISTRY_ORGANIZATION", orgName));
        return null;
    }
}

public function insertOrganization(string author, gen:OrgCreateRequest createOrgsBody) returns error? {
    log:printDebug (io:sprintf("Performing insertion on REGISTRY_ORGANIZATION table, Org name : \'%s\'", createOrgsBody.orgName));
    sql:UpdateResult res = check connection->update(ADD_ORG_QUERY, createOrgsBody.orgName, createOrgsBody.description,
                                            createOrgsBody.websiteUrl, createOrgsBody.defaultVisibility, author);
}

public function insertOrgUserMapping(string author, string orgName, string role) returns error? {
    log:printDebug(io:sprintf("Performing insertion on REGISTRY_ORG_USER_MAPPING table. User : %s, Org name : \'%s\'", author, orgName));
    sql:UpdateResult res = check connection->update(ADD_ORG_USER_MAPPING_QUERY, author, orgName, role);
}

public function getOrganizationCount(string userId) returns int | error {
    log:printDebug(io:sprintf("Retriving number organiations for user : \'%s\'", userId));
    table< record {}> selectRet = check connection->select(GET_ORG_COUNT_FOR_USER, (), userId);
    json jsonConversionRet = check json.convert(selectRet);
    log:printDebug(io:sprintf("Response from organization count query from DB: %s", check string.convert(jsonConversionRet)));
    int value = check int.convert(jsonConversionRet[0]["COUNT(ORG_NAME)"]);
    log:printDebug(io:sprintf("Count organiations for user : %s : %d", userId, value));
    return value;
}
public function getUserImage(string orgName, string imageName, string userId) returns table<gen:Image> | error {
    log:printDebug("Retriving image :" + imageName + " in organization : " + orgName + "for user: " + userId);
    table<gen:Image> res = check connection->select(GET_IMAGE_FOR_USER_FROM_IMAGE_NAME, gen:Image,
    orgName, imageName, userId, orgName, imageName, loadToMemory = true);
    return res;
}

public function getPublicImage(string orgName, string imageName) returns table<gen:Image> | error {
    log:printDebug("Retriving image :" + imageName + " in organization : " + orgName);
    table<gen:Image> res = check connection->select(GET_IMAGE_FROM_IMAGE_NAME, gen:Image,
    orgName, imageName, loadToMemory = true);
    return res;
}

public function getArtifactsOfUserImage(string orgName, string imageName, string userId, string artifactVersion, int offset, int resultLimit)
returns table<gen:ArtifactListResponse> | error {
    log:printDebug(io:sprintf("Performing artifact retrival from DB for org: %s, image: %s , version: %s for user: %s", orgName,
    imageName, artifactVersion, userId));
    table<gen:ArtifactListResponse> res = check connection->select(GET_ARTIFACTS_OF_IMAGE_FOR_USER, gen:ArtifactListResponse,
    orgName, imageName, artifactVersion, userId, orgName, imageName, artifactVersion,
    resultLimit, offset,loadToMemory = true);
    return res;
}

public function getArtifactsOfPublicImage(string orgName, string imageName, string artifactVersion, int offset, int resultLimit)
returns table<gen:ArtifactListResponse> | error {
    log:printDebug(io:sprintf("Performing artifact retrival from DB for org: %s, image: %s , version: %s for", orgName,
    imageName, artifactVersion));
    table<gen:ArtifactListResponse> res = check connection->select(GET_ARTIFACTS_OF_PUBLIC_IMAGE, gen:ArtifactListResponse, orgName, imageName,
    artifactVersion, resultLimit, offset, loadToMemory = true);
    return res;
}

public function getPublicArtifact(string orgName, string imageName, string artifactVersion) returns json | error {
    log:printDebug(io:sprintf("Performing data retrieval for articat \'%s/%s:%s\'", orgName, imageName, artifactVersion));
    table<record {}> res = check connection->select(GET_ARTIFACT_FROM_IMG_NAME_N_VERSION, gen:ArtifactResponse, orgName, imageName,
                                                    artifactVersion, loadToMemory = true);
    return buildJsonPayloadForGetArtifact(res, orgName, imageName, artifactVersion);
}

public function getArtifactListLength(string imageId, string artifactVersion) returns table<gen:Count> | error {
    log:printDebug(io:sprintf("Retriving artifact count for image ID : %s and image version %s", imageId, artifactVersion));
    table<gen:Count> res = check connection->select(GET_ARTIFACT_COUNT, gen:Count, imageId, artifactVersion, loadToMemory = true);
    return res;
}

public function getImageKeywords(string imageId) returns table<gen:StringRecord> | error {
    log:printDebug(io:sprintf("Retriving keywords of image with id : %s", imageId));
    table<gen:StringRecord> res = check connection->select(GET_KEYWORDS_OF_IMAGE_BY_IMAGE_ID, gen:StringRecord, imageId, loadToMemory = true);
    return res;
}

public function getUserArtifact(string userId, string orgName, string imageName, string artifactVersion) returns json | error {
    log:printDebug(io:sprintf("Performing data retrieval for articat \'%s/%s:%s\'", orgName, imageName, artifactVersion));
    table<record {}> res = check connection->select(GET_ARTIFACT_FOR_USER_FROM_IMG_NAME_N_VERSION, gen:ArtifactResponse, orgName, imageName,
                                                    artifactVersion, userId, orgName, imageName, artifactVersion, loadToMemory = true);
    return buildJsonPayloadForGetArtifact(res, orgName, imageName, artifactVersion);
}

function buildJsonPayloadForGetArtifact(table<record {}> res, string orgName, string imageName, string artifactVersion) returns json | error {
    if (res.count() == 1) {
        json resPayload = {};
        gen:ArtifactResponse artRes = check gen:ArtifactResponse.convert(res.getNext());
        string metadataString = encoding:byteArrayToString(artRes.metadata);
        io:StringReader sr = new(metadataString, encoding = "UTF-8");
        json metadataJson = check sr.readJson();
        resPayload["description"] = artRes.description;
        resPayload["pullCount"] = artRes.pullCount;
        resPayload["lastAuthor"] = artRes.lastAuthor;
        resPayload["updatedTimestamp"] = artRes.updatedTimestamp;
        resPayload["metadata"] = metadataJson;
        return resPayload;
    } else if (res.count() == 0) {
        log:printDebug(io:sprintf("The requested artifact \'%s/%s:%s\' was not found in REGISTRY_ORGANIZATION",
                                    orgName, imageName, artifactVersion));
        return null;
    } else {
        string errMsg = io:sprintf("Found more than one result for artifact GET: Number of results : %s", res.count());
        log:printDebug(errMsg);
        error er = error(errMsg);
        return er;
    }
}

public function getMemberOrgsUsers(string userId, string orgName, int offset, int resultLimit)
returns table<gen:User> | error {
    log:printDebug(io:sprintf("Performing data retrieval of users for organization: %s, user: %s , with offset %d,
    and result limit : %d", orgName, userId, offset, resultLimit));
    table<gen:User> res = check connection->select(GET_MEMBERS_ORG_USERS, gen:User, userId,
    orgName, resultLimit, offset, loadToMemory = true);
    return res;
}

public function getMemberCountOfOrg(string orgName)
returns table<gen:Count> | error {
    log:printDebug(io:sprintf("Retriving member count of organization : %s", orgName));
    table<gen:Count> res = check connection->select(GET_MEMBERS_ORG_USERS_COUNT, gen:Count, orgName, loadToMemory = true);
    return res;
}

public function searchOrganizations(string orgName, int offset, int resultLimit) returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table, Org name : \'%s\': ", orgName));
    table<record {}> resTotal = check connection->select(SEARCH_ORGS_TOTAL_COUNT, gen:Count, orgName);
    json resTotalJson = check json.convert(resTotal);
    int totalOrgs = check int.convert(resTotalJson[0]["count"]);
    gen:OrgListResponse olr = {count:totalOrgs , data:[]};
    if (totalOrgs > 0){
        log:printDebug(io:sprintf("%d organization(s) found with the name \'%s\'", totalOrgs, orgName));
        map<any> imageCountMap = {};
        table<gen:OrgListResponseImageCount> resImgCount = check connection->select(SEARCH_ORGS_QUERY_IMAGE_COUNT, 
        gen:OrgListResponseImageCount, orgName, resultLimit, offset);
        foreach var fd in resImgCount{
            imageCountMap[fd.orgName] = fd.imageCount;
        }
        table<gen:OrgListResponseAtom> res = check connection->select(SEARCH_ORGS_QUERY, gen:OrgListResponseAtom, orgName, 
        resultLimit, offset, loadToMemory = true);
        foreach int i in 0...res.count()-1{
            gen:OrgListResponseAtom olra = check gen:OrgListResponseAtom.convert(res.getNext());
            olr.data[i] = olra;
            olr.data[i]["imageCount"] = <int>imageCountMap[olra.orgName];
        }
    } else {
        log:printDebug(io:sprintf("No organization found with the name \'%s\'", orgName));
    }
    return check json.convert(olr);
}

public function searchUserOrganizations(string userId, string apiUserId, string orgName, int offset, int resultLimit) 
returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table for userId : %s, Org name : \'%s\': ",
    userId, orgName));
    table<record {}> resTotal = check connection->select(SEARCH_USER_ORGS_TOTAL_COUNT, gen:Count, orgName, userId);
    json resTotalJson = check json.convert(resTotal);
    int totalOrgs = check int.convert(resTotalJson[0]["count"]);
    gen:OrgListResponse olr = {count:totalOrgs , data:[]};
    if (totalOrgs > 0){
        log:printDebug(io:sprintf("%d organization(s) found with the orgName \'%s\' for userId %s", totalOrgs, orgName, userId));
        map<any> imageCountMap = {};
        table<gen:OrgListResponseImageCount> resImgCount = check connection->select(SEARCH_USER_ORGS_QUERY_IMAGE_COUNT, 
        gen:OrgListResponseImageCount, userId, orgName, userId, orgName, apiUserId, orgName, resultLimit, offset);
        foreach var fd in resImgCount{
            imageCountMap[fd.orgName] = fd.imageCount;
        }
        table<gen:OrgListResponseAtom> res = check connection->select(SEARCH_USER_ORGS_QUERY, gen:OrgListResponseAtom, orgName, userId,
        resultLimit, offset, loadToMemory = true);        
        foreach int i in 0...res.count()-1{
            gen:OrgListResponseAtom olra = check gen:OrgListResponseAtom.convert(res.getNext());
            olr.data[i] = olra;
            if (imageCountMap[olra.orgName] is ()){
                imageCountMap[olra.orgName] = 0;
            }
            olr.data[i]["imageCount"] = <int>imageCountMap[olra.orgName];
        }
    } else {
        log:printDebug(io:sprintf("No organization found for userId %s, with the orgName \'%s\'",userId, orgName));
    }
    return check json.convert(olr);
}
