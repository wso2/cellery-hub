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

import ballerina/auth;
import ballerina/config;
import ballerina/encoding;
import ballerina/http;
import ballerina/io;
import ballerina/log;
import ballerina/transactions;
import cellery_hub/database as hub_database;
import cellery_hub/docker_registry;
import cellery_hub/image;

http:ServiceEndpointConfiguration registryProxyServiceEPConfig = {
    secureSocket: {
        certFile: config:getAsString("security.certfile"),
        keyFile: config:getAsString("security.keyfile")
    }
};

@http:ServiceConfig {
    basePath: "/"
}
service registryProxy on new http:Listener(9090, config = registryProxyServiceEPConfig) {
    @http:ResourceConfig {
        path: "/health"
    }
    resource function health(http:Caller caller, http:Request req) {
        http:Response response = new;
        response.statusCode = http:OK_200;
        response.setJsonPayload({
            status: "healthy"
        });
        error? result = caller->respond(response);
        if (result is error) {
            log:printError("Error sending health response", err = result);
        }
    }

    @http:ResourceConfig {
        path: "/*"
    }
    resource function proxyToDockerRegistry(http:Caller caller, http:Request req) {
        var isMatch = req.rawPath.matches("^/v2/[^\\/]+/[^\\/]+/manifests/[^\\/]+$");
        if (isMatch is boolean && isMatch && (req.method == "PUT" || req.method == "GET")) {
            var rawPathSplt = req.rawPath.split("/");
            var orgName = rawPathSplt[2];
            var imageName = rawPathSplt[3];
            var imageVersion = rawPathSplt[5];
            var imageFQN = orgName + "/" + imageName + "/" + imageVersion;

            if (req.method == "PUT") {
                var apiErrorMessage = "Failed to push Cell Image " + imageFQN;
                // Handling the Docker Manifest Flow. In this flow, the pushed Celler Image is identified and it's metadata is extracted and
                // saved to the Cellery Hub database. The lock is released automatically upon commit or abort by MySQL.
                transaction {
                    var transactionId = transactions:getCurrentTransactionId();
                    log:printDebug("Started transaction " + transactionId + " for pushing image " + imageFQN);

                    var authorizationHeader = req.getHeader("Authorization");
                    var jwtToken = authorizationHeader.split(" ")[1];

                    var lockResult = hub_database:acquireWriteLockForImage(imageFQN);
                    if (lockResult is error) {
                        log:printError("Failed to lock transaction " + transactionId, err = lockResult);
                        handleApiError(caller, untaint apiErrorMessage);
                        abort;
                    } else {
                        log:printDebug("Locked transaction " + transactionId + " using DB write lock");
                    }

                    var reqPayload = req.getBinaryPayload();
                    if (reqPayload is byte[]) {
                        log:printDebug("Forwarding a push manifest request to the Docker Registry for transaction " + transactionId);
                        var clientResponse = docker_registry:forwardRequest(req);

                        if (clientResponse is http:Response) {
                            if (clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                                var userId = getUserId(jwtToken);
                                if (userId is string) {
                                    log:printDebug("Saving image metadata for transaction " + transactionId + " by user " + userId);

                                    // Converting the byte array to Json to read the Docker manifest
                                    var payloadRbc = io:createReadableChannel(reqPayload);
                                    io:ReadableCharacterChannel payloadRch = new(payloadRbc, "UTF8");
                                    var dockerManifest = payloadRch.readJson();

                                    if (dockerManifest is json) {
                                        var dockerFileLayer = <string>dockerManifest.fsLayers[0].blobSum;
                                        var dockerImageName = <string>dockerManifest.name;
                                        var fileLayerBytes = docker_registry:pullDockerFileLayer(untaint dockerImageName, untaint dockerFileLayer, jwtToken);

                                        if (fileLayerBytes is byte[]) {
                                            log:printDebug("Pulled Docker file layer " + dockerFileLayer + " for transaction " + transactionId);

                                            var metadata = image:extractMetadataFromImage(fileLayerBytes);
                                            if (metadata is image:CellImageMetadata) {
                                                log:printDebug("Extracted Cell image metadata for transaction " + transactionId);

                                                var err = hub_database:saveCellImageMetadata(userId, metadata);
                                                if (err is error) {
                                                    log:printError("Failed to save metadata for transaction " + transactionId, err = err);
                                                    handleApiError(caller, untaint apiErrorMessage);
                                                    abort;
                                                }
                                                log:printDebug("Successfull saved image metadata for transaction " + transactionId);
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
                                } else {
                                    log:printError("Failed to identify user for transaction " + transactionId, err = userId);
                                    handleApiError(caller, untaint apiErrorMessage);
                                    abort;
                                }
                            }
                            // Any requests without a 2xx response is passed through without any interference.
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
            } else if (req.method == "GET") {
                var apiErrorMessage = "Failed to pull Cell Image " + imageFQN;
                transaction {
                    var transactionId = transactions:getCurrentTransactionId();
                    log:printDebug("Started transaction " + transactionId + " for updating pull count for image " + imageFQN);
                    log:printDebug("Forwarding pull manifest request to the Docker registry for transaction " + transactionId);
                    var clientResponse = docker_registry:forwardRequest(req);

                    if (clientResponse is http:Response) {
                        if (clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                            var err = hub_database:incrementPullCount(orgName, imageName, imageVersion);
                            if (err is error) {
                                log:printError("Failed to update pull count for transaction " + transactionId, err = err);
                                handleApiError(caller, untaint apiErrorMessage);
                                abort;
                            }
                        }
                        // Any requests without a 2xx response is passed through without any interference.
                        var result = caller->respond(clientResponse);
                        if (result is error) {
                            log:printError("Error sending response for transaction " + transactionId, err = result);
                        }
                    } else {
                        log:printError("Failed to forward pull manifest request to the Docker Registry for transaction " + transactionId,
                            err = clientResponse);
                        handleApiError(caller, untaint apiErrorMessage);
                    }
                } onretry {
                    log:printDebug("Retrying updating pull count for transaction " + transactions:getCurrentTransactionId());
                } committed {
                    log:printDebug("Updating pull count successful for transaction " + transactions:getCurrentTransactionId());
                } aborted {
                    log:printError("Updating pull count aborted for transaction " + transactions:getCurrentTransactionId());
                }
            } else {
                handlePassThroughProxying(caller, req);
            }
        } else {
            handlePassThroughProxying(caller, req);
        }
    }
}

# Forward request to the Docker Registry.
# This does a passthrough proxying and does not alter the request in any way
#
# + caller - Caller who called the proxy
# + req - Request received by the proxy
function handlePassThroughProxying(http:Caller caller, http:Request req) {
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

# Get the user from the request
#
# + jwtToken - The JWT token to be used
# + return - The user who performed the action
function getUserId(string jwtToken) returns (string|error) {
    var jwtTokenSplit = jwtToken.split("\\.");
    byte[] jwtByteArray = check encoding:decodeBase64(jwtTokenSplit[1]);
    var jwtRbc = io:createReadableChannel(jwtByteArray);
    io:ReadableCharacterChannel jwtRch = new(jwtRbc, "UTF8");
    var jwtJson = check jwtRch.readJson();
    return <string>jwtJson.sub;
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
