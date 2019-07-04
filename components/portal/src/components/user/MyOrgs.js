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

import AddCircleOutline from "@material-ui/icons/AddCircleOutline";
import Button from "@material-ui/core/Button";
import Constants from "../../utils/constants";
import CreateOrg from "../../img/CreateOrg.jpg";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import NotificationUtils from "../../utils/common/notificationUtils";
import OrgCreateDialog from "../org/OrgCreateDialog";
import OrgList from "../common/OrgList";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
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
    rightIcon: {
        right: 0,
        marginRight: theme.spacing(1)
    },
    secondaryTitle: {
        marginTop: theme.spacing(2),
        fontWeight: 400
    },
    secondaryText: {
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2),
        textAlign: "center"
    },
    createOrgImg: {
        height: 170,
        marginBottom: theme.spacing(3),
        marginTop: theme.spacing(3)
    }
});

class MyOrgs extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);

        const queryParams = HttpUtils.parseQueryParams(props.location.search);
        const orgName = queryParams.orgName ? queryParams.orgName : "";
        this.state = {
            isDialogOpen: false,
            isLoading: true,
            isUserOrgPresent: false,
            totalCount: 0,
            orgs: [],
            search: {
                orgName: {
                    value: orgName,
                    error: this.getErrorForOrgName(orgName)
                }
            },
            pagination: {
                pageNo: queryParams.pageNo ? queryParams.pageNo : MyOrgs.DEFAULT_PAGE_NO,
                rowsPerPage: queryParams.rowsPerPage ? queryParams.rowsPerPage : MyOrgs.DEFAULT_ROWS_PER_PAGE
            }
        };
    }

    componentDidMount() {
        const self = this;
        const {globalState} = self.props;
        const {pagination} = self.state;

        const queryParams = {
            orgName: "*",
            resultLimit: 0,
            offset: 0
        };
        const currentUserId = globalState.get(StateHolder.USER).userId;
        NotificationUtils.showLoadingOverlay("Checking your organizations", globalState);
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
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isUserOrgPresent: response.count > 0,
                isLoading: false
            });
            self.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError && err.getMessage()) {
                errorMessage = err.getMessage();
            } else {
                errorMessage = "Failed to check your organizations";
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

    handleCreateOrgDialogOpen = () => {
        this.setState({
            isDialogOpen: true
        });
    };

    handleCreateOrgDialogClose = () => {
        const {pagination} = this.state;
        this.setState({
            isDialogOpen: false
        });
        this.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
    };

    handleOrgNameSearchChange = (event) => {
        const self = this;
        const orgName = event.currentTarget.value;
        this.handleQueryParamUpdate({
            orgName: orgName ? orgName : null
        });
        self.setState((prevState) => ({
            search: {
                ...prevState.search,
                orgName: {
                    value: orgName,
                    error: self.getErrorForOrgName(orgName)
                }
            }
        }));
    };

    getErrorForOrgName = (orgName) => {
        let errorMessage = "";
        if (orgName) {
            if (!new RegExp(`^${Constants.Pattern.PARTIAL_CELLERY_ID}$`).test(orgName)) {
                errorMessage = "Organization name can only contain lower case letters, numbers and dashes";
            }
        }
        return errorMessage;
    };

    handleOrgNameSearchKeyDown = (event) => {
        if (event.keyCode === Constants.KeyCode.ENTER) {
            const {pagination} = this.state;
            this.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
        }
    };

    handleSearchButtonClick = () => {
        const {pagination} = this.state;
        this.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
    };

    handlePageChange = (rowsPerPage, pageNo) => {
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
        this.searchOrgs(rowsPerPage, pageNo);
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

    searchOrgs = (rowsPerPage, pageNo) => {
        const self = this;
        const {globalState} = self.props;
        const {search} = self.state;

        const queryParams = {
            orgName: search.orgName.value ? `*${search.orgName.value}*` : "*",
            resultLimit: rowsPerPage,
            offset: pageNo * rowsPerPage
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
                totalCount: response.count,
                orgs: response.data
            });
            if (response.count > 0) {
                self.setState({
                    isUserOrgPresent: true
                });
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
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
    };

    render = () => {
        const {classes} = this.props;
        const {isDialogOpen, isLoading, isUserOrgPresent, totalCount, search, pagination, orgs} = this.state;

        return (
            <React.Fragment>
                {
                    !isLoading && isUserOrgPresent
                        ? (
                            <div className={classes.content}>
                                <Typography variant={"h5"} color={"inherit"}>
                                    Organizations
                                </Typography>
                                <Divider/>
                                <div className={classes.container}>
                                    <Grid container>
                                        <Grid item xs={12} sm={4} md={4}>
                                            <FormControl className={classes.formControl} error={search.orgName.error}>
                                                <InputLabel htmlFor={"search"}>Organization Name</InputLabel>
                                                <Input id={"search"} placeholder={"Search Organization"}
                                                    value={search.orgName.value}
                                                    onChange={this.handleOrgNameSearchChange}
                                                    onKeyDown={this.handleOrgNameSearchKeyDown}
                                                    endAdornment={
                                                        <InputAdornment position={"end"}>
                                                            <IconButton aria-label={"Search Organization"}
                                                                onClick={this.handleSearchButtonClick}>
                                                                <SearchIcon/>
                                                            </IconButton>
                                                        </InputAdornment>
                                                    }
                                                />
                                                {
                                                    search.orgName.error
                                                        ? <FormHelperText>{search.orgName.error}</FormHelperText>
                                                        : null
                                                }
                                            </FormControl>
                                        </Grid>
                                        <Grid item sm={4} md={4} />
                                        <Grid item xs={12} sm={4} md={4}>
                                            <Grid container alignItems={"baseline"} justify={"flex-end"}
                                                direction={"row"}>
                                                <Button variant={"contained"} color={"primary"}
                                                    className={classes.button}
                                                    onClick={this.handleCreateOrgDialogOpen}>
                                                    <AddCircleOutline className={classes.rightIcon}/>
                                                    Create
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </div>
                                <OrgList pageData={orgs} onPageChange={this.handlePageChange} totalCount={totalCount}
                                    rowsPerPage={pagination.rowsPerPage} pageNo={pagination.pageNo}/>
                            </div>
                        )
                        : null
                }
                {
                    !isLoading && !isUserOrgPresent
                        ? (
                            <div className={classes.content}>
                                <div className={classes.container}>
                                    <Grid container alignContent={"center"} direction={"column"} justify={"center"}
                                        alignItems={"center"}>
                                        <Typography variant={"h5"} color={"inherit"}>
                                            Welcome to Cellery Hub!
                                        </Typography>
                                        <Typography variant={"h6"} color={"textSecondary"}
                                            className={classes.secondaryTitle}>
                                            Get started by creating an organization
                                        </Typography>
                                        <img src={CreateOrg} className={classes.createOrgImg} alt={"Create Org"}/>
                                        <Typography variant={"subtitle1"} color={"inherit"}
                                            className={classes.secondaryText}>
                                            Create your organization to share your images with others
                                        </Typography>
                                        <Button variant={"contained"} color={"primary"} className={classes.button}
                                            onClick={this.handleCreateOrgDialogOpen}>
                                            <AddCircleOutline className={classes.rightIcon}/>
                                            Create
                                        </Button>
                                    </Grid>
                                </div>
                            </div>
                        )
                        : null
                }
                <OrgCreateDialog open={isDialogOpen} onClose={this.handleCreateOrgDialogClose}/>
            </React.Fragment>
        );
    }

}

MyOrgs.propTypes = {
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

export default withStyles(styles)(withGlobalState(MyOrgs));
