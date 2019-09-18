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

import ballerina/http;
import ballerina/log;
import ballerina/cache;

public type UserInfo record {
    string userId;
    string firstName;
    string lastName;
    string displayName;
    string email;
};

int userInfoCacheExpiryTime = config:getAsInt(constants:USERINFO_CACHE_EXPIRY_VAR, defaultValue = 1800000);
cache:Cache userInfoCache = new(capacity = config:getAsInt(constants:USERINFO_CACHE_CAPACITY_VAR, defaultValue = 500),
                        expiryTimeMillis = userInfoCacheExpiryTime);

public function getUserInfo(string userId) returns UserInfo? | error {

    log:printDebug(io:sprintf("Retrieving userInformation organizations for user : \'%s\'", userId));
    if(userInfoCache.hasKey(userId)) {
        log:printDebug(io:sprintf("Found cached userinfo for user : \'%s\'", userId));
        return <UserInfo>userInfoCache.get(userId);
    }
    // TODO There is a bug on ballerina that when there are more than one global client endpoints,
    // we have to reinitialize the endpoint. Need to remove this after the bug on this in ballerina is fixed
    log:printDebug(io:sprintf("User info not found in cache for user : \'%s\'. Hence calling IDP", userId));
    http:Client idpClientEP = getBasicAuthIDPClient(config:getAsString("idp.username"),config:getAsString("idp.password"));
    var response = check idpClientEP->get(config:getAsString("idp.scim2.user.endpoint") +
    "?filter=username+eq+" + userId);


    if (response.statusCode >= 400) {
        error err = error(io:sprintf("Failed to call IdP scim endpoint. Recieved status code ", response.statusCode));
        return err;
    }

    json scimUserFilterResponse = check response.getJsonPayload();
    log:printDebug("Response from user info request to IDP : " +check string.convert(scimUserFilterResponse));
    if (scimUserFilterResponse.totalResults == 0) {
        log:printDebug(io:sprintf("No users found with given Id : \'%s\'", userId));
        return;
    } else if (scimUserFilterResponse.totalResults == 1) {
        json userResource = scimUserFilterResponse.Resources[0];
        string username = "";
        string firstName = "";
        string lastName = "";
        string displayName = "";
        string email = "email";
        if (userResource.userName != ()) {
            username = <string>userResource.userName;
        }
        if (userResource.name != ()) {
            if (userResource.name.givenName != ()) {
                firstName = <string> userResource.name.givenName;
            }
            if (userResource.name.familyName != ()) {
                lastName = <string> userResource.name.familyName;
            }
        }
        if (userResource.displayName != ()) {
            displayName = <string> userResource.displayName;
        }
        if (userResource.emails != () && userResource.emails.length() > 0) {
            email = <string> userResource.emails[0];
        }
        UserInfo userInfo = {
            userId: username,
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            email: email
        };
        log:printDebug("Returning user info recieved from IDP");
        userInfoCache.put(userId, userInfo);
        return userInfo;
    }
    log:printDebug(io:sprintf("More than 1 user found for the given user ID hence not returning user info for user
     : \'%s\'", userId));
    return;
}
