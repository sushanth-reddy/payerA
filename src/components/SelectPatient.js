import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { createToken } from './Authentication';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

let blackBorder = "blackBorder";

export class SelectPatient extends Component {
    constructor(props) {
        super(props);
        this.state = {
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
                    // if (k == 'id') {
                    //     patient_state.text = res[k];
                    // }
                    if(k == "name"){
                        if(res[k][0].given.length>1){
                            patient_state.text=   res[k][0].given[0] +" "+res[k][0].given[1]+" "+ res[k][0].family
                        }
                        else{
                            patient_state.text=   res[k][0].given[0]+" "+res[k][0].family
                        }
                        
                    }
                    if (k == 'identifier') {
                        patient_state.value = res;
                    }
                    patient_state.key = 'patient' + i;
                });
                list.push(patient_state);
            });
            this.setState({patients:list});
        } catch (error) {
            console.log('Communication Creation failed', error);
        }

    }

    async getResources() {
        // var url = this.props.config.payer.fhir_url+'/Patient';
        let req = JSON.parse(sessionStorage.getItem('requesterPayer'))
        console.log(req.payer_end_point,'request sessions')
        var url = req.payer_end_point+'/Patient'
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
        // console.log(sender, 'sender')
        return patients;
    }

    handleChange = (e, { value }) => {
        // console.log(this.props, value);
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
                options={this.state.patients}
                placeholder='Select Patient'
                search
                selection
                fluid
                onChange={this.handleChange}
            />
        )
    }
}


function mapStateToProps(state) {
    console.log(state);
    return {
      config: state.config,
    };
  };
  export default withRouter(connect(mapStateToProps)(SelectPatient));