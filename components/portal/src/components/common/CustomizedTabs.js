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

const styles = (theme) => ({
    root: {
        flexGrow: 1
    }
});

const TabContainer = (props) => (
    <Typography component="div" >
        {props.children}
    </Typography>
);

TabContainer.propTypes = {
    children: PropTypes.any.isRequired
};

class CustomizedTabs extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: 0,
            setValue: 0
        };
    }

    handleChange = (event, newValue) => {
        this.setState({
            value: newValue
        });
    };

    render = () => {
        const {data, classes} = this.props;
        const {value} = this.state;

        return (
            <div className={classes.root}>
                <CustomTabs value={value} onChange={this.handleChange}>
                    {
                        data.map((item) => (
                            <CustomTab key={item.label} label={item.label}/>
                        ))
                    }
                </CustomTabs>
                {
                    data.map((item, index) => (
                        value === index && <TabContainer key={index}>{item.component}</TabContainer>
                    ))
                }
            </div>
        );
    }

}

CustomizedTabs.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default withStyles(styles)(CustomizedTabs);
