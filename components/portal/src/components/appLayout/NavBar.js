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

import AccountCircle from "@material-ui/core/SvgIcon/SvgIcon";
import AuthUtils from "../../utils/api/authUtils";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import ButtonAppBarCollapse from "./ButtonAppBarCollapse";
import Divider from "@material-ui/core/Divider";
import GithubLogo from "../../img/GithubLogo";
import GoogleLogo from "../../img/GoogleLogo";
import HttpUtils from "../../utils/api/httpUtils";
import Link from "@material-ui/core/Link";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Typography from "@material-ui/core/Typography";
import classNames from "classnames";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    navButton: {
        "&:hover": {
            backgroundColor: "transparent",
            color: "#57595d"
        },
        "&:focus": {
            backgroundColor: "transparent"
        },
        "&:active": {
            backgroundColor: "transparent"
        }
    },
    navButtonCollapse: {
        display: "block",
        padding: "6px 16px"
    },
    usernameBtn: {
        textTransform: "none",
        display: "inline-flex",
        color: "#57595d"
    },
    leftIcon: {
        marginRight: theme.spacing(1)
    },
    buttonBar: {
        [theme.breakpoints.down("xs")]: {
            display: "none"
        },
        margin: 10,
        paddingLeft: theme.spacing(2),
        right: 0,
        position: "relative",
        width: "100%",
        background: "transparent"
    },
    root: {
        position: "absolute",
        right: 0
    },
    docMenuItem: {
        padding: 0
    },
    docLink: {
        textDecoration: "none",
        color: "#000000",
        width: "100%",
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        "&:hover": {
            textDecoration: "none",
            color: "#000000"
        }
    },
    userMenuItem: {
        pointerEvents: "none"
    },
    logoutMenuItem: {
        paddingLeft: theme.spacing(4)
    }
});

class NavBar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            accountPopoverElement: null,
            user: props.globalState.get(StateHolder.USER)
        };
        props.globalState.addListener(StateHolder.USER, this.handleUserChange);
    }

    handleUserChange = (key, oldValue, newValue) => {
        this.setState({
            user: newValue
        });
    };

    handleAccountPopoverOpen = (event) => {
        this.setState({
            accountPopoverElement: event.currentTarget
        });
    };

    handleAccountPopoverClose = () => {
        this.setState({
            accountPopoverElement: null
        });
    };

    handleDocsPopoverOpen = (event) => {
        this.setState({
            docsPopoverElement: event.currentTarget
        });
    };

    handleDocsPopoverClose = () => {
        this.setState({
            docsPopoverElement: null
        });
    };

    handleNavItemClick = (path) => {
        const {history} = this.props;
        history.push(path);
    };

    /**
     * @typedef {AuthUtils.FederatedIdP.GOOGLE|AuthUtils.FederatedIdP.GITHUB} FederatedIdPType
     */

    /**
     * Handle sign-in to Cellery Hub.
     *
     * @param {FederatedIdPType} fidp The federated IdP to be used
     */
    handleSignIn = (fidp) => {
        const {history, location} = this.props;
        const search = HttpUtils.generateQueryParamString({
            fidp: fidp,
            callback: location.pathname + location.search
        });
        history.push(`/sign-in${search}`);
    };

    render() {
        const {classes, globalState} = this.props;
        const {accountPopoverElement, docsPopoverElement, user} = this.state;

        const isAccountPopoverOpen = Boolean(accountPopoverElement);
        const isDocsPopoverOpen = Boolean(docsPopoverElement);
        const pages = [
            "/my-images",
            "/my-orgs",
            "/explore"
        ];

        return (
            <div className={classes.root}>
                <ButtonAppBarCollapse>
                    {
                        user
                            ? (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        onClick={() => this.handleNavItemClick(pages[0])}
                                        className={classNames(classes.navButton, classes.navButtonCollapse)}>
                                        My Images
                                    </Button>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        onClick={() => this.handleNavItemClick(pages[1])}
                                        className={classNames(classes.navButton, classes.navButtonCollapse)}>
                                        My Organizations
                                    </Button>
                                </React.Fragment>
                            )
                            : null
                    }
                    <Button disableTouchRipple={true} color={"inherit"}
                        onClick={() => this.handleNavItemClick(pages[2])}
                        className={classNames(classes.navButton, classes.navButtonCollapse)}>
                        Explore
                    </Button>
                    <React.Fragment>
                        <Button disableTouchRipple={true} color={"inherit"} ria-haspopup={"true"}
                            onClick={this.handleDocsPopoverOpen}
                            className={classNames(classes.navButton, classes.navButtonCollapse)}>
                            Docs</Button>
                        <Menu id={"user-info"} anchorEl={docsPopoverElement}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right"
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right"
                            }}
                            open={isDocsPopoverOpen}
                            onClose={this.handleDocsPopoverClose}>
                            <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                                <Link href={"https://github.com/wso2-cellery/sdk/blob/master/README.md"}
                                    target={"_blank"} className={classes.docLink}>Get stared with Cellery</Link>
                            </MenuItem>
                            <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                                <Link href={"https://github.com/wso2-cellery/sdk/blob/master/docs/cell-reference.md"}
                                    target={"_blank"} className={classes.docLink}>How to code cell</Link>
                            </MenuItem>
                            <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                                <Link href={"https://github.com/wso2-cellery/sdk/blob/master/docs/cli-reference.md"}
                                    target={"_blank"} className={classes.docLink}>How to use the CLI</Link>
                            </MenuItem>
                        </Menu>
                    </React.Fragment>
                    {
                        user
                            ? (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        className={classNames(classes.usernameBtn, classes.navButtonCollapse,
                                            classes.navButton)}
                                        aria-haspopup={"true"} onClick={this.handleAccountPopoverOpen}>
                                        {
                                            user.avatarUrl
                                                ? (
                                                    <Avatar alt={user.username} src={user.avatarUrl}
                                                        className={classes.leftIcon} />
                                                )
                                                : <AccountCircle className={classes.leftIcon}/>
                                        }
                                        {user.username.split(" ")[0]}
                                    </Button>
                                    <Menu id={"user-info"} anchorEl={accountPopoverElement}
                                        anchorOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        open={isAccountPopoverOpen}
                                        onClose={this.handleAccountPopoverClose}>
                                        {
                                            user
                                                ? (
                                                    <React.Fragment>
                                                        <MenuItem onClick={(e) => e.stopPropagation()}
                                                            className={classes.userMenuItem}>
                                                            <ListItem alignItems={"flex-start"}>
                                                                <ListItemAvatar>
                                                                    <Avatar alt={user.username} src={user.avatarUrl} />
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={user.username}
                                                                    secondary={
                                                                        <React.Fragment>
                                                                            <Typography component={"div"}
                                                                                variant={"body2"}
                                                                                color={"textSecondary"}>
                                                                                {user.email}
                                                                            </Typography>
                                                                        </React.Fragment>
                                                                    }
                                                                />
                                                            </ListItem>
                                                        </MenuItem>
                                                        <Divider/>
                                                        <MenuItem onClick={() => AuthUtils.signOut(globalState)}
                                                            className={classes.logoutMenuItem}>
                                                            <ListItemText primary={"Logout"}/>
                                                        </MenuItem>
                                                    </React.Fragment>
                                                )
                                                : null
                                        }
                                    </Menu>
                                </React.Fragment>
                            )
                            : (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"} aria-haspopup={"true"}
                                        onClick={this.handleAccountPopoverOpen}
                                        className={classNames(classes.navButton, classes.navButtonCollapse)}>
                                        SIGN IN/ SIGN UP</Button>
                                    <Menu id={"user-info-appbar"} anchorEl={accountPopoverElement}
                                        anchorOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        open={isAccountPopoverOpen}
                                        onClose={this.handleAccountPopoverClose}>
                                        <MenuItem onClick={() => {
                                            this.handleSignIn(AuthUtils.FederatedIdP.GITHUB);
                                            this.handleAccountPopoverClose();
                                        }}>
                                            <GithubLogo className={classes.leftIcon}/> Github
                                        </MenuItem>
                                        <MenuItem onClick={() => {
                                            this.handleSignIn(AuthUtils.FederatedIdP.GOOGLE);
                                            this.handleAccountPopoverClose();
                                        }}>
                                            <GoogleLogo className={classes.leftIcon}/> Google
                                        </MenuItem>
                                    </Menu>
                                </React.Fragment>
                            )
                    }
                </ButtonAppBarCollapse>
                <div className={classes.buttonBar} id={"appbar-collapse"}>
                    {
                        user
                            ? (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        onClick={() => this.handleNavItemClick(pages[0])} className={classes.navButton}>
                                        My Images
                                    </Button>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        onClick={() => this.handleNavItemClick(pages[1])} className={classes.navButton}>
                                        My Organizations
                                    </Button>
                                </React.Fragment>
                            )
                            : null
                    }
                    <Button disableTouchRipple={true} color={"inherit"} className={classes.navButton}
                        onClick={() => this.handleNavItemClick(pages[2])}>Explore
                    </Button>
                    <Button disableTouchRipple={true} color={"inherit"}
                        className={classes.navButton} ria-haspopup={"true"}
                        onClick={this.handleDocsPopoverOpen}>Docs</Button>
                    <Menu id={"user-info"} anchorEl={docsPopoverElement}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "right"
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right"
                        }}
                        open={isDocsPopoverOpen}
                        onClose={this.handleDocsPopoverClose}>
                        <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                            <Link href={"https://github.com/wso2-cellery/sdk/blob/master/README.md"}
                                target={"_blank"} className={classes.docLink}>Get stared with Cellery</Link>
                        </MenuItem>
                        <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                            <Link href={"https://github.com/wso2-cellery/sdk/blob/master/docs/cell-reference.md"}
                                target={"_blank"} className={classes.docLink}>How to code cell</Link>
                        </MenuItem>
                        <MenuItem onClick={this.handleDocsPopoverClose} className={classes.docMenuItem}>
                            <Link href={"https://github.com/wso2-cellery/sdk/blob/master/docs/cli-reference.md"}
                                target={"_blank"} className={classes.docLink}>How to use the CLI</Link>
                        </MenuItem>
                    </Menu>
                    {
                        user
                            ? (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        className={classNames(classes.usernameBtn, classes.navButton)}
                                        aria-haspopup={"true"} onClick={this.handleAccountPopoverOpen}>
                                        {
                                            user.avatarUrl
                                                ? (
                                                    <Avatar alt={user.username} src={user.avatarUrl}
                                                        className={classes.leftIcon} />
                                                )
                                                : <AccountCircle className={classes.leftIcon}/>
                                        }
                                        {user.username.split(" ")[0]}
                                    </Button>
                                    <Menu id={"user-info"} anchorEl={accountPopoverElement}
                                        anchorOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        open={isAccountPopoverOpen}
                                        onClose={this.handleAccountPopoverClose}>
                                        {
                                            user
                                                ? (
                                                    <React.Fragment>
                                                        <MenuItem onClick={(e) => e.stopPropagation()}
                                                            className={classes.userMenuItem}>
                                                            <ListItem alignItems={"flex-start"}>
                                                                <ListItemAvatar>
                                                                    <Avatar alt={user.username} src={user.avatarUrl} />
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={user.username}
                                                                    secondary={
                                                                        <React.Fragment>
                                                                            <Typography component={"div"}
                                                                                variant={"body2"}
                                                                                color={"textSecondary"}>
                                                                                {user.email}
                                                                            </Typography>
                                                                        </React.Fragment>
                                                                    }
                                                                />
                                                            </ListItem>
                                                        </MenuItem>
                                                        <Divider/>
                                                        <MenuItem onClick={() => AuthUtils.signOut(globalState)}
                                                            className={classes.logoutMenuItem}>
                                                            <ListItemText primary={"Logout"}/>
                                                        </MenuItem>
                                                    </React.Fragment>
                                                )
                                                : null
                                        }
                                    </Menu>
                                </React.Fragment>
                            )
                            : (
                                <React.Fragment>
                                    <Button disableTouchRipple={true} color={"inherit"}
                                        className={classes.navButton} aria-haspopup={"true"}
                                        onClick={this.handleAccountPopoverOpen}>SIGN IN/ SIGN UP</Button>
                                    <Menu id={"user-info-appbar"} anchorEl={accountPopoverElement}
                                        anchorOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right"
                                        }}
                                        open={isAccountPopoverOpen}
                                        onClose={this.handleAccountPopoverClose}>
                                        <MenuItem onClick={() => {
                                            this.handleSignIn(AuthUtils.FederatedIdP.GITHUB);
                                            this.handleAccountPopoverClose();
                                        }}>
                                            <GithubLogo className={classes.leftIcon}/> Github
                                        </MenuItem>
                                        <MenuItem onClick={() => {
                                            this.handleSignIn(AuthUtils.FederatedIdP.GOOGLE);
                                            this.handleAccountPopoverClose();
                                        }}>
                                            <GoogleLogo className={classes.leftIcon}/> Google
                                        </MenuItem>
                                    </Menu>
                                </React.Fragment>
                            )
                    }
                </div>
            </div>
        );
    }

}

NavBar.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        search: PropTypes.string.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(NavBar)));
