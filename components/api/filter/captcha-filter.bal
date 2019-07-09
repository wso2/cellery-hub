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

import ballerina/config;
import ballerina/http;
import ballerina/log;
import ballerina/io;
import cellery_hub_api/db;
import cellery_hub_api/constants;

http:Client clientEndpoint = new(config:getAsString("filter.captcha.endpoint"));

string engagedPaths = config:getAsString("filter.captcha.engaged.paths");

public type CaptchaRequestFilter object {
    public function filterRequest(http:Caller caller, http:Request request,
    http:FilterContext context)
    returns boolean {

        boolean | error isFilterEngaged = isEngaged(request);
        if (isFilterEngaged is boolean && !isFilterEngaged) {
            return true;
        }
        boolean hasUserId = request.hasHeader(constants:AUTHENTICATED_USER);
        if (!hasUserId) {
            log:printDebug("No authenticated user found. Hence passing through from captcha valve");
            return true;
        }
        string userId = request.getHeader(constants:AUTHENTICATED_USER);

        int | error orgCountResult = db:getOrganizationCount(userId);
        if (orgCountResult is int) {
            if (orgCountResult == 0) {
                return true;
            } else if (orgCountResult >= config:getAsInt("filter.captcha.max.allowd.organization.count")) {    
                log:printInfo(io:sprintf("User %s has already created %d organizations. Hence denying request for organization creation.", userId, 
                orgCountResult));            
                checkpanic caller->respond(getMaxOrgCountExceededResponse());
                return false;
            } else {
                log:printDebug(io:sprintf("%d organizations found for user : %s", orgCountResult, userId));
                boolean catpchaValid = validateCaptcha(request);
                if (catpchaValid) {
                    return true;
                }
                checkpanic caller->respond(getRateLimitResponse());
                return false;
            }
        } else {
            log:printError("Error occured while running Gcaptcha filter " + orgCountResult.reason());
        }
        return true;
    }

    public function filterResponse(http:Response response, http:FilterContext context) returns boolean {
        return true;
    }
};

public function validateCaptcha(http:Request request) returns boolean {
    boolean hasCaptchaHeader = request.hasHeader(constants:G_CAPTCHA_RESPONSE);
    if (!hasCaptchaHeader) {
        log:printDebug("No catpcha header found for captcha required request");
        return false;
    }
    string captchaResult = request.getHeader(constants:G_CAPTCHA_RESPONSE);
    http:Request req = new;
    var gcaptchaSecret = config:getAsString("filter.captcha.secret");

    string body = "secret=" + gcaptchaSecret + "&response=" + captchaResult;
    log:printDebug("Request towards GCaptcha API " + body);
    req.setPayload(untaint body);
    var err = req.setContentType(constants:APPLICATION_URL_ENCODED_CONTENT_TYPE);
    var response = clientEndpoint->post("", req);
    var captchaValidationResult = interpretCaptchaResponse(response);
    if (captchaValidationResult is boolean && captchaValidationResult) {
        return true;
    }
    return false;

}

function interpretCaptchaResponse(http:Response | error response) returns boolean | error {
    if (response is http:Response) {
        var msg = response.getJsonPayload();
        if (msg is json) {
            log:printDebug("Recaptcha validation response : " +check string.convert(msg));
            boolean success = check boolean.convert(msg["success"]);
            if (success) {
                log:printDebug("Gcaptcha validation successful from Gcaptcha API");
                return success;
            }
            log:printInfo("Gcaptcha validation failed from google API");
            return false;
        } else {
            log:printError("Didn't recieve a json response from captcha verification API: " + msg.reason());
        }
    } else {
        log:printError("Error when calling the google recaptcha API for valication: " + response.reason());
    }
    return false;
}


public function isEngaged(http:Request request) returns boolean | error {

    if (engagedPaths == "") {
        log:printInfo("No configured paths found for Gcaptcha filter");
        return false;
    }
    io:StringReader sr = new(engagedPaths, encoding = "UTF-8");
    json engagedPathsJson = check sr.readJson();

    string rawPath = request.rawPath;
    string method = request.method;
    log:printDebug("Incoming request to : " + rawPath + ",  with method : " + method);
    int pathLength = engagedPathsJson.length();

    int i = 0;
    while (i < pathLength) {
        string configuredPath = check string.convert(engagedPathsJson[i]["path"]);
        string configuredMethod = check string.convert(engagedPathsJson[i]["method"]);
        log:printDebug("Evaluating configured path entry : " + configuredPath + ",  with method : " + configuredMethod);
        boolean isPathMatch = check rawPath.toLower().matches(configuredPath.toLower());
        boolean isMethodMatch = check method.toLower().matches(configuredMethod.toLower());
        if (isPathMatch && isMethodMatch) {
            log:printDebug("Path match with method match found : " + configuredPath);
            return true;
        }
        i = i + 1;
    }
    return false;
}


function getRateLimitResponse() returns http:Response {
    http:Response res = new;
    // Status code for request throttled out. This is not found in ballerina http status codes.
    res.statusCode = 429;
    return res;
}


function getMaxOrgCountExceededResponse() returns http:Response {
    http:Response res = getRateLimitResponse();
    json errorCodeResponse = { 
        code: constants:ALLOWED_LIMIT_EXCEEDED_ERROR_CODE,
        message: "Organization creation denied",
        description: "Exceeded maximum organization creation limit"
    };
    log:printDebug("Setting allowed limit exceeded API error code");
    res.setJsonPayload(errorCodeResponse);
    return res;
}
