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
import Link from "@material-ui/core/Link";
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

const Cookie = (props) => {
    const {classes} = props;
    return (
        <div className={classes.content}>
            <Typography variant={"h5"} color={"inherit"}>
                Cookie Policy
            </Typography>
            <Divider className={classes.divider}/>
            <div className={classes.body}>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Below is information about how the Cellery Hub&nbsp;
                    <Link target={"_blank"} href={"https://hub.cellery.io/"}>hub.cellery.io</Link> (the “Site”) uses
                    cookies
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    The Site stores and retrieves information on your browser using cookies. This information is used
                    to make the Site work as you expect it to. It is not personally identifiable to you, but it can be
                    used to give you a more personalized web experience.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    This Cookie Policy is part of our Privacy Policy. It explains the following:
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHAT ARE COOKIES?
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    A browser cookie is a small piece of data that is stored on your device to help websites and mobile
                    apps remember things about you. Other technologies, including Web storage and identifiers associated
                    with your device, may be used for similar purposes. In this policy, we use the term “cookies” to
                    discuss all of these technologies.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHAT DO WE USE COOKIES FOR?
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    Cookies are used to protect your data and account on the Cellery Hub, help us see which features are
                    most popular, count visitors to a page, improve our users’ experience, keep our services secure, and
                    to provide you with a better, more intuitive, and satisfying experience.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We use cookies for the following purposes:
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <b>Security</b>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We use these cookies to help identify and prevent security risks.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    For example, we may use these cookies to store your session information to prevent others from
                    changing your password without your username and password.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <b>Performance</b>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We use these cookies to collect information about how you interact with our services and to help us
                    improve them.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    For example, we may use these cookies to determine if you have interacted with a certain page.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    <b>Analytics</b>
                </Typography>
                <Typography variant={"body1"} gutterBottom>
                    We use these cookies to help us improve our services.
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    For example, we can use these cookies to learn more about which features are the most popular with
                    our users and which ones might need some tweaks.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    THIRD PARTY COOKIES
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Our website will set several types of third-party cookie, and we do not control the operation of any
                    of them. The third-party cookies which maybe set include:
                    <ul>
                        <li>Google Analytics - we use Google Analytics to collect data about website usage. This data
                            does not include personally identifiable information. You can view the Google Privacy Policy
                            &nbsp;<Link target={"_blank"} href={"https://www.google.com/policies/privacy/"}>here:</Link>
                        </li>
                    </ul>
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    WHAT TYPE OF COOKIES DO WE USE?
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    We use session cookies. A session cookie is a cookie that is erased when the user closes the Web
                    browser. The session cookie is stored in temporary memory and is not retained after the browser is
                    closed. Session cookies do not collect information from the users computer.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    HOW DO I CONTROL MY COOKIES?
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    Most browsers allow you to control cookies through their settings preferences. However, if you limit
                    the ability of websites to set cookies, you may worsen your overall user experience, since it will
                    no longer be personalized to you. It may also stop you from saving customized settings like login
                    information.
                </Typography>
                <Typography variant={"h6"} gutterBottom>
                    CONTACT US
                </Typography>
                <Typography variant={"body1"} gutterBottom className={classes.section}>
                    If you have any questions or concerns regarding the use of cookies, please contact&nbsp;
                    <Link href={"mailto:dpo@wso2.com"} target={"_top"}>dpo@wso2.com</Link> - Data Protection Officer,
                    WSO2.
                </Typography>
            </div>
            <div className={classes.bottomSpace}/>
        </div>
    );
};

Cookie.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Cookie);
