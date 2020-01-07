import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { createToken } from './Authentication';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

let blackBorder = "blackBorder";

export class SelectPatientCareGaps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            currentValue: "",
            patients: []
        };
        console.log("props------", props);
        this.handleChange = this.handleChange.bind(this);
    };

    async componentDidMount() {
        try {
            let patients = await this.getResources();
            let list = [];
            let i = 0;
            patients.entry.map((item, key) => {
                i = i + 1;
                let res = item.resource;
                let patient_state = { key: '', value: '', text: '' };
                Object.keys(res).map((k, v) => {
                    if (k == 'id') {
                        patient_state.key = res[k];
                        patient_state.value = res[k];
                    }
                    if (k == "name") {
                        if (res[k][0].given.length > 1) {
                            patient_state.text = res[k][0].given[0] + " " + res[k][0].given[1] + " " + res[k][0].family
                        }
                        else {
                            patient_state.text = res[k][0].given[0] + " " + res[k][0].family
                        }

                    }
                });
                list.push(patient_state);
            });
            console.log("List---", list);
            this.setState({ patients: list });
        } catch (error) {
            console.log('Patients List Request failed', error);
        }

    }

    async getResources() {
        var url = this.state.config.payer_fhir_url + '/Patient'
        let token;
        // token = await createToken(this.props.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'))
        let headers = {
            "Content-Type": "application/json",
            // 'Authorization': 'Bearer ' + token
        }
        let patients = await fetch(url, {
            method: "GET",
            headers: headers
        }).then(response => {
            return response.json();
        }).then((response) => {
            console.log("----------response", response);
            return response;
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        return patients;
    }

    handleChange = (e, { value }) => {
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
            <div className="form-row">
                <div className="form-group col-md-2 offset-2">
                    <h4 className="title">Select Patient*</h4>
                </div>
                <div className="form-group col-md-6">
                    <Dropdown
                        className={blackBorder}
                        options={this.state.patients}
                        placeholder='Select Patient'
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
    console.log(state);
    return {
        config: state.config,
    };
};
export default withRouter(connect(mapStateToProps)(SelectPatientCareGaps));