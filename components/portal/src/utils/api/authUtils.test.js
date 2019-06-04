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
import HttpUtils from "./httpUtils";
import {StateHolder} from "../../components/common/state";

describe("AuthUtils", () => {
    const username = "User1";
    const loggedInUser = {
        username: username,
        accessToken: "12345",
        idToken: "54321"
    };
    afterEach(() => {
        localStorage.removeItem(StateHolder.USER);
    });

    describe("updateUser()", () => {
        it("should set the username provided", () => {
            const stateHolder = new StateHolder();
            const spy = jest.spyOn(stateHolder, "set");
            AuthUtils.updateUser(loggedInUser, stateHolder);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(StateHolder.USER, loggedInUser);
            expect(localStorage.getItem(StateHolder.USER)).toBe(JSON.stringify(loggedInUser));
        });

        it("should not set a username and should throw and error", () => {
            const stateHolder = new StateHolder();
            const spy = jest.spyOn(stateHolder, "set");

            expect(() => AuthUtils.updateUser(null, stateHolder)).toThrow();
            expect(() => AuthUtils.updateUser(undefined, stateHolder)).toThrow();
            expect(() => AuthUtils.updateUser("", stateHolder)).toThrow();
            expect(spy).toHaveBeenCalledTimes(0);
            expect(spy).not.toHaveBeenCalled();
            expect(localStorage.getItem(StateHolder.USER)).toBeNull();
        });
    });

    describe("signOut()", () => {
        it("should unset the user in the state", () => {
            const stateHolder = new StateHolder();
            localStorage.setItem(StateHolder.USER, JSON.stringify(loggedInUser));
            stateHolder.state[StateHolder.USER] = {
                value: {...loggedInUser},
                listeners: []
            };
            stateHolder.state[StateHolder.CONFIG] = {
                value: {
                    hubApiUrl: "http://api.hub.cellery.io",
                    idp: {
                        url: "https://idp.hub.cellery.io",
                        clientId: "testclientid"
                    }
                },
                listener: []
            };
            jest.spyOn(window.location, "assign").mockImplementation((location) => {
                const params = {
                    id_token_hint: "54321",
                    post_logout_redirect_uri: window.location.origin
                };
                const endpoint = `${stateHolder.get(StateHolder.CONFIG).idp.url}${AuthUtils.LOGOUT_ENDPOINT}`;
                expect(location).toEqual(`${endpoint}${HttpUtils.generateQueryParamString(params)}`);
            });
            AuthUtils.signOut(stateHolder);
            expect(localStorage.getItem(StateHolder.USER)).toBeNull();
            window.location.assign.mockClear();
        });
    });

    describe("getAuthenticatedUser()", () => {
        localStorage.setItem(StateHolder.USER, JSON.stringify(loggedInUser));
        const user = AuthUtils.getAuthenticatedUser();

        expect(user).toEqual({...user});
    });
});
