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
import ImageIcon from "@material-ui/icons/Image";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import People from "@material-ui/icons/People";
import React from "react";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    listItemText: {
        flexGrow: 1
    },
    elementText: {
        flex: "none",
        paddingLeft: theme.spacing(1 / 2),
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        marginLeft: theme.spacing(2),
        color: "#666666"
    },
    svgElementIcon: {
        fontSize: 16,
        marginLeft: theme.spacing(2),
        color: "#666666"
    }
});

const data = [
    {
        name: "Alpha",
        value: "alpha",
        members: 5,
        images: 3,
        description: "Sample description"

    },
    {
        name: "Beta",
        value: "beta",
        members: 10,
        images: 6,
        description: "Sample description"
    }
];

class OrgList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pageNo: 0,
            rowsPerPage: 10
        };
    }

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
                            <ListItem button>
                                <ListItemAvatar>
                                    <Avatar className={classes.avatar}>
                                        <ImageIcon/>
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={image.name}
                                    secondary={image.description}/>
                                <People className={classes.elementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {image.members}
                                </Typography>
                                <CellImage size="small" className={classes.svgElementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {image.images}
                                </Typography>
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

OrgList.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(OrgList);
