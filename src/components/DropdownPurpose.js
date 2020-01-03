import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

const defaultValues = [
    { 'key': 'request_pcde', 'text': 'Request for Coverage Transition Document', 'value':'request_pcde' }
];

function dropDownOptions() {
    return defaultValues.map((v) => { return { key: v.key, text: v.text } })
}

let blackBorder = "blackBorder";

export  class DropdownPurpose extends Component {
    constructor(props) {
        super(props);
        this.state = { currentValue: "" }
        this.handleChange = this.handleChange.bind(this);

    };

    handleChange = (e, { value }) => {
        console.log(this.props, value);
        this.props.updateCB(this.props.elementName, value)
        this.setState({ currentValue: value })
    }

    render() {
        // console.log("this.state", this.state);
        const { currentValue } = this.state;
        if (currentValue) {
            blackBorder = "blackBorder";
        } else {
            blackBorder = "";
        }
        return (
            <Dropdown
                className={blackBorder}
                options={defaultValues}
                placeholder='Select Purpose'
                search
                selection
                fluid
                onChange={this.handleChange}
            />
        )
    }
}

function mapStateToProps(state) {
    return {
      config: state.config,
    }
  }
  
  export default withRouter(connect(mapStateToProps)(DropdownPurpose));
  