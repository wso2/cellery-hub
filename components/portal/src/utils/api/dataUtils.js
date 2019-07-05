/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Data (returned from the API) related utilities.
 */
class DataUtils {

    /**
     * Get the name to be displayed for a user object returned from the API.
     *
     * @param {Object} userData The user data object returned from the API.
     * @returns {string} The display name to be used in the Portal
     */
    static getUserDisplayName(userData) {
        let displayName = "";
        if (userData) {
            if (userData.displayName) {
                displayName = userData.displayName;
            } else if (userData.email) {
                displayName = userData.email.split("@")[0];
            } else {
                throw Error("Either the displayName or the email need to be present in the provided user, "
                    + `received ${JSON.stringify(userData)}`);
            }
        } else {
            throw Error(`Unable to get display for empty user data, received ${userData}`);
        }
        return displayName;
    }

}

export default DataUtils;
