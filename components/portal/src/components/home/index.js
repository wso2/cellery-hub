/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import AppBar from "@material-ui/core/AppBar";
import AuthUtils from "../../utils/api/authUtils";
import BgImg from "../../img/celleryOverviewBg.png";
import Button from "@material-ui/core/Button";
import CellImage from "../../img/CellImage";
import CelleryLogo from "../../img/celleryLogo.svg";
import CelleryOverview from "../../img/celleryOverview.jpg";
import Container from "@material-ui/core/Container";
import Footer from "../appLayout/Footer";
import GithubLogo from "../../img/GithubLogo";
import GoogleLogo from "../../img/GoogleLogo";
import Grid from "@material-ui/core/Grid";
import HttpUtils from "../../utils/api/httpUtils";
import Link from "@material-ui/core/Link";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    root: {
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column"
    },
    mainContent: {
        flex: 1
    },
    topHeaderLine: {
        backgroundColor: theme.palette.primary.main,
        height: 10,
        width: "100%"
    },
    appbar: {
        backgroundColor: "#ffffff",
        color: theme.palette.primary.main,
        boxShadow: "none"
    },
    title: {
        flexGrow: 1
    },
    headerSubTitle: {
        display: "flex",
        alignItems: "center",
        height: 64
    },
    logo: {
        paddingTop: theme.spacing(4),
        fontSize: 48,
        fontWeight: 400,
        color: "#43AB00"
    },
    celleryLogo: {
        height: 60,
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
    toolbar: {
        paddingLeft: 0,
        paddingRight: 0,
        justifyContent: "flex-end"
    },
    summary: {
        fontSize: 32,
        paddingTop: theme.spacing(4),
        fontWeight: 200
    },
    headerSubTitleContent: {
        fontWeight: 300
    },
    description: {
        fontSize: 18,
        fontWeight: 300
    },
    desContainer: {
        marginTop: theme.spacing(4)
    },
    bgImg: {
        backgroundImage: `url(${BgImg})`,
        backgroundColor: "#ffffff",
        height: 100,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom center"
    },
    celleryOverview: {
        backgroundImage: `url(${CelleryOverview})`,
        height: "100%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "bottom right"
    },
    loginText: {
        paddingTop: theme.spacing(4),
        fontSize: 16
    },
    leftIcon: {
        marginRight: theme.spacing(1)
    },
    button: {
        borderColor: theme.palette.primary.main,
        textTransform: "none"
    },
    link: {
        color: theme.palette.primary.main
    },
    signInContent: {
        display: "flex",
        alignItems: "center",
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(5)
    },
    connector: {
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2)
    },
    imageIcon: {
        color: theme.palette.primary.main,
        marginRight: theme.spacing(1 / 2),
        fontSize: 16,
        verticalAlign: "text-bottom"
    }
});

class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            accountPopoverElement: null
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

    render = () => {
        const {classes} = this.props;
        const {accountPopoverElement} = this.state;
        const isAccountPopoverOpen = Boolean(accountPopoverElement);

        return <React.Fragment>
            <div className={classes.root}>
                <div className={classes.mainContent}>
                    <Grid container>
                        <Grid item xs={12} sm={6} md={6}>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                            <div className={classes.topHeaderLine}/>
                        </Grid>
                    </Grid>
                    <Container maxWidth="md">
                        <Grid container>
                            <Grid item xs={12} sm={6} md={6}>
                                <div className={classes.headerSubTitle}>
                                    <Typography className={classes.headerSubTitleContent}>
                                        A WSO2 Open Source Project
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <AppBar position="static" className={classes.appbar}>
                                    <Toolbar className={classes.toolbar}>
                                        <Button disableTouchRipple={true} color="inherit" href="/explore"
                                            className={classes.navButton}>EXPLORE</Button>
                                        <div>
                                            <Button disableTouchRipple={true} color="inherit"
                                                className={classes.navButton} aria-haspopup="true"
                                                onClick={this.handleAccountPopoverOpen}>SIGN IN/ SIGN UP</Button>
                                            <Menu id="user-info-appbar" anchorEl={accountPopoverElement}
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
                                    </Toolbar>
                                </AppBar>
                            </Grid>
                        </Grid>
                        <div className={classes.logo}>
                            <img src={CelleryLogo} className={classes.celleryLogo} alt="Cellery logo"/>
                            hub
                        </div>
                        <Typography variant="h2" gutterBottom className={classes.summary}>
                            Manage and share code-first composites on Kubernetes
                        </Typography>
                        <Grid container className={classes.desContainer}>
                            <Grid item xs={12} sm={8} md={8}>
                                <Typography gutterBottom className={classes.description}>
                                    Cellery hub acts as a central repository to store and maintain Cell images which
                                    can be shared with other users. Users with neccessary permissions can pull, push
                                    images and manage users and organizations.
                                </Typography>
                                <Typography variant="h6" color="inherit" className={classes.loginText}>
                                    Sign In/ Sign Up with
                                </Typography>
                                <div className={classes.signInContent}>
                                    <Button variant="outlined" color="inherit" className={classes.button}
                                        onClick={() => this.handleSignIn(AuthUtils.FederatedIdP.GITHUB)}>
                                        <GithubLogo className={classes.leftIcon}/>
                                        Github
                                    </Button>
                                    <Typography variant="subtitle2" color="inherit" className={classes.connector}>
                                        or
                                    </Typography>
                                    <Button variant="outlined" color="inherit" className={classes.button}
                                        onClick={() => this.handleSignIn(AuthUtils.FederatedIdP.GOOGLE)}>
                                        <GoogleLogo className={classes.leftIcon}/>
                                        Google
                                    </Button>
                                </div>
                                <div>
                                    <Typography variant="subtitle2">
                                        <Link href={"/explore"} color="inherit" className={classes.link}>
                                            <CellImage className={classes.imageIcon}/>Popular Cell Images
                                        </Link>
                                    </Typography>
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                                <div className={classes.celleryOverview}/>
                            </Grid>
                        </Grid>
                    </Container>
                </div>
                <div className={classes.bgImg}/>
                <Footer/>
            </div>
        </React.Fragment>;
    };

}

Home.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired
};

export default withStyles(styles)(Home);

