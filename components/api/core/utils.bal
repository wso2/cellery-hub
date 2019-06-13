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

function buildResponseWithUserInfo (json payload, string pathForUserID) returns json | error {
    idp:UserInfo | error? newRes = idp:getUserInfo(pathForUserID);
    if (newRes is idp:UserInfo) {
        json resPayload = {};
        resPayload["description"] = payload.description;
        resPayload["websiteUrl"] = payload.websiteUrl;
        resPayload["createdTimestamp"] = payload.createdTimestamp;
        resPayload["author"] = check json.convert(newRes);
        return resPayload;
    } else {
        return newRes;
    }
}