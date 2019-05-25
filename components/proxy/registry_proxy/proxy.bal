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
import ballerina/http;
import ballerina/io;
import ballerina/log;
import ballerina/transactions;
import cellery_hub/database as hub_database;
import cellery_hub/docker_registry;
import cellery_hub/image;

http:ServiceEndpointConfiguration registryProxyServiceEPConfig = {
    secureSocket: {
        keyStore: {
            path: config:getAsString("PROXY_KEY_STORE"),
            password: config:getAsString("PROXY_KEY_STORE_PASSWORD")
        }
    }
};

@http:ServiceConfig {
    basePath: "/"
}
service registryProxy on new http:Listener(9090, config = registryProxyServiceEPConfig) {
    @http:ResourceConfig {
        path: "/*"
    }
    resource function proxyToDockerRegistry(http:Caller caller, http:Request req) {
        var isMatch = req.rawPath.matches("^/v2/[^\\/]+/[^\\/]+/manifests/[^\\/]+$");
        if (isMatch is boolean && isMatch && req.method == "PUT") {
            var rawPathSplt = req.rawPath.split("/");
            var imageFQN = rawPathSplt[2] + "/" + rawPathSplt[3] + "/" + rawPathSplt[5];

            // Handling the Docker Manifest Flow. In this flow, the pushed Celler Image is identified and it's metadata is extracted and
            // saved to the Cellery Hub database. The lock is released automatically upon commit or abort by MySQL.
            transaction {
                var transactionId = transactions:getCurrentTransactionId();
                var apiErrorMessage = "Failed to upload Cell Image " + imageFQN;
                log:printDebug("Started transaction " + transactionId + " for pushing image " + imageFQN);

                var lockResult = hub_database:acquireWriteLockForImage(imageFQN);
                if (lockResult is error) {
                    log:printError("Failed to lock transaction " + transactionId, err = lockResult);
                } else {
                    log:printDebug("Locked transaction " + transactionId + " using DB write lock");
                }

                var reqPayload = req.getBinaryPayload();
                if (reqPayload is byte[]) {
                    var clientResponse = docker_registry:forwardRequest(req);

                    if (clientResponse is http:Response) {
                        if (clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                            // Converting the byte array to Json to read the Docker manifest
                            var payloadRbc = io:createReadableChannel(reqPayload);
                            io:ReadableCharacterChannel payloadRch = new(payloadRbc, "UTF8");
                            var dockerManifest = payloadRch.readJson();

                            if (dockerManifest is json) {
                                var dockerFileLayer = <string>dockerManifest.fsLayers[0].blobSum;
                                var dockerImageName = <string>dockerManifest.name;
                                var fileLayerBytes = docker_registry:pullDockerFileLayer(untaint dockerImageName, untaint dockerFileLayer, req.getHeader("Authorization"));

                                if (fileLayerBytes is byte[]) {
                                    var metadata = image:extractMetadataFromImage(fileLayerBytes);
                                    if (metadata is json) {
                                        hub_database:saveCellImageMetadata(metadata);
                                    } else {
                                        log:printError("Failed to extract metadata from Cell Image for transaction " + transactionId, err = metadata);
                                        handleApiError(caller, untaint apiErrorMessage);
                                        abort;
                                    }
                                } else {
                                    log:printError("Failed to fetch file layer from Docker Registry for transaction " + transactionId, err = fileLayerBytes);
                                    handleApiError(caller, untaint apiErrorMessage);
                                    abort;
                                }
                            } else {
                                log:printError("Failed to parse Docker Manifest for transaction " + transactionId, err = dockerManifest);
                                handleApiError(caller, untaint apiErrorMessage);
                                abort;
                            }
                        }
                        var result = caller->respond(clientResponse);
                        if (result is error) {
                            log:printError("Error sending response for transaction " + transactionId, err = result);
                        }
                    } else {
                        log:printError("Error forwarding request to the Docker Registry for transaction " + transactionId, err = clientResponse);
                        handleApiError(caller, untaint apiErrorMessage);
                        abort;
                    }
                } else {
                    log:printError("Failed to read request payload for " + transactionId, err = reqPayload);
                    handleApiError(caller, untaint apiErrorMessage);
                    abort;
                }
            } onretry {
                log:printDebug("Retrying pushing image for transaction " + transactions:getCurrentTransactionId());
            } committed {
                log:printDebug("Pushing Image successful for transaction " + transactions:getCurrentTransactionId());
            } aborted {
                log:printError("Pushing Image aborted for transaction " + transactions:getCurrentTransactionId());
            }
            hub_database:cleanUpAfterLockForImage(imageFQN);
        } else {
            // Passthrough proxy to the Docker Registry
            var clientResponse = docker_registry:forwardRequest(req);
            if (clientResponse is http:Response) {
                var result = caller->respond(clientResponse);
                if (result is error) {
                    log:printError("Error sending response", err = result);
                }
            } else {
                log:printError("Error forwarding request to the Docker Registry", err = clientResponse);
                handleApiError(caller, "Failed to perform action");
            }
        }
    }
}

# Handle Proxy API errors.
#
# + caller - Caller who called the Proxy API
# + responsePayload - The respnse payload to be sent
function handleApiError(http:Caller caller, string responsePayload) {
    http:Response res = new;
    res.statusCode = 500;
    res.setPayload(responsePayload);
    var result = caller->respond(res);
    if (result is error) {
        log:printError("Error sending error response", err = result);
    }
}
