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
import GithubLogo from "../../img/GithubLogo";
import GoogleLogo from "../../img/GoogleLogo";
import HttpUtils from "../../utils/api/httpUtils";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
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
    usernameBtn: {
        textTransform: "none"
    },
    leftIcon: {
        marginRight: theme.spacing(1)
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
        const {history} = this.props;
        const search = HttpUtils.generateQueryParamString({
            fidp: fidp
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
            <React.Fragment>
                {
                    user
                        ? (
                            <React.Fragment>
                                <Button disableTouchRipple={true} color={"inherit"}
                                    onClick={() => this.handleNavItemClick(pages[0])}
                                    className={classes.navButton}>
                                    Images
                                </Button>
                                <Button disableTouchRipple={true} color={"inherit"}
                                    onClick={() => this.handleNavItemClick(pages[1])}
                                    className={classes.navButton}>
                                    Organisations
                                </Button>
                            </React.Fragment>
                        )
                        : null
                }
                <Button disableTouchRipple={true} color={"inherit"} className={classes.navButton}
                    onClick={() => this.handleNavItemClick(pages[2])}>
                    Explore
                </Button>
                <div>
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
                        <MenuItem onClick={this.handleDocsPopoverClose}>
                            Get stared with Cellery hub
                        </MenuItem>
                        <MenuItem onClick={this.handleDocsPopoverClose}>
                            How to code cell
                        </MenuItem>
                    </Menu>
                </div>
                {
                    user
                        ? (
                            <div>
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
                                    {user.username}
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
                                                    <MenuItem onClick={() => AuthUtils.signOut(globalState)}>
                                                    Logout
                                                    </MenuItem>
                                                </React.Fragment>
                                            )
                                            : null
                                    }
                                </Menu>
                            </div>
                        )
                        : (
                            <div>
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
                            </div>
                        )
                }
            </React.Fragment>
        );
    }

}

NavBar.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(NavBar)));