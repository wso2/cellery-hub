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

import CustomizedTabs from "../common/CustomizedTabs";
import Divider from "@material-ui/core/Divider";
import Images from "./Images";
import Orgs from "./Orgs";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    divider: {
        marginBottom: theme.spacing(4)
    }
});

const imageData = [
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

const orgData = [
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

const Explore = (props) => {
    const {classes} = props;
    const tabs = [
        {
            label: "Images",
            component: <Images data={imageData}/>
        },
        {
            label: "Organizations",
            component: <Orgs data={orgData}/>
        }
    ];

    return (
        <div className={classes.content}>
            <Typography variant="h5" color="inherit">
                Explore
            </Typography>
            <Divider className={classes.divider}/>
            <CustomizedTabs data={tabs}/>
        </div>
    );
};

Explore.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Explore);
