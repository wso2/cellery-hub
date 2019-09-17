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

/* eslint max-lines: ["error", 600] */

import AccessTime from "@material-ui/icons/AccessTime";
import ArrowBack from "@material-ui/icons/ArrowBack";
import CellImage from "../../../img/CellImage";
import Constants from "../../../utils/constants";
import CustomizedTabs from "../../common/CustomizedTabs";
import DataUtils from "../../../utils/api/dataUtils";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import DependencyDiagram from "../dependencyDiagram/index";
import Description from "../../common/Description";
import Divider from "@material-ui/core/Divider";
import EditOutlined from "@material-ui/icons/EditOutlined";
import FileCopy from "@material-ui/icons/FileCopyOutlined";
import GetApp from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import HelpOutline from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton/IconButton";
import InputBase from "@material-ui/core/InputBase/InputBase";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVert from "@material-ui/icons/MoreVert";
import NotFound from "../../common/error/NotFound";
import NotificationUtils from "../../../utils/common/notificationUtils";
import React from "react";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import Typography from "@material-ui/core/Typography";
import VersionDeleteDialog from "./VersionDeleteDialog";
import VersionUpdateDialog from "./VersionUpdateDialog";
import classNames from "classnames";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../../utils/api/httpUtils";
import withGlobalState, {StateHolder} from "../../common/state/index";
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
    cellImage: {
        fontSize: 40,
        color: theme.palette.primary.main
    },
    imageContainer: {
        padding: theme.spacing(3),
        border: "1px solid #999"
    },
    rightPanel: {
        borderLeft: "1px solid #eee"
    },
    elementText: {
        paddingLeft: theme.spacing(1 / 2),
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        color: "#666666"
    },
    summary: {
        display: "block",
        color: "#464646",
        paddingBottom: theme.spacing(2)
    },
    stats: {
        display: "flex"
    },
    spaceLeft: {
        marginLeft: theme.spacing(4)
    },
    rightPanelSubTitle: {
        marginTop: theme.spacing(2),
        color: "#666666",
        fontSize: 12,
        display: "inline"
    },
    copyContainer: {
        display: "flex",
        color: "#ffffff",
        padding: theme.spacing(1)

    },
    copyInput: {
        flexGrow: 1,
        color: "#ffffff",
        fontSize: 13,
        marginLeft: Number(theme.spacing(1 / 2))
    },
    copyInputMultiline: {
        flexGrow: 1,
        color: "#ffffff",
        fontSize: 13
    },
    copyContent: {
        backgroundColor: "#445d6e",
        borderRadius: 5,
        paddingLeft: theme.spacing(1),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2)
    },
    captionText: {
        color: "#666666",
        marginTop: Number(theme.spacing(1 / 2))
    },
    rightPanelTitle: {
        display: "block",
        marginBottom: theme.spacing(1)
    },
    sidePanelContent: {
        marginTop: theme.spacing(1)
    },
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1)
    },
    copy: {
        fontSize: 16
    },
    copyIconButton: {
        height: "fit-content"
    },
    title: {
        display: "inline-block"
    },
    labelContainer: {
        display: "none"
    },
    helpBtn: {
        display: "inline",
        width: 15,
        height: 15
    },
    helpIconBtn: {
        padding: 0,
        marginLeft: theme.spacing(1 / 2)
    },
    menuIcon: {
        marginRight: theme.spacing(1)
    },
    header: {
        display: "flex"
    },
    titleContainer: {
        flexGrow: 1
    }
});

class ImageVersion extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isPullCopiedTooltipOpen: false,
            isRunCopiedTooltipOpen: false,
            isLoading: true,
            isVersionNotFound: false,
            versionData: null,
            morePopoverElement: null,
            isEditDialogOpen: false,
            isDeleteDialogOpen: false
        };

        this.pullCmdRef = React.createRef();
        this.runCmdRef = React.createRef();
    }

    componentDidMount() {
        this.loadImageMetadata();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {match} = this.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        const version = match.params.version;
        if (!(orgName === prevProps.match.params.orgName && imageName === prevProps.match.params.imageName
            && version === prevProps.match.params.version)) {
            this.loadImageMetadata();
        }
    }

    loadImageMetadata() {
        const self = this;
        const {globalState, match} = self.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        const version = match.params.version;

        NotificationUtils.showLoadingOverlay(`Fetching image version ${orgName}/${imageName}:${version}`,
            globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/artifacts/${orgName}/${imageName}/${version}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            self.setState({
                isLoading: false,
                isVersionNotFound: false,
                versionData: data
            });
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getStatusCode() === 404) {
                    self.setState({
                        isVersionNotFound: true
                    });
                    errorMessage = `Image version ${orgName}/${imageName}:${version} not found`;
                } else if (err.getMessage()) {
                    errorMessage = err.getMessage();
                } else {
                    errorMessage = `Failed to fetch Image version ${orgName}/${imageName}:${version}`;
                }
            } else {
                errorMessage = `Failed to fetch Image version ${orgName}/${imageName}:${version}`;
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

    copyPullCmdToClipboard = () => {
        if (this.pullCmdRef.current) {
            this.pullCmdRef.current.select();
            document.execCommand("copy");

            this.setState({
                isPullCopiedTooltipOpen: true
            });
        }
    };

    handlePullCmdCopiedTooltipClose = () => {
        this.setState({
            isPullCopiedTooltipOpen: false
        });
    };

    copyRunCmdToClipboard = () => {
        if (this.runCmdRef.current) {
            this.runCmdRef.current.select();
            document.execCommand("copy");

            this.setState({
                isRunCopiedTooltipOpen: true
            });
        }
    };

    handleRunCmdCopiedTooltipClose = () => {
        this.setState({
            isRunCopiedTooltipOpen: false
        });
    };

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

    render = () => {
        const {classes, history, location, match} = this.props;
        const {isPullCopiedTooltipOpen, isRunCopiedTooltipOpen, isLoading, isVersionNotFound, versionData,
            morePopoverElement, isEditDialogOpen, isDeleteDialogOpen} = this.state;
        const isMorePopoverOpen = Boolean(morePopoverElement);
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        const version = match.params.version;
        const tabs = [
            {
                label: "Dependencies",
                render: () => <DependencyDiagram data={versionData.metadata}/>
            },
            {
                label: "Description",
                render: () => <Description data={versionData.description}/>
            }
        ];
        const dependencies = {};
        if (versionData) {
            Object.values(versionData.metadata.components).forEach((component) => {
                Object.entries(component.dependencies.cells).forEach((dependencyEntry) => {
                    dependencies[dependencyEntry[0]] = dependencyEntry[1];
                });
            });
        }

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
                                {orgName}/{imageName}:{version}
                            </Typography>
                        </div>
                        {
                            (versionData && (versionData.userRole === Constants.Permission.PUSH
                                || versionData.userRole === Constants.Permission.ADMIN))
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
                                            {
                                                (versionData.userRole === Constants.Permission.ADMIN)
                                                    ? (
                                                        <React.Fragment>
                                                            <Divider/>
                                                            <MenuItem onClick={() => {
                                                                this.handleDeleteDialogOpen();
                                                                this.handleMorePopoverClose();
                                                            }}>
                                                                <DeleteOutline className={classes.menuIcon}/> Delete
                                                            </MenuItem>
                                                        </React.Fragment>
                                                    )
                                                    : null
                                            }
                                        </Menu>
                                    </React.Fragment>
                                )
                                : null
                        }
                    </div>
                    <Divider/>
                    {
                        isLoading || isVersionNotFound || !versionData
                            ? null
                            : (
                                <div className={classes.container}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} sm={8} md={8}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={4} sm={2} md={2}>
                                                    <Grid container justify={"center"}>
                                                        <div className={classes.imageContainer}>
                                                            <CellImage className={classes.cellImage}/>
                                                        </div>
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={8} sm={10} md={10}>
                                                    <div className={classes.stats}>
                                                        <GetApp className={classes.elementIcon}/>
                                                        <Typography variant={"subtitle2"} color={"inherit"}
                                                            className={classes.elementText}>
                                                            {versionData.pullCount}
                                                        </Typography>
                                                        <AccessTime className={classNames(classes.elementIcon,
                                                            classes.spaceLeft)}/>
                                                        <Typography variant={"body2"} color={"inherit"}
                                                            className={classes.elementText}>
                                                            Last Updated on&nbsp;
                                                            {moment(versionData.updatedTimestamp)
                                                                .format(Constants.Format.DATE_TIME)}
                                                            &nbsp;by {DataUtils.getUserDisplayName(
                                                                versionData.lastAuthor)}
                                                        </Typography>
                                                    </div>

                                                </Grid>
                                                <Grid item xs={12} sm={12} md={12}>
                                                    <CustomizedTabs tabs={tabs}/>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} sm={4} md={4} className={classes.rightPanel}>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.rightPanelTitle}>Cellery Commands</Typography>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.rightPanelSubTitle}>
                                                Pull
                                            </Typography>
                                            <div className={classes.copyContent}>
                                                <div className={classes.copyContainer}>
                                                    <InputBase multiline className={classes.copyInput}
                                                        inputProps={{spellCheck: false}} inputRef={this.pullCmdRef}
                                                        value={`cellery pull ${orgName}/${imageName}:${version}`}/>
                                                    <Tooltip title={"Copied!"} disableFocusListener={false}
                                                        disableHoverListener={false} placement={"top"}
                                                        disableTouchListener={false} open={isPullCopiedTooltipOpen}
                                                        onClose={this.handlePullCmdCopiedTooltipClose}>
                                                        <IconButton color={"inherit"} className={classes.copyIconButton}
                                                            aria-label={"Copy"} onClick={this.copyPullCmdToClipboard}>
                                                            <FileCopy className={classes.copy}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.rightPanelSubTitle}>
                                                Run
                                            </Typography>
                                            <Tooltip title={"-n: Name of the cell instance, -l: Link an instance"
                                            + " with a dependency alias, -d: Start all the dependencies of this Cell "
                                            + "Image in order"} placement={"left"}>
                                                <IconButton aria-label={"Command Help"} className={classes.helpIconBtn}>
                                                    <HelpOutline className={classes.helpBtn}/>
                                                </IconButton>
                                            </Tooltip>
                                            <div className={classes.copyContent}>
                                                <div className={classes.copyContainer}>
                                                    <InputBase multiline className={classes.copyInputMultiline}
                                                        value={
                                                            `${`cellery run ${orgName}/${imageName}:${version}`
                                                            + ` -n ${imageName}-inst`}${
                                                                Object.entries(dependencies).map(
                                                                    (dependencyEntry) => ` -l ${dependencyEntry[0]}`
                                                                        + `:${dependencyEntry[1].name}-inst`)} -d`
                                                        }
                                                        inputProps={{spellCheck: false}} inputRef={this.runCmdRef}/>
                                                    <Tooltip title={"Copied!"} disableFocusListener={false}
                                                        disableHoverListener={false} placement={"top"}
                                                        disableTouchListener={false} open={isRunCopiedTooltipOpen}
                                                        onClose={this.handleRunCmdCopiedTooltipClose}>
                                                        <IconButton color={"inherit"} className={classes.copyIconButton}
                                                            aria-label={"Copy"} onClick={this.copyRunCmdToClipboard}>
                                                            <FileCopy className={classes.copy}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <div className={classes.labelContainer}>
                                                <Typography variant={"subtitle2"} color={"inherit"}
                                                    className={classes.rightPanelTitle}>
                                                    Labels
                                                </Typography>
                                                <div className={classes.sidePanelContent}>
                                                    <Typography variant={"body2"}>
                                                        {
                                                            Object.values(versionData.metadata.components).map(
                                                                (component) => Object.entries(component.labels).map(
                                                                    ([key, value]) => `${key}=${value}`))
                                                        }
                                                    </Typography>
                                                </div>
                                            </div>
                                        </Grid>
                                    </Grid>
                                    <VersionUpdateDialog open={isEditDialogOpen} image={imageName}
                                        version={version} description={versionData.description} org={orgName}
                                        onClose={this.handleEditDialogClose}
                                        onUpdate={(newData) => {
                                            this.setState((prevState) => ({
                                                versionData: {
                                                    ...prevState.versionData,
                                                    description: newData.description
                                                }
                                            }));
                                        }}/>
                                    <VersionDeleteDialog open={isDeleteDialogOpen} image={imageName} org={orgName}
                                        version={version} onClose={this.handleDeleteDialogClose}/>
                                </div>
                            )
                    }
                    {
                        isVersionNotFound
                            ? <NotFound title={`Image version ${orgName}/${imageName}:${version} not found`}/>
                            : null
                    }
                </div>
            </React.Fragment>
        );
    }

}

ImageVersion.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    location: PropTypes.any.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            orgName: PropTypes.string.isRequired,
            imageName: PropTypes.string.isRequired,
            version: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(ImageVersion)));
