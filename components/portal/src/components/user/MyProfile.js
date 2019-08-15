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

import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import FileCopy from "@material-ui/icons/FileCopyOutlined";
import Grid from "@material-ui/core/Grid";
import HelpOutline from "@material-ui/icons/HelpOutline";
import HttpUtils from "../../utils/api/httpUtils";
import IconButton from "@material-ui/core/IconButton/IconButton";
import InputBase from "@material-ui/core/InputBase";
import NotFound from "../common/error/NotFound";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import StateHolder from "../common/state/stateHolder";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import Typography from "@material-ui/core/Typography";
import withGlobalState from "../common/state/index";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    },
    orgsImage: {
        fontSize: 100,
        color: theme.palette.primary.main
    },
    description: {
        display: "block",
        color: "#464646",
        paddingBottom: theme.spacing(2),
        marginTop: theme.spacing(1)
    },
    title: {
        display: "inline-block"
    },
    orgName: {
        textTransform: "uppercase",
        color: "#ffffff"
    },
    avatarIcon: {
        width: "100%",
        height: "100%"
    },
    nameIcon: {
        width: 70,
        height: 70,
        backgroundColor: theme.palette.primary.main,
        color: "#ffffff"
    },
    rightPanel: {
        borderLeft: "1px solid #eee"
    },
    elementText: {
        paddingLeft: theme.spacing(1 / 2),
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        color: "#666666"
    },
    summary: {
        display: "block",
        color: "#464646",
        paddingBottom: theme.spacing(2)
    },
    stats: {
        display: "flex"
    },
    spaceLeft: {
        marginLeft: theme.spacing(4)
    },
    rightPanelSubTitle: {
        marginTop: theme.spacing(2),
        color: "#666666",
        fontSize: 12,
        display: "inline"
    },
    copyContainer: {
        display: "flex",
        color: "#ffffff",
        padding: theme.spacing(1)

    },
    copy: {
        fontSize: 16
    },
    copyInput: {
        flexGrow: 1,
        color: "#ffffff",
        fontSize: 13,
        marginLeft: Number(theme.spacing(1 / 2))
    },
    copyInputMultiline: {
        flexGrow: 1,
        color: "#ffffff",
        fontSize: 13
    },
    copyContent: {
        backgroundColor: "#445d6e",
        borderRadius: 5,
        paddingLeft: theme.spacing(1),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2)
    },
    rightPanelTitle: {
        display: "block",
        marginBottom: theme.spacing(1)
    },
    helpBtn: {
        display: "inline",
        width: 15,
        height: 15
    },
    helpIconBtn: {
        padding: 0,
        marginLeft: theme.spacing(1 / 2)
    }
});

class MyProfile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: props.globalState.get(StateHolder.USER),
            isTokenCopiedTooltipOpen: false,
            token: ""
        };

        this.tokenRef = React.createRef();
    }

    copyTokenToClipboard = () => {
        if (this.tokenRef.current) {
            this.tokenRef.current.select();
            document.execCommand("copy");

            this.setState({
                isTokenCopiedTooltipOpen: true
            });
        }
    };

    pullCmdCopiedTooltipClose = () => {
        this.setState({
            isTokenCopiedTooltipOpen: false
        });
    };

    componentDidMount = () => {
        const {globalState} = this.props;
        const self = this;
        NotificationUtils.showLoadingOverlay("Fetching token", globalState);
        HttpUtils.callHubAPI(
            {
                url: "/auth/token",
                method: "POST",
                data: {
                    jwt: globalState.get(StateHolder.USER).tokens.idToken
                }
            },
            globalState
        ).then((data) => {
            self.setState({
                token: data.accessToken
            });
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch(() => {
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification("Error while retrieving token.",
                NotificationUtils.Levels.ERROR, globalState);
        });
    };

    render() {
        const {classes} = this.props;
        const {user, isTokenCopiedTooltipOpen} = this.state;

        return (
            <React.Fragment>
                <div className={classes.content}>
                    <Typography variant={"h5"} color={"inherit"} className={classes.title}>
                        My Profile
                    </Typography>
                    <Divider/>
                    {
                        user
                            ? (
                                <div className={classes.container}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} sm={8} md={8}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={4} sm={2} md={2}>
                                                    {
                                                        user.avatarUrl
                                                            ? (
                                                                <Avatar alt={user.username} src={user.avatarUrl}
                                                                    className={classes.avatarIcon} />
                                                            )
                                                            : <Avatar alt={user.username} className={classes.nameIcon}>
                                                                {user.username.charAt(0)}
                                                            </Avatar>
                                                    }
                                                </Grid>
                                                <Grid item xs={8} sm={10} md={10}>
                                                    <Typography variant={"h6"} color={"inherit"}>
                                                        {user.username}
                                                    </Typography>
                                                    <Typography component={"div"} variant={"body1"}
                                                        color={"textSecondary"}>{user.email}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} sm={4} md={4} className={classes.rightPanel}>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.rightPanelSubTitle}>
                                                Access Token
                                            </Typography>
                                            <Tooltip title={"This token can be used to login from CLI without opening"
                                            + " a browser window"} placement={"left"}>
                                                <IconButton aria-label={"Command Help"} className={classes.helpIconBtn}>
                                                    <HelpOutline className={classes.helpBtn}/>
                                                </IconButton>
                                            </Tooltip>
                                            <div className={classes.copyContent}>
                                                <div className={classes.copyContainer}>
                                                    {/* TODO: Get long lived token to input value*/}
                                                    <InputBase multiline className={classes.copyInput} readOnly
                                                        value={this.state.token}
                                                        inputProps={{"aria-label": "naked", spellCheck: "false"}}
                                                        inputRef={this.tokenRef} />
                                                    <Tooltip title={"Copied!"} disableFocusListener={false}
                                                        disableHoverListener={false} placement={"top"}
                                                        disableTouchListener={false} open={isTokenCopiedTooltipOpen}
                                                        onClose={this.pullCmdCopiedTooltipClose}>
                                                        <IconButton color={"inherit"} className={classes.copyIconButton}
                                                            aria-label={"Copy"} onClick={this.copyTokenToClipboard}>
                                                            <FileCopy className={classes.copy}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </Grid>
                                    </Grid>
                                </div>
                            )
                            : <NotFound title={"Could not find user details"}/>
                    }
                </div>
            </React.Fragment>
        );
    }

}

MyProfile.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder)
};

export default withStyles(styles)(withRouter(withGlobalState(MyProfile)));
