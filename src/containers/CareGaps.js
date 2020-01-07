import React, { Component } from 'react';
import { SelectPatientCareGaps } from '../components/SelectPatientCareGaps';
import { SelectCareGapTopic } from '../components/SelectCareGapTopic';
import { DateInput } from 'semantic-ui-calendar-react';
import Loader from 'react-loader-spinner';
import { createToken } from '../components/Authentication';

export default class CareGaps extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            loading: false,
            patient: "",
            topic: "",
            startDate: "",
            endDate: "",
            successMsg: "",
            errorMsg: "",
            currentPayer: '',
        }
        this.onClickLogout = this.onClickLogout.bind(this);
        this.onChange = this.onChange.bind(this);
        this.submit = this.submit.bind(this);
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
   async componentDidMount() {
        if (!sessionStorage.getItem('isLoggedIn')) {
            sessionStorage.setItem('redirectTo', "/care_gaps");
            this.props.history.push("/login");
        }
        let payersList = await this.getPayerList()
        let payer;
        if (payersList !== undefined) {
            if (this.state.config !== null) {
                payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
                this.setState({ currentPayer: payer })
            }

        }
    }
    onClickLogout() {
        sessionStorage.removeItem('isLoggedIn');
        this.props.history.push('/home');
    }
    updateStateElement = (elementName, text) => {
        this.setState({ [elementName]: text });
    }
    onChange(event, { name, value }) {
        if (this.state.hasOwnProperty(name)) {
            this.setState({ [name]: value });
        }
    }
    async submit() {
        this.setState({ prefetchloading: true });
        let token = await createToken(this.state.config.payer_grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        token = "Bearer " + token;
        var myHeaders = new Headers({
            "Content-Type": "application/json",
            "authorization": token,
        });
        let url = this.state.config.payer_fhir_url + "/Measure/$care-gaps"
        url += "?patient=Patient/" + this.state.patient;
        url += "&topic=" + this.state.topic;
        url += "&periodStart=" + this.state.startDate;
        url += "&periodEnd=" + this.state.endDate;
        await fetch(url, {
            method: "GET",
            headers: myHeaders
        }).then(response => {
            return response.json();
        }).then((careGapsRes) => {
            console.log("Care Gaps Response",careGapsRes);
            this.setState({"successMsg":"Check patient's care gap report below."})
        }).catch((error)=>{
            this.setState({"errorMsg":"Unable to fetch Care Gaps report !!"})
        })
    }
    render() {
        return (
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
                                            <li ><a href={window.location.protocol + "//" + window.location.host + "/request"}>Request for documents</a></li>
                                            <li className="menu-active"><a href={window.location.protocol + "//" + window.location.host + "/care_gaps"}>Request Care Gaps</a></li>
                                        </ul>
                                    </li>
                                    <li className="menu-has-children"><a href="">TASKS</a>
                                        <ul>
                                            <li ><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>Coverage Documents</a></li>
                                            <li><a href={window.location.protocol + "//" + window.location.host + "/cdex_documents"}>Clinical Documents</a></li>
                                            <li><a href={window.location.protocol + "//" + window.location.host + "/task"}>Submit Coverage Documents</a></li>
                                        </ul>
                                    </li>

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
                                <h3>Gaps in Care
                                    <div className="sub-heading">Check gaps in care for patient.</div>
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div>
                        <SelectPatientCareGaps elementName='patient' updateCB={this.updateStateElement} />
                        <SelectCareGapTopic elementName='topic' updateCB={this.updateStateElement} />
                        <div className="form-row">
                            <div className="form-group col-md-2 offset-2">
                                <h4 className="title">Measurement Period</h4>
                            </div>
                            <div className="form-group col-md-3">
                                <DateInput
                                    name="startDate"
                                    placeholder="Start Date"
                                    dateFormat="YYYY-MM-DD"
                                    fluid
                                    value={this.state.startDate}
                                    iconPosition="left"
                                    onChange={this.onChange}
                                />
                            </div>
                            <div className="form-group col-md-3">
                                <DateInput
                                    name="endDate"
                                    placeholder="End Date"
                                    dateFormat="YYYY-MM-DD"
                                    fluid
                                    value={this.state.endDate}
                                    iconPosition="left"
                                    onChange={this.onChange}
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <button type="button" onClick={this.submit}>Submit
                    <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                                    <Loader
                                        type="Oval"
                                        color="#fff"
                                        height="15"
                                        width="15"
                                    />
                                </div>
                            </button>
                        </div>
                        <div>
                            {this.state.successMsg.length > 0 &&
                                <h4>{this.state.successMsg}</h4>
                            }
                            {this.state.errorMsg.length > 0 &&
                                <h4>{this.state.errorMsg}</h4>
                            }
                        </div>
                    </div>
                </main>

            </div>
        )
    }
}