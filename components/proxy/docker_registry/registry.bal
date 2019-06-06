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

http:Client dockerRegistryClientEP = new(config:getAsString("docker.registry.url"), config = {
    secureSocket: {
        trustedCertFile: config:getAsString("security.trustedcertsfile")
    }
});

# Forward a request to the Docker Rgistry.
#
# + req - The request to be forwared to the docker registry
# + return - The response received from the registry
public function forwardRequest(http:Request req) returns (http:Response|error) {
    return dockerRegistryClientEP->forward(untaint req.rawPath, req);
}

# Pull a file layer from the Docker Registry.
#
# + repository - The Docker Image Repository name
# + fileLayer - Docker File Layer to be pulled
# + jwtToken - The JWT token that should be used
# + return - Docker file layer bytes
public function pullDockerFileLayer(string repository, string fileLayer, string jwtToken) returns (byte[]|error) {
    http:Request dockerRegistryRequest = new;
    dockerRegistryRequest.addHeader("Authorization", "Bearer " + jwtToken);
    var response = check dockerRegistryClientEP->get("/v2/" + repository + "/blobs/" + fileLayer, message = dockerRegistryRequest);
    if (response.statusCode >= 200 && response.statusCode < 400) {
        return response.getBinaryPayload();
    } else if (response.statusCode == 401) {
        error err = error("unauthorized to pull docker file layer " + fileLayer);
        return err;
    } else {
        error err = error("failed to pull docker file layer " + fileLayer + " with status code " + response.statusCode);
        return err;
    }
}
