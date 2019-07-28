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
import cellery_hub_api/constants;
import ballerina/io;
import ballerina/encoding;

type RegistryOrgUserMapping record {|
    string USER_ROLE;
|};

type RegistryArtifactImage record {|
    string ARTIFACT_IMAGE_ID;
|};

public function getOrganization(string orgName, string userId) returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table by user \'%s\', Org name : \'%s\': ",
    userId, orgName));
    table<record {}> res = check connection->select(GET_ORG_QUERY, gen:OrgResponse, orgName, userId, orgName);
    int counter = 0;
    gen:OrgResponse orgRes;
    foreach var item in res {
        orgRes = check gen:OrgResponse.convert(item);
        counter += 1;
    }
    json resPayload = null;
    if counter == 1 {
        log:printDebug(io:sprintf("Building the response payload for getOrganization. user : %s, orgName : %s", userId, orgName));
        resPayload.description = encoding:byteArrayToString(orgRes.description);
        resPayload.summary = orgRes.summary;
        resPayload.websiteUrl = orgRes.websiteUrl;
        resPayload.author = orgRes.firstAuthor;
        resPayload.createdTimestamp = orgRes.createdTimestamp;
        resPayload.userRole = orgRes.userRole;
    } else if (counter == 0) {
        log:printDebug(io:sprintf("Failed to retrieve organization data. No organization found with the org name \'%s\'", orgName));
    } else {
        string errMsg = io:sprintf("Error in retrieving organization data. More than one record found for org name \'%s\'", orgName);
        log:printError(errMsg);
        error er = error(errMsg);
        return er;
    }
    res.close();
    return resPayload;
}

public function getOrganizationAvailability(string orgName) returns boolean | error {
    log:printDebug(io:sprintf("Checking orgName avialability on REGISTRY_ORGANIZATION table for Org name : \'%s\': ", orgName));
    table<record {}> res = check connection->select(GET_ORG_QUERY, gen:OrgResponse, orgName, loadToMemory = true);
    if (res.count() == 0) {
        log:printDebug(io:sprintf("Organization name \'%s\' is not exists in REGISTRY_ORGANIZATION", orgName));
        res.close();
        return true;
    } else {
        log:printDebug(io:sprintf("Organization \'%s\' is already existing in REGISTRY_ORGANIZATION", orgName));
        res.close();
        return false;
    }
}

public function insertOrganization(string author, gen:OrgCreateRequest createOrgsBody) returns error? {
    log:printDebug(io:sprintf("Performing insertion on REGISTRY_ORGANIZATION table, Org name : \'%s\'", createOrgsBody.orgName));
    sql:UpdateResult res = check connection->update(ADD_ORG_QUERY, createOrgsBody.orgName, createOrgsBody.description,
    createOrgsBody.websiteUrl, createOrgsBody.defaultVisibility, author);
}

public function insertOrgUserMapping(string author, string orgName, string role) returns error? {
    log:printDebug(io:sprintf("Performing insertion on REGISTRY_ORG_USER_MAPPING table. User : %s, Org name : \'%s\'", author, orgName));
    sql:UpdateResult res = check connection->update(ADD_ORG_USER_MAPPING_QUERY, author, orgName, role);
}

public function getOrganizationCount(string userId) returns int | error {
    log:printDebug(io:sprintf("Retriving number organiations for user : \'%s\'", userId));
    table<record {}> selectRet = check connection->select(GET_ORG_COUNT_FOR_USER, (), userId);
    json jsonConversionRet = check json.convert(selectRet);
    log:printDebug(io:sprintf("Response from organization count query from DB: %s",check string.convert(jsonConversionRet)));
    int value = check int.convert(jsonConversionRet[0]["COUNT(ORG_NAME)"]);
    selectRet.close();
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

public function searchOrganizationsWithAuthenticatedUser(string orgName, string userId, int offset, int resultLimit) returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table, Org name : \'%s\', offset : %d, resultLimit : %d",
    orgName, offset, resultLimit));
    table<record {}> resTotal = check connection->select(SEARCH_ORGS_TOTAL_COUNT, gen:Count, orgName);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:OrgListResponse orgListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d organization(s) found with the org name \'%s\'", totalOrgs, orgName));
        map<any> imageCountMap = {};
        log:printDebug(io:sprintf("Retreiving image count for organization(s) \'%s\' with an authenticated user \'%s\'", orgName, userId));
        table<gen:OrgListResponseImageCount> resImgCount = check connection->select(SEARCH_ORGS_QUERY_IMAGE_COUNT_FOR_AUTHENTICATED_USER,
        gen:OrgListResponseImageCount, orgName, userId, resultLimit, offset);
        foreach var orgImageCount in resImgCount {
            imageCountMap[orgImageCount.orgName] = orgImageCount.imageCount;
        }
        resImgCount.close();
        log:printDebug(io:sprintf("Retreiving summary, description and members count for organization(s) \'%s\'", orgName));
        table<gen:OrgListAtom> resData = check connection->select(SEARCH_ORGS_QUERY, gen:OrgListAtom, orgName,
        resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:OrgListAtom orgListRecord = gen:OrgListAtom.convert(item);
            orgListResponse.data[counter] = buildListOrgsResponse(orgListRecord, imageCountMap, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No organization found with the name \'%s\'", orgName));
    }
    return check json.convert(orgListResponse);
}

public function searchOrganizationsWithoutAuthenticatedUser(string orgName, int offset, int resultLimit) returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table, Org name : \'%s\', offset : %d, resultLimit : %d",
    orgName, offset, resultLimit));
    table<record {}> resTotal = check connection->select(SEARCH_ORGS_TOTAL_COUNT, gen:Count, orgName);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:OrgListResponse orgListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d organization(s) found with the name \'%s\'", totalOrgs, orgName));
        map<any> imageCountMap = {};
        log:printDebug(io:sprintf("Retreiving image count for organization(s) \'%s\' with an unauthenticated user", orgName));
        table<gen:OrgListResponseImageCount> resImgCount = check connection->select(SEARCH_ORGS_QUERY_IMAGE_COUNT_FOR_UNAUTHENTICATED_USER,
        gen:OrgListResponseImageCount, orgName, resultLimit, offset);
        foreach var orgImageCount in resImgCount {
            imageCountMap[orgImageCount.orgName] = orgImageCount.imageCount;
        }
        resImgCount.close();
        log:printDebug(io:sprintf("Retreiving summary, description and members count for organization(s) \'%s\'", orgName));
        table<gen:OrgListAtom> resData = check connection->select(SEARCH_ORGS_QUERY, gen:OrgListAtom, orgName,
        resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:OrgListAtom orgListRecord = gen:OrgListAtom.convert(item);
            orgListResponse.data[counter] = buildListOrgsResponse(orgListRecord, imageCountMap, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No organization found with the name \'%s\'", orgName));
    }
    return check json.convert(orgListResponse);
}

public function searchUserOrganizations(string userId, string apiUserId, string orgName, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Performing data retreival on REGISTRY_ORGANIZATION table for userId : %s, Org name : \'%s\': ",
    userId, orgName));
    table<record {}> resTotal = check connection->select(SEARCH_USER_ORGS_TOTAL_COUNT, gen:Count, orgName, userId);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:OrgListResponse orgListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d organization(s) found with the orgName \'%s\' for userId %s", totalOrgs, orgName, userId));
        map<any> imageCountMap = {};
        table<gen:OrgListResponseImageCount> resImgCount = check connection->select(SEARCH_USER_ORGS_QUERY_IMAGE_COUNT,
        gen:OrgListResponseImageCount, apiUserId, orgName, userId, orgName, resultLimit, offset);
        foreach var orgImageCount in resImgCount {
            imageCountMap[orgImageCount.orgName] = orgImageCount.imageCount;
        }
        resImgCount.close();
        table<gen:OrgListAtom> resData = check connection->select(SEARCH_USER_ORGS_QUERY, gen:OrgListAtom, orgName, userId,
        resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:OrgListAtom orgListRecord = gen:OrgListAtom.convert(item);
            if (imageCountMap[orgListRecord.orgName] is ()) {
                imageCountMap[orgListRecord.orgName] = 0;
            }
            orgListResponse.data[counter] = buildListOrgsResponse(orgListRecord, imageCountMap, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No organization found for userId %s, with the orgName \'%s\'", userId, orgName));
    }
    return check json.convert(orgListResponse);
}

public function getPublicImagesOfOrg(string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Performing image retrival from DB for organization \'%s\', image name: \'%s\'", orgName, imageName));
    table<record {}> resTotal = check connection->select(SEARCH_PUBLIC_ORG_IMAGES_TOTAL_COUNT, gen:Count, orgName, imageName);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:OrgImagesListResponse orgImagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d image(s) found with the image name \'%s\' for organization \'%s\'", totalOrgs, imageName, orgName));
        string searchQuery = SEARCH_PUBLIC_ORG_IMAGES_QUERY.replace("$ORDER_BY", orderBy);
        table<gen:OrgImagesListAtom> resData = check connection->select(searchQuery, gen:OrgImagesListAtom, orgName, imageName,
        resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:OrgImagesListAtom orgImagesListRecord = gen:OrgImagesListAtom.convert(item);
            orgImagesListResponse.data[counter] = buildOrgImagesResponse(orgImagesListRecord, totalOrgs);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with the image name \'%s\' within the orgaization \'%s\'", imageName, orgName));
    }
    return check json.convert(orgImagesListResponse);
}

public function getUserImagesOfOrg(string userId, string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Performing image retrival from DB for organization: \'%s\', image name: \'%s\'", orgName, imageName));
    table<record {}> resTotal = check connection->select(SEARCH_ORG_IMAGES_FOR_USER_TOTAL_COUNT, gen:Count, orgName, imageName, userId);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:OrgImagesListResponse orgImagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d image(s) found with the image name \'%s\' for organization \'%s\', userId : \'%s\'", totalOrgs,
        imageName, orgName, userId));
        string searchQuery = SEARCH_ORG_IMAGES_FOR_USER_QUERY.replace("$ORDER_BY", orderBy);
        table<gen:OrgImagesListAtom> resData = check connection->select(searchQuery, gen:OrgImagesListAtom, orgName, imageName,
        userId, resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:OrgImagesListAtom orgImagesListRecord = gen:OrgImagesListAtom.convert(item);
            orgImagesListResponse.data[counter] = buildOrgImagesResponse(orgImagesListRecord, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with the image name \'%s\' within the orgaization \'%s\'", imageName, orgName));
    }
    return check json.convert(orgImagesListResponse);
}

public function getUserImages(string orgName, string userId, string imageName, string orderBy, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Retreiving images for org name \'%s\' and image name \'%s\' with an authenticated user \'%s\'",
    orgName, imageName, userId));
    table< record {}> resTotal = check connection->select(SEARCH_IMAGES_FOR_USER_TOTAL_COUNT, gen:Count, orgName, imageName, userId);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:ImagesListResponse imagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d image(s) found with the image name \'%s\' for org name %s", totalOrgs, imageName, orgName));
        string searchQuery = SEARCH_IMAGES_FOR_USER_QUERY.replace("$ORDER_BY", orderBy);
        table<gen:ImagesListAtom> resData = check connection->select(searchQuery, gen:ImagesListAtom,
        orgName, imageName, userId, resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:ImagesListAtom imagesListRecord = gen:ImagesListAtom.convert(item);
            imagesListResponse.data[counter] = buildListImagesResponse(imagesListRecord, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with the image name \'%s\' and org name \'%s\'", imageName, orgName));
    }
    return check json.convert(imagesListResponse);
}

public function getPublicImages(string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Retreiving images for org name \'%s\' and image name \'%s\' with an unauthenticated user",
    orgName, imageName));
    table< record {}> resTotal = check connection->select(SEARCH_PUBLIC_IMAGES_TOTAL_COUNT, gen:Count, orgName, imageName);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:ImagesListResponse imagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if totalOrgs > 0 {
        log:printDebug(io:sprintf("%d image(s) found with the image name \'%s\' for org name %s", totalOrgs, imageName, orgName));
        string searchQuery = SEARCH_PUBLIC_IMAGES_QUERY.replace("$ORDER_BY", orderBy);
        table<gen:ImagesListAtom> resData = check connection->select(searchQuery, gen:ImagesListAtom,
        orgName, imageName, resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:ImagesListAtom imagesListRecord = gen:ImagesListAtom.convert(item);
            imagesListResponse.data[counter] = buildListImagesResponse(imagesListRecord, counter+1);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with the image name \'%s\' and org name \'%s\'", imageName, orgName));
    }
    return check json.convert(imagesListResponse);
}

public function updateImageDescriptionNSummary(string orgName, string imageName, string description, string summary, string userId) returns sql:UpdateResult | error? {
    log:printInfo(io:sprintf("Updating description and summary of the image %s/%s", orgName, imageName));
    sql:UpdateResult res = check connection->update(UPDATE_IMAGE_DESCRIPTION_N_SUMMARY_QUERY, description, summary, imageName, orgName, userId);
    return res;
}

public function updateOrgDescriptionNSummary(string description, string summary, string orgName, string userId) returns sql:UpdateResult | error? {
    log:printInfo(io:sprintf("Updating description and summary of the organization \'%s\'", orgName));
    sql:UpdateResult res = check connection->update(UPDATE_ORG_DESCRIPTION_N_SUMMARY_QUERY, description, summary, orgName, userId);
    return res;
}

public function updateArtifactDescription(string description, string orgName, string imageName, string artifactVersion, string userId)
returns sql:UpdateResult | error? {
    log:printInfo(io:sprintf("Updating description of the artifact \'%s/%s:%s\'", orgName, imageName, artifactVersion));
    sql:UpdateResult res = check connection->update(UPDATE_ARTIFACT_DESCRIPTION_QUERY, description, artifactVersion, imageName, orgName, userId);
    return res;
}

public function updateImageKeywords(string orgName, string imageName, string[] keywords, string userId) returns error? {
    log:printInfo(io:sprintf("User %s is updating keywords of the image %s/%s", userId, orgName, imageName));
    string imageId = check getArtifactImageID(orgName, imageName);
    if imageId != "" {
        _ = check connection->update(DELETE_IMAGE_KEYWORDS_QUERY, imageId);
        log:printInfo(io:sprintf("Successfully deleted keywords of the image %s/%s", orgName, imageName));

        string[][] dataBatch = [];
        int i = 0;
        foreach var keyword in keywords {
            if keyword != "" {
                dataBatch[i] = [imageId, keyword];
                i = i + 1;
            }
        }
        if i > 0 {
            _ = check connection->batchUpdate(INSERT_IMAGE_KEYWORDS_QUERY, ...dataBatch);
            log:printInfo(io:sprintf("Successfully inserted keywords for the image %s/%s", orgName, imageName));
        } else {
            log:printDebug(io:sprintf("No keywords found. Hence not perform keyword insertion for image %s/%s", orgName, imageName));
        }
    } else {
        string errMsg = io:sprintf("Unable to update image %s/%s. Artifact Image Id of the image is not found", orgName, imageName);
        log:printError(errMsg);
        error er = error(errMsg);
        return er;
    }
}

public function getImagesForUserIdWithAuthenticatedUser(string userId, string orgName, string imageName, string orderBy, int offset, int resultLimit,
string apiUserId)
returns json | error {
    log:printDebug(io:sprintf("Performing image retrival for user %s from DB for orgName: %s, imageName: %s by user : %s", userId, orgName,
    imageName, apiUserId));
    table<record {}> resTotal = check connection->select(SEARCH_USER_AUTHORED_IMAGES_TOTAL_COUNT_FOR_AUTHENTICATED_USER, gen:Count,
    userId, orgName, imageName, apiUserId);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:ImagesListResponse imagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d image(s) found with the image name \'%s\' and org name %s for user %s", totalOrgs, imageName,
        orgName, userId));
        string searchQuery = SEARCH_USER_AUTHORED_IMAGES_QUERY_FOR_AUTHENTICATED_USER.replace("$ORDER_BY", orderBy);
        table<gen:ImagesListAtom> resData = check connection->select(searchQuery, gen:ImagesListAtom, userId, orgName, imageName,
        apiUserId, resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:ImagesListAtom imagesListRecord = gen:ImagesListAtom.convert(item);
            imagesListResponse.data[counter] = buildListImagesResponse(imagesListRecord, counter);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with org name \'%s\' and image name \'%s\' for userId %s", orgName,
        imageName, userId));
    }
    return check json.convert(imagesListResponse);
}

public function getImagesForUserIdWithoutAuthenticatedUser(string userId, string orgName, string imageName, string orderBy, int offset, int resultLimit)
returns json | error {
    log:printDebug(io:sprintf("Performing image retrival for user %s from DB for orgName: %s, imageName: %s by unauthenticated user", userId, orgName,
    imageName));
    table<record {}> resTotal = check connection->select(SEARCH_USER_AUTHORED_IMAGES_TOTAL_COUNT_FOR_UNAUTHENTICATED_USER, gen:Count,
    userId, orgName, imageName);
    int totalOrgs = check getTotalRecordsCount(resTotal);
    gen:ImagesListResponse imagesListResponse = {
        count: totalOrgs,
        data: []
    };
    if (totalOrgs > 0) {
        log:printDebug(io:sprintf("%d image(s) found with the imageName \'%s\' and orgName %s for user %s", totalOrgs, imageName,
        orgName, userId));
        string searchQuery = SEARCH_USER_AUTHORED_IMAGES_QUERY_FOR_UNAUTHENTICATED_USER.replace("$ORDER_BY", orderBy);
        table<gen:ImagesListAtom> resData = check connection->select(searchQuery, gen:ImagesListAtom, userId, orgName, imageName,
        resultLimit, offset);
        int counter = 0;
        foreach var item in resData {
            gen:ImagesListAtom imagesListRecord = gen:ImagesListAtom.convert(item);
            imagesListResponse.data[counter] = buildListImagesResponse(imagesListRecord, counter);
            counter += 1;
        }
        resData.close();
    } else {
        log:printDebug(io:sprintf("No images found with orgName \'%s\' and image name \'%s\' for userId %s", orgName,
        imageName, userId));
    }
    return check json.convert(imagesListResponse);
}

function buildJsonPayloadForGetArtifact(table< record {}> res, string orgName, string imageName, string artifactVersion) returns json | error {
    if (res.count() == 1) {
        json resPayload = {};
        gen:ArtifactResponse artRes = check gen:ArtifactResponse.convert(res.getNext());
        string metadataString = encoding:byteArrayToString(artRes.metadata);
        io:StringReader sr = new(metadataString, encoding = "UTF-8");
        json metadataJson = check sr.readJson();
        resPayload["summary"] = artRes.summary;
        resPayload["pullCount"] = artRes.pullCount;
        resPayload["lastAuthor"] = artRes.lastAuthor;
        resPayload["updatedTimestamp"] = artRes.updatedTimestamp;
        resPayload["metadata"] = metadataJson;
        return resPayload;
    } else if (res.count() == 0) {
        log:printDebug(io:sprintf("The requested artifact \'%s/%s:%s\' was not found in REGISTRY_ORGANIZATION",
        orgName, imageName, artifactVersion));
        res.close();
        return null;
    } else {
        string errMsg = io:sprintf("Found more than one result for artifact GET: Number of results : %s", res.count());
        log:printDebug(errMsg);
        error er = error(errMsg);
        return er;
    }
}

function getArtifactImageID(string orgName, string imageName) returns string | error {
    log:printDebug(io:sprintf("Retrieving Artifact Image Id of image %s/%s", orgName, imageName));
    table<record {}> imageIdRes = check connection->select(GET_ARTIFACT_IMAGE_ID, RegistryArtifactImage, imageName, orgName);
    json imageIdRecord = check json.convert(imageIdRes);
    string imageId = check string.convert(imageIdRecord[0]["ARTIFACT_IMAGE_ID"]);
    log:printDebug(io:sprintf("Artifact Image Id of %s/%s is %s ", orgName, imageName, imageId));
    return imageId;
}

function getTotalRecordsCount(table< record {}> tableRecord) returns int | error {
    log:printDebug("Converting the total in table record type into integer value");
    json tableJson = check json.convert(tableRecord);
    int total = check int.convert(tableJson[0]["count"]);
    tableRecord.close();
    return total;
}

function buildListImagesResponse(gen:ImagesListAtom imagesListRecord, int index) returns gen:ImagesListResponseAtom {
    log:printDebug(io:sprintf("Building response record for imagesListRecord %d", index));
    gen:ImagesListResponseAtom imagesListResponseAtom = {
        orgName: imagesListRecord.orgName,
        imageName: imagesListRecord.imageName,
        summary: imagesListRecord.summary,
        description: encoding:byteArrayToString(imagesListRecord.description),
        pullCount: imagesListRecord.pullCount,
        updatedTimestamp: imagesListRecord.updatedTimestamp,
        visibility: imagesListRecord.visibility
    };
    return imagesListResponseAtom;
}

function buildListOrgsResponse(gen:OrgListAtom orgListRecord, map<any> imageCountMap, int index) returns gen:OrgListResponseAtom {
    log:printDebug(io:sprintf("Building response record for orgListRecord %d", index));
    gen:OrgListResponseAtom orgListResponseAtom = {
        orgName: orgListRecord.orgName,
        summary: orgListRecord.summary,
        description: encoding:byteArrayToString(orgListRecord.description),
        membersCount: orgListRecord.membersCount,
        imageCount: <int>imageCountMap[orgListRecord.orgName]
    };
    return orgListResponseAtom;
}

function buildOrgImagesResponse(gen:OrgImagesListAtom orgImagesListRecord, int index) returns gen:OrgImagesListResponseAtom{
    log:printDebug(io:sprintf("Building response record for orgImagesListRecord %d", index));
    gen:OrgImagesListResponseAtom orgImagesListResponseAtom = {
        imageName: orgImagesListRecord.imageName,
        summary: orgImagesListRecord.summary,
        description: encoding:byteArrayToString(orgImagesListRecord.description),
        pullCount: orgImagesListRecord.pullCount,
        updatedTimestamp: orgImagesListRecord.updatedTimestamp,
        visibility: orgImagesListRecord.visibility
    };
    return orgImagesListResponseAtom;
}
