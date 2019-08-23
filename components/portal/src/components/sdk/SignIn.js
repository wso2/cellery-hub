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
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import HttpUtils from "../../utils/api/httpUtils";
import React from "react";
import StateHolder from "../common/state/stateHolder";
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
    },
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

class SignIn extends React.Component {

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
                AuthUtils.initiateSdkLoginFlow(globalState, params.redirectUrl);
            } else if (params.code) {
                const oneTimeToken = params.code;
                AuthUtils.retrieveTokens(oneTimeToken, globalState, () => {
                    params.code = null;
                    history.replace(`${location.pathname}${HttpUtils.generateQueryParamString(params)}`);
                    AuthUtils.initiateSdkLoginFlow(globalState, params.redirectUrl);
                });
            } else {
                sessionStorage.setItem(SignIn.REDIRECT_URL, params.redirectUrl);
                AuthUtils.initiateHubLoginFlow(globalState);
            }
        } else if (sessionStorage.getItem(SignIn.REDIRECT_URL)) {
            params.redirectUrl = sessionStorage.getItem(SignIn.REDIRECT_URL);
            history.replace(`${location.pathname}${HttpUtils.generateQueryParamString(params)}`);
            sessionStorage.removeItem(SignIn.REDIRECT_URL);
        } else {
            this.handleInvalidState();
        }
    }

    handleInvalidState = () => {
        const {history} = this.props;
        history.replace("/");
    };

    render() {
        const {classes} = this.props;
        return (
            <Grid container justify={"center"} alignItems={"center"} className={classes.centerContainer}>
                <Grid item><CircularProgress/></Grid>
                <Grid item>&nbsp;Signing In</Grid>
            </Grid>
        );
    }

}

SignIn.propTypes = {
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }).isRequired,
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired
};

export default withStyles(styles)(withGlobalState(SignIn));
