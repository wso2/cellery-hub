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

import AppLayout from "./appLayout";
import ErrorBoundary from "../common/error/ErrorBoundary";
import FederatedIdpSelect from "./FederatedIdpSelect";
import HttpUtils from "../../utils/api/httpUtils";
import NotFound from "../common/error/NotFound";
import OrgCreate from "./OrgCreate";
import React from "react";
import SignIn from "../SignIn";
import SignInSuccess from "./SignInSuccess";
import {Route, Switch} from "react-router-dom";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

class StatelessProtectedSDKPortal extends React.Component {

    static SESSION_DATA_KEY = "sdkSignInSessionDataKey";

    constructor(props) {
        super(props);
        this.state = {
            user: props.globalState.get(StateHolder.USER)
        };
        props.globalState.addListener(StateHolder.USER, this.handleUserChange);
    }

    handleUserChange = (key, oldValue, newValue) => {
        this.setState({
            user: newValue
        });
    };

    render = () => {
        const {location, match, history} = this.props;
        const {user} = this.state;
        const params = HttpUtils.parseQueryParams(location.search);
        let view;
        if (user) {
            const sessionDataKey = sessionStorage.getItem(SDK.SESSION_DATA_KEY);
            if (sessionDataKey) {
                params.sessionDataKey = sessionDataKey;
                history.replace(`${location.pathname}${HttpUtils.generateQueryParamString(params)}`);
                sessionStorage.removeItem(SDK.SESSION_DATA_KEY);
            }
            view = (
                <Switch>
                    <Route exact path={`${match.path}/org-create`} component={OrgCreate}/>
                    <Route exact path={`${match.path}/auth-success`} component={SignInSuccess}/>
                    <Route render={(props) => <NotFound {...props} showNavigationButtons={true}/>}/>
                </Switch>
            );
        } else {
            if (params.sessionDataKey) {
                sessionStorage.setItem(SDK.SESSION_DATA_KEY, params.sessionDataKey);
            }
            view = <SignIn/>;
        }
        return view;
    }

}

StatelessProtectedSDKPortal.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder)
};

const ProtectedSDKPortal = withGlobalState(StatelessProtectedSDKPortal);

const SDK = ({match}) => (
    <AppLayout>
        <ErrorBoundary>
            <Switch>
                <Route exact path={`${match.path}/fidp-select`} component={FederatedIdpSelect}/>
                <Route component={ProtectedSDKPortal}/>
            </Switch>
        </ErrorBoundary>
    </AppLayout>
);

SDK.propTypes = {
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired
};

export default SDK;
