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

import DescriptionOutlined from "@material-ui/icons/DescriptionOutlined";
import Grid from "@material-ui/core/Grid";
import Markdown from "react-markdown";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import withGlobalState, {StateHolder} from "./state/index";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    noDescriptionMsgContainer: {
        textAlign: "center",
        paddingTop: theme.spacing(6),
        paddingBottom: theme.spacing(4)
    },
    descriptionIcon: {
        color: "#a0a0a0"
    },
    noDescriptionMsg: {
        fontWeight: 500,
        color: "#a0a0a0",
        paddingTop: theme.spacing(1)
    }
});

const VersionList = (props) => {
    const {classes, data} = props;

    return (
        <div className={classes.content}>
            <div className={classes.container}>
                {
                    data
                        ? (
                            <Grid container>
                                <Grid item xs={12} sm={12} md={12}>
                                    <Markdown source={data} />
                                </Grid>
                            </Grid>
                        )
                        : (
                            <div className={classes.noDescriptionMsgContainer}>
                                <DescriptionOutlined className={classes.descriptionIcon} fontSize={"large"}/>
                                <Typography component={"div"} className={classes.noDescriptionMsg}>
                                    No Description Found
                                </Typography>
                            </div>
                        )
                }
            </div>
        </div>
    );
};

VersionList.propTypes = {
    data: PropTypes.string,
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(VersionList)));
