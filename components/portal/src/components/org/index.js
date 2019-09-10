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

import ArrowBack from "@material-ui/icons/ArrowBack";
import Constants from "../../utils/constants";
import CustomizedTabs from "../common/CustomizedTabs";
import DataUtils from "../../utils/api/dataUtils";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Description from "../common/Description";
import Divider from "@material-ui/core/Divider";
import EditOutlined from "@material-ui/icons/EditOutlined";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton/IconButton";
import Link from "@material-ui/core/Link";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVert from "@material-ui/icons/MoreVert";
import NotFound from "../common/error/NotFound";
import NotificationUtils from "../../utils/common/notificationUtils";
import OrgDeleteDialog from "./OrgDeleteDialog";
import OrgImageList from "./OrgImageList";
import OrgUpdateDialog from "./OrgUpdateDialog";
import React from "react";
import StateHolder from "../common/state/stateHolder";
import Typography from "@material-ui/core/Typography";
import withGlobalState from "../common/state";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import * as PropTypes from "prop-types";
import * as moment from "moment";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    },
    orgsImage: {
        fontSize: 100,
        color: theme.palette.primary.main
    },
    elementText: {
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        color: "#666666"
    },
    description: {
        display: "block",
        color: "#464646",
        paddingBottom: theme.spacing(2),
        marginTop: theme.spacing(1)
    },
    stats: {
        display: "flex"
    },
    title: {
        display: "inline-block"
    },
    orgName: {
        textTransform: "uppercase",
        color: "#ffffff"
    },
    imageContainer: {
        backgroundColor: "#91c56f",
        borderRadius: 5,
        minHeight: 100
    },
    menuIcon: {
        marginRight: theme.spacing(1)
    },
    header: {
        display: "flex"
    },
    titleContainer: {
        flexGrow: 1
    },
    summary: {
        display: "block",
        fontSize: 14,
        marginTop: theme.spacing(3 / 2),
        color: "#333333"
    }

});

class Org extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isOrgNotFound: false,
            orgData: null,
            morePopoverElement: null,
            isEditDialogOpen: false,
            isDeleteDialogOpen: false
        };
    }

    componentDidMount() {
        const self = this;
        const {globalState, match} = self.props;
        const orgName = match.params.orgName;

        NotificationUtils.showLoadingOverlay(`Fetching organization ${orgName}`,
            globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/orgs/${orgName}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            self.setState({
                isLoading: false,
                isOrgNotFound: false,
                orgData: data
            });
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getStatusCode() === 404) {
                    self.setState({
                        isOrgNotFound: true
                    });
                    errorMessage = `Organization ${orgName} not found`;
                } else if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = `Failed to fetch Organization ${orgName}`;
                }
            } else {
                errorMessage = `Failed to fetch Organization ${orgName}`;
            }
            self.setState({
                isLoading: false
            });
            NotificationUtils.hideLoadingOverlay(globalState);
            if (errorMessage) {
                NotificationUtils.showNotification(errorMessage, NotificationUtils.Levels.ERROR, globalState);
            }
        });
    }

    handleMorePopoverOpen = (event) => {
        this.setState({
            morePopoverElement: event.currentTarget
        });
    };

    handleMorePopoverClose = () => {
        this.setState({
            morePopoverElement: null
        });
    };

    handleEditDialogOpen = () => {
        this.setState({
            isEditDialogOpen: true
        });
    };

    handleEditDialogClose = () => {
        this.setState({
            isEditDialogOpen: false
        });
    };

    handleDeleteDialogOpen = () => {
        this.setState({
            isDeleteDialogOpen: true
        });
    };

    handleDeleteDialogClose = () => {
        this.setState({
            isDeleteDialogOpen: false
        });
    };

    render() {
        const {classes, history, location, match} = this.props;
        const {isLoading, isOrgNotFound, orgData, morePopoverElement, isEditDialogOpen,
            isDeleteDialogOpen} = this.state;
        const isMorePopoverOpen = Boolean(morePopoverElement);
        const orgName = match.params.orgName;
        const tabs = [
            {
                label: "Images",
                render: () => <OrgImageList organization={orgName}/>
            },
            {
                label: "About",
                render: () => <Description data={orgData.description}/>
            }
        ];

        return (
            <React.Fragment>
                <div className={classes.content}>
                    <div className={classes.header}>
                        <div className={classes.titleContainer}>
                            {
                                (history.length <= 2 || location.pathname === "/")
                                    ? null
                                    : (
                                        <IconButton color={"inherit"} aria-label={"Back"}
                                            onClick={() => history.goBack()}>
                                            <ArrowBack/>
                                        </IconButton>
                                    )
                            }
                            <Typography variant={"h5"} color={"inherit"} className={classes.title}>
                                {orgName}
                            </Typography>
                        </div>
                        {
                            (orgData && orgData.userRole === Constants.Permission.ADMIN)
                                ? (
                                    <React.Fragment>
                                        <IconButton color={"inherit"} aria-label={"More"}
                                            onClick={this.handleMorePopoverOpen}>
                                            <MoreVert/>
                                        </IconButton>
                                        <Menu id={"image-more-option-menu"} anchorEl={morePopoverElement}
                                            anchorOrigin={{vertical: "top", horizontal: "right"}}
                                            transformOrigin={{vertical: "top", horizontal: "right"}}
                                            open={isMorePopoverOpen}
                                            onClose={this.handleMorePopoverClose}>
                                            <MenuItem onClick={() => {
                                                this.handleEditDialogOpen();
                                                this.handleMorePopoverClose();
                                            }}>
                                                <EditOutlined className={classes.menuIcon}/> Edit
                                            </MenuItem>
                                            <Divider/>
                                            <MenuItem onClick={() => {
                                                this.handleDeleteDialogOpen();
                                                this.handleMorePopoverClose();
                                            }}>
                                                <DeleteOutline className={classes.menuIcon}/> Delete
                                            </MenuItem>
                                        </Menu>
                                    </React.Fragment>
                                )
                                : null
                        }
                    </div>
                    <Divider/>
                    {
                        isLoading || isOrgNotFound || !orgData
                            ? null
                            : (
                                <div className={classes.container}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={2} sm={2} md={2}>
                                            <Grid container justify={"center"} alignContent={"center"}
                                                className={classes.imageContainer}>
                                                <Typography variant={"h2"} color={"inherit"}
                                                    className={classes.orgName}>
                                                    {orgName.charAt(0)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={10} sm={10} md={10}>
                                            <div className={classes.stats}>
                                                <Typography variant={"subtitle2"} color={"inherit"}
                                                    className={classes.elementText}>
                                                    Created by {DataUtils.getUserDisplayName(orgData.firstAuthor)}&nbsp;
                                                    on {moment(orgData.createdTimestamp)
                                                        .format(Constants.Format.DATE_TIME)}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant={"body1"} color={"inherit"}
                                                    className={classes.summary}>
                                                    {orgData.summary}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography variant={"body2"}>
                                                    <Link href={orgData.websiteUrl} target={"_blank"}>
                                                        {orgData.websiteUrl}</Link>
                                                </Typography>
                                            </div>
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={12}>
                                            <Grid container>
                                                <Grid item xs={12} sm={12} md={12}>
                                                    <div>
                                                        <CustomizedTabs tabs={tabs}/>
                                                    </div>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <OrgUpdateDialog open={isEditDialogOpen} org={orgName}
                                        description={orgData.description} summary={orgData.summary}
                                        websiteUrl={orgData.websiteUrl}
                                        onClose={this.handleEditDialogClose} onUpdate={(newData) => {
                                            this.setState((prevState) => ({
                                                orgData: {
                                                    ...prevState.orgData,
                                                    summary: newData.summary,
                                                    description: newData.description,
                                                    websiteUrl: newData.websiteUrl
                                                }
                                            }));
                                        }}/>
                                    <OrgDeleteDialog open={isDeleteDialogOpen} org={orgName}
                                        onClose={this.handleDeleteDialogClose}/>
                                </div>
                            )
                    }
                    {isOrgNotFound ? <NotFound title={`Organization ${orgName} not found`}/> : null}
                </div>
            </React.Fragment>
        );
    }

}

Org.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            orgName: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    location: PropTypes.any.isRequired,
    globalState: PropTypes.instanceOf(StateHolder)
};

export default withStyles(styles)(withRouter(withGlobalState(Org)));
