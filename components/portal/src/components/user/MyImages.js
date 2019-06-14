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

import Constants from "../../utils/constants";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import ImageList from "../common/ImageList";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
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
    orgSelect: {
        marginRight: theme.spacing(1)
    },
    placeholderIcon: {
        color: "#999999"
    }
});

const images = [
    {
        orgName: "alpha",
        imageName: "pet-fe",
        summary: "This contains the four components which involves with working with the Pet Store data and"
            + " business logic.",
        visibility: "PUBLIC",
        pullCount: 10,
        updatedTimestamp: "2019-05-12T05:11:54-0500",
        lastAuthor: "john"
    },
    {
        orgName: "alpha",
        imageName: "pet-be",
        summary: "This contains of a single component which serves the portal.",
        visibility: "PUBLIC",
        pullCount: 15,
        updatedTimestamp: "2019-01-01T05:11:54-0500",
        lastAuthor: "john"
    },
    {
        orgName: "beta",
        imageName: "hello-world",
        summary: "Sample hello world cell.",
        visibility: "PRIVATE",
        pullCount: 7,
        updatedTimestamp: "2019-01-02T05:11:54-0500",
        lastAuthor: "john"
    }
];

const orgs = [
    "alpha",
    "beta"
];

class MyImages extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            organization: "*",
            sort: Constants.SortingOrder.MOST_POPULAR
        };
    }

    handleOrgChange = (event) => {
        this.setState({
            organization: event.target.value
        });
    };

    handleSortChange = (event) => {
        this.setState({
            sort: event.target.value
        });
    };

    handlePageChange = () => {
        // TODO: Load new data for page
    };

    render = () => {
        const {classes} = this.props;
        const {organization, sort} = this.state;

        return (
            <div className={classes.content}>
                <Typography variant={"h5"} color={"inherit"}>
                    Images
                </Typography>
                <Divider/>
                <div className={classes.container}>
                    <Grid container>
                        <Grid item xs={12} sm={3} md={3}>
                            <form autoComplete={"off"}>
                                <FormControl className={classes.formControl}>
                                    <InputLabel shrink htmlFor={"organization-label-placeholder"}>
                                        Organization
                                    </InputLabel>
                                    <Select value={organization} displayEmpty name={"organization"}
                                        onChange={this.handleOrgChange} className={classes.orgSelect}
                                        input={
                                            <Input name={"organization"} id={"organization-label-placeholder"}/>
                                        }>
                                        <MenuItem value={"*"}>All</MenuItem>
                                        {orgs.map((org) => <MenuItem key={org} value={org}>{org}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </form>
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <FormControl className={classes.formControl}>
                                <InputLabel htmlFor={"search"}>Image Name</InputLabel>
                                <Input id={"search"} placeholder={"Search Image"}
                                    startAdornment={
                                        <InputAdornment position={"start"}>
                                            <SearchIcon className={classes.placeholderIcon}/>
                                        </InputAdornment>
                                    }/>
                            </FormControl>
                        </Grid>
                        <Grid item sm={2} md={2} />
                        <Grid item xs={12} sm={3} md={3}>
                            <form autoComplete={"off"}>
                                <FormControl className={classes.formControl}>
                                    <InputLabel shrink htmlFor={"sort-label-placeholder"}>
                                        Sort
                                    </InputLabel>
                                    <Select value={sort} onChange={this.handleSortChange} name={"sort"} displayEmpty
                                        input={<Input name={"sort"} id={"sort-label-placeholder"}/>}>
                                        <MenuItem value={Constants.SortingOrder.RECENTLY_UPDATED}>
                                            Recently Updated
                                        </MenuItem>
                                        <MenuItem value={Constants.SortingOrder.MOST_POPULAR}>
                                            Most No of Pulls
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </form>
                        </Grid>
                    </Grid>
                </div>
                <ImageList pageData={images} onPageChange={this.handlePageChange}/>
            </div>
        );
    }

}

MyImages.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyImages);
