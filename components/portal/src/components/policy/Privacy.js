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

import Divider from "@material-ui/core/Divider";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    divider: {
        marginBottom: theme.spacing(4)
    },
    body: {
        color: "#464646"
    },
    section: {
        marginBottom: theme.spacing(2)
    },
    bottomSpace: {
        height: 50
    }
});

const Privacy = (props) => {
    const {classes} = props;
    return (
        <div className={classes.content}>
            <Typography variant={"h5"} color={"inherit"}>
                Privacy Policy
            </Typography>
            <Divider className={classes.divider}/>
            <div className={classes.body} />
        </div>
    );
};

Privacy.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Privacy);
