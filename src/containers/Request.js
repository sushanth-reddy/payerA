import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import ProviderCommunicationRequest from './ProviderCommunicationRequest';
import PayerCommunicationRequest from './PayerCommunicationRequest';
import { Header } from '../components/Header';

let blackBorder = "blackBorder";

export class Request extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            currentPayer: '',
            payer_name: "",
            defaultValues: [
                { 'key': 'request_pcde', 'text': 'Request for Coverage Transition Document', 'value': 'request_document' },
                { 'key': 'claim', 'text': 'Request for Additional Documents', 'value': 'claim' }
            ],
            document_type: 'request_document'
        }
        this.updateStateElement = this.updateStateElement.bind(this)
    }
    handleChange = (e, { value }) => {
        // console.log(this.props, value);
        // this.props.updateCB(this.props.elementName, value)
        this.setState({ document_type: value })
    }
    async getPayerList() {
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
    updateStateElement = (elementName, value) => {
        // console.log("event----------", value, elementName)
        this.setState({ [elementName]: value })

    }

    async componentDidMount() {
        if (!sessionStorage.getItem('isLoggedIn')) {
            sessionStorage.setItem('redirectTo', "/request");
            this.props.history.push("/login");
        }
        let payersList = await this.getPayerList()
        let payer;
        if (payersList !== undefined) {
            if (this.state.config !== null) {
                payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
                this.setState({ currentPayer: payer })
                this.setState({ payer_name: payer.payer_name })
            }

        }
    }
    renderForm() {
        let local = {
            "format": "DD-MM-YYYY HH:mm",
            "sundayFirst": false
        }
        return (
            <React.Fragment>
                <div>
                <Header payer={this.state.currentPayer.payer_name} />
                    <main id="main" style={{ marginTop: "92px" }}>
                        <div className="form">
                            <div className="container">
                                <div className="section-header">
                                    <h3>Request for Document
                                    <div className="sub-heading"></div>
                                    </h3>

                                </div>
                                <div className="form-row">
                                    <div className="form-group col-3 offset-1">
                                        <h4 className="title">Document Type</h4>
                                    </div>
                                    <div className="form-group col-8">
                                        <Dropdown
                                            className={blackBorder}
                                            options={this.state.defaultValues}
                                            placeholder='Select Document Type'
                                            search
                                            selection
                                            fluid
                                            value={this.state.document_type}
                                            onChange={this.handleChange}
                                        />
                                        {/* <Dropdowndocument_type elementName="document_type" updateCB={this.updateStateElement} /> */}
                                    </div>
                                </div>
                                {this.state.document_type === 'claim' &&
                                    <ProviderCommunicationRequest />
                                }
                                {this.state.document_type === 'request_document' &&
                                    <PayerCommunicationRequest />
                                }
                            </div>
                        </div>

                    </main>
                </div>
            </React.Fragment>
        )
    }
    render() {
        return (
            <div className="attributes mdl-grid">
                {this.renderForm()}
            </div>)
    }
}