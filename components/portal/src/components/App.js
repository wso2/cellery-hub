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
import OrgCreateSuccess from "./sdk/OrgCreateSuccess";
import React from "react";
import SDK from "./sdk";
import SDKAppLayout from "./sdk/SDKAppLayout";
import {StateProvider} from "./common/state";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {MuiThemeProvider, createMuiTheme} from "@material-ui/core/styles";

const Portal = () => {
    // TODO: Integrate user authentication.
    const isLoggedIn = false;
    const isSDK = true;

    if (isLoggedIn) {
        return (
            <AppLayout>
                <ErrorBoundary showNavigationButtons={true}>
                    <Switch>
                        <Route exact path={["/", "/my-images"]} component={MyImages}/>
                        <Route exact path={"/my-orgs"} component={MyOrgs}/>
                        <Route exact path={"/explore"} component={Explore}/>
                        <Route exact path={"/images/:orgName/:imageName"} component={Image}/>
                        <Route exact path={"/images/:orgName/:imageName/:versionNo"} component={ImageVersion}/>
                        <Route exact path={"/orgs/:orgName"} component={Org}/>
                    </Switch>
                </ErrorBoundary>
            </AppLayout>
        );
    } else if (isSDK) {
        return (
            <SDKAppLayout>
                <Switch>
                    <Route exact path={"/sdk"} component={SDK}/>
                    <Route exact path={"/sdk/success"} component={OrgCreateSuccess}/>
                </Switch>
            </SDKAppLayout>
        );
    }
    return <Home/>;
};


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
                    <Portal/>
                </StateProvider>
            </ErrorBoundary>
        </BrowserRouter>
    </MuiThemeProvider>
);

export default App;

