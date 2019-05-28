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
import Avatar from "@material-ui/core/Avatar";
import CellImage from "../../img/CellImage";
import Divider from "@material-ui/core/Divider";
import GetApp from "@material-ui/icons/GetApp";
import Language from "@material-ui/icons/Language";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import Lock from "@material-ui/icons/Lock";
import React from "react";
import Star from "@material-ui/icons/Star";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    avatar: {
        color: theme.palette.primary.main,
        backgroundColor: "transparent"
    },
    listItemText: {
        flexGrow: 1
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

    }
});

const data = [
    {
        name: "pet-fe",
        summary: "This contains the four components which involves with working with the Pet Store data and"
        + " business logic.",
        organization: "alpha",
        public: true,
        pulls: 10,
        stars: 3,
        lastUpdated: "2 days",
        lastUpdatedBy: "john"
    },
    {
        name: "pet-be",
        summary: "This contains of a single component which serves the portal.",
        organization: "alpha",
        public: true,
        pulls: 15,
        stars: 11,
        lastUpdated: "20 hours",
        lastUpdatedBy: "john"
    },
    {
        name: "hello-world",
        summary: "Sample hello world cell.",
        organization: "beta",
        public: false,
        pulls: 7,
        stars: 4,
        lastUpdated: "5 days",
        lastUpdatedBy: "john"
    }
];

class ImageList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pageNo: 0,
            rowsPerPage: 10
        };
    }

    handleItemClick = (path) => {
        const {history} = this.props;
        history.push(path);
    };


    handleChangePage = (event, newValue) => {
        // TODO: Load and set new data
        this.setState({
            pageNo: newValue
        });
    };

    handleChangeRowsPerPage = (event) => {
        // TODO: Load and set new data
        this.setState({
            rowsPerPage: event.target.value
        });
    };

    render = () => {
        const {classes} = this.props;
        const {pageNo, rowsPerPage} = this.state;

        return (
            <React.Fragment>
                <List component="nav">
                    {data.map((image) => (
                        <div key={image.name}>
                            <ListItem button onClick={(event) => {
                                this.handleItemClick(`/images/${image.organization}/${image.name}`, event);
                            }}>
                                <ListItemAvatar>
                                    <Avatar className={classes.avatar}>
                                        <CellImage/>
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${image.organization}/${image.name}`}
                                    secondary={
                                        <React.Fragment>
                                            {image.summary}
                                            <Typography
                                                variant="caption"
                                                className={classes.block}
                                                color="textPrimary"
                                            >
                                                <AccessTime className={classes.updated}/> Last
                                                          Updated {image.lastUpdated} ago by {image.lastUpdatedBy}
                                            </Typography>
                                        </React.Fragment>
                                    }/>

                                <GetApp className={classes.elementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {image.pulls}
                                </Typography>
                                <Star className={classes.elementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {image.stars}
                                </Typography>
                                {
                                    image.public
                                        ? <Language className={classes.elementIcon}/>
                                        : <Lock className={classes.elementIcon}/>
                                }
                            </ListItem>
                            <Divider/>
                        </div>
                    ))}
                </List>
                <TablePagination
                    component="nav"
                    page={pageNo}
                    rowsPerPage={rowsPerPage}
                    count={data.length}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                />
            </React.Fragment>
        );
    }

}

ImageList.propTypes = {
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withRouter(ImageList));
