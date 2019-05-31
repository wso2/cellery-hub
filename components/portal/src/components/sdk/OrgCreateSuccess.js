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

import Link from "@material-ui/core/Link";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    success: {
        paddingTop: theme.spacing(2),
        fontWeight: 300
    },
    gotoHub: {
        fontWeight: 400,
        paddingTop: theme.spacing(2),
        fontSize: 18
    }

});

const OrgCreateSuccess = (props) => {
    const {classes} = props;

    return (
        <div className={classes.content}>
            <Typography component="div" variant="h5" className={classes.success}>
                You are now authenticated with Cellery SDK!
            </Typography>
            <Typography component="div" className={classes.gotoHub}> You can go to&nbsp;
                <Link target="_blank" href="http://hub.cellery.io">Cellery Hub</Link> to manage your organizations and
                Cell images.
            </Typography>
        </div>
    );
};

OrgCreateSuccess.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(OrgCreateSuccess);
