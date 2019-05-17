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

import AccountCircle from "@material-ui/icons/AccountCircle";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import CelleryLogo from "../../img/celleryLogo.svg";
import Container from "@material-ui/core/Container";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Toolbar from "@material-ui/core/Toolbar";
import classNames from "classnames";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    appbar: {
        backgroundColor: "#ffffff",
        color: theme.palette.primary.main,
        boxShadow: "none"
    },
    headerLogo: {
        flexGrow: 1
    },
    logo: {
        fontSize: 32,
        fontWeight: 400,
        color: "#43AB00"
    },
    celleryLogo: {
        height: 40,
        verticalAlign: "middle",
        paddingRight: 2
    },
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
    toolbar: {
        paddingLeft: 0,
        paddingRight: 0
    },
    headerContent: {
        borderBottom: "1px solid",
        borderBottomColor: theme.palette.primary.main
    },
    leftIcon: {
        marginRight: theme.spacing(1)
    }
});

class Header extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            accountPopoverElement: null,
            docsPopoverElement: null
        };
    }

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

    render = () => {
        const {classes} = this.props;
        const {accountPopoverElement, docsPopoverElement} = this.state;
        const isAccountPopoverOpen = Boolean(accountPopoverElement);
        const isDocsPopoverOpen = Boolean(docsPopoverElement);
        const pages = [
            "/my-images",
            "/my-orgs",
            "/explore"
        ];

        return (
            <header>
                <div className={classes.headerContent}>
                    <Container maxWidth="md">
                        <AppBar position="static" className={classes.appbar}>
                            <Toolbar className={classes.toolbar}>
                                <div className={classes.headerLogo}>
                                    <div className={classes.logo}>
                                        <img src={CelleryLogo} className={classes.celleryLogo} alt="Cellery logo"/>
                                        hub
                                    </div>
                                </div>
                                <Button disableTouchRipple={true} color="inherit" onClick={(event) => {
                                    this.handleNavItemClick(pages[0], event);
                                }} className={classes.navButton}>Images</Button>
                                <Button disableTouchRipple={true} color="inherit" onClick={(event) => {
                                    this.handleNavItemClick(pages[1], event);
                                }} className={classes.navButton}>Organisations</Button>
                                <Button disableTouchRipple={true} color="inherit" onClick={(event) => {
                                    this.handleNavItemClick(pages[2], event);
                                }} className={classes.navButton}>Explore</Button>
                                <div>
                                    <Button disableTouchRipple={true} color="inherit"
                                        className={classes.navButton} ria-haspopup="true"
                                        onClick={this.handleDocsPopoverOpen}>Docs</Button>
                                    <Menu id="user-info" anchorEl={docsPopoverElement}
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
                                <div>
                                    <Button disableTouchRipple={true} color="inherit"
                                        className={classNames(classes.usernameBtn, classes.navButton)}
                                        aria-haspopup="true"
                                        onClick={this.handleAccountPopoverOpen}>
                                        <AccountCircle className={classes.leftIcon}/> john</Button>
                                    <Menu id="user-info" anchorEl={accountPopoverElement}
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
                                        <MenuItem onClick={this.handleAccountPopoverClose}>
                                            My Profile
                                        </MenuItem>
                                        <MenuItem>
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </div>
                            </Toolbar>
                        </AppBar>
                    </Container>
                </div>
            </header>
        );
    };

}

Header.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired
};

export default withStyles(styles)(withRouter(Header));

