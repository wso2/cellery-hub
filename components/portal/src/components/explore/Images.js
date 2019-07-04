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

class Images extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);

        const queryParams = HttpUtils.parseQueryParams(props.location.search);
        const imageFQN = queryParams.imageFQN ? queryParams.imageFQN : "";
        this.state = {
            isLoading: true,
            totalCount: 0,
            images: [],
            sort: queryParams.sort ? queryParams.sort : Constants.SortingOrder.MOST_POPULAR,
            search: {
                imageFQN: {
                    value: imageFQN,
                    error: this.getErrorForImageFQN(imageFQN)
                }
            },
            pagination: {
                pageNo: queryParams.pageNo ? queryParams.pageNo : Images.DEFAULT_PAGE_NO,
                rowsPerPage: queryParams.rowsPerPage ? queryParams.rowsPerPage : Images.DEFAULT_ROWS_PER_PAGE
            }
        };
    }

    componentDidMount() {
        const {pagination, sort} = this.state;
        this.searchImages(pagination.rowsPerPage, pagination.pageNo, sort);
    }

    handleImageFQNSearchChange = (event) => {
        const self = this;
        const imageFQN = event.currentTarget.value;
        self.handleQueryParamUpdate({
            imageFQN: imageFQN ? imageFQN : null
        });
        self.setState((prevState) => ({
            search: {
                ...prevState.search,
                imageFQN: {
                    value: imageFQN,
                    error: self.getErrorForImageFQN(imageFQN)
                }
            }
        }));
    };

    getErrorForImageFQN = (imageFQN) => {
        let errorMessage = "";
        if (imageFQN) {
            if (!new RegExp(`^${Constants.Pattern.PARTIAL_IMAGE_FQN}$`).test(imageFQN)) {
                errorMessage = "Image name can only contain lower case letters, numbers and dashes";
            }
        }
        return errorMessage;
    };

    handleImageFQNSearchKeyDown = (event) => {
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
        this.searchImages(rowsPerPage, pageNo, sort);
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
        this.searchImages(pagination.rowsPerPage, pagination.pageNo, newSort);
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

    searchImages = (rowsPerPage, pageNo, sort) => {
        const self = this;
        const {globalState} = self.props;
        const {search} = self.state;

        let orgName;
        let imageFQN;
        if (search.imageFQN.value) {
            const imageMatch = search.imageFQN.value.match(`^${Constants.Pattern.PARTIAL_IMAGE_FQN}$`);
            if (imageMatch) {
                if (imageMatch[2]) {
                    orgName = `*${imageMatch[1]}`;
                    imageFQN = `${imageMatch[2]}*`;
                } else {
                    orgName = "*";
                    imageFQN = `*${imageMatch[1]}*`;
                }
            }
        }

        const queryParams = {
            orgName: orgName ? orgName : "*",
            imageName: imageFQN ? imageFQN : "*",
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
                url: `/images${HttpUtils.generateQueryParamString(queryParams)}`,
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
        const {search, sort, images, totalCount, pagination, isLoading} = this.state;
        return (
            <React.Fragment>
                <Grid container>
                    <Grid item xs={12} sm={4} md={4}>
                        <FormControl className={classes.formControl} error={search.imageFQN.error}>
                            <InputLabel htmlFor={"search"}>Search Image</InputLabel>
                            <Input id={"search"}
                                value={search.imageFQN.value} onChange={this.handleImageFQNSearchChange}
                                onKeyDown={this.handleImageFQNSearchKeyDown}
                                endAdornment={
                                    <InputAdornment position={"end"}>
                                        <IconButton aria-label={"Search Image"} onClick={this.handleSearchButtonClick}>
                                            <SearchIcon/>
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                            {
                                search.imageFQN.error
                                    ? <FormHelperText>{search.imageFQN.error}</FormHelperText>
                                    : null
                            }
                        </FormControl>
                    </Grid>
                    <Grid item sm={5} md={5} />
                    <Grid item xs={12} sm={3} md={3}>
                        <form autoComplete={"off"}>
                            <FormControl className={classes.formControl}>
                                <InputLabel shrink htmlFor={"sort-label-placeholder"}>Sort</InputLabel>
                                <Select value={sort} displayEmpty name={"sort"} onChange={this.handleSortChange}
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
                    {
                        isLoading
                            ? null
                            : (
                                <Grid item xs={12} sm={12} md={12}>
                                    <ImageList pageData={images} onPageChange={this.handlePageChange}
                                        totalCount={totalCount} rowsPerPage={pagination.rowsPerPage}
                                        pageNo={pagination.pageNo}/>
                                </Grid>
                            )
                    }
                </Grid>
            </React.Fragment>
        );
    }

}

Images.propTypes = {
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

export default withStyles(styles)(withGlobalState(withRouter(Images)));
