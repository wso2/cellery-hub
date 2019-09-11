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
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles/index";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    dialogActions: {
        marginBottom: theme.spacing(2)
    },
    deleteBtn: {
        color: "#e74c3c",
        borderColor: "#e74c3c",
        marginRight: theme.spacing(2)
    }
});

class ImageDeleteDialog extends React.Component {

    handleDeleteImage = () => {
        const self = this;
        const {globalState, image, org, history} = self.props;
        NotificationUtils.showLoadingOverlay(`Deleting image ${org}/${image}`, globalState);
        HttpUtils.callHubAPI(
            {
                url: `/images/${org}/${image}`,
                method: "DELETE"
            },
            globalState
        ).then(() => {
            self.handleClose();
            NotificationUtils.hideLoadingOverlay(globalState);
            if (history.length > 2) {
                history.goBack();
            } else {
                history.push("/my-images");
            }
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = `Failed to delete image - ${org}/${image}`;
                }
            } else {
                errorMessage = `Failed to delete image - ${org}/${image}`;
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
        });
    };

    handleClose = () => {
        const {onClose} = this.props;
        onClose();
    };

    render() {
        const {classes, open, image, org} = this.props;

        return (
            <div>
                <Dialog open={open} onClose={this.handleClose} aria-labelledby={"form-dialog-title"} fullWidth>
                    <DialogTitle id={"alert-dialog-title"}>
                        Do you really want to delete image - {org}/{image}?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id={"alert-dialog-description"}>
                            If you delete this image, <b>all image versions</b> will also be deleted.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button onClick={this.handleClose}>Cancel</Button>
                        <Button onClick={this.handleDeleteImage} variant={"outlined"} className={classes.deleteBtn}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

}

ImageDeleteDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    image: PropTypes.string.isRequired,
    org: PropTypes.string.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired,
        length: PropTypes.number.isRequired,
        push: PropTypes.func.isRequired
    })
};

export default withStyles(styles)(withRouter(withGlobalState(ImageDeleteDialog)));
