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

/* eslint max-lines: ["off"] */

import ArrowBack from "@material-ui/icons/ArrowBack";
import CellImage from "../../img/CellImage";
import Chip from "@material-ui/core/Chip";
import Constants from "../../utils/constants";
import CustomizedTabs from "../common/CustomizedTabs";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Description from "../common/Description";
import Divider from "@material-ui/core/Divider";
import EditOutlined from "@material-ui/icons/EditOutlined";
import FileCopy from "@material-ui/icons/FileCopyOutlined";
import GetApp from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import HelpOutline from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton/IconButton";
import ImageDeleteDialog from "./ImageDeleteDialog";
import ImageUpdateDialog from "./ImageUpdateDialog";
import InputBase from "@material-ui/core/InputBase";
import Language from "@material-ui/icons/Language";
import Lock from "@material-ui/icons/Lock";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVert from "@material-ui/icons/MoreVert";
import NotFound from "../common/error/NotFound";
import NotificationUtils from "../../utils/common/notificationUtils";
import React from "react";
import StateHolder from "../common/state/stateHolder";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import Typography from "@material-ui/core/Typography";
import VersionList from "./VersionList";
import classNames from "classnames";
import withGlobalState from "../common/state";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import HttpUtils, {HubApiError} from "../../utils/api/httpUtils";
import * as PropTypes from "prop-types";

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
    keywordContent: {
        marginTop: theme.spacing(2)
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
    keywords: {
        marginTop: theme.spacing(4)
    },
    visibility: {
        textTransform: "capitalize"
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

class Image extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isPullCopiedTooltipOpen: false,
            isRunCopiedTooltipOpen: false,
            isLoading: true,
            isImageNotFound: false,
            imageData: null,
            morePopoverElement: null,
            isEditDialogOpen: false,
            isDeleteDialogOpen: false
        };

        this.pullCmdRef = React.createRef();
        this.runCmdRef = React.createRef();
    }

    componentDidMount() {
        const self = this;
        const {globalState, match} = self.props;
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;

        NotificationUtils.showLoadingOverlay(`Fetching image ${orgName}/${imageName}`,
            globalState);
        self.setState({
            isLoading: true
        });
        HttpUtils.callHubAPI(
            {
                url: `/images/${orgName}/${imageName}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            self.setState({
                isLoading: false,
                isImageNotFound: false,
                imageData: data
            });
            NotificationUtils.hideLoadingOverlay(globalState);
        }).catch((err) => {
            let errorMessage;
            if (err instanceof HubApiError) {
                if (err.getStatusCode() === 404) {
                    self.setState({
                        isImageNotFound: true
                    });
                    errorMessage = `Image ${orgName}/${imageName} not found`;
                } else {
                    errorMessage = err.getMessage();
                }
            } else {
                errorMessage = `Failed to fetch Image ${orgName}/${imageName}`;
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

    pullCmdCopiedTooltipClose = () => {
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

    runCmdCopiedTooltipClose = () => {
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
        const {classes, location, match, history, globalState} = this.props;
        const {isPullCopiedTooltipOpen, isRunCopiedTooltipOpen, isLoading, isImageNotFound, imageData,
            morePopoverElement, isEditDialogOpen, isDeleteDialogOpen} = this.state;
        const isMorePopoverOpen = Boolean(morePopoverElement);
        const orgName = match.params.orgName;
        const imageName = match.params.imageName;
        const tabs = [
            {
                label: "Versions",
                render: () => <VersionList/>
            },
            {
                label: "Description",
                render: () => <Description data={imageData.description}/>
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
                                {orgName}/{imageName}
                            </Typography>
                        </div>
                        {
                            globalState.get(StateHolder.USER).roles.includes(Constants.Permission.PUSH)
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
                                                globalState.get(StateHolder.USER).roles
                                                    .includes(Constants.Permission.ADMIN)
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
                        isLoading || isImageNotFound || !imageData
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
                                                            {imageData.pullCount}
                                                        </Typography>
                                                        {
                                                            imageData.visibility.toUpperCase()
                                                            === Constants.Visibility.PUBLIC
                                                                ? <React.Fragment>
                                                                    <Language className={classNames(classes.elementIcon,
                                                                        classes.spaceLeft)}/>
                                                                    <Typography variant={"subtitle2"} color={"inherit"}
                                                                        className={classNames(classes.elementText,
                                                                            classes.visibility)}>
                                                                        {imageData.visibility.toLowerCase()}
                                                                    </Typography>
                                                                </React.Fragment>
                                                                : <React.Fragment>
                                                                    <Lock className={classes.elementIcon}/>
                                                                    <Typography variant={"subtitle2"} color={"inherit"}
                                                                        className={classNames(classes.elementText,
                                                                            classes.visibility)}>
                                                                        {imageData.visibility.toLowerCase()}
                                                                    </Typography>
                                                                </React.Fragment>
                                                        }
                                                    </div>
                                                    <div>
                                                        <Typography variant={"body1"} color={"inherit"}>
                                                            {imageData.summary}
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
                                                className={classes.rightPanelTitle}>Cellery Commands
                                            </Typography>
                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                className={classes.rightPanelSubTitle}>
                                                Pull
                                            </Typography>
                                            <div className={classes.copyContent}>
                                                <div className={classes.copyContainer}>
                                                    <InputBase multiline className={classes.copyInput} readOnly
                                                        value={`cellery pull ${orgName}/${imageName}:<version>`}
                                                        inputProps={{"aria-label": "naked", spellCheck: "false"}}
                                                        inputRef={this.pullCmdRef} />
                                                    <Tooltip title={"Copied!"} disableFocusListener={false}
                                                        disableHoverListener={false} placement={"top"}
                                                        disableTouchListener={false} open={isPullCopiedTooltipOpen}
                                                        onClose={this.pullCmdCopiedTooltipClose}>
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
                                                    <InputBase multiline className={classes.copyInputMultiline} readOnly
                                                        value={
                                                            `cellery run ${orgName}/${imageName}:<version>`
                                                            + ` -n ${imageName}-inst`
                                                            + " -l <alias>:<dependent-cell-instance> -d"
                                                        }
                                                        inputProps={{"aria-label": "naked", spellCheck: "false"}}
                                                        inputRef={this.runCmdRef}/>
                                                    <Tooltip title={"Copied!"} disableFocusListener={false}
                                                        disableHoverListener={false} placement={"top"}
                                                        disableTouchListener={false} open={isRunCopiedTooltipOpen}
                                                        onClose={this.runCmdCopiedTooltipClose}>
                                                        <IconButton color={"inherit"} className={classes.copyIconButton}
                                                            aria-label={"Copy"} onClick={this.copyRunCmdToClipboard}>
                                                            <FileCopy className={classes.copy}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            {
                                                imageData.keywords
                                                    ? (
                                                        <div className={classes.keywords}>
                                                            <Typography variant={"subtitle2"} color={"inherit"}
                                                                className={classes.rightPanelTitle}>Keywords
                                                            </Typography>
                                                            <div className={classes.keywordContent}>
                                                                {imageData.keywords.map((keyword) => (
                                                                    <Chip key={keyword} label={keyword}
                                                                        className={classes.chip}/>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                    : null
                                            }

                                        </Grid>
                                    </Grid>
                                    <ImageUpdateDialog open={isEditDialogOpen} image={`${orgName}/${imageName}`}
                                        summary={imageData.summary} description={imageData.description}
                                        keywords={imageData.keywords} onClose={this.handleEditDialogClose}/>
                                    <ImageDeleteDialog open={isDeleteDialogOpen} image={`${orgName}/${imageName}`}
                                        onClose={this.handleDeleteDialogClose}/>
                                </div>
                            )
                    }
                    {
                        isImageNotFound
                            ? <NotFound title={`Image ${orgName}/${imageName} not found`}/>
                            : null
                    }
                </div>
            </React.Fragment>
        );
    }

}

Image.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    location: PropTypes.any.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            orgName: PropTypes.string.isRequired,
            imageName: PropTypes.string.isRequired
        })
    }),
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withRouter(withGlobalState(Image)));
