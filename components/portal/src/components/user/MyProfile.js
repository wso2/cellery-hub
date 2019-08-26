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

/* eslint max-lines: ["error", 600] */

import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Divider from "@material-ui/core/Divider";
import FileCopy from "@material-ui/icons/FileCopyOutlined";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import HelpOutline from "@material-ui/icons/HelpOutline";
import HttpUtils from "../../utils/api/httpUtils";
import IconButton from "@material-ui/core/IconButton/IconButton";
import Input from "@material-ui/core/Input";
import InputBase from "@material-ui/core/InputBase";
import NotFound from "../common/error/NotFound";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import RefreshRounded from "@material-ui/icons/RefreshRounded";
import StateHolder from "../common/state/stateHolder";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import Typography from "@material-ui/core/Typography";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
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
        padding: theme.spacing(1 / 2)

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
    },
    toggleTokenBtn: {
        borderColor: theme.palette.primary.main,
        marginBottom: theme.spacing(3),
        fontSize: 12
    },
    revokeBtn: {
        fontSize: 12,
        color: theme.palette.primary.main
    },
    deleteBtn: {
        color: "#e74c3c",
        borderColor: "#e74c3c",
        marginRight: theme.spacing(2)
    },
    actionBtnPanel: {
        marginBottom: theme.spacing(3)
    },
    dialogNote: {
        color: "#e74c3c",
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    hideTokenField: {
        opacity: 0.001,
        width: "1%"
    }
});

class MyProfile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: props.globalState.get(StateHolder.USER),
            isUserIdCopiedTooltipOpen: false,
            isTokenCopiedTooltipOpen: false,
            token: "",
            hide: true,
            isDialogOpen: false,
            hidePassword: true,
            tokenToBeRevoked: "",
            errorMessage: ""
        };

        this.tokenRef = React.createRef();
        this.userIdRef = React.createRef();
    }

    copyUserIdToClipboard = () => {
        if (this.userIdRef.current) {
            this.userIdRef.current.select();
            document.execCommand("copy");

            this.setState({
                isUserIdCopiedTooltipOpen: true
            });
        }
    };

    copyTokenToClipboard = () => {
        if (this.tokenRef.current) {
            this.tokenRef.current.select();
            document.execCommand("copy");

            this.setState({
                isTokenCopiedTooltipOpen: true
            });
        }
    };

    userIdCopiedTooltipClose = () => {
        this.setState({
            isUserIdCopiedTooltipOpen: false
        });
    };

    tokenCopiedTooltipClose = () => {
        this.setState({
            isTokenCopiedTooltipOpen: false
        });
    };

    generateToken = () => {
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

    toggleUserCredentials = () => {
        const {hide} = this.state;
        if (hide) {
            this.generateToken();
        }

        this.setState((prevState) => ({
            hide: !prevState.hide,
            hidePassword: true
        }));
    };

    handleConfirmDialogOpen = () => {
        this.setState({
            isDialogOpen: true
        });
    };

    handleConfirmDialogClose = () => {
        this.setState({
            isDialogOpen: false,
            tokenToBeRevoked: "",
            errorMessage: ""
        });
    };

    handleContinue = () => {
        const {globalState} = this.props;
        const {token} = this.state;
        const self = this;
        NotificationUtils.showLoadingOverlay("Revoking token", globalState);
        HttpUtils.callHubAPI(
            {
                url: "/auth/revoke",
                method: "POST",
                data: {
                    token: token
                }
            },
            globalState
        ).then(() => {
            self.handleConfirmDialogClose();
            self.toggleUserCredentials();
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch(() => {
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification("Error while revoking token.",
                NotificationUtils.Levels.ERROR, globalState);
        });
    };

    handleClickShowPassword = () => {
        this.setState((prevState) => ({
            hidePassword: !prevState.hidePassword
        }));
    };

    handleTokenInputChange = (event) => {
        const inputToken = event.currentTarget.value;
        const {token} = this.state;
        let errorMessage = "";

        if (inputToken !== token) {
            errorMessage = "Invalid Access Token";
        }
        this.setState({
            tokenToBeRevoked: inputToken,
            errorMessage: errorMessage
        });
    };

    render() {
        const {classes} = this.props;
        const {user, isTokenCopiedTooltipOpen, isUserIdCopiedTooltipOpen, token,
            isDialogOpen, hide, hidePassword, tokenToBeRevoked, errorMessage} = this.state;

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
                                        <Grid item xs={12} sm={7} md={7}>
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
                                        <Grid item xs={12} sm={5} md={5} className={classes.rightPanel}>
                                            <Button variant={"outlined"} className={classes.toggleTokenBtn}
                                                onClick={this.toggleUserCredentials} size={"small"}>
                                                {
                                                    hide
                                                        ? "Show"
                                                        : "Hide"
                                                }
                                                &nbsp;CLI Credentials
                                            </Button>
                                            {
                                                hide
                                                    ? null
                                                    : (
                                                        <React.Fragment>
                                                            <div className={"userID"}>
                                                                <Typography variant={"subtitle2"} color={"inherit"}
                                                                    className={classes.rightPanelSubTitle}>
                                                                    User ID
                                                                </Typography>
                                                                <Tooltip placement={"left"} title={"This can be used "
                                                                    + "as the username to perform CLI operations such "
                                                                    + "as login and  pull"}>
                                                                    <IconButton aria-label={"Command Help"}
                                                                        className={classes.helpIconBtn}>
                                                                        <HelpOutline className={classes.helpBtn}/>
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <div className={classes.copyContent}>
                                                                    <div className={classes.copyContainer}>
                                                                        <InputBase multiline inputRef={this.userIdRef}
                                                                            className={classes.copyInput}
                                                                            readOnly value={user.userId}
                                                                            inputProps={
                                                                                {
                                                                                    "aria-label": "naked",
                                                                                    spellCheck: "false"
                                                                                }
                                                                            }/>
                                                                        <Tooltip title={"Copied!"}
                                                                            disableFocusListener={false}
                                                                            disableHoverListener={false}
                                                                            placement={"top"}
                                                                            disableTouchListener={false}
                                                                            open={isUserIdCopiedTooltipOpen}
                                                                            onClose={this.userIdCopiedTooltipClose}>
                                                                            <IconButton color={"inherit"}
                                                                                className={classes.copyIconButton}
                                                                                aria-label={"Copy"}
                                                                                onClick={this.copyUserIdToClipboard}>
                                                                                <FileCopy className={classes.copy}/>
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {
                                                                token ? (
                                                                    <div className={"userToken"}>
                                                                        <Typography variant={"subtitle2"}
                                                                            color={"inherit"}
                                                                            className={classes.rightPanelSubTitle}>
                                                                            Access Token
                                                                        </Typography>
                                                                        <Tooltip title={"This token can be used "
                                                                            + "as the password to perform CLI "
                                                                            + "operations such as cellery login and "
                                                                            + "push"} placement={"left"}>
                                                                            <IconButton aria-label={"Command Help"}
                                                                                className={classes.helpIconBtn}>
                                                                                <HelpOutline
                                                                                    className={classes.helpBtn}/>
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <div className={classes.copyContent}>
                                                                            <div className={classes.copyContainer}>
                                                                                <InputBase readOnly
                                                                                    className={classes.copyInput}
                                                                                    value={token}
                                                                                    inputProps={{
                                                                                        ariaLabel: "naked",
                                                                                        spellCheck: "false",
                                                                                        type: hidePassword
                                                                                            ? "password"
                                                                                            : "text"
                                                                                    }}/>
                                                                                <InputBase inputRef={this.tokenRef}
                                                                                    value={token}
                                                                                    className={classes.hideTokenField}/>
                                                                                <IconButton color={"inherit"}
                                                                                    aria-label={"Toggle token"
                                                                                    + " visibility"}
                                                                                    className={classes.copyIconButton}
                                                                                    onClick={this
                                                                                        .handleClickShowPassword}>
                                                                                    {
                                                                                        hidePassword
                                                                                            ? <Visibility
                                                                                                className=
                                                                                                    {classes.copy}/>
                                                                                            : <VisibilityOff
                                                                                                className=
                                                                                                    {classes.copy}/>
                                                                                    }
                                                                                </IconButton>
                                                                                <Tooltip title={"Copied!"}
                                                                                    disableFocusListener={false}
                                                                                    disableHoverListener={false}
                                                                                    placement={"top"}
                                                                                    disableTouchListener={false}
                                                                                    open={isTokenCopiedTooltipOpen}
                                                                                    onClose={this
                                                                                        .tokenCopiedTooltipClose}>
                                                                                    <IconButton color={"inherit"}
                                                                                        className={classes
                                                                                            .copyIconButton}
                                                                                        aria-label={"Copy"}
                                                                                        onClick={this
                                                                                            .copyTokenToClipboard}>
                                                                                        <FileCopy
                                                                                            className={classes.copy}
                                                                                        />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            </div>
                                                                        </div>
                                                                        <Button variant={"outlined"}
                                                                            className={classes.revokeBtn}
                                                                            onClick={this.handleConfirmDialogOpen}>
                                                                            <RefreshRounded/> Revoke Token
                                                                        </Button>
                                                                    </div>
                                                                ) : null

                                                            }
                                                        </React.Fragment>
                                                    )
                                            }
                                        </Grid>
                                    </Grid>
                                    <Dialog open={isDialogOpen} onClose={this.handleConfirmDialogClose}
                                        aria-labelledby={"alert-dialog-title"}
                                        aria-describedby={"alert-dialog-description"}>
                                        <DialogTitle id={"alert-dialog-title"}>
                                            Do you really want to do this?
                                        </DialogTitle>
                                        <DialogContent>
                                            <DialogContentText id={"alert-dialog-description"}>
                                                If you revoke the token, CI/CD processes and CLI clients
                                                which are integrated using the token will <b>no longer be functioning
                                                </b>.
                                                <Typography variant={"subtitle2"} color={"inherit"}
                                                    className={classes.dialogNote}>
                                                    Please note that this action cannot be undone.
                                                </Typography>
                                                <FormControl fullWidth error={errorMessage}>
                                                    <Input value={tokenToBeRevoked} type={"text"}
                                                        placeholder={"Enter access token to be revoked"}
                                                        onChange={this.handleTokenInputChange}/>
                                                    {
                                                        errorMessage
                                                            ? <FormHelperText>{errorMessage}</FormHelperText>
                                                            : <FormHelperText>
                                                                Copy and paste the access token</FormHelperText>
                                                    }
                                                </FormControl>
                                            </DialogContentText>
                                        </DialogContent>
                                        <DialogActions className={classes.actionBtnPanel}>
                                            <Button color={"inherit"} onClick={this.handleConfirmDialogClose}>
                                                Cancel
                                            </Button>
                                            <Button variant={"outlined"} className={classes.deleteBtn} onClick={() => {
                                                this.handleContinue();
                                            }} size={"small"} disabled={!tokenToBeRevoked || errorMessage}>
                                                <RefreshRounded/> Revoke
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
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
