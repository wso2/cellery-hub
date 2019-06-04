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

import ErrorBoundary from "../common/error/ErrorBoundary";
import FederatedIdpSelect from "./FederatedIdpSelect";
import React from "react";
import SDKAppLayout from "./sdkAppLayout";
import SDKOrgCreate from "./SDKOrgCreate";
import SDKSignInSuccess from "./SDKSignInSuccess";
import SignIn from "../SignIn";
import {Route, Switch} from "react-router-dom";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const SDK = ({match}) => (
    <SDKAppLayout>
        <ErrorBoundary>
            <Switch>
                <Route exact path={`${match.url}/fidp-select`} component={FederatedIdpSelect}/>
                <Route path={`${match.url}*`} component={ProtectedSDKPortal}/>
            </Switch>
        </ErrorBoundary>
    </SDKAppLayout>
);

SDK.propTypes = {
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired
};

const ProtectedSDKPortal = withGlobalState(({globalState, match}) => {
    const isLoggedIn = Boolean(globalState.get(StateHolder.USER));
    let view;
    if (isLoggedIn) {
        view = (
            <Switch>
                <Route exact path={`${match.url}/org-create`} component={SDKOrgCreate}/>
                <Route exact path={`${match.url}/auth-success`} component={SDKSignInSuccess}/>
            </Switch>
        );
    } else {
        view = <SignIn/>;
    }
    return view;
});

export default SDK;
