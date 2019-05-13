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

import ballerina/config;
import ballerina/filepath;
import ballerina/http;
import ballerina/internal;
import ballerina/io;
import ballerina/log;
import ballerina/time;

http:ServiceEndpointConfiguration registryProxyEPConfig = {
    secureSocket: {
        keyStore: {
            path: "/security/keystore.p12",
            password: "ballerina"
        }
    }
};

http:ClientEndpointConfig registryEPConfig = {
    secureSocket: {
        trustStore: {
            path: "/security/truststore.p12",
            password: "ballerina"
        }
    }
};

http:Client dockerRegistryClientEP = new(config:getAsString("TARGET_DOCKER_REGISTRY_URL"), config = registryEPConfig);

@http:ServiceConfig {
    basePath: "/"
}
service registryProxy on new http:Listener(9090, config = registryProxyEPConfig) {
    @http:ResourceConfig {
        path: "/*"
    }
    resource function proxyToDockerRegistry(http:Caller caller, http:Request req) {
        var reqPayload = req.getBinaryPayload();
        var clientResponse = dockerRegistryClientEP->forward(untaint req.rawPath, req);

        if (clientResponse is http:Response) {
            var isMatch = req.rawPath.matches("/v2/[^\\/]+/[^\\/]+/manifests/[^\\/]+");
            if (isMatch is boolean && isMatch && req.method == "PUT"
                    && clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                if (reqPayload is byte[]) {
                    // Converting the byte array to Json to read the Docker manifest
                    var payloadRbc = io:createReadableChannel(reqPayload);
                    io:ReadableCharacterChannel payloadRch = new(payloadRbc, "UTF8");
                    var dockerManifest = payloadRch.readJson();

                    if (dockerManifest is json) {
                        var dockerFileLayer = <string>dockerManifest.fsLayers[0].blobSum;
                        var dockerImageName = <string>dockerManifest.name;
                        var fileLayerBytes = pullDockerFileLayer(untaint dockerImageName, untaint dockerFileLayer, req.getHeader("Authorization"));

                        if (fileLayerBytes is byte[]) {
                            var metadata = extractMetadata(fileLayerBytes);
                            if (metadata is json) {
                                saveCellImageMetadata(metadata);
                            } else {
                                handleApiError(caller, "Failed to persist additional metadata", metadata);
                            }
                        } else {
                            handleApiError(caller, "Failed to persist additional metadata", fileLayerBytes);
                        }
                    } else {
                        handleApiError(caller, "Failed to persist additional metadata", dockerManifest);
                    }
                } else {
                    handleApiError(caller, "Failed to persist additional metadata", reqPayload);
                }
            }
            var result = caller->respond(clientResponse);
            if (result is error) {
                log:printError("Error sending response", err = result);
            }
        } else {
            handleApiError(caller, <string>clientResponse.detail().message, clientResponse);
        }
    }
}

# Pull a file layer from the Docker Registry.
#
# + repository - The Docker Image Repository name
# + fileLayer - Docker File Layer to be pulled
# + currentToken - The current token used in the intercepted request
# + return - Docker file layer bytes
function pullDockerFileLayer(string repository, string fileLayer, string currentToken) returns (byte[]|error) {
    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader("Authorization", currentToken);
    var response = dockerRegistryClientEP->get("/v2/" + repository + "/blobs/" + fileLayer, message = dockerRegistryRequest);
    if (response is http:Response && response.statusCode >= 200 && response.statusCode < 300) {
        return response.getBinaryPayload();
    } else if (response is http:Response && response.statusCode == 401) {
        error err = error("Unauthorized to pull docker file layer " + fileLayer);
        return err;
    } else {
        error err = error("Failed to Call Docker Registry");
        return err;
    }
}

# Extract the metadata for the cell iamge file layer.
#
# + cellImageBytes - Cell Image Zip bytes
# + return - metadata JSON or an error
function extractMetadata(byte[] cellImageBytes) returns (json|error) {
    time:Time time = time:currentTime();
    int timestamp = time:getMilliSecond(time);
    var extractedCellImageDir = filepath:build("/", "ballerina", "home", "cell-image-" + timestamp);

    if (extractedCellImageDir is error) {
        error err = error("Failed to resolve extract location due to " + extractedCellImageDir.reason());
        return err;
    } else {
        // Uncompressing the received Cell Image Bytes
        internal:Path zipDest = new(extractedCellImageDir);
        var zipDestDirCreateResult = zipDest.createDirectory();
        if (zipDestDirCreateResult is error) {
            error err = error("Failed to create temp directory due to " + zipDestDirCreateResult.reason());
            return err;
        }
        var decompressResult = internal:decompressFromByteArray(cellImageBytes, zipDest);

        if (decompressResult is error) {
            error err = error("Failed to extract Cell Image due to " + decompressResult.reason());
            return err;
        } else {
            // Reading the metadata from the extracted Cell Image
            var cellImageMetadataFile = filepath:build(extractedCellImageDir, "artifacts", "cellery", "metadata.json");
            if (cellImageMetadataFile is string) {
                io:ReadableByteChannel metadataRbc = io:openReadableFile(untaint cellImageMetadataFile);
                io:ReadableCharacterChannel metadataRch = new(metadataRbc, "UTF8");
                var parsedMetadata = metadataRch.readJson();

                if (parsedMetadata is json) {
                    var extracedCellImageDeleteResult = zipDest.delete();
                    if (extracedCellImageDeleteResult is error) {
                        log:printError("Failed to cleanup Cell Image", err = extracedCellImageDeleteResult);
                    }
                    return parsedMetadata;
                } else {
                    error err = error("Failed to parse metadata.json due to " + parsedMetadata.reason());
                    var extracedCellImageDeleteResult = zipDest.delete();
                    if (extracedCellImageDeleteResult is error) {
                        log:printError("Failed to cleanup Cell Image", err = extracedCellImageDeleteResult);
                    }
                    return err;
                }
            } else {
                error err = error("Failed to resolve metadata.json file due to " + cellImageMetadataFile.reason());
                var extracedCellImageDeleteResult = zipDest.delete();
                if (extracedCellImageDeleteResult is error) {
                    log:printError("Failed to cleanup Cell Image", err = extracedCellImageDeleteResult);
                }
                return err;
            }
        }
    }
}

# Save Cell Image Metadata to the Cellery Hub Database
#
# + metadata - Metadata of the Cell Image
function saveCellImageMetadata(json metadata) {
    io:println(metadata);
}

# Handle Proxy API errors.
#
# + caller - Caller who called the Proxy API
# + responsePayload - The respnse payload to be sent
# + err - The error which occurred
function handleApiError(http:Caller caller, string responsePayload, error err) {
    http:Response res = new;
    res.statusCode = 500;
    res.setPayload(responsePayload);
    var result = caller->respond(res);
    if (result is error) {
        log:printError("Error sending error response", err = err);
    }
}
