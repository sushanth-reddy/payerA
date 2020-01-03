import React, { Component } from 'react';
import config_default from '../globalConfiguration.json';
import { Input } from 'semantic-ui-react';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { saveConfiguration } from '../actions/index';
import 'react-notifications/lib/notifications.css';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import Loader from 'react-loader-spinner';
import { SelectPayerWithId } from '../components/SelectPayerWithId.js';
import logo from "../Palm_GBA_H.JPG";

// const NotificationContainer = window.ReactNotifications.NotificationContainer;
// const NotificationManager = window.ReactNotifications.NotificationManager;
class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            currentPayer: sessionStorage.getItem('currentPayer') !== undefined ? JSON.parse(sessionStorage.getItem('currentPayer')) : {},
            payer: ''
        }
        this.onChangeTokenExpiry = this.onChangeTokenExpiry.bind(this);
        this.onChangeCrdUrl = this.onChangeCrdUrl.bind(this);
        this.onChangeCoverageDecisionPath = this.onChangeCoverageDecisionPath.bind(this);
        this.onChangeCoverageRequirementPath = this.onChangeCoverageRequirementPath.bind(this);
        this.onChangePayerFhirUrl = this.onChangePayerFhirUrl.bind(this);
        this.onChangePayerClientSecret = this.onChangePayerClientSecret.bind(this);
        this.onChangePayerClientId = this.onChangePayerClientId.bind(this);
        this.onChangePayerGrantType = this.onChangePayerGrantType.bind(this);
        this.handleAPFChange = this.handleAPFChange.bind(this);
        this.onChangeProviderFhirUrl = this.onChangeProviderFhirUrl.bind(this);
        this.onChangeAuthorizedFhir = this.onChangeAuthorizedFhir.bind(this);
        this.onChangeProviderClientSecret = this.onChangeProviderClientSecret.bind(this);
        this.onChangeProviderClientId = this.onChangeProviderClientId.bind(this);
        this.onChangeProviderGrantType = this.onChangeProviderGrantType.bind(this);
        this.onChangeAuthTokenUrl = this.onChangeAuthTokenUrl.bind(this);
        this.onChangeTokenVerificationUrl = this.onChangeTokenVerificationUrl.bind(this);
        this.onChangeTokenType = this.onChangeTokenType.bind(this);
        this.onSaveConfiguration = this.onSaveConfiguration.bind(this);
        this.resetToDefaults = this.resetToDefaults.bind(this);
        this.onClickLogout = this.onClickLogout.bind(this);
        this.goTo = this.goTo.bind(this);
        this.updateStateElement = this.updateStateElement.bind(this);
    }


    onClickLogout() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('fhir_url');
        this.props.history.push('/payerA');
    }

    onChangeTokenExpiry(event) {
        let config = this.state.config;
        config.tokenExpiresIn = event.target.value
        this.setState({ config })
    }
    onChangeCrdUrl(event) {
        let config = this.state.config;
        config.crd_url = event.target.value
        this.setState({ config })
    }
    onChangeCoverageDecisionPath(event) {
        let config = this.state.config;
        config.crd.coverage_decision_path = event.target.value
        this.setState({ config })
    }
    onChangeCoverageRequirementPath(event) {
        let config = this.state.config;
        config.crd.coverage_requirement_path = event.target.value
        this.setState({ config })
    }
    onChangePayerFhirUrl(event) {
        let config = this.state.config;
        config.payer_fhir_url = event.target.value
        this.setState({ config })
    }
    onChangePayerGrantType(event) {
        let config = this.state.config;
        config.payer_grant_type = event.target.value
        this.setState({ config })
    }
    onChangePayerClientId(event) {
        let config = this.state.config;
        config.payer_client_id = event.target.value
        this.setState({ config })
    }
    onChangePayerClientSecret(event) {
        let config = this.state.config;
        config.payer_client_secret = event.target.value
        this.setState({ config })
    }
    handleAPFChange(event) {
        let config = this.state.config;
        config.payer_authorised = event.target.checked
        console.log(event.target.checked, 'check')
        this.setState({ config })
    }
    onChangeProviderFhirUrl(event) {
        let config = this.state.config;
        config.provider_fhir_url = event.target.value
        this.setState({ config })
    }
    onChangeProviderGrantType(event) {
        let config = this.state.config;
        config.provider_grant_type = event.target.value
        this.setState({ config })
    }
    onChangeProviderClientId(event) {
        let config = this.state.config;
        config.provider_client_id = event.target.value
        this.setState({ config })
    }
    onChangeProviderClientSecret(event) {
        let config = this.state.config;
        config.provider_client_secret = event.target.value
        this.setState({ config })
    }
    onChangeAuthorizedFhir(event) {
        let config = this.state.config;
        config.provider_authorised = event.target.checked
        this.setState({ config })
    }
    onChangeAuthTokenUrl(event) {
        let config = this.state.config;
        config.token_url = event.target.value
        this.setState({ config })
    }
    onChangeTokenVerificationUrl(event) {
        let config = this.state.config;
        config.authorization_service.token_verification_url = event.target.value
        this.setState({ config })
    }
    onChangeTokenType(event) {
        let config = this.state.config;
        config.authorization_service.token_type = event.target.value
        this.setState({ config })
    }
    onIdChange(e) {
        let config = this.state.config;
        config.payer_id = e.target.value
        this.setState({ config })
    }
    updateStateElement = (elementName, value) => {
        console.log("event----------", value, elementName)
        let config = this.state.config;
        config.payer_id = value.id
        this.setState({ [elementName]: value })

    }
    async onSaveConfiguration() {
        let config = this.state.config;
        var url = "http://cdex.mettles.com/cds/updateConfig";
        config["user_name"] = sessionStorage.getItem("username");
        console.log(config['id']);
        delete config["last_updated"];
        delete config["id"];
        console.log(config);
        let self = this;
        await fetch(url, {
            method: "POST",
            body: JSON.stringify(config)
        }).then(response => {
            return response.json();
        }).then((configuration) => {
            console.log("Configuartion response---", configuration);
            self.setState({ "config": config })
            sessionStorage.setItem('config', JSON.stringify(config))
            NotificationManager.success('Your changes have been updated successfully', 'Success');
        }).catch((reason) => {
            self.setState({ loading: false, login_error_msg: "Unable to login !! Please try again." });
            console.log("Configuartion not recieved from the server", reason)
        });
        // this.props.saveConfiguration(config);
    }
    async resetToDefaults() {
        var url = "http://cdex.mettles.com/cds/resetConfig";
        let body = { "user_name": sessionStorage["username"] }
        console.log(body);
        let self = this;
        await fetch(url, {
            method: "POST",
            body: JSON.stringify(body)
        }).then(response => {
            return response.json();
        }).then((configuration) => {
            console.log("Configuartion response---", configuration);
            configuration["user_name"] = sessionStorage.getItem("username")
            self.setState({ "config": configuration })
            sessionStorage.setItem('config', JSON.stringify(configuration))
            NotificationManager.success('Your changes have been set to defaults successfully', 'Reset Successfull');
        }).catch((reason) => {
            self.setState({ loading: false, login_error_msg: "Unable to login !! Please try again." });
            console.log("Configuartion not recieved from the server", reason)
        });
        // this.props.saveConfiguration(config_default);
        // window.location.reload();
    }
    goTo(title) {
        window.location = window.location.protocol + "//" + window.location.host + "/" + title;
    }
    renderConfiguration() {
        return (
            <React.Fragment>
                <div>
                    <header id="inpageheader">
                        <div >
                            <div id="logo" className="pull-left">
                                {/* <h1><a href="#intro" className="scrollto">Beryllium</a></h1> */}
                                {/* <a href="#intro"><img src={process.env.PUBLIC_URL + "/assets/img/logo.png"} alt="" title="" /></a> */}
                                {this.state.currentPayer !== null &&
                  <h1><img style={{height: "60px", marginTop: "-13px"}} src={logo}  /><a href="#intro" className="scrollto">{this.state.currentPayer.payer_name}</a></h1>
                                }
                            </div>
                            <nav id="nav-menu-container">
                                <ul className="nav-menu">
                                    {/* <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>List Of CT documents</a></li> */}
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/payerA"}>Request for CTD</a></li>
                                    {/* <li><a href={window.location.protocol + "//" + window.location.host + "/payerB"}>PDEX</a></li> */}
                                    {/* <li className="menu-active"><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li> */}
                                    <li className="menu-has-children"><a href="">{sessionStorage.getItem('username')}</a>
                                        <ul>
                                            <li><a href="" onClick={this.onClickLogout}>Logout</a></li>
                                        </ul>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </header>
                    {/* <div className="main_heading">
                        <span style={{ lineHeight: "35px" }}>PILOT INCUBATOR - Configuration</span>
                        <div className="menu_conf" onClick={() => this.goTo('provider_request')}>
                            <i style={{ paddingLeft: "5px", paddingRight: "7px" }} className="fa fa-home"></i>
                            Home</div>
                        <div className="menu_conf" onClick={() => this.goTo('cdex')}>
                            <i style={{ paddingLeft: "5px", paddingRight: "7px" }} className="fa fa-exchange"></i>
                            CDEX</div>
                        
                        <div className="menu_conf" onClick={() => this.goTo('x12converter')}>
                            <i style={{ paddingLeft: "5px", paddingRight: "7px" }} className="fa fa-exchange"></i>
                            X12 Converter</div>
                        
                        <div className="menu_conf" onClick={() => this.goTo('reportingScenario')}>
                            <i style={{ paddingLeft: "5px", paddingRight: "7px" }} className="fa fa-exchange"></i>
                            Reporting Scenario</div>
                        
                    </div> */}
                    <main id="main" style={{ marginTop: "92px" }}>
                        <div className="form">
                            <div className="container">
                                <div className="section-header">
                                    <h3>Configuration</h3>
                                    <p>Setup FHIR information and others</p>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title">Payer FHIR</h4>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <input type="text" name="payer_fhir_url" className="form-control" id="name" placeholder="URL"
                                            onChange={this.onChangePayerFhirUrl} value={this.state.config.payer_fhir_url}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title"></h4>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="payer_grant_type" className="form-control" id="name" placeholder="Grant Type"
                                            onChange={this.onChangePayerGrantType}
                                            value={this.state.config.payer_grant_type}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <div className="form-control">Authorized<input
                                            name="authorize_payer_fhir"
                                            type="checkbox"
                                            className="input-checkbox"
                                            value={this.state.config.payer_authorised}
                                            checked={this.state.config.payer_authorised}
                                            onChange={this.handleAPFChange} /></div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title"></h4>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="payer_client_id" className="form-control" id="name" placeholder="Client Id"
                                            onChange={this.onChangePayerClientId}
                                            value={this.state.config.payer_client_id}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="payer_client_secret" className="form-control" id="name" placeholder="Client Secret"
                                            onChange={this.onChangePayerClientSecret} fluid
                                            value={this.state.config.payer_client_secret}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                </div>
                                <SelectPayerWithId elementName='payer' updateCB={this.updateStateElement} />

                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title"></h4>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <span className="title-small">Payer Id</span>
                                        <input type="text" name="payer_id" className="form-control" id="payer_id" placeholder=" Payer Id"
                                            value={this.state.config.payer_id} onChange={this.onIdChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title">Provider FHIR</h4>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <input type="text" name="provider_fhir_url" className="form-control" id="name" placeholder="URL"
                                            onChange={this.onChangeProviderFhirUrl}
                                            value={this.state.config.provider_fhir_url}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title"></h4>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="provider_grant_type" className="form-control" id="name" placeholder="Grant Type"
                                            onChange={this.onChangeProviderGrantType} fluid
                                            defaultValue={this.state.config.provider_grant_type}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <div className="form-control">Authorized <input
                                            name="authorize_fhir"
                                            className="input-checkbox"
                                            type="checkbox"
                                            value={this.state.config.provider_authorised}
                                            checked={this.state.config.provider_authorised}
                                            onChange={this.onChangeAuthorizedFhir} /></div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title"></h4>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="provider_client_id" className="form-control"
                                            id="name" placeholder="Client Id"
                                            onChange={this.onChangeProviderClientId}
                                            defaultValue={this.state.config.provider_client_id}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <input type="text" name="provider_client_secret" className="form-control"
                                            id="name" placeholder="Client Secret"
                                            onChange={this.onChangeProviderClientSecret}
                                            defaultValue={this.state.config.provider_client_secret}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title">CRD</h4>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <input type="text" name="crd_url" className="form-control"
                                            id="name" placeholder="URL"
                                            onChange={this.onChangeCrdUrl}
                                            value={this.state.config.crd_url}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                    {/* <div className="form-group col-md-3">
                                        <input type="text" name="coverage_requirements_path" className="form-control"
                                            id="name" placeholder="Requirements Path"
                                            onChange={this.onChangeCoverageRequirementPath}
                                            value={this.state.config.crd.coverage_requirement_path}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div> */}
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-2 offset-2">
                                        <h4 className="title">Authorization</h4>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <input type="text" name="auth_token_url" className="form-control"
                                            id="name" placeholder="Token URL"
                                            onChange={this.onChangeAuthTokenUrl}
                                            defaultValue={this.state.config.token_url}
                                            data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                                        <div className="validation"></div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button type="button" onClick={this.onSaveConfiguration}>Save
                                        <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                                            <Loader
                                                type="Oval"
                                                color="#fff"
                                                height="15"
                                                width="15"
                                            />
                                        </div>
                                    </button>
                                    <button type="reset" className="btn2" onClick={this.resetToDefaults}>Reset to defaults
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
                            </div>
                        </div>
                    </main>
                    {/* <div className="content">
                        <div className="left-form">

                            {config.user_profiles.map(function(user_profile, index){
                        if(user_profile.username=='john'){
                            return(<div>
                                <div className='header'>User Profile {index+1}</div>
                            <div className="leftStateInput"><div className='header-child'>Username</div>
                            <div className="dropdown"><Input className='ui input' type="text" name="username" defaultValue={user_profile.username}></Input></div></div>
                            <div className="rightStateInput"><div className='header-child'>Name</div>
                            <div className="dropdown"><Input className='ui input' type="text" name="name" defaultValue={user_profile.name}></Input></div></div>
                            <div className='header-child'>NPI</div>
                            <div className="dropdown"><Input className='ui fluid input' type="text" name="npi" fluid defaultValue={user_profile.npi}></Input></div>
                            </div>
                            )
                        }
                        else if(user_profile.username==='mary'){
                            return(<div>
                                <div className='header'>User Profile {index+1}</div>
                               <div className="leftStateInput"> <div className='header-child'>Username</div>
                               <div className="dropdown"><Input className='ui input' type="text" name="username" defaultValue={user_profile.username}></Input></div></div>
                            <div className="rightStateInput"><div className='header-child'>Name</div>
                            <div className="dropdown"><Input className='ui input' type="text" name="name" defaultValue={user_profile.name}></Input></div></div>
                            <div className='header-child'>NPI</div>
                            <div className="dropdown"><Input className='ui fluid input' type="text" name="npi" fluid defaultValue={user_profile.npi}></Input></div>
                            </div>
                            )
                        }
                        
                    })} 
                            <div className='header'>CRD</div>
                            <div className='header-child'>CRD URL</div>
                            <div className="dropdown">
                                <Input className='ui fluid input' type="text" fluid name="crd_url"
                                    onChange={this.onChangeCrdUrl}
                                    defaultValue={this.state.config.crd_url}>
                                </Input>
                            </div>

                            <div className='header-child'>Coverage Decision Path</div>
                            <div className="dropdown">
                                <Input className='ui fluid input' type="text" name="coverage_decision_path"
                                    fluid onChange={this.onChangeCoverageDecisionPath}
                                    defaultValue={this.state.config.crd.coverage_decision_path}>
                                </Input>
                            </div>
                            <div className='header-child'>Coverage Requirement Path</div>
                            <div className="dropdown">
                                <Input className='ui fluid input' type="text" name="coverage_requirement_path" fluid
                                    onChange={this.onChangeCoverageRequirementPath}
                                    defaultValue={this.state.config.crd.coverage_requirement_path}>
                                </Input>
                            </div>



                            <div className='header'>CDS Service</div>
                    <div className="leftStateInput"><div className='header-child'>VSAC Username</div>
                    <div className="dropdown"><Input className='ui  input' type="text" name="vsac_user"  defaultValue={config.cds_service.vsac_user}></Input></div></div>
                    <div className="rightStateInput"><div className='header-child'>VSAC Password</div>
                    <div className="dropdown"><Input className='ui  input' type="text" name="vsac_password"  defaultValue={config.cds_service.vsac_password}></Input></div></div>
                            <div className='header'>Authorization Service</div>
                            <div className='header-child'>Authorization Token URL</div>
                            <div className="dropdown">
                                <Input className='ui fluid input' type="text" fluid name="auth_token_url"
                                    onChange={this.onChangeAuthTokenUrl}
                                    defaultValue={this.state.config.token_url}>
                                </Input>
                            </div>
                            <div className='header-child'>Token Verification URL</div>
                            <div className="dropdown">
                                <Input className='ui fluid input' type="text" name="token_verification_url" fluid
                                    onChange={this.onChangeTokenVerificationUrl}
                                    defaultValue={this.state.config.authorization_service.token_verification_url}>
                                </Input>
                            </div>
                            <div className="leftStateInput">
                                <div className='header-child'>Token Type</div>
                                <div className="dropdown"><Input className='ui input' type="text"
                                    name="token_type" onChange={this.onChangeTokenType}
                                    defaultValue={this.state.config.authorization_service.token_type}>
                                </Input>
                                </div>
                            </div>
                            <div className="rightStateInput"><div className='header-child'>Token Expires In</div>
                                <div className="dropdown">
                                    <Input className='ui  input' type="text" name="token_expires_in"
                                        onChange={this.onChangeTokenExpiry}
                                        defaultValue={this.state.config.authorization_service.token_expires_in}>
                                    </Input>
                                </div>
                            </div>
                        </div>
                        <div className="right-form">
                            <button className="submit-btn btn btn-class button-ready"
                                onClick={this.onSaveConfiguration}>Save</button>
                            <button className="btn default-btn"
                                onClick={this.resetToDefaults}>Reset to defaults</button>
                        </div>
                    </div>*/}
                    <NotificationContainer />
                </div>
            </React.Fragment>
        )

    }

    render() {
        return (
            <div className="attributes mdl-grid">
                {this.renderConfiguration()}
            </div>)
    }

}
function mapStateToProps(state) {
    console.log(state);
    return {
        config: state.config,
    };
};

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        saveConfiguration
    }, dispatch);
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Configuration));
