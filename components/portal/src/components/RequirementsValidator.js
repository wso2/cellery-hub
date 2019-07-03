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

import CelleryError from "../img/celleryError.jpg";
import ErrorOutlined from "@material-ui/icons/ErrorOutlined";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";
import * as React from "react";

const styles = (theme) => ({
    requirementsUnmetContainer: {
        position: "relative",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        display: "grid"
    },
    requirementsUnmet: {
        margin: "auto",
        textAlign: "center"
    },
    requirementsUnmetImg: {
        marginTop: theme.spacing.unit * 5,
        height: 150
    },
    requirementsUnmetTitle: {
        margin: theme.spacing.unit,
        fontSize: "1.5em",
        fontWeight: 400,
        color: "#6e6e6e"
    },
    requirementsUnmetDescription: {
        fontSize: "1em",
        fontWeight: 300,
        color: "#808080",
        maxWidth: "50vw"
    }
});

class RequirementsValidator extends React.Component {

    static LOCAL_STORAGE_TEST_KEY = "requirementsValidatorLocalStorageTest";
    static LOCAL_STORAGE_TEST_VALUE = "requirementsValidatorLocalStorageTestValue";

    constructor(props) {
        super(props);

        let isLocalStorageEnabled = false;
        try {
            localStorage.removeItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY);
            localStorage.setItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY,
                RequirementsValidator.LOCAL_STORAGE_TEST_VALUE);
            if (localStorage.getItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY)
                === RequirementsValidator.LOCAL_STORAGE_TEST_VALUE) {
                isLocalStorageEnabled = true;
            }
            localStorage.removeItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY);
        } catch (error) {
            // Local storage access failed
        }

        let isSessionStorageEnabled = false;
        try {
            sessionStorage.removeItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY);
            sessionStorage.setItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY,
                RequirementsValidator.LOCAL_STORAGE_TEST_VALUE);
            if (sessionStorage.getItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY)
                === RequirementsValidator.LOCAL_STORAGE_TEST_VALUE) {
                isSessionStorageEnabled = true;
            }
            sessionStorage.removeItem(RequirementsValidator.LOCAL_STORAGE_TEST_KEY);
        } catch (error) {
            // Session storage access failed
        }

        this.state = {
            localStorageEnabled: isLocalStorageEnabled,
            sessionStorageEnabled: isSessionStorageEnabled
        };
    }

    render() {
        const {classes, children} = this.props;
        const {localStorageEnabled, sessionStorageEnabled} = this.state;
        return (
            !localStorageEnabled || !sessionStorageEnabled
                ? (
                    <div className={classes.requirementsUnmetContainer}>
                        <div className={classes.requirementsUnmet}>
                            <img src={CelleryError} className={classes.requirementsUnmetImg}
                                alt={"Requirements Unmet"}/>
                            <div className={classes.requirementsUnmetTitle}>
                                Requirements not met
                            </div>
                            <div className={classes.requirementsUnmetDescription}>
                                <List>
                                    {
                                        localStorageEnabled
                                            ? null
                                            : (
                                                <ListItem>
                                                    <ListItemIcon><ErrorOutlined/></ListItemIcon>
                                                    <ListItemText primary={"Local Storage Disabled"}
                                                        secondary={"Access to localStorage is required by Cellery Hub. "
                                                                  + "Please enable and refresh to continue"}/>
                                                </ListItem>
                                            )
                                    }
                                    {
                                        sessionStorageEnabled
                                            ? null
                                            : (
                                                <ListItem>
                                                    <ListItemIcon><ErrorOutlined/></ListItemIcon>
                                                    <ListItemText primary={"Session Storage Disabled"}
                                                        secondary={"Access to sessionStorage is required by "
                                                        + "Cellery Hub. Please enable and refresh to continue"}/>
                                                </ListItem>
                                            )
                                    }
                                </List>
                            </div>
                        </div>
                    </div>
                )
                : children
        );
    }

}

RequirementsValidator.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.any.isRequired
};

export default withStyles(styles)(withRouter(RequirementsValidator));
