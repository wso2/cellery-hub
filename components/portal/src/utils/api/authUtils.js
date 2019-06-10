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
import * as moment from "moment";

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
     * Redirect the user to IDP for Hub authentication.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {FederatedIdPType} [fidp] The federated idp to be used
     */
    static initiateHubLoginFlow(globalState, fidp) {
        const clientId = globalState.get(StateHolder.CONFIG).idp.hubClientId;
        this.initiateLoginFlow(globalState, fidp, clientId, window.location.href.split("?")[0]);
    }

    /**
     * Redirect the user to IDP for SDK authentication.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {FederatedIdPType} [fidp] The federated idp to be used
     * @param {string} redirectUrl The URL to redirect back to
     */
    static initiateSdkLoginFlow(globalState, fidp, redirectUrl) {
        const clientId = globalState.get(StateHolder.CONFIG).idp.sdkClientId;
        this.initiateLoginFlow(globalState, fidp, clientId, redirectUrl);
    }

    /**
     * Redirect the user to IDP for authentication.
     *
     * @private
     * @param {StateHolder} globalState The global state provided to the current component
     * @param {FederatedIdPType} [fidp] The federated idp to be used
     * @param {string} clientId The client ID to be used
     * @param {string} redirectUrl The URL to redirect back to
     */
    static initiateLoginFlow(globalState, fidp, clientId, redirectUrl) {
        AuthUtils.setDefaultFIdP(fidp);
        const params = {
            response_type: "code",
            nonce: "auth",
            scope: "openid",
            client_id: clientId,
            redirect_uri: redirectUrl,
            fidp: fidp
        };
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
        const searchParams = {
            authCode: authCode,
            callbackUrl: window.location.href.split("?")[0]
        };
        HttpUtils.callHubAPI(
            {
                url: `/auth/token${HttpUtils.generateQueryParamString(searchParams)}`,
                method: "GET"
            },
            globalState
        ).then((resp) => {
            const decodedToken = jwtDecode(resp.idToken);
            let name = decodedToken.name;
            if (!name) {
                name = decodedToken.email.split("@")[0];
            }
            let avatarUrl = decodedToken.avatar_url;
            if (!avatarUrl) {
                avatarUrl = decodedToken.google_pic_url;
            }
            const user = {
                userId: decodedToken.sub,
                username: name,
                email: decodedToken.email,
                avatarUrl: avatarUrl,
                tokens: {
                    accessToken: resp.accessToken,
                    idToken: resp.idToken,
                    expirationTime: decodedToken.exp * 1000
                }
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
            id_token_hint: globalState.get(StateHolder.USER).tokens.idToken,
            post_logout_redirect_uri: `${window.location.origin}/`
        };
        const signOutEndpoint = `${globalState.get(StateHolder.CONFIG).idp.url}${AuthUtils.LOGOUT_ENDPOINT}`;
        window.location.assign(`${signOutEndpoint}${HttpUtils.generateQueryParamString(params)}`);
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
     * Remove the stored user from local storage.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static removeUserFromStorageOnly(globalState) {
        localStorage.removeItem(AuthUtils.USER_KEY);
    }

    /**
     * Update the user stored in the browser.
     *
     * @private
     * @param {Object} user The user to be signed in
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static updateUser(user, globalState) {
        localStorage.setItem(AuthUtils.USER_KEY, JSON.stringify(user));
        globalState.set(StateHolder.USER, user);
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
            if (user && user.tokens && user.tokens.expirationTime
                    && moment().valueOf() > user.tokens.expirationTime) {
                // Removing expired user login data
                user = null;
                localStorage.removeItem(AuthUtils.USER_KEY);
            }
        } catch {
            user = null;
            localStorage.removeItem(AuthUtils.USER_KEY);
        }
        return user;
    }

}

export default AuthUtils;
