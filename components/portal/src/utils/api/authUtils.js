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

import HttpUtils from "./httpUtils";
import NotificationUtils from "../common/notificationUtils";
import {StateHolder} from "../../components/common/state";
import jwtDecode from "jwt-decode";

/**
 * Authentication/Authorization related utilities.
 */
class AuthUtils {

    static AUTHORIZATION_ENDPOINT = "/oauth2/authorize";

    /**
     * Redirects the user to IDP for authentication.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static initiateLoginFlow(globalState) {
        localStorage.removeItem(StateHolder.USER);
        globalState.unset(StateHolder.USER);
        HttpUtils.callOpenAPI(
            {
                url: "/auth/client-id",
                method: "GET"
            },
            globalState
        ).then((resp) => {
            window.location.href
                = `${globalState.get(StateHolder.CONFIG).idp.idpURL}${AuthUtils.AUTHORIZATION_ENDPOINT}`
                + `?response_type=code&nonce=auth&scope=openid&client_id=${resp}&`
                + `redirect_uri=${globalState.get(StateHolder.CONFIG).idp.callBackURL}`;
        }).catch(() => {
            NotificationUtils.showNotification(
                "Failed to redirect to IdP",
                NotificationUtils.Levels.ERROR,
                globalState
            );
        });
    }

    /**
     * Requests the API backend for tokens in exchange for authorization code.
     *
     * @param {string} authCode The one time Authorization code given by the IDP.
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static retrieveTokens(authCode, globalState) {
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
    static signOut = (globalState) => {
        const idToken = globalState.get(StateHolder.USER).idToken;
        localStorage.removeItem(StateHolder.USER);
        window.location.assign(`${globalState.get(StateHolder.CONFIG).idpURL}/oidc/logout?id_token_hint=`
            + `${idToken}&post_logout_redirect_uri=${window.location.origin}`);
    };

    /**
     * Update the user stored in the browser.
     *
     * @param {Object} user The user to be signed in
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static updateUser = (user, globalState) => {
        if (user.username) {
            localStorage.setItem(StateHolder.USER, JSON.stringify(user));
            globalState.set(StateHolder.USER, user);
        } else {
            throw Error(`Username provided cannot be "${user.username}"`);
        }
    };

    /**
     * Get the currently authenticated user.
     *
     * @returns {string} The current user
     */
    static getAuthenticatedUser = () => {
        let user;
        try {
            user = JSON.parse(localStorage.getItem(StateHolder.USER));
        } catch {
            user = null;
            localStorage.removeItem(StateHolder.USER);
        }
        return user;
    };

}

export default AuthUtils;
