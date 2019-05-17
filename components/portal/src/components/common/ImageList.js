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
        paddingLeft: theme.spacing.unit / 2,
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        marginLeft: theme.spacing.unit * 2,
        color: "#666666"
    }
});

const ImageList = (props) => {
    const {classes, data} = props;

    return (
        <React.Fragment>
            <List component="nav">
                {data.map((image) => (
                    <div key={image.name}>
                        <ListItem button>
                            <ListItemAvatar>
                                <Avatar className={classes.avatar}>
                                    <CellImage/>
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={`${image.organization}/${image.name}`}
                                secondary={image.description}/>
                            <GetApp className={classes.elementIcon}/>
                            <Typography variant="subheading2" color="inherit" className={classes.elementText}>
                                {image.pulls}
                            </Typography>
                            <Star className={classes.elementIcon}/>
                            <Typography variant="subheading2" color="inherit" className={classes.elementText}>
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
                page={0}
                rowsPerPage={10}
                count={data.length}
            />
        </React.Fragment>
    );
};

ImageList.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired
};

export default withStyles(styles)(ImageList);

