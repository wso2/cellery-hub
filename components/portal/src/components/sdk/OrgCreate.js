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

import AuthUtils from "../../utils/api/authUtils";
import Button from "@material-ui/core/Button";
import Constants from "../../utils/constants";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    form: {
        paddingBottom: theme.spacing(4)
    },
    instructions: {
        paddingTop: theme.spacing(2),
        fontWeight: 300
    },
    orgTextField: {
        marginBottom: theme.spacing(4)
    },
    skipBtn: {
        marginLeft: theme.spacing(2)
    }
});

class OrgCreate extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            orgNameToBeCreated: "",
            isDialogOpen: false,
            errorMessage: ""
        };
    }

    handleOrgInputChange = (event) => {
        const orgName = event.currentTarget.value;
        let errorMessage = "";
        if (orgName) {
            if (!new RegExp(`^${Constants.Pattern.CELLERY_ID}$`).test(orgName)) {
                errorMessage = "Organization name can only contain lower case letters, numbers and dashes"
                    + " and should be surrounded by lower case letters and numbers";
            }
        }
        this.setState({
            orgNameToBeCreated: orgName,
            errorMessage: errorMessage
        });
    };

    handleSkipConfirmDialogOpen = () => {
        this.setState({
            isDialogOpen: true
        });
    };

    handleSkipConfirmDialogClose = () => {
        this.setState({
            isDialogOpen: false
        });
    };

    handleCreateOrg = () => {
        const self = this;
        const {globalState} = self.props;
        const {orgNameToBeCreated} = self.state;
        NotificationUtils.showLoadingOverlay(`Creating organization ${orgNameToBeCreated}`, globalState);
        HttpUtils.callHubAPI(
            {
                url: "/orgs",
                method: "POST",
                data: {
                    orgName: orgNameToBeCreated
                }
            },
            globalState
        ).then(() => {
            self.handleContinue(false);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getErrorCode() === Constants.ApplicationErrorCode.ALREADY_EXISTS) {
                    errorMessage = `Organization ${orgNameToBeCreated} already taken.`;
                    self.setState({
                        errorMessage: errorMessage
                    });
                } else if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = "Failed to create organization";
                }
            } else {
                errorMessage = "Failed to create organization";
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
        });
    };

    /**
     * Handle continuing the authentication flow.
     *
     * @param {boolean} skipOrgCheck Whether to skip checking for organizations
     */
    handleContinue = (skipOrgCheck) => {
        const {globalState, location} = this.props;
        const params = HttpUtils.parseQueryParams(location.search);
        AuthUtils.continueLoginFlow(globalState, params.sessionDataKey, skipOrgCheck);
    };

    render = () => {
        const {classes} = this.props;
        const {isDialogOpen, orgNameToBeCreated, errorMessage} = this.state;

        return (
            <div className={classes.content}>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={12} md={12}>
                        <Typography component={"div"} variant={"h6"} className={classes.instructions}>
                            In order to push an Cell Image to Cellery Hub, you need to create an organization.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <div className={classes.form}>
                            <FormControl fullWidth className={classes.orgTextField} error={errorMessage}>
                                <InputLabel htmlFor={"organization-name"}>Organization Name</InputLabel>
                                <Input value={orgNameToBeCreated} type={"text"} fullWidth autoFocus
                                    onChange={this.handleOrgInputChange}/>
                                {errorMessage ? <FormHelperText>{errorMessage}</FormHelperText> : null}
                            </FormControl>
                            <Button variant={"contained"} color={"primary"} onClick={this.handleCreateOrg}
                                disabled={!orgNameToBeCreated || errorMessage}>
                                Create Organization
                            </Button>
                            <Button variant={"outlined"} color={"default"} className={classes.skipBtn}
                                onClick={this.handleSkipConfirmDialogOpen}>Skip this step
                            </Button>
                            <Dialog open={isDialogOpen} onClose={this.handleSkipConfirmDialogClose}
                                aria-labelledby={"alert-dialog-title"}
                                aria-describedby={"alert-dialog-description"}>
                                <DialogTitle id={"alert-dialog-title"}>
                                    Do you want to skip creating an organization?
                                </DialogTitle>
                                <DialogContent>
                                    <DialogContentText id={"alert-dialog-description"}>
                                        If you skip this step you will have to go to Cellery Hub and create a
                                        organization before pushing an Cell Image.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button color={"primary"} onClick={this.handleSkipConfirmDialogClose}>
                                        Cancel
                                    </Button>
                                    <Button color={"primary"} autoFocus onClick={() => {
                                        this.handleSkipConfirmDialogClose();
                                        this.handleContinue(true);
                                    }}>
                                        Continue
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    </Grid>
                </Grid>
            </div>
        );
    };

}

OrgCreate.propTypes = {
    classes: PropTypes.object.isRequired,
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withGlobalState(OrgCreate));
