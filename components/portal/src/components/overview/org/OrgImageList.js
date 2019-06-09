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

import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import ImageList from "../../common/ImageList";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    formControl: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1),
        minWidth: "100%"
    },
    placeholderIcon: {
        color: "#999999"
    }
});

const data = [
    {
        name: "pet-fe",
        summary: "This contains the four components which involves with working with the Pet Store data and"
            + " business logic.",
        organization: "alpha",
        public: true,
        pulls: 10,
        stars: 3,
        lastUpdated: "2 days",
        lastUpdatedBy: "john"
    },
    {
        name: "pet-be",
        summary: "This contains of a single component which serves the portal.",
        organization: "alpha",
        public: true,
        pulls: 15,
        stars: 11,
        lastUpdated: "20 hours",
        lastUpdatedBy: "john"
    }
];

const OrgImageList = (props) => {
    const {classes} = props;
    return (
        <React.Fragment>
            <Grid container>
                <Grid item xs={12} sm={4} md={4}>
                    <FormControl className={classes.formControl}>
                        <Input
                            id="search"
                            startAdornment={
                                <InputAdornment position="start">
                                    <SearchIcon className={classes.placeholderIcon}/>
                                </InputAdornment>
                            }
                            placeholder="Search Image"
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <ImageList data={data}/>
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

OrgImageList.propTypes = {
    classes: PropTypes.object.isRequired,
    organization: PropTypes.string.isRequired
};

export default withStyles(styles)(OrgImageList);
