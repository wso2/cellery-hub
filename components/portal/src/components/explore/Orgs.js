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
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import NotificationUtils from "../../utils/common/notificationUtils";
import OrgList from "../common/OrgList";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../common/state";
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

class Orgs extends React.Component {

    static DEFAULT_ROWS_PER_PAGE = 5;
    static DEFAULT_PAGE_NO = 0;

    constructor(props) {
        super(props);
        this.state = {
            totalCount: 0,
            orgs: [],
            search: {
                orgName: {
                    value: "",
                    error: ""
                }
            },
            pagination: {
                pageNo: Orgs.DEFAULT_PAGE_NO,
                rowsPerPage: Orgs.DEFAULT_ROWS_PER_PAGE
            }
        };
    }

    componentDidMount() {
        const {pagination} = this.state;
        this.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
    }

    handleOrgNameSearchChange = (event) => {
        const orgName = event.currentTarget.value;
        let errorMessage = "";
        if (orgName) {
            if (!new RegExp(`^${Constants.Pattern.CELLERY_ID}$`).test(orgName)) {
                errorMessage = "Organization name can only contain lower case letters, numbers and dashes"
                    + " and should be surrounded by lower case letters and numbers";
            }
        }
        this.setState((prevState) => ({
            search: {
                ...prevState.search,
                orgName: {
                    value: orgName,
                    error: errorMessage
                }
            }
        }));
    };

    handleOrgNameSearchKeyDown = (event) => {
        const {pagination} = this.state;
        if (event.keyCode === Constants.KeyCode.ENTER) {
            this.searchOrgs(pagination.rowsPerPage, pagination.pageNo);
        }
    };

    handlePageChange = (rowsPerPage, pageNo) => {
        this.setState({
            pagination: {
                pageNo: pageNo,
                rowsPerPage: rowsPerPage
            }
        });
        this.searchOrgs(rowsPerPage, pageNo);
    };

    searchOrgs = (rowsPerPage, pageNo) => {
        const self = this;
        const {globalState} = self.props;
        const {search} = self.state;

        const queryParams = {
            orgName: search.orgName.value ? `*${search.orgName.value}*` : "*",
            resultLimit: rowsPerPage,
            offset: pageNo
        };
        NotificationUtils.showLoadingOverlay("Fetching organizations", globalState);
        HttpUtils.callHubAPI(
            {
                url: `/orgs${HttpUtils.generateQueryParamString(queryParams)}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            self.setState({
                totalCount: data.count,
                orgs: data.data
            });
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError && err.getMessage()) {
                errorMessage = err.getMessage();
            } else {
                errorMessage = "Failed to fetch organizations";
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            if (errorMessage) {
                NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
            }
        });
    };

    render() {
        const {classes} = this.props;
        const {totalCount, orgs, search} = this.state;
        return (
            <Grid container>
                <Grid item xs={12} sm={4} md={4}>
                    <FormControl className={classes.formControl} error={search.orgName.error}>
                        <InputLabel shrink htmlFor={"search-label-placeholder"}/>
                        <Input id={"search"} placeholder={"Search Organization"} value={search.orgName.value}
                            onChange={this.handleOrgNameSearchChange} onKeyDown={this.handleOrgNameSearchKeyDown}
                            startAdornment={
                                <InputAdornment position={"start"}>
                                    <SearchIcon className={classes.placeholderIcon}/>
                                </InputAdornment>
                            }/>
                        {search.orgName.error ? <FormHelperText>{search.orgName.error}</FormHelperText> : null}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <OrgList pageData={orgs} onPageChange={this.handlePageChange} totalCount={totalCount}
                        rowsPerPage={Orgs.DEFAULT_ROWS_PER_PAGE} pageNo={Orgs.DEFAULT_PAGE_NO}/>
                </Grid>
            </Grid>
        );
    }

}

Orgs.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withGlobalState(Orgs));
