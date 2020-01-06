import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { createToken } from './Authentication';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

let blackBorder = "blackBorder";

export class DropdownClaim extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentValue: "",
            claims: []
        };
        console.log("props------", props);
        this.handleChange = this.handleChange.bind(this);

    };

    async componentDidMount() {

        try {
            let claims = await this.getResources();
            let list = [];
            let i = 0;
            claims.entry.map((item, key) => {
                i = i + 1;
                let res = item.resource;
                let claim_state = { key: '', value: '', text: '' };
                Object.keys(res).map((k, v) => {
                    if (k == 'id') {
                        claim_state.text = res[k];
                    }
                    if (k == 'identifier') {
                        claim_state.value = res[k][0]['value'];
                    }
                    claim_state.key = 'claim' + i;
                });
                list.push(claim_state);
            });
            this.setState({claims:list});
        } catch (error) {
            console.log('Communication Creation failed', error);
        }

    }

    async getResources() {
        var url = this.props.config.payer.fhir_url+'/Claim';
        let token;
        token = await createToken(this.props.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'))
        let headers = {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + token
        }

        let claims = await fetch(url, {
            method: "GET",
            headers: headers
        }).then(response => {
            return response.json();
        }).then((response) => {
            // console.log("----------response", response);
            return response;
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        // console.log(sender, 'sender')
        return claims;
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
                options={this.state.claims}
                placeholder='Select Claim'
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
export default withRouter(connect(mapStateToProps)(DropdownClaim));