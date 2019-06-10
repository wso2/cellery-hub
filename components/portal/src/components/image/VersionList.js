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
import * as moment from "moment";

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

const data = [
    {
        version: "1.0.1",
        updatedTimestamp: "2019-03-30T05:11:54-0500",
        pullCount: 4
    },
    {
        version: "2.0.1",
        updatedTimestamp: "2018-05-12T05:11:54-0500",
        pullCount: 2
    }
];

class VersionList extends React.Component {

    handleVersionClick = (version) => {
        const {history, match} = this.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        history.push(`/images/${orgName}/${imageName}/${version}`);
    };

    render = () => {
        const {classes} = this.props;
        const columns = [
            {
                name: "version",
                label: "Version",
                options: {
                    customBodyRender: (version) => <Link component={"button"} variant={"subtitle2"}
                        onClick={() => this.handleVersionClick(version)}>{version}</Link>
                }
            },
            {
                name: "updatedTimestamp",
                label: "Last Updated",
                options: {
                    customBodyRender: (timestamp) => moment(timestamp).format(Constants.Format.DATE_TIME)
                }
            },
            {
                name: "pullCount",
                label: "Pulls"
            }
        ];
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

        return (
            <div className={classes.content}>
                <div className={classes.container}>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <FormControl className={classes.formControl}>
                                <Input placeholder={"Search Version"} startAdornment={
                                    <InputAdornment position={"start"}>
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
        params: PropTypes.shape({
            orgName: PropTypes.string.isRequired,
            imageName: PropTypes.string.isRequired
        })
    }).isRequired
};

export default withStyles(styles)(withRouter(VersionList));
