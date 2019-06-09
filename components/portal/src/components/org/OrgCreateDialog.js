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
import React from "react";
import TextField from "@material-ui/core/TextField";
import {withStyles} from "@material-ui/core/styles/index";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    dialogActions: {
        marginBottom: theme.spacing(2)
    }
});

const OrgCreateDialog = (props) => {
    const {classes, open, onClose} = props;

    return (
        <div>
            <Dialog open={open} onClose={onClose} aria-labelledby={"form-dialog-title"} fullWidth>
                <DialogTitle id={"form-dialog-title"}>Create Organization</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin={"dense"} id={"name"} label={"Organization Name"} type={"text"}
                        fullWidth/>
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button onClick={onClose} size={"small"}>
                        Cancel
                    </Button>
                    <Button onClick={onClose} color={"primary"} size={"small"}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

OrgCreateDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default withStyles(styles)(OrgCreateDialog);
