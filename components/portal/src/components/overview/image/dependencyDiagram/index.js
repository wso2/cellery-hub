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

import CellDiagram from "./CellDiagram";
import React from "react";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";


const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    }
});

const graphData = {
    cells: ["pet-fe", "pet-be"],
    components: [
        {
            cell: "pet-fe",
            name: "portal"
        },
        {
            cell: "pet-be",
            name: "controller"
        },
        {
            cell: "pet-be",
            name: "catalog"
        },
        {
            cell: "pet-be",
            name: "orders"
        },
        {
            cell: "pet-be",
            name: "customers"
        }
    ],
    dependencyLinks: [
        {
            alias: "petStoreBackend",
            from: "pet-fe",
            to: "pet-be"
        }
    ]
};

const DependencyDiagram = (props) => {
    const {classes, cell} = props;

    return (
        <div className={classes.content}>
            <CellDiagram data={graphData} focusedCell={cell}/>
        </div>
    );
};

DependencyDiagram.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    cell: PropTypes.string.isRequired
};

export default withStyles(styles)(DependencyDiagram);
