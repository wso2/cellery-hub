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
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import People from "@material-ui/icons/People";
import React from "react";
import TablePagination from "@material-ui/core/TablePagination";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
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
    },
    avatar: {
        color: "#ffffff",
        background: "#91c56f"
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
                    {data.map((org) => (
                        <div key={org.name}>
                            <ListItem button onClick={(event) => {
                                this.handleItemClick(`/orgs/${org.name}`, event);
                            }}>
                                <ListItemAvatar>
                                    <Avatar className={classes.avatar}>
                                        {org.name.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={org.name}
                                    secondary={org.description}/>
                                <People className={classes.elementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {org.members}
                                </Typography>
                                <CellImage size="small" className={classes.svgElementIcon}/>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    {org.images}
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
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    })
};

export default withStyles(styles)(withRouter(OrgList));
