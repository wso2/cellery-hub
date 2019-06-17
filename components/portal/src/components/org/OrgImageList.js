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
import IconButton from "@material-ui/core/IconButton";
import ImageList from "../common/ImageList";
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
        updatedTimestamp: "2019-05-07T05:11:54-0500",
        lastAuthor: "john"
    },
    {
        orgName: "alpha",
        imageName: "pet-be",
        summary: "This contains of a single component which serves the portal.",
        visibility: "PRIVATE",
        pullCount: 15,
        updatedTimestamp: "2019-04-10T05:11:54-0500",
        lastAuthor: "john"
    }
];

class OrgImageList extends React.Component {

    handlePageChange = () => {
        // TODO: Load new data for page
    };

    render() {
        const {classes} = this.props;
        return (
            <React.Fragment>
                <Grid container>
                    <Grid item xs={12} sm={4} md={4}>
                        <FormControl className={classes.formControl}>
                            <Input placeholder={"Search Organization"} type={"text"}
                                endAdornment={
                                    <InputAdornment position={"end"}>
                                        <IconButton aria-label={"Search Organization"}>
                                            <SearchIcon/>
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <ImageList pageData={images} onPageChange={this.handlePageChange}/>
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }

}

OrgImageList.propTypes = {
    classes: PropTypes.object.isRequired,
    organization: PropTypes.string.isRequired
};

export default withStyles(styles)(OrgImageList);
