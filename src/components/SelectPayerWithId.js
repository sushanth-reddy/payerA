import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import config from '../globalConfiguration.json';


let blackBorder = "blackBorder";

// export const payerTypeOptions = [
//   { key: 'medicare', value: 'medicare', text: 'Medicare' },
//   { key: 'state_medicaid', value: 'state_medicaid', text: 'Medicaid' },
//   { key: 'other', value: 'other', text: 'Other Private Insurer' },
// ]
// export var payerOptions = [
//   { key: 'medicare_fee_for_service', value: 'medicare_fee_for_service', text: 'Medicare Fee for service' },
//   { key: 'texas_state_medicaid', value: 'texas_state_medicaid', text: 'Texas State Medicaid' },
//   { key: 'uhc', value: 'uhc', text: 'UHC' },
// ]

export class SelectPayerWithId extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            currentValue: "",
            payer_type: [],
            payers: [],
            payersList: [],
            payerId: '',
        }
        this.handlePayerTypeChange = this.handlePayerTypeChange.bind(this);
        this.handlePayerChange = this.handlePayerChange.bind(this);
    };
    async componentDidMount() {
        try {
            let payersList = await this.getResources();
            this.setState({ payersList });
            if (this.state.config !== null) {
                if (this.state.hasOwnProperty('payer_id')) {
                    let currentPayer = payersList.find(payer => payer.id === this.state.config.payer_id);
                    console.log(currentPayer, "currentPayer")
                    sessionStorage.setItem('currentPayer', JSON.stringify(currentPayer))
                }

            }

            let payers = this.state.payers;
            let payer_type = this.state.payer_type;
            payersList.map((item) => {
                /**Update payer type options */
                let type = item.payer_type.replace(/ /g, "_").toLowerCase();
                let payer_type_obj = { key: type, value: type, text: item.payer_type };
                var exists = false;
                for (var i in payer_type) {
                    if (payer_type[i].key === type) {
                        exists = true;
                    }
                }
                if (!exists) {
                    payer_type.push(payer_type_obj);
                }


                /**Update payer options */
                let val = {
                    'name': item.payer_name.replace(/ /g, "_").toLowerCase(),
                    'payer_identifier': item.payer_identifier,
                    'payer_type': item.payer_type,
                    'id': item.id,
                    "payerName": item.payer_name,
                    'endpoint': item.payer_end_point
                }
                let obj = { key: item.id, value: val, text: item.payer_name };
                payers.push(obj);
            });
            this.setState({ payers });
        } catch (error) {
            console.log('Payers list error, ', error);
        }
    }

    async getResources() {
        //var url = this.props.config.cds_service.get_payers;
        var url = "http://cdex.mettles.com/cds/getPayers";
        // let token;
        // token = await createToken(this.props.config.provider.grant_type, 'provider', sessionStorage.getItem('username'), sessionStorage.getItem('password'))
        let headers = {
            "Content-Type": "application/json",
            // 'Authorization': 'Bearer ' + token
        }
        let payersList = await fetch(url, {
            method: "GET",
            headers: headers
        }).then(response => {
            return response.json();
        }).then((response) => {
            return response;
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        return payersList;
    }

    handlePayerTypeChange = (e, { value }) => {
        let payers = this.state.payers;
        this.setState({ payerEndpoint: '' })
        this.setState({ payerId: '' })

        payers = [];
        this.setState({ payers });
        this.state.payersList.map((item) => {
            if (item.payer_type.replace(/ /g, "_").toLowerCase() === value) {
                let val = {
                    'name': item.payer_name.replace(/ /g, "_").toLowerCase(),
                    'payer_identifier': item.payer_identifier,
                    'payer_type': item.payer_type,
                    'id': item.id,
                    "payerName": item.payer_name,
                    'endpoint': item.payer_end_point
                }
                let obj = { key: item.id, value: val, text: item.payer_name };
                payers.push(obj);
            }
        });
        this.setState({ payers });
    }
    handlePayerChange = (e, { value }) => {
        this.setState({ payerEndpoint: value.endpoint })
        this.setState({ payerId: value.id })
        console.log(value, 'lll')
        this.props.updateCB(this.props.elementName, value)
        this.setState({ currentValue: value })
    }

    render() {
        const { currentValue } = this.state
        if (currentValue) {
            blackBorder = "blackBorder";
        } else {
            blackBorder = "";
        }
        return (
            <div>
                <div className="form-row">

                    <div className="form-group col-md-3 offset-1">
                        {/* <h4 className="title"></h4> */}
                    </div>


                    <div className="form-group col-md-3">
                        <span className="title-small">Payer Type</span>
                        <Dropdown
                            className={blackBorder}
                            options={this.state.payer_type}
                            placeholder='Payer Type'
                            search
                            selection
                            fluid
                            onChange={this.handlePayerTypeChange}
                        />
                    </div>
                    <div className="form-group col-md-3">
                        <span className="title-small">Payer Name</span>

                        <Dropdown
                            className={blackBorder}
                            options={this.state.payers}
                            placeholder='Payer'
                            search
                            selection
                            fluid
                            onChange={this.handlePayerChange}
                        />
                    </div>
                </div>
                {/* <div className="form-row">
                    <div className="form-group col-md-3 offset-1">
                            <h4 className="title"></h4>
                        </div>
                        <div className="form-group col-md-6">
                        <span className="title-small">Payer Id</span>

                            <input type="text" name="id" className="form-control" id="id" placeholder=" Payer Id"
                                value={this.state.payerId} onChange={this.onIdChange}
                            />
                        </div>
                    </div> */}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        config: state.config,
    }
}

export default withRouter(connect(mapStateToProps)(SelectPayerWithId));
