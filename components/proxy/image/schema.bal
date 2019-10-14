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
import ballerina/transactions;
import cellery_hub/database;

type CellImageMetadata record {|
	string org;
	string name;
	string ver;
	string schemaVersion;
	string kind;
	map<ComponentMetadata> components;
	int buildTimestamp;
	string buildCelleryVersion;
	boolean zeroScalingRequired;
	boolean autoScalingRequired;
|};

type ComponentMetadata record {|
	string dockerImage;
	boolean isDockerPushRequired;
	map<string> labels;
	string[] ingressTypes;
	ComponentDependencies dependencies;
|};

type ComponentDependencies record {|
	map<CellImageMetadata> cells;
	map<CellImageMetadata> composites;
	string[] components;
|};

const string IMAGE_KIND_CELL = "Cell";
const string IMAGE_KIND_COMPOSITE = "Composite";
string[] IMAGE_KINDS = [IMAGE_KIND_CELL, IMAGE_KIND_COMPOSITE];

const string INGRESS_TYPE_TCP = "TCP";
const string INGRESS_TYPE_HTTP = "HTTP";
const string INGRESS_TYPE_GRPC = "GRPC";
const string INGRESS_TYPE_WEB = "WEB";
string[] INGRESS_TYPES = [INGRESS_TYPE_TCP, INGRESS_TYPE_HTTP, INGRESS_TYPE_GRPC, INGRESS_TYPE_WEB];

# Build Cell Image from the metadata JSON.
#
# + metadataJson - metadata of the Cell Image
# + return - The cell image built using metadata JSON
function buildCellImage(json metadataJson) returns (database:CellImage|error) {
    var transactionId = transactions:getCurrentTransactionId();

    CellImageMetadata cellImageMetadata;
    var convertedCellImageMetadata = CellImageMetadata.convert(metadataJson);
    if (convertedCellImageMetadata is error) {
        var stringConvertedMetadata = string.convert(metadataJson);
        string metadataPayloadMessage;
        if (stringConvertedMetadata is string) {
            metadataPayloadMessage = " with metadata: " + stringConvertedMetadata;
        } else {
            metadataPayloadMessage = "";
        }

        var buildCelleryVersion = string.convert(metadataJson["buildCelleryVersion"]);
        var schemaVersion = string.convert(metadataJson["schemaVersion"]);
        if (buildCelleryVersion is string && schemaVersion is string) {
            log:printError("Format of the received metadata of Schema Version "
                + schemaVersion +  " built using Cellery "
                + buildCelleryVersion + " does not match Cellery Hub supported metadata "
                + "format for transaction " + transactionId + metadataPayloadMessage);
        } else {
            log:printError("Format of the received metadata does not match Cellery Hub "
                + "supported metadata format for transaction " + transactionId
                + metadataPayloadMessage);
        }
        return convertedCellImageMetadata;
    } else {
        cellImageMetadata = convertedCellImageMetadata;
        var err = validateMetadataSchema(cellImageMetadata);
        if (err is error) {
            log:printError("Invalid metadata format", err = err);
            return err;
        }
    }

    database:CellImage cellImage = {
        org: cellImageMetadata.org,
        name: cellImageMetadata.name,
        ver: cellImageMetadata.ver,
        labels: {},
        ingresses: [],
        metadata: metadataJson
    };
    // Extracting labels from metadata
    foreach var (componentName, component) in cellImageMetadata.components {
        foreach var (labelKey, labelValue) in component.labels {
            cellImage.labels[labelKey] = labelValue;
        }
    }
    // Extracting ingress types from metadata
    int i = 0;
    foreach var (componentName, component) in cellImageMetadata.components {
        foreach var rawIngressType in component.ingressTypes {
            var ingressType = rawIngressType.toUpper();
            boolean alreadyPresent = false;
            // Ensuring that duplicates are not added.
            // Since ballerina does not yet support Sets, need to iterate to ensure no duplicates are added.
            foreach var addedIngress in cellImage.ingresses {
                if (addedIngress == ingressType) {
                    alreadyPresent = true;
                    break;
                }
            }
            if (!alreadyPresent) {
                cellImage.ingresses[i] = ingressType;
                i = i + 1;
            }
        }
    }
    return cellImage;
}

# Validate the metadata values and return error if invalid.
#
# + cellImageMetadata - cellImageMetadata Metadata to be validated
# + return - Error if invalid
function validateMetadataSchema(CellImageMetadata cellImageMetadata) returns error? {
    // TODO: Update this validation to a ballerina enum based validation after migrating to Ballerina 1.0.0
    if (!isValidEnum(cellImageMetadata.kind, IMAGE_KINDS)) {
        error err = error(io:sprintf("invalid kind \"%s\" found", cellImageMetadata.kind));
        return err;
    }

    foreach var (componentName, component) in cellImageMetadata.components {
        foreach var ingressType in component.ingressTypes {
            if (!isValidEnum(ingressType, INGRESS_TYPES)) {
                error err = error(io:sprintf("invalid ingress type \"%s\" found", ingressType));
                return err;
            }
        }
    }
}

# Validate a enum value using an array of valid values.
#
# + actualValue - actualValue The actual value which should match the array of values
# + validValues - validValues The array of valid values for the enum value
# + return - Return Value Description
function isValidEnum(string actualValue, string[] validValues) returns boolean {
    var isValid = false;
    foreach var validValue in validValues {
        if (validValue == actualValue) {
            isValid = true;
            break;
        }
    }
    return isValid;
}
