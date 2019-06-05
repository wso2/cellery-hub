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

public function buildErrorResponse (int code, string message, string description) returns http:Response {
    http:Response res = new;
    gen:ErrorResponse errPassed = {
        code: code,
        message: message,
        description: description
    };
    var errJson = json.convert(errPassed);
    if (errJson is json) {
        res.setJsonPayload(errJson);
        res.statusCode = http:INTERNAL_SERVER_ERROR_500;
    } else {
        res = buildUnknownErrorResponse("Error occured when converting Error struct to Json");
    }
    return res; 
}

function buildUnknownErrorResponse (string msg) returns http:Response {
    http:Response res = new;
    json errDefault = {
        code: API_DEFAULT_STATUSCODE,
        message: msg,
        description: ""
    };
    res.setPayload(errDefault);
    res.statusCode = http:INTERNAL_SERVER_ERROR_500;
    return res; 
}
