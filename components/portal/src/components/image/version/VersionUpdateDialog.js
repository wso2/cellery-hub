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
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import NotificationUtils from "../../../utils/common/notificationUtils";
import React from "react";
import {withStyles} from "@material-ui/core/styles/index";
import HttpUtils, {HubApiError} from "../../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../../common/state/index";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    dialogActions: {
        marginBottom: theme.spacing(2)
    },
    captchaContainer: {
        marginTop: theme.spacing(2)
    },
    formControl: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
        minWidth: "100%"
    },
    updateBtn: {
        marginRight: theme.spacing(2)
    }
});

class VersionUpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            imageVersionDescription: props.description
        };
    }

    handleDescriptionInputChange = (event) => {
        this.setState({
            imageVersionDescription: event.currentTarget.value
        });
    };

    handleUpdateImageVersion = () => {
        const self = this;
        const {globalState, image, version} = self.props;
        const {imageVersionDescription} = self.state;
        NotificationUtils.showLoadingOverlay(`Updating image version ${image}:${version}`, globalState);
        HttpUtils.callHubAPI(
            {
                url: `/artifacts/${image}/${version}`,
                method: "PUT",
                data: {
                    description: imageVersionDescription
                }
            },
            globalState
        ).then(() => {
            self.handleClose();
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = `Failed to update image version - ${image}:${version}`;
                }
            } else {
                errorMessage = `Failed to update image version - ${image}:${version}`;
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
        });
    };

    handleClose = () => {
        const {onClose} = this.props;
        this.setState({
            imageVersionDescription: ""
        });
        onClose();
    };

    render() {
        const {classes, open, image, version} = this.props;
        const {imageVersionDescription} = this.state;

        return (
            <div>
                <Dialog open={open} onClose={this.handleClose} aria-labelledby={"form-dialog-title"} fullWidth>
                    <DialogTitle id={"form-dialog-title"}>Update Image Version Details</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth className={classes.formControl}>
                            <InputLabel htmlFor={"name"}>Image Version</InputLabel>
                            <Input id={"name"} value={`${image}:${version}`} type={"text"} disabled={"true"}/>
                        </FormControl>
                        <FormControl fullWidth className={classes.formControl}>
                            <InputLabel htmlFor={"description"}>Description</InputLabel>
                            <Input id={"description"} value={imageVersionDescription} type={"text"} multiline={true}
                                onChange={this.handleDescriptionInputChange}/>
                            <FormHelperText>Markdown supported</FormHelperText>
                        </FormControl>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button onClick={this.handleClose}>Cancel</Button>
                        <Button onClick={this.handleUpdateImageVersion} color={"primary"} className={classes.updateBtn}>
                            Update
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

}

VersionUpdateDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    image: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
};

export default withStyles(styles)(withGlobalState(VersionUpdateDialog));
