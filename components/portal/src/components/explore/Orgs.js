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
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import OrgList from "../common/OrgList";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    formControl: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1),
        minWidth: "100%"
    },
    placeholderIcon: {
        color: "#999999"
    }
});

const Orgs = (props) => {
    const {classes, data} = props;

    return (
        <Grid container>
            <Grid item xs={12} sm={4} md={4}>
                <FormControl className={classes.formControl}>
                    <InputLabel shrink htmlFor="search-label-placeholder"></InputLabel>
                    <Input
                        id="search"
                        startAdornment={
                            <InputAdornment position="start">
                                <SearchIcon className={classes.placeholderIcon}/>
                            </InputAdornment>
                        }
                        placeholder="Search Organization"
                    />
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <OrgList data={data}/>
            </Grid>
        </Grid>
    );
};


Orgs.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default withStyles(styles)(Orgs);
