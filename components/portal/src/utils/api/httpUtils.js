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

/* eslint camelcase: ["off"] */

import AuthUtils from "./authUtils";
import {StateHolder} from "../../components/common/state";
import axios from "axios";

/**
 * Error representing an error returned from Hub API.
 */
class HubApiError extends Error {

    /**
     * @private
     * @type{{code: number, message: string, description: string}}
     */
    errorResponse;

    /**
     * @private
     * @type{number}
     */
    statusCode;

    constructor(errorResponse, statusCode) {
        super(errorResponse.message);
        this.errorResponse = errorResponse;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Get the application error code returned from Hub API.
     *
     * @returns {number} The Application Error Code
     */
    getErrorCode() {
        return this.errorResponse.code;
    }

    /**
     * Get the error message returned from Hub API.
     *
     * @returns {string} The error message
     */
    getMessage() {
        return this.errorResponse.message;
    }

    /**
     * Get the error description returned from Hub API.
     *
     * @returns {string} The error description
     */
    getDescription() {
        return this.errorResponse.description;
    }

    /**
     * Get the HTTP status code returned from Hub API.
     *
     * @returns {number} The HTTP status code
     */
    getStatusCode() {
        return this.statusCode;
    }

}

class HttpUtils {

    /**
     * Parse the query param string and get an object of key value pairs.
     *
     * @param {string} queryParamString Query param string
     * @returns {Object} Query param object
     */
    static parseQueryParams = (queryParamString) => {
        const queryParameters = {};
        if (queryParamString) {
            let query = queryParamString;
            if (queryParamString.startsWith("?")) {
                query = queryParamString.substr(1);
            }

            if (query) {
                const queries = query.split("&");
                for (let i = 0; i < queries.length; i++) {
                    const queryPair = queries[i].split("=");
                    const key = decodeURIComponent(queryPair[0]);

                    if (key) {
                        queryParameters[key] = (queryPair.length === 2 && queryPair[1])
                            ? decodeURIComponent(queryPair[1])
                            : true;
                    }
                }
            }
        }
        return queryParameters;
    };

    /**
     * Generate a query param string from a query params object.
     *
     * @param {Object} queryParams Query params as an flat object
     * @returns {string} Query string
     */
    static generateQueryParamString = (queryParams) => {
        let queryString = "";
        if (queryParams) {
            for (const [queryParamKey, queryParamValue] of Object.entries(queryParams)) {
                if (queryParamValue === undefined || queryParamValue === null) {
                    continue;
                }

                // Validating
                if (typeof queryParamValue !== "string" && typeof queryParamValue !== "number"
                    && typeof queryParamValue !== "boolean") {
                    throw Error("Query param value need to be a string, number or boolean "
                        + `instead found ${typeof queryParamValue}`);
                }

                // Generating query string
                queryString += queryString ? "&" : "?";
                queryString += `${encodeURIComponent(queryParamKey)}=${encodeURIComponent(queryParamValue)}`;
            }
        }
        return queryString;
    };

    /**
     * Call the Cellery Hub API.
     *
     * @param {Object} config Axios configuration object
     * @param {StateHolder} [globalState] The global state provided to the current component
     * @param {boolean} [preventAutoReLogin] Prevent initializing a auto re-login upon token invalidation
     * @returns {Promise} A promise for the API call
     */
    static callHubAPI = (config, globalState, preventAutoReLogin) => new Promise((resolve, reject) => {
        config.url = `${globalState.get(StateHolder.CONFIG).hubApiUrl}${config.url}`;
        config.withCredentials = true;
        if (!config.headers) {
            config.headers = {};
        }
        if (!config.headers.Accept) {
            config.headers.Accept = "application/json";
        }
        if (globalState.get(StateHolder.USER) !== null) {
            config.headers.Authorization = `Bearer ${globalState.get(StateHolder.USER).tokens.accessToken}`;
        }
        if (!config.headers["Content-Type"]) {
            config.headers["Content-Type"] = "application/json";
        }
        if (!config.data && (config.method === "POST" || config.method === "PUT" || config.method === "PATCH")) {
            config.data = {};
        }
        axios(config)
            .then((response) => {
                if (response.status >= 200 && response.status < 400) {
                    resolve(response.data);
                } else {
                    reject(response.data);
                }
            })
            .catch((error) => {
                if (error.response) {
                    const errorResponse = error.response;
                    if (errorResponse.status === 401 && !preventAutoReLogin) {
                        AuthUtils.removeUserFromBrowser();
                        AuthUtils.initiateHubLoginFlow(globalState, null, `${window.location.origin}/sign-in`);
                    }
                    reject(new HubApiError(errorResponse.data, errorResponse.status));
                } else {
                    reject(error);
                }
            });
    });

}

export default HttpUtils;
export {HubApiError};
