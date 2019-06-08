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
import Home from "./home";
import Image from "./overview/image";
import ImageVersion from "./overview/image/ImageVersion";
import MyImages from "./myImages";
import MyOrgs from "./myOrgs";
import Org from "./overview/org";
import PortalExtras from "./PortalExtras";
import React from "react";
import SDK from "./sdk";
import SignIn from "./SignIn";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {MuiThemeProvider, createMuiTheme} from "@material-ui/core/styles";
import withGlobalState, {StateHolder, StateProvider} from "./common/state";

const HubPortal = withGlobalState(({globalState}) => {
    const isLoggedIn = Boolean(globalState.get(StateHolder.USER));
    return (
        <Switch>
            {
                isLoggedIn
                    ? null
                    : (
                        <React.Fragment>
                            <Route exact path={"/"} component={Home}/>
                            <Route exact path={"/sign-in"} render={() => <SignIn callbackRoute={"/"}/>}/>
                        </React.Fragment>
                    )
            }
            <Route path={"*"} render={() => (
                <AppLayout>
                    <ErrorBoundary showNavigationButtons={true}>
                        <Switch>
                            {
                                isLoggedIn
                                    ? (
                                        <React.Fragment>
                                            <Route exact path={["/", "/my-images"]} component={MyImages}/>
                                            <Route exact path={"/my-orgs"} component={MyOrgs}/>
                                        </React.Fragment>
                                    )
                                    : null
                            }
                            <Route exact path={"/explore"} component={Explore}/>
                            <Route exact path={"/orgs/:orgName"} component={Org}/>
                            <Route exact path={"/images/:orgName/:imageName"} component={Image}/>
                            <Route exact path={"/images/:orgName/:imageName/:versionNo"} component={ImageVersion}/>
                        </Switch>
                    </ErrorBoundary>
                </AppLayout>
            )}/>
        </Switch>
    );
});

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
                <StateProvider>
                    <PortalExtras/>
                    <Switch>
                        <Route path={"/sdk"} component={SDK}/>
                        <Route path={"/"} component={HubPortal}/>
                    </Switch>
                </StateProvider>
            </ErrorBoundary>
        </BrowserRouter>
    </MuiThemeProvider>
);

export default App;

