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
import ChipInput from "material-ui-chip-input";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import NotificationUtils from "../../utils/common/notificationUtils";
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

class ImageUpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            imgSummary: props.summary,
            imageDescription: props.description,
            imageKeywords: props.keywords
        };
    }

    handleSummaryInputChange = (event) => {
        this.setState({
            imgSummary: event.currentTarget.value
        });
    };

    handleDescriptionInputChange = (event) => {
        this.setState({
            imageDescription: event.currentTarget.value
        });
    };

    handleAddKeywords = (chip) => {
        const {imageKeywords} = this.state;
        this.setState({
            imageKeywords: [...imageKeywords, chip]
        });
    };

    handleDeleteKeywords = (deletedChip) => {
        const {imageKeywords} = this.state;
        this.setState({
            imageKeywords: imageKeywords.filter((c) => c !== deletedChip)
        });
    };

    handleUpdateImage = () => {
        const self = this;
        const {globalState, image} = self.props;
        const {imgSummary, imageDescription, imageKeywords} = self.state;
        NotificationUtils.showLoadingOverlay(`Updating image ${image}`, globalState);
        HttpUtils.callHubAPI(
            {
                url: `/images/${image}`,
                method: "PUT",
                data: {
                    summary: imgSummary,
                    description: imageDescription,
                    keywords: imageKeywords
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
                    errorMessage = `Failed to update image - ${image}`;
                }
            } else {
                errorMessage = `Failed to update image - ${image}`;
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
        });
    };

    handleClose = () => {
        const {onClose} = this.props;
        this.setState({
            imgSummary: "",
            imageDescription: "",
            imageKeywords: []
        });
        onClose();
    };

    render() {
        const {classes, open, image} = this.props;
        const {imgSummary, imageDescription, imageKeywords} = this.state;

        return (
            <div>
                <Dialog open={open} onClose={this.handleClose} aria-labelledby={"form-dialog-title"} fullWidth>
                    <DialogTitle id={"form-dialog-title"}>Update Image Details</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth className={classes.formControl}>
                            <InputLabel htmlFor={"name"}>Image</InputLabel>
                            <Input id={"name"} value={image} type={"text"} disabled={"true"}/>
                        </FormControl>
                        <FormControl fullWidth className={classes.formControl}>
                            <InputLabel htmlFor={"summary"}>Summary</InputLabel>
                            <Input id={"summary"} value={imgSummary} type={"text"} autoFocus multiline={true}
                                inputProps={{maxLength: 60}} onChange={this.handleSummaryInputChange}/>
                            <FormHelperText>Limited to 60 characters</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth className={classes.formControl}>
                            <InputLabel htmlFor={"description"}>Description</InputLabel>
                            <Input id={"description"} value={imageDescription} type={"text"} multiline={true}
                                onChange={this.handleDescriptionInputChange}/>
                            <FormHelperText>Markdown supported</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth className={classes.formControl}>
                            <ChipInput value={imageKeywords} fullWidth label={"keywords"}
                                onAdd={(chip) => this.handleAddKeywords(chip)}
                                onDelete={(deletedChip) => this.handleDeleteKeywords(deletedChip)}/>
                            <FormHelperText>Type and press enter to add keywords</FormHelperText>
                        </FormControl>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button onClick={this.handleClose}>Cancel</Button>
                        <Button onClick={this.handleUpdateImage} color={"primary"} className={classes.updateBtn}>
                            Update
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

}

ImageUpdateDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    image: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    keywords: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default withStyles(styles)(withGlobalState(ImageUpdateDialog));
