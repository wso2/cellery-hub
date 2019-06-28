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

import CelleryCmd from "../../img/celleryCmd.png";
import ErrorOutlineRounded from "@material-ui/icons/ErrorOutlineRounded";
import Grid from "@material-ui/core/Grid";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    success: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(4)
    },
    gotoHub: {
        fontWeight: 400,
        paddingTop: theme.spacing(2),
        color: "#464646",
        textAlign: "center"
    },
    hubUrl: {
        color: "#464646",
        textDecoration: "underline"
    },
    celleryCmd: {
        height: 85,
        paddingTop: theme.spacing(2)
    },
    error: {
        paddingTop: theme.spacing(2),
        color: "#e74c3c",
        fontSize: "3.8rem"
    },
    nextTitle: {
        color: "#464646"
    }
});

const SignInFailure = (props) => {
    const {classes, globalState} = props;
    return (
        <div className={classes.content}>
            <Grid container justify={"center"} direction={"column"} alignContent={"center"} alignItems={"center"}>
                <ErrorOutlineRounded className={classes.error} fontSize={"large"}/>
                <Typography component={"div"} variant={"h5"} className={classes.success}>
                    Authentication failure!
                </Typography>
                <Typography variant={"h6"} className={classes.nextTitle}>What to do next?</Typography>
                <img src={CelleryCmd} className={classes.celleryCmd} alt={"Cellery cmd"}/>
                <div className={classes.gotoHub}>
                    <Typography>
                        Go back to your terminal to know more information about the error and try login again.
                    </Typography>
                </div>

            </Grid>
        </div>
    );
};

SignInFailure.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withGlobalState(SignInFailure));
