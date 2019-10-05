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
            var imageFQN = io:sprintf("%s/%s:%s", orgName, imageName, imageVersion);

            if (req.method == "PUT") {
                var apiErrorMessage = "Failed to push Cell Image " + imageFQN;
                // Handling the Docker Manifest Flow. In this flow, the pushed Cellery Image is identified and
                // it's metadata is extracted and saved to the Cellery Hub database.
                // The lock is released automatically upon commit or abort by MySQL.
                transaction {
                    var transactionId = transactions:getCurrentTransactionId();
                    log:printDebug(io:sprintf("Started transaction %s for pushing image %s", transactionId, imageFQN));

                    var lockResult = hub_database:acquireWriteLockForImage(imageFQN);
                    if (lockResult is error) {
                        log:printError(io:sprintf("Failed to lock transaction %s for pushing image %s", transactionId,
                            imageFQN), err = lockResult);
                        handleApiError(caller, untaint apiErrorMessage);
                        abort;
                    } else {
                        log:printDebug(io:sprintf("Locked transaction %s using DB write lock", transactionId));
                    }

                    var reqPayload = req.getBinaryPayload();
                    if (reqPayload is byte[]) {
                        log:printDebug("Forwarding a push manifest request to the Docker Registry for transaction "
                            + transactionId);
                        var clientResponse = docker_registry:forwardRequest(req);

                        if (clientResponse is http:Response) {
                            if (clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                                var authorizationHeader = req.getHeader("Authorization");
                                var jwtToken = authorizationHeader.split(" ")[1];
                                var userId = getUserId(jwtToken);
                                if (userId is string) {
                                    log:printDebug(io:sprintf("Saving image metadata for transaction %s by user %s",
                                        transactionId, userId));

                                    // Converting the byte array to Json to read the Docker manifest
                                    var payloadRbc = io:createReadableChannel(reqPayload);
                                    io:ReadableCharacterChannel payloadRch = new(payloadRbc, "UTF8");
                                    var dockerManifest = payloadRch.readJson();

                                    if (dockerManifest is json) {
                                        var dockerFileLayer = <string>dockerManifest.fsLayers[0].blobSum;
                                        var dockerImageName = <string>dockerManifest.name;
                                        var fileLayerBytes = docker_registry:pullDockerFileLayer(
                                            untaint dockerImageName, untaint dockerFileLayer, jwtToken);

                                        if (fileLayerBytes is byte[]) {
                                            log:printDebug(io:sprintf("Pulled Docker file layer %s for transaction %s",
                                                dockerFileLayer, transactionId));

                                            var err = image:saveMetadataFromImage(userId, fileLayerBytes);
                                            if (err is error) {
                                                log:printError(
                                                    io:sprintf("Failed to save Cell image metadata from Cell Image "
                                                        + "%s pushed by user %s for transaction %s",
                                                    imageFQN, userId, transactionId), err = err);
                                                handleApiError(caller, untaint apiErrorMessage);
                                                abort;
                                            } else {
                                                log:printDebug("Saved Cell image metadata for transaction "
                                                    + transactionId);
                                            }
                                        } else {
                                            log:printError(
                                                io:sprintf( "Failed to fetch file layer from Docker Registry for "
                                                    + "image %s pushed by user %s for transaction %s",
                                                imageFQN, userId, transactionId), err = fileLayerBytes);
                                            handleApiError(caller, untaint apiErrorMessage);
                                            abort;
                                        }
                                    } else {
                                        log:printError(
                                            io:sprintf("Failed to parse Docker Manifest for Image %s pushed by user %s "
                                                + "for transaction %s", imageFQN, userId, transactionId),
                                            err = dockerManifest);
                                        handleApiError(caller, untaint apiErrorMessage);
                                        abort;
                                    }
                                } else {
                                    log:printError(io:sprintf(
                                        "Failed to identify user for image %s for transaction %s", imageFQN,
                                            transactionId), err = userId);
                                    handleApiError(caller, untaint apiErrorMessage);
                                    abort;
                                }
                            }
                            // Any requests without a 2xx response is passed through without any interference.
                            var result = caller->respond(clientResponse);
                            if (result is error) {
                                log:printError(io:sprintf(
                                    "Error sending response for image %s for transaction %s", imageFQN, transactionId),
                                        err = result);
                            }
                        } else {
                            log:printError(io:sprintf(
                                "Error forwarding request to the Docker Registry for image %s for transaction %s",
                                    imageFQN, transactionId), err = clientResponse);
                            handleApiError(caller, untaint apiErrorMessage);
                            abort;
                        }
                    } else {
                        log:printError(io:sprintf(
                            "Failed to read request payload for image %s for transaction %s", imageFQN, transactionId),
                                err = reqPayload);
                        handleApiError(caller, untaint apiErrorMessage);
                        abort;
                    }
                } onretry {
                    log:printDebug("Retrying pushing image for transaction " + transactions:getCurrentTransactionId());
                } committed {
                    log:printDebug("Pushing Image successful for transaction "
                        + transactions:getCurrentTransactionId());
                } aborted {
                    log:printError(io:sprintf("Pushing Image aborted for image %s for transaction %s", imageFQN,
                        transactions:getCurrentTransactionId()));
                }
                hub_database:cleanUpAfterLockForImage(imageFQN);
            } else if (req.method == "GET") {
                var apiErrorMessage = "Failed to pull Cell Image " + imageFQN;
                transaction {
                    var transactionId = transactions:getCurrentTransactionId();
                    log:printDebug(io:sprintf("Started transaction %s for updating pull count for image %s",
                        transactionId, imageFQN));
                    log:printDebug("Forwarding pull manifest request to the Docker registry for transaction "
                        + transactionId);
                    var clientResponse = docker_registry:forwardRequest(req);

                    if (clientResponse is http:Response) {
                        if (clientResponse.statusCode >= 200 && clientResponse.statusCode < 300) {
                            var err = hub_database:incrementPullCount(orgName, imageName, imageVersion);
                            if (err is error) {
                                log:printError(io:sprintf(
                                    "Failed to update pull count for image %s for transaction %s", imageFQN,
                                        transactionId), err = err);
                                handleApiError(caller, untaint apiErrorMessage);
                                abort;
                            }
                        }
                        // Any requests without a 2xx response is passed through without any interference.
                        var result = caller->respond(clientResponse);
                        if (result is error) {
                            log:printError(io:sprintf("Error sending response for pulling image %s for transaction %s",
                                imageFQN, transactionId), err = result);
                        }
                    } else {
                        log:printError(io:sprintf(
                            "Failed to forward pull manifest request to the Docker Registry for image %s for transaction %s",
                                imageFQN, transactionId), err = clientResponse);
                        handleApiError(caller, untaint apiErrorMessage);
                    }
                } onretry {
                    log:printDebug("Retrying updating pull count for transaction "
                        + transactions:getCurrentTransactionId());
                } committed {
                    log:printDebug("Updating pull count successful for transaction "
                        + transactions:getCurrentTransactionId());
                } aborted {
                    log:printError(io:sprintf("Updating pull count aborted for image %s for transaction %s",
                        imageFQN, transactions:getCurrentTransactionId()));
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
            log:printError(io:sprintf("Error sending response for request %s %s", req.method, req.rawPath),
                err = result);
        }
    } else {
        log:printError(io:sprintf("Error forwarding request %s %s to the Docker Registry", req.method, req.rawPath),
            err = clientResponse);
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
