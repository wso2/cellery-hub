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

import InputLabel from "@material-ui/core/InputLabel";
import Constants from "../../utils/constants";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import ImageList from "../common/ImageList";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import MenuItem from "@material-ui/core/MenuItem";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    formControl: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(1),
        minWidth: "100%"
    }
});

class OrgImageList extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            totalCount: 0,
            images: [],
            sort: Constants.SortingOrder.RECENTLY_UPDATED,
            search: {
                imageName: {
                    value: "",
                    error: ""
                }
            },
            pagination: {
                pageNo: OrgImageList.DEFAULT_PAGE_NO,
                rowsPerPage: OrgImageList.DEFAULT_ROWS_PER_PAGE
            }
        };
    }

    componentDidMount() {
        const {pagination, sort} = this.state;
        this.searchImages(pagination.rowsPerPage, pagination.pageNo, sort);
    }

    handleImageNameSearchChange = (event) => {
        const imageName = event.currentTarget.value;
        let errorMessage = "";
        if (imageName) {
            if (!new RegExp(`^${Constants.Pattern.PARTIAL_CELLERY_ID}$`).test(imageName)) {
                errorMessage = "Image name can only contain lower case letters, numbers and dashes";
            }
        }
        this.setState((prevState) => ({
            search: {
                ...prevState.search,
                imageName: {
                    value: imageName,
                    error: errorMessage
                }
            }
        }));
    };

    handleImageNameSearchKeyDown = (event) => {
        if (event.keyCode === Constants.KeyCode.ENTER) {
            const {pagination, sort} = this.state;
            this.searchImages(pagination.rowsPerPage, pagination.pageNo, sort);
        }
    };

    handleSearchButtonClick = () => {
        const {pagination, sort} = this.state;
        this.searchImages(pagination.rowsPerPage, pagination.pageNo, sort);
    };

    handlePageChange = (rowsPerPage, pageNo) => {
        const {sort} = this.state;
        this.setState({
            pagination: {
                pageNo: pageNo,
                rowsPerPage: rowsPerPage
            }
        });
        this.searchImages(rowsPerPage, pageNo, sort);
    };

    handleSortChange = (event) => {
        const {pagination} = this.state;
        const newSort = event.target.value;
        this.setState({
            sort: newSort
        });
        this.searchImages(pagination.rowsPerPage, pagination.pageNo, newSort);
    };

    searchImages = (rowsPerPage, pageNo, sort) => {
        const self = this;
        const {globalState, match} = self.props;
        const {search} = self.state;
        const orgName = match.params.orgName;

        const queryParams = {
            imageName: search.imageName.value ? `*${search.imageName.value}*` : "*",
            orderBy: sort,
            resultLimit: rowsPerPage,
            offset: pageNo * rowsPerPage
        };
        NotificationUtils.showLoadingOverlay("Fetching organizations", globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/images/${orgName}${HttpUtils.generateQueryParamString(queryParams)}`,
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

    render() {
        const {classes, match} = this.props;
        const {search, sort, images} = this.state;
        const orgName = match.params.orgName;

        return (
            <React.Fragment>
                <Grid container>
                    <Grid item xs={12} sm={7} md={7}>
                        <FormControl className={classes.formControl} error={search.imageName.error}>
                            <Input placeholder={"Search Images"} type={"text"}
                                value={search.imageName.value} onChange={this.handleImageNameSearchChange}
                                onKeyDown={this.handleImageNameSearchKeyDown}
                                endAdornment={
                                    <InputAdornment position={"end"}>
                                        <IconButton aria-label={"Search Images"} onClick={this.handleSearchButtonClick}>
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
                    <Grid item xs={12} sm={1} md={1} />
                    <Grid item xs={12} sm={4} md={4}>
                        <form autoComplete={"off"}>
                            <FormControl className={classes.formControl}>
                                <InputLabel shrink htmlFor={"sort-label-placeholder"}>Sort</InputLabel>
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
                    <Grid item xs={12} sm={12} md={12}>
                        <ImageList pageData={images.map((image) => ({...image, orgName: orgName}))}
                            onPageChange={this.handlePageChange}/>
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }

}

OrgImageList.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            imageName: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    classes: PropTypes.object.isRequired,
    organization: PropTypes.string.isRequired
};

export default withRouter(withStyles(styles)(withGlobalState(OrgImageList)));
