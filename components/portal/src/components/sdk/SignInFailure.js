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

import CelleryError from "../../img/celleryError.jpg";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";
import * as React from "react";

const styles = (theme) => ({
    signInFailureContainer: {
        position: "relative",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        display: "grid"
    },
    signInFailure: {
        margin: "auto",
        textAlign: "center"
    },
    signInFailureImg: {
        marginTop: theme.spacing.unit * 5,
        height: 150
    },
    signInFailureTitle: {
        margin: theme.spacing.unit,
        fontSize: "1.5em",
        fontWeight: 400,
        color: "#6e6e6e"
    }
});

const SignInFailure = ({classes}) => (
    <div className={classes.signInFailureContainer}>
        <div className={classes.signInFailure}>
            <img src={CelleryError} className={classes.signInFailureImg} alt={"Sign In Failure"}/>
            <div className={classes.signInFailureTitle}>
                Failed to login. Please go back to the CLI for more details.
            </div>
        </div>
    </div>
);

SignInFailure.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SignInFailure);
