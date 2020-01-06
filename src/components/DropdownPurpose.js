import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';


function dropDownOptions() {
    return defaultValues.map((v) => { return { key: v.key, text: v.text } })
}

let blackBorder = "blackBorder";
let defaultValues; 

export class DropdownPurpose extends Component {
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
        defaultValues = [
                    { 'key': 'request_pcde', 'text': 'Request for Coverage Transition Document', 'value': 'request_document' },
                { 'key': 'claim', 'text': 'Request for Additional Documents', 'value': 'claim' }

                ];
        // console.log(this.props, 'props')
        // if (this.props.pdex) {
        //     defaultValues = [
        //         { 'key': 'request_pcde', 'text': 'Request for Coverage Transition Document', 'value': 'request_pcde' }
        //     ];
        // }
        // else {
        //     defaultValues = [
        //         { 'key': 'claim', 'text': 'Claim', 'value': 'claim' }
        //     ];
        // }
        return (
            <Dropdown
                className={blackBorder}
                options={defaultValues}
                placeholder='Select Purpose'
                search
                selection
                fluid
                value = 'request_document'
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
