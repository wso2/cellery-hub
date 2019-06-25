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

import AuthUtils from "../../utils/api/authUtils";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import GithubLogo from "../../img/GithubLogo";
import GoogleLogo from "../../img/GoogleLogo";
import Grid from "@material-ui/core/Grid";
import HttpUtils from "../../utils/api/httpUtils";
import React from "react";
import StateHolder from "../common/state/stateHolder";
import Typography from "@material-ui/core/Typography";
import withGlobalState from "../common/state";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    leftIcon: {
        marginRight: theme.spacing(1)
    },
    signInBtn: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        borderColor: theme.palette.primary.main,
        textTransform: "none"
    },
    title: {
        marginBottom: theme.spacing(2),
        textAlign: "center"
    },
    signInContainer: {
        border: "1px solid #e0e0e0",
        borderRadius: 5,
        marginTop: theme.spacing(4)
    },
    divider: {
        marginBottom: theme.spacing(2)
    }
});

class FederatedIdpSelect extends React.Component {

    static REDIRECT_URL = "sdkSignInRedirectUrl";

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

    componentDidMount() {
        this.handleUpdate();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.handleUpdate();
    }

    handleUpdate() {
        const {history, globalState, location} = this.props;
        const {user} = this.state;

        const params = HttpUtils.parseQueryParams(location.search);
        if (params.redirectUrl) {
            if (user) {
                if (params.fidp) {
                    AuthUtils.initiateSdkLoginFlow(globalState, params.fidp, params.redirectUrl);
                } else if (AuthUtils.getDefaultFIdP()) {
                    AuthUtils.initiateSdkLoginFlow(globalState, null, params.redirectUrl);
                } else {
                    AuthUtils.removeUserFromBrowser();
                }
            } else if (params.code) {
                const oneTimeToken = params.code;
                AuthUtils.retrieveTokens(oneTimeToken, globalState, () => {
                    if (params.fidp) {
                        AuthUtils.initiateSdkLoginFlow(globalState, params.fidp, params.redirectUrl);
                    } else if (AuthUtils.getDefaultFIdP()) {
                        AuthUtils.initiateSdkLoginFlow(globalState, null, params.redirectUrl);
                    } else {
                        // Do nothing (waiting for user to select IdP to login)
                    }
                });
            } else {
                sessionStorage.setItem(FederatedIdpSelect.REDIRECT_URL, params.redirectUrl);
            }
        } else if (sessionStorage.getItem(FederatedIdpSelect.REDIRECT_URL)) {
            params.redirectUrl = sessionStorage.getItem(FederatedIdpSelect.REDIRECT_URL);
            history.replace(`${location.pathname}${HttpUtils.generateQueryParamString(params)}`);
            sessionStorage.removeItem(FederatedIdpSelect.REDIRECT_URL);
        } else {
            this.handleInvalidState();
        }
    }

    handleInvalidState = () => {
        const {history} = this.props;
        history.replace("/");
    };

    render() {
        const {classes, globalState, location} = this.props;
        const {user} = this.state;

        const params = HttpUtils.parseQueryParams(location.search);
        const fidp = params.fidp ? params.fidp : AuthUtils.getDefaultFIdP();
        return (
            !fidp && !user
                ? (
                    <div className={classes.content}>
                        <Grid container spacing={4} direction={"row"} justify={"center"} alignItems={"center"}>
                            <Grid item xs={12} sm={4} md={4} className={classes.signInContainer}>
                                <Typography component={"div"} variant={"h5"} className={classes.title}>
                                    Sign in
                                </Typography>
                                <Divider className={classes.divider}/>
                                <Button fullWidth variant={"outlined"} size={"large"} className={classes.signInBtn}
                                    onClick={() => {
                                        AuthUtils.initiateHubLoginFlow(globalState, AuthUtils.FederatedIdP.GITHUB);
                                    }}>
                                    <GithubLogo className={classes.leftIcon}/>
                                    Sign in with Github
                                </Button>
                                <Button fullWidth variant={"outlined"} size={"large"} className={classes.signInBtn}
                                    onClick={() => {
                                        AuthUtils.initiateHubLoginFlow(globalState, AuthUtils.FederatedIdP.GOOGLE);
                                    }}>
                                    <GoogleLogo className={classes.leftIcon}/>
                                    Sign in with Google
                                </Button>
                            </Grid>
                        </Grid>
                    </div>
                )
                : null
        );
    }

}

FederatedIdpSelect.propTypes = {
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }).isRequired,
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired
};

export default withStyles(styles)(withGlobalState(FederatedIdpSelect));
