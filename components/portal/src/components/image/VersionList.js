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
import FormHelperText from "@material-ui/core/FormHelperText";
import GetApp from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";
import * as moment from "moment";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    formControl: {
        minWidth: "100%"
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
    },
    noVersionsMessage: {
        textAlign: "center",
        fontSize: "1em",
        fontWeight: 300,
        color: "#808080",
        maxWidth: "50vw"
    }
});

class VersionList extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);

        const queryParams = HttpUtils.parseQueryParams(props.location.search);
        const version = queryParams.version ? queryParams.version : "";
        this.state = {
            isLoading: true,
            totalCount: 0,
            versions: [],
            search: {
                version: {
                    value: version,
                    error: this.getErrorForVersion(version)
                }
            },
            sort: queryParams.sort ? queryParams.sort : Constants.SortingOrder.MOST_POPULAR,
            pagination: {
                pageNo: queryParams.pageNo ? queryParams.pageNo : VersionList.DEFAULT_PAGE_NO,
                rowsPerPage: queryParams.rowsPerPage ? queryParams.rowsPerPage : VersionList.DEFAULT_ROWS_PER_PAGE
            }
        };
    }

    componentDidMount() {
        const {pagination, sort} = this.state;
        this.searchVersions(pagination.rowsPerPage, pagination.pageNo, sort);
    }

    handleVersionClick = (version) => {
        const {history, match} = this.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        history.push(`/images/${orgName}/${imageName}/${version}`);
    };

    handleVersionSearchChange = (event) => {
        const self = this;
        const version = event.currentTarget.value;
        self.handleQueryParamUpdate({
            version: version ? version : null
        });
        self.setState((prevState) => ({
            search: {
                ...prevState.search,
                version: {
                    value: version,
                    error: self.getErrorForVersion(version)
                }
            }
        }));
    };

    getErrorForVersion = (version) => {
        let errorMessage = "";
        if (version) {
            if (!new RegExp(`^${Constants.Pattern.PARTIAL_IMAGE_VERSION}$`).test(version)) {
                errorMessage = "Version can only contain lower case letters, numbers, dashes and dots";
            }
        }
        return errorMessage;
    };

    handleVersionSearchKeyDown = (event) => {
        if (event.keyCode === Constants.KeyCode.ENTER) {
            const {pagination, sort} = this.state;
            this.searchVersions(pagination.rowsPerPage, pagination.pageNo, sort);
        }
    };

    handleSearchButtonClick = () => {
        const {pagination, sort} = this.state;
        this.searchVersions(pagination.rowsPerPage, pagination.pageNo, sort);
    };

    handleChangePageNo = (event, newPageNo) => {
        const {pagination, sort} = this.state;
        this.handleQueryParamUpdate({
            pageNo: newPageNo
        });
        this.setState((prevState) => ({
            pagination: {
                ...prevState.pagination,
                pageNo: newPageNo
            }
        }));
        this.searchVersions(pagination.rowsPerPage, newPageNo, sort);
    };

    handleChangeRowsPerPage = (event) => {
        const {pagination, sort} = this.state;
        const newRowsPerPage = event.target.value;
        const newPageNoCandidate = Math.trunc((pagination.pageNo * pagination.rowsPerPage) / newRowsPerPage);
        const newPageNo = newPageNoCandidate >= 0 ? newPageNoCandidate : 0;
        this.handleQueryParamUpdate({
            pageNo: newPageNo,
            rowsPerPage: newRowsPerPage
        });
        this.setState((prevState) => ({
            pagination: {
                ...prevState.pagination,
                pageNo: newPageNo,
                rowsPerPage: newRowsPerPage
            }
        }));
        this.searchVersions(newRowsPerPage, newPageNo, sort);
    };

    handleSortChange = (event) => {
        const {pagination} = this.state;
        const newSort = event.target.value;
        this.handleQueryParamUpdate({
            sort: newSort
        });
        this.setState({
            sort: newSort
        });
        this.searchVersions(pagination.rowsPerPage, pagination.pageNo, newSort);
    };

    handleQueryParamUpdate = (queryParams) => {
        const {location, match, history} = this.props;
        const queryParamsString = HttpUtils.generateQueryParamString({
            ...HttpUtils.parseQueryParams(location.search),
            ...queryParams
        });
        history.replace(match.url + queryParamsString, {
            ...location.state
        });
    };

    searchVersions = (rowsPerPage, pageNo, sort) => {
        const self = this;
        const {globalState, match} = self.props;
        const {search} = self.state;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;

        const queryParams = {
            artifactVersion: search.version.value ? `*${search.version.value}*` : "*",
            orderBy: sort,
            resultLimit: rowsPerPage,
            offset: pageNo * rowsPerPage
        };
        NotificationUtils.showLoadingOverlay("Fetching versions", globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/artifacts/${orgName}/${imageName}/${HttpUtils.generateQueryParamString(queryParams)}`,
                method: "GET"
            },
            globalState
        ).then((response) => {
            self.setState({
                totalCount: response.count,
                versions: response.data
            });
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError && err.getMessage()) {
                errorMessage = err.getMessage();
            } else {
                errorMessage = "Failed to fetch versions";
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
            if (errorMessage) {
                NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
            }
        });
    };

    render = () => {
        const {classes} = this.props;
        const {pagination, sort, search, totalCount, versions} = this.state;
        return (
            <div className={classes.content}>
                <div className={classes.container}>
                    <div className={classes.searchFilters}>
                        <Grid container>
                            <Grid item xs={12} sm={7} md={7}>
                                <FormControl className={classes.formControl} error={search.version.error}>
                                    <Input placeholder={"Search Version"} type={"text"}
                                        value={search.version.value}
                                        onChange={this.handleVersionSearchChange}
                                        onKeyDown={this.handleVersionSearchKeyDown}
                                        endAdornment={
                                            <InputAdornment position={"end"}>
                                                <IconButton aria-label={"Search Version"}
                                                    onClick={this.handleSearchButtonClick}>
                                                    <SearchIcon/>
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                    />
                                    {
                                        search.version.error
                                            ? <FormHelperText>{search.version.error}</FormHelperText>
                                            : null
                                    }
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={1} md={1} />
                            <Grid item xs={12} sm={4} md={4}>
                                <form autoComplete={"off"}>
                                    <FormControl className={classes.formControl}>
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
                    {
                        totalCount > 0
                            ? (
                                <Grid container>
                                    <Grid item xs={12} sm={12} md={12}>
                                        <List component={"nav"}>
                                            {
                                                versions.map((versionDatum) => (
                                                    <div key={versionDatum.version}>
                                                        <ListItem button onClick={() => this.handleVersionClick(
                                                            versionDatum.artifactVersion)}>
                                                            <ListItemText primary={versionDatum.artifactVersion}
                                                                className={classes.versionName}/>
                                                            <Typography variant={"caption"} className={classes.block}
                                                                color={"textPrimary"}>
                                                                <AccessTime className={classes.updated}/>&nbsp;
                                                                Last Updated on {moment(versionDatum.updatedTimestamp)
                                                                    .format(Constants.Format.DATE_TIME)}
                                                            </Typography>
                                                            <GetApp className={classes.elementIcon}/>
                                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                                className={classes.elementText}>
                                                                {versionDatum.pullCount}
                                                            </Typography>
                                                        </ListItem>
                                                        <Divider/>
                                                    </div>
                                                ))
                                            }
                                        </List>
                                        <TablePagination component={"nav"} page={pagination.pageNo}
                                            rowsPerPage={pagination.rowsPerPage} rowsPerPageOptions={[5, 10, 25]}
                                            count={totalCount} onChangePage={this.handleChangePageNo}
                                            onChangeRowsPerPage={this.handleChangeRowsPerPage}/>
                                    </Grid>
                                </Grid>
                            )
                            : (
                                <div className={classes.noVersionsMessage}>
                                    No Image Versions Found
                                </div>
                            )
                    }
                </div>
            </div>
        );
    }

}

VersionList.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired,
        goBack: PropTypes.func.isRequired
    }).isRequired,
    match: PropTypes.shape({
        url: PropTypes.string.isRequired,
        params: PropTypes.shape({
            orgName: PropTypes.string.isRequired,
            imageName: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(VersionList)));
