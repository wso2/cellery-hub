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

import React from "react";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const CustomTabs = withStyles((theme) => ({
    root: {
        borderBottom: "1px solid #e8e8e8"
    },
    indicator: {
        backgroundColor: theme.palette.primary.main
    }
}))(Tabs);

const CustomTab = withStyles((theme) => ({
    root: {
        textTransform: "none",
        minWidth: 72,
        fontSize: 14,
        marginRight: theme.spacing(4),
        "&:hover": {
            color: "#464646",
            opacity: 1
        },
        "&$selected": {
            color: "#464646",
            fontWeight: theme.typography.fontWeightMedium
        },
        "&:focus": {
            color: "#464646"
        }
    },
    selected: {}
}))((props) => <Tab disableRipple {...props} />);

const styles = () => ({
    root: {
        flexGrow: 1
    }
});

const TabContainer = ({children}) => (
    <Typography component={"div"} >
        {children}
    </Typography>
);

TabContainer.propTypes = {
    children: PropTypes.any.isRequired
};

class CustomizedTabs extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 0
        };
    }

    handleChange = (event, newSelectedIndex) => {
        this.setState({
            selectedIndex: newSelectedIndex
        });
    };

    render = () => {
        const {tabs, classes} = this.props;
        const {selectedIndex} = this.state;

        return (
            <div className={classes.root}>
                <CustomTabs value={selectedIndex} onChange={this.handleChange}>
                    {
                        tabs.map((item) => (
                            <CustomTab key={item.label} label={item.label}/>
                        ))
                    }
                </CustomTabs>
                {
                    tabs.map((item, index) => (
                        selectedIndex === index && <TabContainer key={index}>{item.render()}</TabContainer>
                    ))
                }
            </div>
        );
    }

}

CustomizedTabs.propTypes = {
    classes: PropTypes.object.isRequired,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        render: PropTypes.func.isRequired
    })).isRequired
};

export default withStyles(styles)(CustomizedTabs);
