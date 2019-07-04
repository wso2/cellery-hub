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
import SearchOrgs from "../../img/SearchOrgs.png";
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
    },
    noOrgsMsgContainer: {
        textAlign: "center",
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(4)
    },
    searchIcon: {
        height: 70
    },
    noResultsMsg: {
        fontWeight: 500,
        color: "#a0a0a0",
        paddingTop: theme.spacing(1)
    }
});

class OrgList extends React.Component {

    handleOrgClick = (orgName) => {
        const {history} = this.props;
        history.push(`/orgs/${orgName}`);
    };

    handleChangePageNo = (event, newPageNo) => {
        const {onPageChange, rowsPerPage} = this.props;
        onPageChange(rowsPerPage, newPageNo);
    };

    handleChangeRowsPerPage = (event) => {
        const {pageNo, rowsPerPage, onPageChange} = this.props;
        const newRowsPerPage = event.target.value;
        const newPageNoCandidate = Math.trunc((pageNo * rowsPerPage) / newRowsPerPage);
        const newPageNo = newPageNoCandidate >= 0 ? newPageNoCandidate : 0;
        onPageChange(newRowsPerPage, newPageNo);
    };

    render = () => {
        const {classes, totalCount, pageNo, rowsPerPage, pageData} = this.props;
        return (
            totalCount > 0
                ? (
                    <React.Fragment>
                        <List component={"nav"}>
                            {pageData.map((org) => (
                                <div key={org.orgName}>
                                    <ListItem button onClick={() => this.handleOrgClick(org.orgName)}>
                                        <ListItemAvatar>
                                            <Avatar className={classes.avatar}>
                                                {org.orgName.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={org.orgName}
                                            secondary={org.description}/>
                                        <People className={classes.elementIcon}/>
                                        <Typography variant={"subtitle2"} color={"inherit"}
                                            className={classes.elementText}>
                                            {org.membersCount}
                                        </Typography>
                                        <CellImage size={"small"} className={classes.svgElementIcon}/>
                                        <Typography variant={"subtitle2"} color={"inherit"}
                                            className={classes.elementText}>
                                            {org.imageCount}
                                        </Typography>
                                    </ListItem>
                                    <Divider/>
                                </div>
                            ))}
                        </List>
                        <TablePagination component={"nav"} page={pageNo} rowsPerPage={rowsPerPage} count={totalCount}
                            onChangePage={this.handleChangePageNo} onChangeRowsPerPage={this.handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}/>
                    </React.Fragment>
                )
                : (
                    <div className={classes.noOrgsMsgContainer}>
                        <img src={SearchOrgs} alt={"no results found"} className={classes.searchIcon}/>
                        <Typography component={"div"} className={classes.noResultsMsg}>
                            No Matching Organizations Found
                        </Typography>
                    </div>
                )
        );
    }

}

OrgList.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    pageNo: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    totalCount: PropTypes.number.isRequired,
    pageData: PropTypes.arrayOf(PropTypes.shape({
        orgName: PropTypes.string.isRequired,
        description: PropTypes.string,
        membersCount: PropTypes.number.isRequired,
        imageCount: PropTypes.number.isRequired
    })).isRequired
};

export default withStyles(styles)(withRouter(OrgList));
