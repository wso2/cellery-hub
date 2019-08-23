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
import NotFound from "../common/error/NotFound";
import OrgCreate from "./OrgCreate";
import React from "react";
import SignIn from "./SignIn";
import SignInFailure from "./SignInFailure";
import SignInRequired from "../common/error/SignInRequired";
import SignInSuccess from "./SignInSuccess";
import {withStyles} from "@material-ui/core/styles";
import {Route, Switch} from "react-router-dom";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

class StatelessProtectedSDKPortal extends React.Component {

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
        const {match} = this.props;
        const {user} = this.state;
        let view;
        if (user) {
            view = (
                <Switch>
                    <Route exact path={`${match.path}/org-create`} component={OrgCreate}/>
                    <Route exact path={`${match.path}/auth-success`} component={SignInSuccess}/>
                    <Route exact path={`${match.path}/auth-failure`} component={SignInFailure}/>
                    <Route render={(props) => <NotFound {...props} showNavigationButtons={true}/>}/>
                </Switch>
            );
        } else {
            view = <SignInRequired/>;
        }
        return view;
    }

}

StatelessProtectedSDKPortal.propTypes = {
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder)
};

const ProtectedSDKPortal = withGlobalState(StatelessProtectedSDKPortal);

const styles = () => ({
    centerContainer: {
        position: "absolute",
        margin: "auto",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "200px",
        height: "100px",
        verticalAlign: "middle"
    }
});

const SDK = ({match}) => (
    <AppLayout>
        <ErrorBoundary>
            <Switch>
                {/* TODO: Remove "/fidp-select" route after releasing 0.4.0 SDK */}
                <Route exact path={[`${match.path}/fidp-select`, `${match.path}/sign-in`]} component={SignIn}/>
                <Route component={ProtectedSDKPortal}/>
            </Switch>
        </ErrorBoundary>
    </AppLayout>
);

SDK.propTypes = {
    classes: PropTypes.object.isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        search: PropTypes.object.isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }).isRequired,
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired
};

export default withStyles(styles)(SDK);
