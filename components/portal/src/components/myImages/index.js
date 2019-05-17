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
        paddingTop: theme.spacing.unit * 4
    },
    container: {
        paddingTop: theme.spacing.unit * 4,
        paddingBottom: theme.spacing.unit * 4
    },
    formControl: {
        minWidth: "100%"
    },
    orgSelect: {
        marginRight: 10
    }
});

const data = [
    {
        name: "pet-fe",
        description: "This contains the four components which involves with working with the Pet Store data and"
        + " business logic.",
        organization: "alpha",
        public: true,
        pulls: 10,
        stars: 3
    },
    {
        name: "pet-be",
        description: "This contains of a single component which serves the portal.",
        organization: "alpha",
        public: true,
        pulls: 15,
        stars: 11
    },
    {
        name: "hello-world",
        description: "Sample hello world cell.",
        organization: "beta",
        public: false,
        pulls: 7,
        stars: 4
    }
];

const orgData = [
    {
        name: "Alpha",
        value: "alpha"
    },
    {
        name: "Beta",
        value: "beta"
    }
];

class MyImages extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            organization: "all",
            sort: "most-popular"
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

    render = () => {
        const {classes} = this.props;
        const {organization, sort} = this.state;

        return (
            <div className={classes.content}>
                <Typography variant="h5" color="inherit">
                    Images
                </Typography>
                <Divider/>
                <div className={classes.container}>
                    <Grid container>
                        <Grid item xs={12} sm={3} md={3}>
                            <form autoComplete="off">
                                <FormControl className={classes.formControl}>
                                    <InputLabel shrink htmlFor="organization-label-placeholder">
                                        Organization
                                    </InputLabel>
                                    <Select
                                        value={organization}
                                        onChange={this.handleOrgChange}
                                        input={<Input name="organization" id="organization-label-placeholder"/>}
                                        displayEmpty
                                        name="organization"
                                        className={classes.orgSelect}
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        {orgData.map((org) => (
                                            <MenuItem key={org.value} value={org.value}>{org.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </form>
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <FormControl className={classes.formControl}>
                                <InputLabel htmlFor="search">Image Name</InputLabel>
                                <Input
                                    id="search"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SearchIcon/>
                                        </InputAdornment>
                                    }
                                    placeholder="Search Image"
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={0} sm={2} md={2}>
                        </Grid>
                        <Grid item xs={12} sm={3} md={3}>
                            <form autoComplete="off">
                                <FormControl className={classes.formControl}>
                                    <InputLabel shrink htmlFor="sort-label-placeholder">
                                        Sort
                                    </InputLabel>
                                    <Select
                                        value={sort}
                                        onChange={this.handleSortChange}
                                        input={<Input name="sort" id="sort-label-placeholder"/>}
                                        displayEmpty
                                        name="sort"
                                    >
                                        <MenuItem value="most-popular">Most Popular</MenuItem>
                                        <MenuItem value="a-z">A-Z</MenuItem>
                                        <MenuItem value="updated">Recently Updated</MenuItem>
                                    </Select>
                                </FormControl>
                            </form>
                        </Grid>
                    </Grid>
                </div>
                <ImageList data={data}/>
            </div>
        );
    }

}

MyImages.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MyImages);
