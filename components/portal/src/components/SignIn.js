/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import AuthUtils from "../utils/api/authUtils";
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid/Grid";
import HttpUtils from "../utils/api/httpUtils";
import React from "react";
import {withRouter} from "react-router-dom";
import withStyles from "@material-ui/core/styles/withStyles";
import withGlobalState, {StateHolder} from "./common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    layout: {
        width: "auto",
        display: "block", // Fix IE 11 issue.
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(400 + (theme.spacing.unit * 3 * 2))]: {
            width: 400,
            marginLeft: "auto",
            marginRight: "auto"
        }
    },
    paper: {
        marginTop: theme.spacing.unit * 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`
    },
    heading: {
        margin: theme.spacing.unit,
        paddingTop: theme.spacing.unit * 2
    },
    form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing.unit
    },
    submit: {
        marginTop: theme.spacing.unit * 3
    },
    centerContainer: {
        position: "absolute",
        margin: "auto",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "200px",
        height: "100px"
    }
});

class SignIn extends React.Component {

    static CALLBACK = "signInComponentCallback";

    componentDidMount() {
        const {defaultCallback, globalState, history, location} = this.props;
        const searchParams = HttpUtils.parseQueryParams(location.search);
        if (searchParams.code) {
            const oneTimeToken = searchParams.code;
            AuthUtils.retrieveTokens(oneTimeToken, globalState, () => {
                searchParams.code = null;
                history.replace(`${location.pathname}${HttpUtils.generateQueryParamString(searchParams)}`);

                if (sessionStorage.getItem(SignIn.CALLBACK)) {
                    const callback = sessionStorage.getItem(SignIn.CALLBACK);
                    sessionStorage.removeItem(SignIn.CALLBACK);
                    history.replace(callback);
                } else if (defaultCallback) {
                    history.replace(defaultCallback);
                }
            });
        } else {
            if (searchParams.callback) {
                sessionStorage.setItem(SignIn.CALLBACK, searchParams.callback);
            }
            AuthUtils.initiateHubLoginFlow(globalState, searchParams.fidp);
        }
    }

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
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }),
    defaultCallback: PropTypes.string
};

export default withRouter(withStyles(styles)(withGlobalState(SignIn)));
