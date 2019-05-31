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
import DoneAllRounded from "@material-ui/icons/DoneAll";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
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

class SDK extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isDialogOpen: false
        };
    }

    handleClickOpen = () => {
        this.setState({
            isDialogOpen: true
        });
    };

    handleClose = () => {
        this.setState({
            isDialogOpen: false
        });
    };

    handleItemClick = (path) => {
        const {history} = this.props;
        history.push(path);
    };

    handleCheckAvailability = (value) => {
        // TODO: Check if the input name is already taken or not
    };

    render = () => {
        const {classes} = this.props;
        const {isDialogOpen} = this.state;

        return (
            <div className={classes.content}>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={12} md={12}>
                        <Typography component="div" variant="h6" className={classes.instructions}>
                            In order to push an Cell Image to Cellery Hub, you need to create an organization.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <div className={classes.form}>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="organization-name">Organization Name</InputLabel>
                                <Input id="organization-name" type="text" fullWidth autoFocus
                                    className={classes.orgTextField} endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton aria-label="Toggle password visibility"
                                                onClick={this.handleCheckAvailability}>
                                                <DoneAllRounded/>
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                            <Button variant="contained" color="primary" onClick={(event) => {
                                this.handleItemClick("/sdk/success", event);
                            }}>Create Organization
                            </Button>
                            <Button variant="outlined" color="default" className={classes.skipBtn}
                                onClick={this.handleClickOpen}>Skip this step
                            </Button>
                            <Dialog
                                open={isDialogOpen}
                                onClose={this.handleClose}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                            >
                                <DialogTitle id="alert-dialog-title">{"Do you want to skip creating an"
                                + " organization?"}</DialogTitle>
                                <DialogContent>
                                    <DialogContentText id="alert-dialog-description">
                                        If you skip this step you will have to go to Cellery Hub and create a
                                        organization before pushing an Cell Image.
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleClose} color="primary">
                                        Cancel
                                    </Button>
                                    <Button color="primary" autoFocus onClick={(event) => {
                                        this.handleItemClick("/sdk/success", event);
                                    }}>Continue
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

SDK.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    })
};

export default withStyles(styles)(SDK);
