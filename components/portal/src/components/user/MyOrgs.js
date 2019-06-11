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

import AddCircleOutline from "@material-ui/icons/AddCircleOutline";
import Button from "@material-ui/core/Button";
import CreateOrg from "../../img/CreateOrg.jpg";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import OrgCreateDialog from "../org/OrgCreateDialog";
import OrgList from "../common/OrgList";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    },
    formControl: {
        minWidth: "100%"
    },
    rightIcon: {
        right: 0,
        marginRight: theme.spacing(1)
    },
    secondaryTitle: {
        marginTop: theme.spacing(2),
        fontWeight: 400
    },
    secondaryText: {
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    placeholderIcon: {
        color: "#999999"
    },
    createOrgImg: {
        height: 170,
        marginBottom: theme.spacing(3),
        marginTop: theme.spacing(3)
    }
});

const orgs = [
    {
        orgName: "alpha",
        description: "Sample description",
        membersCount: 5,
        imagesCount: 3

    },
    {
        orgName: "beta",
        description: "Sample description",
        membersCount: 10,
        imagesCount: 6
    }
];

class MyOrgs extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            organization: "all",
            sort: "most-popular",
            isOrgsAvailable: true,
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

    handlePageChange = () => {
        // TODO: Load new data for page
    };

    render = () => {
        const {classes} = this.props;
        const {isOrgsAvailable, isDialogOpen} = this.state;

        return (
            <React.Fragment>
                {
                    isOrgsAvailable
                        ? (
                            <div className={classes.content}>
                                <Typography variant={"h5"} color={"inherit"}>
                                    Organizations
                                </Typography>
                                <Divider/>
                                <div className={classes.container}>
                                    <Grid container>
                                        <Grid item xs={12} sm={4} md={4}>
                                            <FormControl className={classes.formControl}>
                                                <InputLabel htmlFor={"search"}>Organization Name</InputLabel>
                                                <Input
                                                    id={"search"}
                                                    startAdornment={
                                                        <InputAdornment position={"start"}>
                                                            <SearchIcon className={classes.placeholderIcon}/>
                                                        </InputAdornment>
                                                    }
                                                    placeholder={"Search Organization"}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item sm={4} md={4} />
                                        <Grid item xs={12} sm={4} md={4}>
                                            <Grid container alignItems={"baseline"} justify={"flex-end"}
                                                direction={"row"}>
                                                <Button variant={"contained"} color={"primary"}
                                                    className={classes.button}
                                                    onClick={this.handleClickOpen}>
                                                    <AddCircleOutline className={classes.rightIcon}/>
                                                    Create
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </div>
                                <OrgList pageData={orgs} onPageChange={this.handlePageChange}/>
                            </div>
                        )
                        : (
                            <div className={classes.content}>
                                <div className={classes.container}>
                                    <Grid container alignContent={"center"} direction={"column"} justify={"center"}
                                        alignItems={"center"}>
                                        <Typography variant={"h5"} color={"inherit"}>
                                            Welcome to Cellery Hub!
                                        </Typography>
                                        <Typography variant={"h6"} color={"textSecondary"}
                                            className={classes.secondaryTitle}>
                                            Get started by creating an organization
                                        </Typography>
                                        <img src={CreateOrg} className={classes.createOrgImg}/>
                                        <Typography variant={"subtitle1"} color={"inherit"}
                                            className={classes.secondaryText}>
                                            Create your organisation to share your images with others
                                        </Typography>
                                        <Button variant={"contained"} color={"primary"} className={classes.button}
                                            onClick={this.handleClickOpen}>
                                            <AddCircleOutline className={classes.rightIcon}/>
                                            Create
                                        </Button>
                                    </Grid>
                                </div>
                            </div>
                        )
                }
                <OrgCreateDialog open={isDialogOpen} onClose={this.handleClose}/>
            </React.Fragment>
        );
    }

}


MyOrgs.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyOrgs);
