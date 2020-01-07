import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

let blackBorder = "blackBorder";

export class SelectCareGapTopic extends Component {
    constructor(props) {
        super(props);
        this.state = {
            topicOptions: [
                { key: 'effective+clinical+care', text: "Effective Clinical Care", value: 'effective+clinical+care' },
            ]
        };
        this.handleChange = this.handleChange.bind(this);
    };

    async componentDidMount() {
    }

    handleChange = (e, { value }) => {
        this.props.updateCB(this.props.elementName, value)
        this.setState({ currentValue: value })
    }

    render() {
        const { currentValue } = this.state;
        if (currentValue) {
            blackBorder = "blackBorder";
        } else {
            blackBorder = "";
        }
        return (
            <div className="form-row">
                <div className="form-group col-md-2 offset-2">
                    <h4 className="title">Topic*</h4>
                </div>
                <div className="form-group col-md-6">
                    <Dropdown
                        className={blackBorder}
                        options={this.state.topicOptions}
                        placeholder='Select Topic'
                        search
                        selection
                        fluid
                        onChange={this.handleChange}
                    />
                </div>
            </div>
        )
    }
}


function mapStateToProps(state) {
    return {
        config: state.config,
    };
};
export default withRouter(connect(mapStateToProps)(SelectCareGapTopic));