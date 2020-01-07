import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import ProviderCommunicationRequest from './ProviderCommunicationRequest';
import PayerCommunicationRequest from './PayerCommunicationRequest';
import { DropdownPurpose } from '../components/DropdownPurpose';

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
            purpose: 'request_document'
        }
        this.updateStateElement = this.updateStateElement.bind(this)
    }
    handleChange = (e, { value }) => {
        // console.log(this.props, value);
        // this.props.updateCB(this.props.elementName, value)
        this.setState({ purpose: value })
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
                    <header id="inpageheader">
                        <div className="">
                            <div id="logo" className="pull-left">
                                {this.state.currentPayer !== '' &&
                                    //   <h1><img style={{height: "60px", marginTop: "-13px"}} src={logo}  /><a href="#intro" className="scrollto">{this.state.currentPayer.payer_name}</a></h1>

                                    <h1><a href="/request" className="scrollto">{this.state.currentPayer.payer_name}</a></h1>
                                }

                            </div>

                            <nav id="nav-menu-container">
                                <ul className="nav-menu">
                                    <li className="menu-active menu-has-children"><a href="">Request</a>
                                        <ul>
                                            <li className="menu-active"><a href={window.location.protocol + "//" + window.location.host + "/request"}>Request for documents</a></li>
                                            <li ><a href={window.location.protocol + "//" + window.location.host + "/care_gaps"}>Request Care Gaps</a></li>
                                        </ul>
                                    </li>
                                    <li className="menu-has-children"><a href="">TASKS</a>
                                        <ul>
                                            <li ><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>Coverage Documents</a></li>
                                            <li><a href={window.location.protocol + "//" + window.location.host + "/cdex_documents"}>Clinical Documents</a></li>
                                            <li><a href={window.location.protocol + "//" + window.location.host + "/task"}>Submit Coverage Documents</a></li>
                                        </ul>
                                    </li>
                                    {/* <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>List Of CT documents</a></li> */}
                                    {/* <li><a href={window.location.protocol + "//" + window.location.host + "/task"}>Task</a></li> */}
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li>
                                    <li className="menu-has-children"><a href="">{sessionStorage.getItem('username')}</a>
                                        <ul>
                                            <li><a href="" onClick={this.onClickLogout}>Logout</a></li>
                                        </ul>
                                    </li>

                                </ul>
                            </nav>
                        </div>
                    </header>
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
                                        <h4 className="title">Purpose</h4>
                                    </div>
                                    <div className="form-group col-8">
                                        <Dropdown
                                            className={blackBorder}
                                            options={this.state.defaultValues}
                                            placeholder='Select Purpose'
                                            search
                                            selection
                                            fluid
                                            value={this.state.purpose}
                                            onChange={this.handleChange}
                                        />
                                        {/* <DropdownPurpose elementName="purpose" updateCB={this.updateStateElement} /> */}
                                    </div>
                                </div>
                                {this.state.purpose === 'claim' &&
                                    <ProviderCommunicationRequest />
                                }
                                {this.state.purpose === 'request_document' &&
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