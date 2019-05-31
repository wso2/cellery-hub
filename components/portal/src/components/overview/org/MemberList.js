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

import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import MenuItem from "@material-ui/core/MenuItem";
import MuiDataTable from "mui-datatables";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Select from "@material-ui/core/Select";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    }, formControl: {
        minWidth: "100%"
    }, placeholderIcon: {
        color: "#999999"
    },
    table: {
        marginTop: theme.spacing(2),
        boxShadow: "none"
    }
});

const options = {
    download: false,
    search: false,
    selectableRows: false,
    print: false,
    filter: false,
    responsive: "scroll",
    sort: true,
    rowHover: false,
    viewColumns: false
};

class MemberList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            role: "Member",
            isAdmin: false
        };
    }

    handleItemClick = (path) => {
        const {history} = this.props;
        history.push(path);
    };

    handleRoleChange = (event) => {
        this.setState({
            role: event.target.value
        });
    };

    render = () => {
        const {classes, data} = this.props;
        const {isAdmin} = this.state;
        const columns = [
            {
                name: "name",
                label: "Name"
            },
            {
                name: "role",
                label: "Role/State",
                options: {
                    customBodyRender: (value) => {
                        if (isAdmin) {
                            return <Select value={value} onChange={this.handleRoleChange}
                                input={<Input name="organization" id="member-label-placeholder"/>}
                                displayEmpty name="member" className={classes.orgSelect}>
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="contributor">Contributor</MenuItem>
                            </Select>;
                        }
                        return <td>{value}</td>;
                    }
                }
            }
        ];

        return (
            <div className={classes.content}>
                <div className={classes.container}>
                    <Grid container>
                        <Grid item xs={12} sm={4} md={4}>
                            <FormControl className={classes.formControl}>
                                <Input
                                    id="search"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SearchIcon className={classes.placeholderIcon}/>
                                        </InputAdornment>
                                    }
                                    placeholder="Search Member"
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <MuiDataTable
                                className={classes.table}
                                data={data}
                                columns={columns}
                                options={options}
                            />
                        </Grid>
                    </Grid>
                </div>
            </div>
        );
    }

}

MemberList.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    })
};

export default withStyles(styles)(MemberList);
