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

import "typeface-roboto";
import AppLayout from "./appLayout";
import CssBaseline from "@material-ui/core/CssBaseline/CssBaseline";
import ErrorBoundary from "./common/error/ErrorBoundary";
import Explore from "./explore";
import Home from "./Home";
import Image from "./image";
import ImageVersion from "./image/ImageVersion";
import MyImages from "./user/MyImages";
import MyOrgs from "./user/MyOrgs";
import NotFound from "./common/error/NotFound";
import NotificationAdditions from "./common/NotificationAdditions";
import Org from "./org";
import React from "react";
import RequirementsValidator from "./RequirementsValidator";
import SDK from "./sdk";
import SignIn from "./SignIn";
import SignInRequired from "./common/error/SignInRequired";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {MuiThemeProvider, createMuiTheme} from "@material-ui/core/styles";
import withGlobalState, {StateHolder, StateProvider} from "./common/state";
import * as PropTypes from "prop-types";

class GlobalStatelessHubPortal extends React.Component {

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

    render() {
        const {user} = this.state;
        const commonRoutes = [
            <Route key={0} exact path={"/explore"} component={Explore}/>,
            <Route key={1} exact path={"/orgs/:orgName"} component={Org}/>,
            <Route key={2} exact path={"/images/:orgName/:imageName"} component={Image}/>,
            <Route key={3} exact path={"/images/:orgName/:imageName/:version"} component={ImageVersion}/>
        ];
        const notFoundRoute = <Route render={(props) => <NotFound {...props} showNavigationButtons={true}/>}/>;

        let view;
        if (user) {
            view = (
                <AppLayout>
                    <ErrorBoundary showNavigationButtons={true}>
                        <Switch>
                            <Route exact path={["/", "/my-images"]} component={MyImages}/>
                            <Route exact path={"/my-orgs"} component={MyOrgs}/>
                            {[...commonRoutes, notFoundRoute]}
                        </Switch>
                    </ErrorBoundary>
                </AppLayout>
            );
        } else {
            view = (
                <Switch>
                    <Route exact path={"/"} component={Home}/>
                    <Route exact path={"/sign-in"} render={() => <SignIn defaultCallback={"/"}/>}/>
                    <Route render={() => (
                        <AppLayout>
                            <ErrorBoundary showNavigationButtons={true}>
                                <Switch>
                                    <Route exact path={["/my-images", "/my-orgs"]} component={SignInRequired}/>
                                    {[...commonRoutes, notFoundRoute]}
                                </Switch>
                            </ErrorBoundary>
                        </AppLayout>
                    )}/>
                </Switch>
            );
        }
        return view;
    }

}

GlobalStatelessHubPortal.propTypes = {
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

const HubPortal = withGlobalState(GlobalStatelessHubPortal);

// Create the main theme of the App
const theme = createMuiTheme({
    typography: {
        useNextVariants: true
    },
    palette: {
        primary: {
            light: "#E5EAEA",
            main: "#69b26d",
            contrastText: "#FFF"
        },
        secondary: {
            main: "#57595d"
        }
    }
});

/**
 * The Hub Main App.
 *
 * @returns {React.Component} App react component
 */
const App = () => (
    <MuiThemeProvider theme={theme}>
        <CssBaseline/>
        <BrowserRouter>
            <ErrorBoundary showNavigationButtons={true}>
                <RequirementsValidator>
                    <StateProvider>
                        <NotificationAdditions/>
                        <Switch>
                            <Route path={"/sdk"} component={SDK}/>
                            <Route component={HubPortal}/>
                        </Switch>
                    </StateProvider>
                </RequirementsValidator>
            </ErrorBoundary>
        </BrowserRouter>
    </MuiThemeProvider>
);

export default App;

