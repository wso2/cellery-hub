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

import AuthUtils from "./authUtils";
import {StateHolder} from "../../components/common/state";
import axios from "axios";

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
                if (!queryParamValue) {
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
     * Call the Cellery Hub open APIs.
     *
     * @param {Object} config Axios configuration object
     * @param {StateHolder} [globalState] The global state provided to the current component
     * @returns {Promise} A promise for the API call
     */
    static callOpenAPI = (config, globalState) => new Promise((resolve, reject) => {
        config.url = `${globalState.get(StateHolder.CONFIG).hubApiUrl}${config.url}`;
        config.withCredentials = true;
        if (!config.headers) {
            config.headers = {};
        }
        if (!config.headers.Accept) {
            config.headers.Accept = "application/json";
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
                    reject(new Error(error.response.data));
                } else {
                    reject(error);
                }
            });
    });

    /**
     * Call the Cellery Hub authenticated APIs.
     *
     * @param {Object} config Axios configuration object
     * @param {StateHolder} [globalState] The global state provided to the current component
     * @returns {Promise} A promise for the API call
     */
    static callHubAPI = (config, globalState) => new Promise((resolve, reject) => {
        config.url = `${globalState.get(StateHolder.CONFIG).hubApiUrl}${config.url}`;
        config.withCredentials = true;
        if (!config.headers) {
            config.headers = {};
        }
        if (!config.headers.Accept) {
            config.headers.Accept = "application/json";
        }
        if (globalState.get(StateHolder.USER) !== null) {
            config.headers.Authorization = `Bearer ${globalState.get(StateHolder.USER).accessToken}`;
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
                    if (errorResponse.status === 401) {
                        AuthUtils.signOut(globalState);
                    }
                    reject(new Error(errorResponse.data));
                } else {
                    reject(error);
                }
            });
    });

}

export default HttpUtils;
