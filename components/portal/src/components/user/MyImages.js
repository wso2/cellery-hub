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
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import ImageList from "../common/ImageList";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
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
    }
});

class MyImages extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);

        const queryParams = HttpUtils.parseQueryParams(props.location.search);
        const imageName = queryParams.imageName ? queryParams.imageName : "";
        this.state = {
            isLoading: true,
            totalCount: 0,
            images: [],
            orgs: [],
            search: {
                orgName: queryParams.orgName ? queryParams.orgName : "*",
                imageName: {
                    value: imageName,
                    error: this.getErrorForImageName(imageName)
                }
            },
            pagination: {
                pageNo: queryParams.pageNo ? queryParams.pageNo : MyImages.DEFAULT_PAGE_NO,
                rowsPerPage: queryParams.rowsPerPage ? queryParams.rowsPerPage : MyImages.DEFAULT_ROWS_PER_PAGE
            },
            sort: queryParams.sort ? queryParams.sort : Constants.SortingOrder.MOST_POPULAR
        };
    }

    componentDidMount() {
        const self = this;
        const {globalState} = self.props;
        const {search, pagination, sort} = self.state;

        const queryParams = {
            orgName: "*",
            resultLimit: 25,
            offset: 0
        };
        const currentUserId = globalState.get(StateHolder.USER).userId;
        NotificationUtils.showLoadingOverlay("Fetching organizations", globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/orgs/users/${currentUserId}${HttpUtils.generateQueryParamString(queryParams)}`,
                method: "GET"
            },
            globalState
        ).then((response) => {
            self.setState({
                orgs: response.data.map((org) => org.orgName)
            });

            self.searchImages(search.orgName, pagination.rowsPerPage, pagination.pageNo, sort);
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError && err.getMessage()) {
                errorMessage = err.getMessage();
            } else {
                errorMessage = "Failed to fetch organizations";
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
            if (errorMessage) {
                NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
            }
        });
    }

    handleOrgChange = (event) => {
        const {pagination, sort} = this.state;
        const newOrg = event.target.value;
        this.handleQueryParamUpdate({
            orgName: newOrg ? newOrg : null
        });
        this.setState((prevState) => ({
            search: {
                ...prevState.search,
                orgName: newOrg
            }
        }));
        this.searchImages(newOrg, pagination.rowsPerPage, pagination.pageNo, sort);
    };

    handleImageNameSearchChange = (event) => {
        const self = this;
        const imageName = event.currentTarget.value;
        this.handleQueryParamUpdate({
            imageName: imageName ? imageName : null
        });
        self.setState((prevState) => ({
            search: {
                ...prevState.search,
                imageName: {
                    value: imageName,
                    error: self.getErrorForImageName(imageName)
                }
            }
        }));
    };

    getErrorForImageName = (imageName) => {
        let errorMessage = "";
        if (imageName) {
            if (!new RegExp(`^${Constants.Pattern.PARTIAL_CELLERY_ID}$`).test(imageName)) {
                errorMessage = "Image name can only contain lower case letters, numbers and dashes";
            }
        }
        return errorMessage;
    };

    handleImageNameSearchKeyDown = (event) => {
        if (event.keyCode === Constants.KeyCode.ENTER) {
            const {search, pagination, sort} = this.state;
            this.searchImages(search.orgName, pagination.rowsPerPage, pagination.pageNo, sort);
        }
    };

    handleSearchButtonClick = () => {
        const {search, pagination, sort} = this.state;
        this.searchImages(search.orgName, pagination.rowsPerPage, pagination.pageNo, sort);
    };

    handleSortChange = (event) => {
        const {search, pagination} = this.state;
        const newSort = event.target.value;
        this.handleQueryParamUpdate({
            sort: newSort
        });
        this.setState({
            sort: newSort
        });
        this.searchImages(search.orgName, pagination.rowsPerPage, pagination.pageNo, newSort);
    };

    handlePageChange = (rowsPerPage, pageNo) => {
        const {search, sort} = this.state;
        this.handleQueryParamUpdate({
            pageNo: pageNo,
            rowsPerPage: rowsPerPage
        });
        this.setState({
            pagination: {
                pageNo: pageNo,
                rowsPerPage: rowsPerPage
            }
        });
        this.searchImages(search.orgName, rowsPerPage, pageNo, sort);
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

    searchImages = (orgName, rowsPerPage, pageNo, sort) => {
        const self = this;
        const {globalState} = self.props;
        const {search} = self.state;

        const queryParams = {
            orgName: orgName,
            imageName: search.imageName.value ? `*${search.imageName.value}*` : "*",
            orderBy: sort,
            resultLimit: rowsPerPage,
            offset: pageNo * rowsPerPage
        };
        const currentUserId = globalState.get(StateHolder.USER).userId;
        NotificationUtils.showLoadingOverlay("Fetching images", globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/images/users/${currentUserId}${HttpUtils.generateQueryParamString(queryParams)}`,
                method: "GET"
            },
            globalState
        ).then((response) => {
            self.setState({
                totalCount: response.count,
                images: response.data
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
                errorMessage = "Failed to fetch images";
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
        const {pagination, totalCount, search, sort, images, orgs} = this.state;

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
                                    <Select value={search.orgName} displayEmpty name={"organization"}
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
                            <FormControl className={classes.formControl} error={search.imageName.error}>
                                <InputLabel htmlFor={"search"}>Image Name</InputLabel>
                                <Input id={"search"} placeholder={"Search Image"}
                                    value={search.imageName.value}
                                    onChange={this.handleImageNameSearchChange}
                                    onKeyDown={this.handleImageNameSearchKeyDown}
                                    endAdornment={
                                        <InputAdornment position={"end"}>
                                            <IconButton aria-label={"Search Image"}
                                                onClick={this.handleSearchButtonClick}>
                                                <SearchIcon/>
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                                {
                                    search.imageName.error
                                        ? <FormHelperText>{search.imageName.error}</FormHelperText>
                                        : null
                                }
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
                <ImageList pageData={images} onPageChange={this.handlePageChange} totalCount={totalCount}
                    rowsPerPage={pagination.rowsPerPage} pageNo={pagination.pageNo}/>
            </div>
        );
    }

}

MyImages.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }).isRequired,
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired,
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withGlobalState(MyImages));
