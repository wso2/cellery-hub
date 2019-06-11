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

import AccessTime from "@material-ui/icons/AccessTime";
import Constants from "../../utils/constants";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import GetApp from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";
import * as moment from "moment";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    formControl: {
        minWidth: "100%"
    },
    placeholderIcon: {
        color: "#999"
    },
    table: {
        marginTop: theme.spacing(2),
        boxShadow: "none"
    },
    elementText: {
        flex: "none",
        paddingLeft: theme.spacing(2),
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        marginLeft: theme.spacing(2),
        color: "#666666"
    },
    block: {
        marginTop: Number(theme.spacing(1 / 3)),
        fontStyle: "italic",
        display: "block"
    },
    updated: {
        fontSize: 14,
        verticalAlign: "text-bottom"
    },
    versionName: {
        color: theme.palette.primary.main,
        fontWeight: 500,
        fontSize: 12
    },
    searchFilters: {
        marginBottom: theme.spacing(2)
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

    constructor(props) {
        super(props);
        this.state = {
            pageNo: 0,
            rowsPerPage: 10,
            sort: "updated"
        };
    }

    handleVersionClick = (version) => {
        const {history, match} = this.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        history.push(`/images/${orgName}/${imageName}/${version}`);
    };

    handleChangePageNo = (newPageNo) => {
        const {onPageChange} = this.props;
        const {rowsPerPage} = this.state;
        this.setState({
            pageNo: newPageNo
        });
        onPageChange(rowsPerPage, newPageNo);
    };

    handleChangeRowsPerPage = (newRowsPerPage) => {
        const {onPageChange} = this.props;
        const {pageNo} = this.state;
        this.setState({
            rowsPerPage: newRowsPerPage
        });
        onPageChange(newRowsPerPage, pageNo);
    };

    handleSortChange = (event) => {
        this.setState({
            sort: event.target.value
        });
    };

    render = () => {
        const {classes} = this.props;
        const {pageNo, rowsPerPage, sort} = this.state;

        return (
            <div className={classes.content}>
                <div className={classes.container}>
                    <div className={classes.searchFilters}>
                        <Grid container>
                            <Grid item xs={12} sm={7} md={7}>
                                <FormControl className={classes.formControl}>
                                    <Input placeholder={"Search Version"} startAdornment={
                                        <InputAdornment position={"start"}>
                                            <SearchIcon className={classes.placeholderIcon}/>
                                        </InputAdornment>
                                    }/>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={1} md={1} />
                            <Grid item xs={12} sm={4} md={4}>
                                <form autoComplete={"off"}>
                                    <FormControl className={classes.formControl}>
                                        <Select value={sort} onChange={this.handleSortChange} name={"sort"} displayEmpty
                                            input={<Input name={"sort"} id={"sort-label-placeholder"}/>}>
                                            <MenuItem value={"updated"}>Recently Updated</MenuItem>
                                            <MenuItem value={"pulls"}>Most No of Pulls</MenuItem>
                                            <MenuItem value={"a-z"}>A-Z</MenuItem>
                                        </Select>
                                    </FormControl>
                                </form>
                            </Grid>
                        </Grid>
                    </div>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12}>
                            <List component={"nav"}>
                                {data.map((version) => (
                                    <div key={version.version}>
                                        <ListItem button onClick={() => this.handleVersionClick(version)}>
                                            <ListItemText primary={version.version} className={classes.versionName}/>
                                            <Typography variant={"caption"} className={classes.block}
                                                color={"textPrimary"}>
                                                <AccessTime className={classes.updated}/> Last Updated on&nbsp;
                                                {moment(version.updatedTimestamp).format(Constants.Format.DATE_TIME)}
                                            </Typography>
                                            <GetApp className={classes.elementIcon}/>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.elementText}>{version.pullCount}</Typography>
                                        </ListItem>
                                        <Divider/>
                                    </div>
                                ))}
                            </List>
                            <TablePagination component={"nav"} page={pageNo} rowsPerPage={rowsPerPage}
                                count={data.length} onChangePage={this.handleChangePageNo}
                                onChangeRowsPerPage={this.handleChangeRowsPerPage}/>
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
    }).isRequired,
    onPageChange: PropTypes.func
};

export default withStyles(styles)(withRouter(VersionList));
