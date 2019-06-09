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
import Link from "@material-ui/core/Link";
import MUIDataTable from "mui-datatables";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    }, formControl: {
        minWidth: "100%"
    }, placeholderIcon: {
        color: "#999"
    },
    table: {
        marginTop: theme.spacing(2),
        boxShadow: "none"
    }
});

const options = {
    download: false,
    search: false,
    selectableRows: false,
    print: false,
    filter: false,
    responsive: "scroll",
    sort: true,
    rowHover: false,
    viewColumns: false
};

const data = [
    {
        name: "1.0",
        lastUpdated: "2 days ago",
        pulls: "4"
    },
    {
        name: "2.0",
        lastUpdated: "1 hour ago",
        pulls: "2"
    }
];

class VersionList extends React.Component {


    handleItemClick = (path) => {
        const {history} = this.props;
        history.push(path);
    };

    render = () => {
        const {classes, match} = this.props;
        const columns = [
            {
                name: "name",
                label: "Version",
                options: {
                    customBodyRender: (value) => <Link component="button"
                        variant="subtitle2"
                        onClick={(event) => {
                            this.handleItemClick(
                                `/images/${match.params.orgName}/${match.params.imageName}/${value}`,
                                event);
                        }}>{value}</Link>
                }
            },
            {
                name: "lastUpdated",
                label: "Last Updated"
            },
            {
                name: "pulls",
                label: "Pulls"
            }
        ];

        return (
            <div className={classes.content}>
                <div className={classes.container}>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <FormControl className={classes.formControl}>
                                <Input placeholder={"Search Version"} startAdornment={
                                    <InputAdornment position="start">
                                        <SearchIcon className={classes.placeholderIcon}/>
                                    </InputAdornment>
                                }/>
                            </FormControl>
                            <MUIDataTable className={classes.table} data={data} columns={columns} options={options}/>
                        </Grid>
                    </Grid>
                </div>
            </div>
        );
    }

}

VersionList.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired
};

export default withStyles(styles)(withRouter(VersionList));
