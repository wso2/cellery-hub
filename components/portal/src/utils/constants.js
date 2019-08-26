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

const Constants = {
    Color: {
        SUCCESS: "#23ff5d",
        ERROR: "#ff443d"
    },
    Pattern: {
        CELLERY_ID: "[a-z0-9]+(-[a-z0-9]+)*",
        PARTIAL_CELLERY_ID: "[-a-z0-9]+",
        PARTIAL_IMAGE_VERSION: "[-.a-z0-9]+",
        PARTIAL_IMAGE_FQN: "((?:-?[a-z0-9]+)+)(?:/([a-z0-9]+))?[-a-z0-9]*"
    },
    Format: {
        DATE_TIME: "DD MMM YYYY, hh:mm:ss A"
    },
    Visibility: {
        PUBLIC: "PUBLIC",
        PRIVATE: "PRIVATE"
    },
    SortingOrder: {
        MOST_POPULAR: "most-popular",
        RECENTLY_UPDATED: "last-updated"
    },
    KeyCode: {
        ENTER: 13
    },
    Header: {
        CELLERY_HUB_CAPTCHA: "g-recaptcha-response"
    },
    ApplicationErrorCode: {
        ALREADY_EXISTS: 2,
        ALLOWED_LIMIT_EXCEEDED: 3,
        ENTRY_NOT_FOUND: 4
    },
    Permission: {
        ADMIN: "admin",
        PUSH: "push",
        PULL: "pull"
    },
    Type: {
        CELL: "Cell",
        COMPOSITE: "Composite"
    }
};

export default Constants;
