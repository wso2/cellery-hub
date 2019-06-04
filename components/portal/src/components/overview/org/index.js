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

import ArrowBack from "@material-ui/icons/ArrowBack";
import CustomizedTabs from "../../common/CustomizedTabs";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton/IconButton";
import OrgImageList from "./OrgImageList";
import React from "react";
import Typography from "@material-ui/core/Typography";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    content: {
        paddingTop: theme.spacing(4)
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    },
    orgsImage: {
        fontSize: 100,
        color: theme.palette.primary.main
    },
    elementText: {
        paddingLeft: theme.spacing(1 / 2),
        color: "#666666"
    },
    elementIcon: {
        fontSize: 20,
        color: "#666666"
    },
    description: {
        display: "block",
        color: "#464646",
        paddingBottom: theme.spacing(2)
    },
    stats: {
        display: "flex"
    },
    title: {
        display: "inline-block"
    },
    link: {
        color: "#666666",
        fontWeight: 400
    },
    orgName: {
        textTransform: "uppercase",
        color: "#ffffff"
    },
    imageContainer: {
        backgroundColor: "#91c56f",
        borderRadius: 5,
        minHeight: 100
    }
});

const data = {
    orgName: "alpha",
    description: "Sample Description",
    url: "http://alpha.com",
    createdBy: "john",
    createdDate: "12/05/2019",
    members: [
        {
            name: "John",
            role: "admin"
        },
        {
            name: "Mark",
            role: "member"
        }
    ],
    images: [
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
        }
    ]
};

const Org = (props) => {
    const {classes, location, history} = props;
    const tabs = [
        {
            label: "Images",
            component: <OrgImageList data={data.images}/>
        }
    ];

    return (
        <React.Fragment>
            <div className={classes.content}>
                {
                    (history.length <= 2 || location.pathname === "/")
                        ? null
                        : (
                            <IconButton color="inherit" aria-label="Back"
                                onClick={() => history.goBack()}>
                                <ArrowBack/>
                            </IconButton>
                        )
                }
                <Typography variant="h5" color="inherit" className={classes.title}>
                    {data.orgName}
                </Typography>
                <Divider/>
                <div className={classes.container}>
                    <Grid container spacing={4}>
                        <Grid item xs={2} sm={2} md={2}>
                            <Grid container justify="center" alignContent="center" className={classes.imageContainer}>
                                <Typography variant="h2" color="inherit" className={classes.orgName}>
                                    {data.orgName.charAt(0)}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid item xs={10} sm={10} md={10}>
                            <div className={classes.stats}>
                                <Typography variant="subtitle2" color="inherit" className={classes.elementText}>
                                    Created by {data.createdDate} on {data.createdBy}
                                </Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12}>
                            <Grid container>
                                <Grid item xs={12} sm={12} md={12}>
                                    <div>
                                        <CustomizedTabs data={tabs}/>
                                    </div>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </React.Fragment>
    );
};

Org.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        goBack: PropTypes.func.isRequired
    }),
    location: PropTypes.any.isRequired
};

export default withStyles(styles)(withRouter(Org));
