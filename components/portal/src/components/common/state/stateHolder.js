/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as axios from "axios";

/**
 * Configuration holder.
 */
class StateHolder {

    static CONFIG = "config";

    /**
     * @type {Object}
     * @private
     */
    state = {};

    /**
     * Initialize the State Holder.
     */
    constructor() {
        const rawState = {
            [StateHolder.CONFIG]: {}
        };

        const initialProcessedState = {};
        for (const [stateKey, stateValue] of Object.entries(rawState)) {
            initialProcessedState[stateKey] = {
                value: stateValue
            };
        }
        this.state = initialProcessedState;
    }

    /**
     * Set the value for a particular key.
     *
     * @param {string} key The key for which the value should be added
     * @param {Object} value The new value that should be set
     */
    set = (key, value) => {
        if (key) {
            if (!this.state[key]) {
                this.state[key] = {
                    value: null
                };
            }
            this.notify(key, value);
            this.state[key].value = value;
        }
    };

    /**
     * Unset the value for a particular key.
     *
     * @param {string} key The key for which the value should be removed
     */
    unset = (key) => {
        if (key && this.state[key]) {
            this.notify(key, null);
            this.state[key].value = null;
        }
    };

    /**
     * Get the value for a particular key.
     *
     * @param {string} key The key for which the value should be retrieved
     * @param {Object} defaultValue The default value which should be returned if the value does not exist
     * @returns {Object} The value for the key provided
     */
    get = (key, defaultValue = null) => {
        let value = defaultValue;
        if (this.state[key]) {
            value = this.state[key].value;
        }
        return value;
    };

    /**
     * Add a listener for a particular state key.
     *
     * @param {string} key The state key for which the listener should be added
     * @param {Function} callback The callback function which should be called upon update
     */
    addListener = (key, callback) => {
        if (!this.state[key]) {
            this.state[key] = {};
        }
        if (!this.state[key].listeners) {
            this.state[key].listeners = [];
        }
        this.state[key].listeners.push(callback);
    };

    /**
     * Remove a listener previously added.
     *
     * @param {string} key The key from which the listener should be added
     * @param {Function} callback The callback which should be removed
     */
    removeListener = (key, callback) => {
        if (this.state[key]) {
            const listeners = this.state[key].listeners;
            if (listeners) {
                const removeIndex = listeners.indexOf(callback);
                listeners.splice(removeIndex, 1);
            }
        }
    };

    /**
     * Notify the listeners about a state change.
     *
     * @param {string} key The key of which the listeners should be notified
     * @param {Object} newValue The new value of the key
     * @private
     */
    notify = (key, newValue) => {
        const oldValue = this.state[key].value;
        const listeners = this.state[key].listeners;
        if (oldValue !== newValue && listeners) {
            listeners.forEach((listener) => listener(key, oldValue, newValue));
        }
    };

    /**
     * Load the state that should be used.
     *
     * @returns {Promise<Object>} Promise which resolves when the state is loaded or rejects
     */
    loadConfig = () => {
        const self = this;
        return new Promise((resolve, reject) => {
            axios({
                url: "/config",
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            }).then((response) => {
                self.set(StateHolder.CONFIG, response.data);
                resolve(response.data);
            }).catch((error) => {
                reject(error);
            });
        });
    };

}

export default StateHolder;
