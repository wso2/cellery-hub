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
import ballerina/sql;
import ballerina/system;
import ballerina/transactions;
import cellery_hub/image;

type RegistryOrganization record {
    string DEFAULT_IMAGE_VISIBILITY;
};

type RegistryArtifactImage record {
    string ARTIFACT_IMAGE_ID;
};

type RegistryArtifact record {
    string ARTIFACT_ID;
};

# Save Cell Image Metadata to the Cellery Hub Database.
# This also incremenets the push count of the artifact by one.
#
# + userId - The UUID of the user trying to push the Cell Image
# + metadata - Metadata of the Cell Image
# + return - Error if any error occurred
public function saveCellImageMetadata(string userId, image:CellImageMetadata metadata) returns error? {
    var imageUuid = check persistImageMetadata(userId, metadata.org, metadata.name);
    var result = check persistImageArtifactMetadata(userId, imageUuid, metadata);
}

# Increment the pull count for a specific image.
#
# + orgName - Name of the organization of the image
# + imageName - Name of the image
# + imageVersion - Version of the image
# + return - Error if any occurred
public function incrementPullCount(string orgName, string imageName, string imageVersion) returns error? {
    var registryArtifactImageTable = check celleryHubDB->select("SELECT ARTIFACT_IMAGE_ID FROM REGISTRY_ARTIFACT_IMAGE " +
        "WHERE ORG_NAME = ? AND IMAGE_NAME = ? FOR UPDATE", RegistryArtifactImage, orgName, imageName, loadToMemory = true);

    if (registryArtifactImageTable.count() == 1) {
        var registryArtifactImage = check RegistryArtifactImage.convert(registryArtifactImageTable.getNext());
        var imageUuid = registryArtifactImage.ARTIFACT_IMAGE_ID;

        var updateResult = check celleryHubDB->update("UPDATE REGISTRY_ARTIFACT SET PULL_COUNT = PULL_COUNT + 1 " +
            "WHERE ARTIFACT_IMAGE_ID = ? AND VERSION = ?", imageUuid, imageVersion);
        log:printDebug("Incremented pull count of image " + imageUuid + " for transaction " + transactions:getCurrentTransactionId());
    } else {
        var err = error("unexpected error due to artifact image " + orgName + "/" + imageName +
            " not being available in the database");
        return err;
    }
}

# Persist Image metadata in the Cellery Hub database.
#
# + userId - The UUID of the user who is pushing the image
# + orgName - Name of the organization of the Cell Image
# + imageName - Name of the Cell Image
# + return - Image registry artifcat image ID
function persistImageMetadata(string userId, string orgName, string imageName) returns (string|error) {
    var registryArtifactImageTable = check celleryHubDB->select("SELECT ARTIFACT_IMAGE_ID FROM REGISTRY_ARTIFACT_IMAGE " +
        "WHERE ORG_NAME = ? AND IMAGE_NAME = ? FOR UPDATE", RegistryArtifactImage, orgName, imageName, loadToMemory = true);

    string uuid;
    if (registryArtifactImageTable.count() == 1) {
        var registryArtifactImage = check RegistryArtifactImage.convert(registryArtifactImageTable.getNext());
        uuid = registryArtifactImage.ARTIFACT_IMAGE_ID;
        log:printDebug("Using existing image " + orgName + "/" + imageName + " with id " + uuid +
            " for transaction " + transactions:getCurrentTransactionId());
    } else {
        var defaultVisibility = check getOrganizationDefaultVisibility(orgName);
        uuid = system:uuid();
        var updateResult = celleryHubDB->update("INSERT INTO REGISTRY_ARTIFACT_IMAGE(ARTIFACT_IMAGE_ID, ORG_NAME, " +
            "IMAGE_NAME, FIRST_AUTHOR, VISIBILITY) VALUES (?, ?, ?, ?, ?)", uuid, orgName, imageName, userId, defaultVisibility);
        if (updateResult is error) {
            return updateResult;
        }
        log:printDebug("Created new image " + orgName + "/" + imageName + " with id " + uuid +
            " and visibility " + defaultVisibility + " for transaction " + transactions:getCurrentTransactionId());
    }
    return uuid;
}

# Get the organization's default image visibility.
#
# + orgName - Name of the organization
# + return - Error or organization's default visibility
function getOrganizationDefaultVisibility(string orgName) returns (error|string) {
    var organizationTable = check celleryHubDB->select("SELECT DEFAULT_IMAGE_VISIBILITY " +
        "FROM REGISTRY_ORGANIZATION WHERE ORG_NAME = ? FOR UPDATE", RegistryOrganization, orgName, loadToMemory = true);
    if (organizationTable.count() == 1) {
        var organization = check RegistryOrganization.convert(organizationTable.getNext());
        return organization.DEFAULT_IMAGE_VISIBILITY;
    } else {
        var err = error("unexpected error due to organization " + orgName + " not being available in the database");
        return err;
    }
}

# Persist Image Artifact metadata in the Cellery Hub database.
#
# + userId - The UUID of the user who is pushing the image
# + artifactImageId - ID of the Cell Image without considering the versions
# + metadata - Cell Image metadata
# + return - Error if any error occurred
function persistImageArtifactMetadata(string userId, string artifactImageId, image:CellImageMetadata metadata) returns error? {
    var registryArtifactTable = check celleryHubDB->select("SELECT ARTIFACT_ID FROM REGISTRY_ARTIFACT " +
        "WHERE ARTIFACT_IMAGE_ID = ? AND VERSION = ? FOR UPDATE", RegistryArtifact, artifactImageId, metadata.ver,
        loadToMemory = true);

    var metadataJson = check json.convert(metadata);
    var metadataString = check string.convert(metadataJson);
    string artifactUuid;
    if (registryArtifactTable.count() == 1) {
        var registryArtifact = check RegistryArtifact.convert(registryArtifactTable.getNext());
        artifactUuid = registryArtifact.ARTIFACT_ID;
        var updateResult = check celleryHubDB->update("UPDATE REGISTRY_ARTIFACT " +
            "SET PUSH_COUNT = PUSH_COUNT + 1, LAST_AUTHOR = ?, METADATA = ?, STATEFUL = ? " +
            "WHERE ARTIFACT_ID = ? AND VERSION = ?", userId, metadataString, false, artifactUuid, metadata.ver);
        log:printDebug("Updated image with image id " + artifactImageId + " and version " + metadata.ver +
            " for transaction " + transactions:getCurrentTransactionId());

        // Cleanup all existing metadata related info tables
        var labelCleanupResult = check cleanUpLabels(artifactUuid);
        var ingressCleanupResult = check cleanUpIngresses(artifactUuid);
    } else {
        artifactUuid = system:uuid();
        var updateResult = celleryHubDB->update("INSERT INTO REGISTRY_ARTIFACT(ARTIFACT_ID, ARTIFACT_IMAGE_ID, VERSION, " +
            "PUSH_COUNT, LAST_AUTHOR, FIRST_AUTHOR, METADATA, STATEFUL) " +
            "VALUES (?, ?, ?, 1, ?, ?, ?, ?)", artifactUuid, artifactImageId, metadata.ver, userId, userId, metadataString, false);
        if (updateResult is error) {
            return updateResult;
        }
        log:printDebug("Created new image with image id " + artifactImageId + " and version " + metadata.ver +
            " for transaction " + transactions:getCurrentTransactionId());
    }
    var labelsInsertResult = check persistImageArtifactLabels(artifactUuid, metadata.labels);
    var ingressesInsertResult = check persistImageArtifactIngresses(artifactUuid, metadata.ingresses);
}

# Cleanup labels for an artifact.
#
# + artifactId - ID of the Cell Image without considering the versions
# + return - Error if any occurred
function cleanUpLabels(string artifactId) returns error? {
    var updateResult = check celleryHubDB->update("DELETE FROM REGISTRY_ARTIFACT_LABEL WHERE ARTIFACT_ID = ?", artifactId);
    log:printDebug("Removed all labels for image version with artifact id " + artifactId +
        " for transaction " + transactions:getCurrentTransactionId());
}

# Persist Image Artifact labels in the Cellery Hub database.
#
# + artifactId - ID of the Cell Image without considering the versions
# + labels - Labels to be added
# + return - Error if any occurred
function persistImageArtifactLabels(string artifactId, map<string> labels) returns error? {
    if (labels.length() > 0) {
        string[][] dataBatch = [];
        int i = 0;
        foreach var (labelKey, labelValue) in labels {
            dataBatch[i] = [artifactId, labelKey, labelValue];
            i = i + 1;
        }
        var updateResult = check celleryHubDB->batchUpdate("INSERT INTO REGISTRY_ARTIFACT_LABEL(ARTIFACT_ID, LABEL_KEY, LABEL_VALUE) " +
            "VALUES (?, ?, ?)", ...dataBatch);
        log:printDebug("Added labels for image version with artifact id " + artifactId +
            " for transaction " + transactions:getCurrentTransactionId());
    }
}

# Cleanup labels for an artifact.
#
# + artifactId - ID of the Cell Image
# + return - Error if any occurred
function cleanUpIngresses(string artifactId) returns error? {
    var updateResult = check celleryHubDB->update("DELETE FROM REGISTRY_ARTIFACT_INGRESS WHERE ARTIFACT_ID = ?", artifactId);
    log:printDebug("Removed all ingresses for image version with artifact id " + artifactId +
        " for transaction " + transactions:getCurrentTransactionId());
}

# Persist Image Artifact ingresses in the Cellery Hub database.
#
# + artifactId - ID of the Cell Image
# + ingresses - Ingresses to be added
# + return - Error if any occurred
function persistImageArtifactIngresses(string artifactId, string[] ingresses) returns error? {
    if (ingresses.length() > 0) {
        string[][] dataBatch = [];
        int i = 0;
        foreach var ingress in ingresses {
            dataBatch[i] = [artifactId, ingress];
            i = i + 1;
        }
        var updateResult = check celleryHubDB->batchUpdate("INSERT INTO REGISTRY_ARTIFACT_INGRESS(ARTIFACT_ID, INGRESS_TYPE) " +
            "VALUES (?, ?)", ...dataBatch);
        log:printDebug("Added ingresses for image version with artifact id " + artifactId + " for transaction " +
            " for transaction " + transactions:getCurrentTransactionId());
    }
}
