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

import Button from "@material-ui/core/Button";
import Constants from "../../utils/constants";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/Input";
import NotificationUtils from "../../utils/common/notificationUtils";
import ReCAPTCHA from "react-google-recaptcha";
import React from "react";
import {withStyles} from "@material-ui/core/styles/index";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    dialogActions: {
        marginBottom: theme.spacing(2)
    },
    captchaContainer: {
        marginTop: theme.spacing(2)
    }
});

class OrgCreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            orgNameToBeCreated: "",
            orgNameErrorMessage: "",
            reCaptchaVerifiedToken: null
        };
        this.reCaptchaInstance = React.createRef();
    }

    handleOnCaptchaVerify = (token) => {
        this.setState({
            reCaptchaVerifiedToken: token
        });
    };

    handleOnCaptchaVerifyError = () => {
        const {globalState} = this.props;
        NotificationUtils.showNotification("Failed to verify Captcha", NotificationUtils.Levels.ERROR, globalState);
    };

    handleOrgNameInputChange = (event) => {
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
            orgNameErrorMessage: errorMessage
        });
    };

    handleCreateOrg = () => {
        const self = this;
        const {globalState} = self.props;
        const {orgNameToBeCreated, reCaptchaVerifiedToken} = self.state;
        NotificationUtils.showLoadingOverlay(`Creating organization ${orgNameToBeCreated}`, globalState);
        HttpUtils.callHubAPI(
            {
                url: "/orgs",
                method: "POST",
                headers: {
                    [Constants.Header.CELLERY_HUB_CAPTCHA]: reCaptchaVerifiedToken
                },
                data: {
                    orgName: orgNameToBeCreated
                }
            },
            globalState
        ).then(() => {
            self.handleClose();
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getStatusCode() === 429) {
                    if (err.getErrorCode() === Constants.ApplicationErrorCode.ALLOWED_LIMIT_EXCEEDED) {
                        errorMessage = "Already exceeded the maximum organization creation limit";
                    } else {
                        errorMessage = "Too Many Requests. Please try again later.";
                    }
                } else if (err.getErrorCode() === Constants.ApplicationErrorCode.ALREADY_EXISTS) {
                    errorMessage = `Organization ${orgNameToBeCreated} is already taken, try another`;
                    self.setState({
                        orgNameErrorMessage: errorMessage
                    });
                } else if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = "Failed to create organization";
                }
            } else {
                errorMessage = "Failed to create organization";
            }
            if (this.reCaptchaInstance && this.reCaptchaInstance.current) {
                this.reCaptchaInstance.current.reset();
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
        });
    };

    handleClose = () => {
        const {onClose} = this.props;
        this.setState({
            orgNameToBeCreated: "",
            orgNameErrorMessage: "",
            reCaptchaVerifiedToken: null
        });
        onClose();
    };

    render() {
        const {classes, globalState, open} = this.props;
        const {orgNameToBeCreated, orgNameErrorMessage, reCaptchaVerifiedToken} = this.state;

        const reCaptchaSiteKey = globalState.get(StateHolder.CONFIG).reCaptchaSiteKey;
        return (
            <div>
                <Dialog open={open} onClose={this.handleClose} aria-labelledby={"form-dialog-title"} fullWidth>
                    <DialogTitle id={"form-dialog-title"}>Create Organization</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth className={classes.orgTextField} error={orgNameErrorMessage}>
                            <Input value={orgNameToBeCreated} type={"text"} autoFocus
                                onChange={this.handleOrgNameInputChange}/>
                            {orgNameErrorMessage ? <FormHelperText>{orgNameErrorMessage}</FormHelperText> : null}
                        </FormControl>
                        <ReCAPTCHA sitekey={reCaptchaSiteKey} onChange={this.handleOnCaptchaVerify}
                            ref={this.reCaptchaInstance} className={classes.captchaContainer}
                            onErrored={this.handleOnCaptchaVerifyError}/>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button onClick={this.handleClose} size={"small"}>
                            Cancel
                        </Button>
                        <Button onClick={this.handleCreateOrg} color={"primary"} size={"small"}
                            disabled={!orgNameToBeCreated || orgNameErrorMessage || !reCaptchaVerifiedToken}>
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

}

OrgCreateDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default withStyles(styles)(withGlobalState(OrgCreateDialog));
