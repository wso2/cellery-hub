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

import HttpUtils from "./httpUtils";
import NotificationUtils from "../common/notificationUtils";
import {StateHolder} from "../../components/common/state";
import jwtDecode from "jwt-decode";

/**
 * Authentication/Authorization related utilities.
 */
class AuthUtils {

    static AUTHORIZATION_ENDPOINT = "/oauth2/authorize";
    static LOGOUT_ENDPOINT = "/oidc/logout";
    static COMMON_AUTH_ENDPOINT = "/commonauth";

    static USER_KEY = "user";
    static FEDERATED_IDP_KEY = "hub-fidp";

    static FederatedIdP = {
        GOOGLE: "google",
        GITHUB: "github"
    };

    /**
     * @typedef {AuthUtils.FederatedIdP.GOOGLE|AuthUtils.FederatedIdP.GITHUB} FederatedIdPType
     */

    /**
     * Redirect the user to IDP for authentication.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {FederatedIdPType} [fidp] The federated idp to be used
     */
    static initiateLoginFlow(globalState, fidp) {
        AuthUtils.setDefaultFIdP(fidp);
        const clientId = globalState.get(StateHolder.CONFIG).idp.clientId;
        const params = {
            response_type: "code",
            nonce: "auth",
            scope: "openid",
            client_id: clientId,
            redirect_uri: window.location.href
        };
        params.fidp = fidp;
        const authEndpoint = `${globalState.get(StateHolder.CONFIG).idp.url}${AuthUtils.AUTHORIZATION_ENDPOINT}`;
        window.location.assign(`${authEndpoint}${HttpUtils.generateQueryParamString(params)}`);
    }

    /**
     * Continue the login flow.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {string} sessionDataKey The session data key of the login flow to continue
     * @param {boolean} skipOrgCheck Whether to skip checking organization
     */
    static continueLoginFlow(globalState, sessionDataKey, skipOrgCheck) {
        const params = {
            sessionDataKey: sessionDataKey,
            skipOrgCreation: skipOrgCheck
        };
        const authEndpoint = `${globalState.get(StateHolder.CONFIG).idp.url}${AuthUtils.COMMON_AUTH_ENDPOINT}`;
        window.location.assign(`${authEndpoint}${HttpUtils.generateQueryParamString(params)}`);
    }

    /**
     * Requests the API backend for tokens in exchange for authorization code.
     *
     * @param {string} authCode The one time Authorization code given by the IDP.
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {Function} [onSuccess] The callback to be called after retrieving taokens
     */
    static retrieveTokens(authCode, globalState, onSuccess) {
        HttpUtils.callOpenAPI(
            {
                url: `/auth/tokens/${authCode}`,
                method: "GET"
            },
            globalState
        ).then((resp) => {
            const decodedToken = jwtDecode(resp.idToken);
            const user = {
                username: decodedToken.sub,
                accessToken: resp.accessToken,
                idToken: resp.idToken
            };
            AuthUtils.updateUser(user, globalState);
            if (onSuccess) {
                onSuccess();
            }
        }).catch(() => {
            NotificationUtils.showNotification(
                "Failed to authenticate",
                NotificationUtils.Levels.ERROR,
                globalState
            );
        });
    }

    /**
     * Sign out the current user.
     * The provided global state will be updated accordingly as well.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static signOut(globalState) {
        localStorage.removeItem(AuthUtils.USER_KEY);
        localStorage.removeItem(AuthUtils.FEDERATED_IDP_KEY);

        const params = {
            id_token_hint: globalState.get(StateHolder.USER).idToken,
            post_logout_redirect_uri: window.location.origin
        };
        const signOutEndpoint = `${globalState.get(StateHolder.CONFIG).idp.url}${AuthUtils.LOGOUT_ENDPOINT}`;
        window.location.assign(`${signOutEndpoint}${HttpUtils.generateQueryParamString(params)}`);
    }

    /**
     * Remove the stored user.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static removeUser(globalState) {
        localStorage.removeItem(AuthUtils.USER_KEY);
        globalState.unset(StateHolder.USER);
    }

    /**
     * Update the user stored in the browser.
     *
     * @private
     * @param {Object} user The user to be signed in
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static updateUser(user, globalState) {
        if (user.username) {
            localStorage.setItem(AuthUtils.USER_KEY, JSON.stringify(user));
            globalState.set(StateHolder.USER, user);
        } else {
            throw Error(`Username provided cannot be "${user.username}"`);
        }
    }

    /**
     * Set the default federated IdP to be used.
     *
     * @private
     * @param {FederatedIdPType} fidp The new federated IdP
     */
    static setDefaultFIdP(fidp) {
        localStorage.setItem(AuthUtils.FEDERATED_IDP_KEY, /** @type{string} **/ fidp);
    }

    /**
     * Get the default federated IdP.
     *
     * @returns {FederatedIdPType} The default federated IdP
     */
    static getDefaultFIdP() {
        return /** @type{FederatedIdPType} **/ localStorage.getItem(AuthUtils.FEDERATED_IDP_KEY);
    }

    /**
     * Get the currently authenticated user.
     *
     * @returns {string} The current user
     */
    static getAuthenticatedUser() {
        let user;
        try {
            user = JSON.parse(localStorage.getItem(AuthUtils.USER_KEY));
        } catch {
            user = null;
            localStorage.removeItem(AuthUtils.USER_KEY);
        }
        return user;
    }

}

export default AuthUtils;
