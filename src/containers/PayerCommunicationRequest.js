import React, { Component } from 'react';
import { Input } from 'semantic-ui-react';
// import { DateInput } from 'semantic-ui-calendar-react';
import { withRouter } from 'react-router-dom';
import Client from 'fhir-kit-client';
import 'font-awesome/css/font-awesome.min.css';
import "react-datepicker/dist/react-datepicker.css";
// import DisplayBox from '../components/DisplayBox';
import 'font-awesome/css/font-awesome.min.css';
import '../index.css';
import '../components/consoleBox.css';
import Loader from 'react-loader-spinner';
import config from '../globalConfiguration.json';
import { KEYUTIL } from 'jsrsasign';
import { createToken } from '../components/Authentication';
import { SelectPayer } from '../components/SelectPayerWithId';
import { connect } from 'react-redux';
import moment from "moment";
import { SelectPatient } from '../components/SelectPatient';
import { DropdownPurpose } from '../components/DropdownPurpose';
import { SelectPayerWithEndpoint } from '../components/SelectPayerWithEndpoint';
import logo from "../Palm_GBA_H.JPG";

let now = new Date();
let occurenceStartDate = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0, 0)).toISOString();
let occurenceEndDate = moment(occurenceStartDate).add(8, "days").subtract(1, "seconds").toISOString();
let yesterday = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0, 0));
let payloadStartDate = moment(yesterday).subtract(8, "days").toISOString();
let payloadEndDate = moment(payloadStartDate).add(8, "days").subtract(1, "seconds").toISOString();


var requesterPayerFhir = "http://localhost:8080/hapi-fhir-jpaserver/fhir"
// var senderPayerFhir = this.props.config.payer.fhir_url

const types = {
  error: "errorClass",
  info: "infoClass",
  debug: "debugClass",
  warning: "warningClass"
}


class CommunicationRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      patient: null,
      fhirUrl: (sessionStorage.getItem('username') === 'john') ? this.props.config.provider.fhir_url : 'https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca',
      accessToken: '',
      scope: '',
      payer: '',
      patientId: sessionStorage.getItem('patientId'),
      payerId: "6677829",
      practitionerId: "9941339229",
      resourceType: null,
      resourceTypeLT: null,
      encounterId: '',
      coverageId: '',
      encounter: null,
      request: "coverage-requirement",
      response: null,
      token: null,
      oauth: false,
      treating: null,
      loading: false,
      logs: [],
      cards: [],
      medicationInput: null,
      medication: null,
      medicationStartDate: '',
      medicationEndDate: '',
      hook: null,
      resource_records: {},
      keypair: KEYUTIL.generateKeypair('RSA', 2048),
      prior_auth: false,
      dosageAmount: null,
      color: 'grey',
      validatePatient: false,
      validateFhirUrl: false,
      validateAccessToken: false,
      validateIcdCode: false,
      req_active: 'active',
      auth_active: '',
      prefetchData: {},
      prefetch: false,
      frequency: null,
      loadCards: false,
      showMenu: false,
      service_code: "",
      category_name: "",
      communicationList: [],
      documents: [],
      reqId: '',
      vitalSigns: [],
      reasons: '',
      docType: '',
      timePeriod: '',
      payloadtimePeriod: '',
      occurenceStartDate: occurenceStartDate,
      occurenceEndDate: occurenceEndDate,
      payloadStartDate: payloadStartDate,
      payloadEndDate: payloadEndDate,
      isDocument: true,
      payer_name: '',
      queries: [{ query: "", searchString: "", resource: "" }],
      requirementSteps: [{ 'step_no': 1, 'step_str': 'Communicating with CRD system.', 'step_status': 'step_loading' },
      {
        'step_no': 2, 'step_str': 'Retrieving the required 4 FHIR resources on crd side.', 'step_status': 'step_not_started'
      },
      { 'step_no': 3, 'step_str': 'Executing HyperbaricOxygenTherapy.cql on cds server and generating requirements', 'step_status': 'step_not_started', 'step_link': 'https://github.com/mettlesolutions/coverage_determinations/blob/master/src/data/Misc/Home%20Oxygen%20Therapy/homeOxygenTherapy.cql', 'cql_name': 'homeOxygenTheraphy.cql' },
      { 'step_no': 4, 'step_str': 'Generating cards based on requirements .', 'step_status': 'step_not_started' },
      { 'step_no': 5, 'step_str': 'Retrieving Smart App', 'step_status': 'step_not_started' }],
      errors: {},
      loadingSteps: false,
      dataLoaded: false,
      isClinicalNote: true,
      isDataElement: false,
      patientResource: '',
      senderOrganizationIdentifier: '',
      senderOrganizationResource: '',
      communicationRequestIdentifier: this.getGUID(),
      payer: '',
      // currentPayer: sessionStorage.getItem('currentPayer') !== undefined ? JSON.parse(sessionStorage.getItem('currentPayer')) : '',
      currentPayer: '',
      requesterCommRequest: '',
      purpose: '',
      note: '',
      config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},

    }


    this.requirementSteps = [
      { 'step_no': 1, 'step_str': 'Communicating with CRD system.', 'step_status': 'step_loading' },
      { 'step_no': 2, 'step_str': 'Fetching required FHIR resources at CRD', 'step_status': 'step_not_started' },
      { 'step_no': 3, 'step_str': 'Executing CQL at CDS and generating requirements', 'step_status': 'step_not_started', 'step_link': 'https://github.com/mettlesolutions/coverage_determinations/blob/master/src/data/Misc/Home%20Oxygen%20Therapy/homeOxygenTherapy.cql', 'cql_name': 'homeOxygenTheraphy.cql' },
      { 'step_no': 4, 'step_str': 'Generating cards based on requirements .', 'step_status': 'step_not_started' },
      { 'step_no': 5, 'step_str': 'Retrieving Smart App', 'step_status': 'step_not_started' }];
    this.currentstep = 0;
    this.validateMap = {
      status: (foo => { return foo !== "draft" && foo !== "open" }),
      code: (foo => { return !foo.match(/^[a-z0-9]+$/i) })
    };
    this.startLoading = this.startLoading.bind(this);
    this.submit_info = this.submit_info.bind(this);

    this.onClickLogout = this.onClickLogout.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    // this.readFHIR = this.readFHIR.bind(this);
    this.onClickMenu = this.onClickMenu.bind(this);
    this.redirectTo = this.redirectTo.bind(this);
    this.updateStateElement = this.updateStateElement.bind(this);
    this.getToken = this.getToken.bind(this);
    this.onChangeNote = this.onChangeNote.bind(this);

  }
  consoleLog(content, type) {
    let jsonContent = {
      content: content,
      type: type
    }
    this.setState(prevState => ({
      logs: [...prevState.logs, jsonContent]
    }))
  }

  //   let queries = this.state.queries;
  //   console.log("queries--",queries)
  //   queries= queries.push({query:"", searchString:"",resource:""});
  //   this.setState({queries:queries})
  //   console.log("qState queries--,",this.state.queries)
  updateStateElement = (elementName, value) => {
    // console.log("event----------", value, elementName)
    this.setState({ [elementName]: value })

  }


  async getToken(grant_type, client_id, client_secret) {
    let params = {}
    const tokenUrl = config.token_url;
    params['grant_type'] = grant_type
    params['client_id'] = client_id
    params['client_secret'] = client_secret
    const searchParams = Object.keys(params).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: searchParams
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const token = response ? response.access_token : null;
        if (token) {
          console.log("Successfully retrieved token", types.info);
        } else {
          console.log("Failed to get token", types.warning);
          if (response.error_description) {
            console.log(response.error_description, types.error);
          }
        }
        return token;

      })
      .catch(reason => {
        console.log("Failed to get token", types.error, reason);
        console.log("Bad request");
      });
    //    let t = await tokenResponse
    // console.log("tokenResponse:",t)
    return tokenResponse;
  }

  validateForm() {
    let formValidate = true;
    if (this.state.patientId === '') {
      formValidate = false;
      this.setState({ validatePatient: true });
    }

    if (this.state.practitionerId === '') {
      formValidate = false;
      this.setState({ validatePractitioner: true });
    }

    if (this.state.payerId === '') {
      formValidate = false;
      this.setState({ validatePayer: true });
    }

    return formValidate;
  }

  startLoading() {
    // if (this.validateForm()) {
    this.setState({ loading: true }, () => {
      this.submit_info();
    })
    // }
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
    // console.log(payer, "currentPayer")

    // let token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
    // token = "Bearer " + token;
    var myHeaders = new Headers({
      "Content-Type": "application/json",
      // "authorization": token,
    });
    // var url = this.props.config.provider.fhir_url + '/' + 'Patient' + "/" + this.state.patientId;
    // var url = this.state.currentPayer.payer_end_point + "/Organization?identifeir="
    // let organization = await fetch(url, {
    //   method: "GET",
    //   headers: myHeaders
    // }).then(response => {
    //   // console.log("response----------",response);
    //   return response.json();
    // }).then((response) => {
    //   // console.log("----------response", response);


    //   this.setState({ senderOrganizationIdentifier: response.identifier[0].value })
    //   this.setState({ senderOrganizationResource: response })
    //   this.setState({ prefetchloading: false });
    //   return response;
    // }).catch(reason =>
    //   console.log("No response recieved from the server", reason)
    // );


  }

  onClickMenu() {
    var showMenu = this.state.showMenu;
    this.setState({ showMenu: !showMenu });
  }

  async getResources(resource, identifier) {
    var url = this.state.currentPayer.payer_end_point + "/" + resource + "?identifier=" + identifier;
    // let token;
    let headers = {
      "Content-Type": "application/json",
    }
    // token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
    // if (config.payerA.authorizedPayerFhir) {
    //   headers['Authorization'] = 'Bearer ' + token
    // }
    let sender = await fetch(url, {
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
    return sender;
  }


  redirectTo(path) {
    window.location = `${window.location.protocol}//${window.location.host}/` + path;
  }
  onClickLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('fhir_url');
    this.props.history.push('/login');
  }



  async createFhirResource(json, resourceName, url, user, claim = false) {
    //  console.log("this.state.procedure_code")
    // console.log(this.state.procedure_code)
    // this.setState({ loading: true });

    try {
      // if (claim == true) {
      //   json.about = [{
      //     "reference": "Claim?identifier=" + this.state.claimid
      //   }];
      // }
      const fhirClient = new Client({ baseUrl: url });
      let token;
      // if (user == 'provider') {
      //   console.log('using Provider Client Credentials')

      //   if (this.props.config.provider.grant_type == 'client_credentials') {
      //     token = await createToken(this.props.config.provider.grant_type, user, this.props.config.provider.username, this.props.config.provider.password);
      //   }
      //   else {
      //     token = await createToken(this.props.config.provider.grant_type, user, this.props.config.provider.username, this.props.config.provider.password);

      //   }
      //   if (this.props.config.provider.authorized_fhir) {
      //     fhirClient.bearerToken = token;
      //   }
      // }
      // else if (user == 'payer') {
      //   console.log('using payer Client Credentials')
      //   if (this.props.config.payer.grant_type == 'client_credentials') {
      //     token = await createToken(this.props.config.payer.grant_type, user, sessionStorage.getItem('username'), sessionStorage.getItem('password'));
      //   }
      //   else {
      //     token = await createToken(this.props.config.payer.grant_type, user, sessionStorage.getItem('username'), sessionStorage.getItem('password'));
      //   }
      //   if (this.props.config.payer.authorizedPayerFhir) {
      //     fhirClient.bearerToken = token;
      //   }
      // }
      // token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
      // fhirClient.bearerToken = token;

      console.log('The json is : ', json);
      let data = fhirClient.create({
        resourceType: resourceName,
        body: json,
        headers: { "Content-Type": "application/fhir+json" }
      }).then((data) => {
        console.log("Data::", data);
        this.setState({ requesterCommRequest: data })
        if (user == 'otherPayer') {
          this.setState({ dataLoaded: true })
          var commReqId = data.entry[0].response.location.split('/')[1]
          this.setState({ reqId: commReqId })
        }
        // this.setState({ loading: false });
        return data;
      }).catch((err) => {
        console.log(err);
        // this.setState({ loading: false });
      })
      return data
    } catch (error) {
      console.error('Unable to create resource', error.message);
      // this.setState({ loading: false });
      this.setState({ dataLoaded: false })
    }
  }

  getGUID = () => {
    let s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };
    return 'mettles-' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }


  async submit_info() {

    try {
      this.setState({ loading: true });

      let requesterOrganizationBundle = await this.getResources('Organization', this.state.currentPayer.payer_identifier)
      let senderOrganizationBundle = await this.getResources('Organization', this.state.payer.payer_identifier)
      let senderOrganization = ''
      let requesterOrganization = ''
      if (requesterOrganizationBundle.hasOwnProperty('entry')) {
        requesterOrganization = requesterOrganizationBundle.entry[0].resource
      }
      if (senderOrganizationBundle.hasOwnProperty('entry')) {
        senderOrganization = senderOrganizationBundle.entry[0].resource
      }
      // var request_identifier = 
      this.setState({ dataLoaded: false, reqId: '' })
      let communicationRequestIdentifier = this.state.communicationRequestIdentifier
      // let request_identifier = await this.getGUID();
      // this.setState({communicationRequestIdentifier:request_identifier})
      let communicationRequestBundle = {
        "resourceType": "Bundle",
        "id": 'bundle-transaction',
        "type": "transaction",
        "entry": []
      }
      var date = new Date()
      var currentDateTime = date.toISOString()
      let commRequest = {
        "resourceType": "CommunicationRequest",
        "id": "1",
        "status": "active",
        "subject": {
          "reference": "Patient/" + this.state.patientResource.id
        },
        "identifier": [
          {
            "system": "http://www.jurisdiction.com/insurer/123456",
            "value": communicationRequestIdentifier
          }
        ],
        "authoredOn": currentDateTime,
        "payload": [
          {
            "extension": [
              {
                "url": "http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-clinical-note-type",
                "valueCodeableConcept": {
                  "coding": [
                    {
                      "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEDocumentCode",
                      "code": "pcde"
                    }
                  ]
                }
              }
            ],
            "contentString": "Please send previous coverage information."
          }
        ],
        "requester": {
          "reference": "Organization/" + requesterOrganization.id
        },
        "recipient": [
          {
            "reference": "Organization/" + requesterOrganization.id
          }
        ],
        "sender": {
          "reference": "Organization/" + senderOrganization.id
        }
      }
      if (this.state.note !== '') {
        let string = commRequest.payload[0].contentString + " " + this.state.note
        commRequest.payload[0].contentString = string
      }
      communicationRequestBundle.entry.push({
        resource: commRequest,
        'request': {
          "method": "POST",
          "url": "CommunicationRequest",
          "ifNoneExist": "identifier=" + communicationRequestIdentifier
        }

      })


      let requesterCommRequest = await this.createFhirResource(commRequest, 'CommunicationRequest', this.state.currentPayer.payer_end_point, 'payer', true)
      console.log()
      let requester_endPoint_identifier = this.getGUID()
      let bundle = {
        "resourceType": "Bundle",
        "id": 'bundle-transaction',
        "type": "transaction",
        "entry": []
      }
      requesterOrganization['endpoint'] = []
      requesterOrganization['endpoint'][0] = { 'reference': "Endpoint/Requester-Endpoint-Id" }

      bundle.entry.push({
        'resource': commRequest,
        'request': {
          "method": "POST",
          "url": "CommunicationRequest",
          "ifNoneExist": "identifier=" + communicationRequestIdentifier
        }
      })
      bundle.entry.push({
        "resource": {
          "resourceType": "Endpoint",
          "id": "Requester-Endpoint-Id",
          "identifier": [
            {
              "system": "http://www.jurisdiction.com/insurer/123456",
              "value": requester_endPoint_identifier
            }
          ],
          "connectionType": {
            "system": "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
            "code": "hl7-fhir-rest"
          },
          " managingOrganization": {
            "reference": "Organization/" + requesterOrganization.id
          },
          "address": this.state.currentPayer.payer_end_point
        },
        "request": {
          "method": "POST",
          "url": "Endpoint",
          "ifNoneExist": "identifier=" + requester_endPoint_identifier
        }
      })
      bundle.entry.push({
        'resource': this.state.patientResource,
        'request': {
          "method": "POST",
          "url": "Patient",
          "ifNoneExist": "identifier=" + this.state.patientResource.identifier[0].value
        }
      })
      bundle.entry.push({
        'resource': requesterOrganization,
        'request': {
          "method": "PUT",
          "url": "Organization?identifier=" + requesterOrganization.identifier[0].value,
          "ifNoneExist": "identifier=" + requesterOrganization.identifier[0].value
        }
      })
      bundle.entry.push({
        'resource': senderOrganization,
        'request': {
          "method": "POST",
          "url": "Organization",
          "ifNoneExist": "identifier=" + senderOrganization.identifier[0].value
        }
      })

      let response = await this.createFhirResource(bundle, '', this.state.payer.payer_end_point, 'otherPayer', true).then(() => {
        this.setState({ loading: false });
      })
      console.log(response, 'communciation request created')
      // let res_json = {}
      // this.setState({ dataLoaded: false, reqId: '' })
      // this.setState({ loading: false });







      // let communication = await this.createFhirResource(provider_req_json, 'CommunicationRequest', this.props.config.payer.fhir_url, 'payer', true)

      // console.log(commRequest, 'yess')
      // console.log(communication, 'yess plese')
      // sessionStorage.setItem('patientId', this.state.patientId)
      // sessionStorage.setItem('practitionerId', this.state.practitionerId)
      // sessionStorage.setItem('payerId', this.state.payerId)
      // this.setState({ response: res_json });

    }
    catch (error) {
      console.log(error)
      this.setState({ response: error });
      this.setState({ loading: false });
      if (error instanceof TypeError) {
        this.consoleLog(error.name + ": " + error.message);
      }
      this.setState({ dataLoaded: false })
    }
  }

  onChangeNote(event) {
    this.setState({ note: event.target.value });
  }


  renderForm() {
    let local = {
      "format": "DD-MM-YYYY HH:mm",
      "sundayFirst": false
    }
    console.log('yoooo heree ')
    return (
      <React.Fragment>
        <div>
          {/* <header id="inpageheader">
            <div className="">

              <div id="logo" className="pull-left">
                
                {this.state.currentPayer!=='' &&
                  <h1><img style={{height: "60px", marginTop: "-13px"}} src={logo}  /><a href="#intro" className="scrollto">{this.state.currentPayer.payer_name}</a></h1>
                }
                <a href="#intro"><img src={process.env.PUBLIC_URL + "/assets/img/logo.png"} alt="" title="" /></a>
              </div>

              <nav id="nav-menu-container">
                <ul className="nav-menu">
                  <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>List Of CT documents</a></li>
                  <li><a href={window.location.protocol + "//" + window.location.host + "/pdex"}>PDEX</a></li>
                  <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li>

                </ul>
              </nav>
            </div>
          </header>  */}
          {/* <main id="main" style={{ marginTop: "192px" }}> */}
          <main id="main" >
            <div className="form">
              {/* <div className="container"> */}
              {/* <div className="section-header">
                  <h3>Request for Coverage Transition Document
                  <div className="sub-heading"></div>
                  </h3>

                </div> */}
              <div>
                <div className="form-row">
                  <div className="form-group col-3 offset-1">
                    {/* <span className="title-small">Beneficiary*</span> */}
                    <h4 className="title">Beneficiary*</h4>

                  </div>
                  <div className="form-group col-8">
                    <SelectPatient elementName="patientResource" updateCB={this.updateStateElement} />
                  </div>





                </div>
                {this.state.patientResource !== '' &&
                  <div >
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title">Beneficiary Info</h4>
                      </div>

                      <div className="form-group col-md-4">
                        <span className="title-small">First Name</span>
                        <input type="text" name="firstName" className="form-control" id="name" placeholder="First Name"
                          value={this.state.patientResource.name[0].given} disabled
                        />

                      </div>
                      <div className="form-group col-md-4">
                        <span className="title-small">Last Name</span>
                        <input type="text" name="lastName" className="form-control" id="lastname" placeholder="Last Name"
                          value={this.state.patientResource.name[0].family} disabled
                        />

                      </div>

                    </div>
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        {/* <h4 className="title">Gender</h4> */}
                      </div>
                      {this.state.patientResource.hasOwnProperty('gender') &&
                        <div className="form-group col-md-4">
                          <span className="title-small">Gender</span>
                          <input type="text" name="gender" className="form-control" id="gender" placeholder="Gender"
                            value={this.state.patientResource.gender} disabled
                          />
                          {/* <Dropdown
                               className={"blackBorder"}
                               options={this.state.genderOptions}
                               placeholder='Gender'
                               search
                               selection
                               fluid
                               value={this.state.gender}
                               onChange={this.handleGenderChange}
                             /> */}
                        </div>
                      }
                      {this.state.patientResource.hasOwnProperty('birthDate') &&
                        <div className="form-group col-md-4">
                          <span className="title-small">Birth Date</span>
                          <input type="text" name="birthDate" className="form-control" id="birthDate" placeholder="Birth Date"
                            value={this.state.patientResource.birthDate} disabled
                          />
                          {/* <DateInput
                                name="birthDate"
                                placeholder="Birth Date"
                                dateFormat="MM/DD/YYYY"
                                fluid
                                value={this.state.birthDate}
                                iconPosition="left"
                                onChange={this.changebirthDate}
                              /> */}
                        </div>
                      }
                    </div>
                    {this.state.patientResource.hasOwnProperty('address') &&
                      <div className="form-row">
                        <div className="form-group col-md-3 offset-1">
                          <h4 className="title"></h4>
                        </div>
                        {this.state.patientResource.address[0].hasOwnProperty('state') &&
                          <div className="form-group col-md-4">
                            <span className="title-small">State</span>
                            <input type="text" name="state" className="form-control" id="state" placeholder="State"
                              value={this.state.patientResource.address[0].state} disabled
                            />
                            {/* <Dropdown
                                  className={"blackBorder"}
                                  options={this.state.stateOptions}
                                  placeholder='State'
                                  search
                                  selection
                                  fluid
                                  value={this.state.patientState}
                                  onChange={this.handlePatientStateChange}
                                /> */}
                          </div>
                        }
                        {this.state.patientResource.address[0].hasOwnProperty('postalCode') &&
                          <div className="form-group col-md-4">
                            <span className="title-small">Postal Code</span>
                            <input type="text" name="patientPostalCoade" className="form-control" id="patientPostalCoade" placeholder="Postal Code"
                              value={this.state.patientResource.address[0].postalCode} disabled
                            />

                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                {/* <SelectPayer elementName='payer' updateCB={this.updateStateElement} /> */}
                <SelectPayerWithEndpoint elementName='payer' updateCB={this.updateStateElement} obj={{ 'endpoint': true, 'offset': true }} />
                {/* <div className="form-row">
                    <div className="form-group col-3 offset-1">
                      <h4 className="title">Payer Endpoint</h4>
                    </div>
                    <div className="form-group col-8">
                    <input type="text" name="endpoint" className="form-control" id="endpoint" placeholder="endpoint"
                                value={this.state.payer} disabled
                              />
                    </div>
                    </div> */}
                {/* <div className="form-row">
                    <div className="form-group col-3 offset-1">
                      <h4 className="title">Purpose</h4>
                    </div>
                    <div className="form-group col-8">
                      <DropdownPurpose elementName="purpose" updateCB={this.updateStateElement} />
                    </div>
                  </div> */}
                <div className="form-row">
                  <div className="form-group col-3 offset-1">
                    <h4 className="title">Note</h4>
                  </div>
                  <div className="form-group col-8">
                    <input type="text" name="note" className="form-control" id="note" placeholder="Note"
                      value={this.state.note} onChange={this.onChangeNote}
                    />
                  </div>
                </div>
                {/* <div className="form-row">
                    <div className="form-group col-3 offset-1">
                      <h4 className="title">Identifier</h4>
                    </div>
                    <div className="form-group col-8">
                      <input type="text" name="practitioner" className="form-control" id="name" placeholder="Identifier"
                        value={this.state.currentPayer} onChange={this.onChangeOrganizationIdentifier}
                        data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                      <div className="validation"></div>
                    </div>
                  </div> */}
                <div className="text-center">
                  <button type="button" onClick={this.startLoading}>Submit
                    <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                      <Loader
                        type="Oval"
                        color="#fff"
                        height="15"
                        width="15"
                      />
                    </div>
                  </button>
                  {this.state.dataLoaded &&
                    <div style={{ textAlign: "center", paddingTop: "5%" }}>
                      <p style={{ color: "green" }}>{"Request for Coverage Document has been posted successfully with id : " + this.state.reqId + "."}</p>
                    </div>
                  }
                </div>
              </div>
              {/* </div> */}
            </div>
          </main>
        </div>
      </React.Fragment>);
  };


  render() {
    return (
      <div className="attributes mdl-grid">
        {this.renderForm()}
      </div>)
  }
}


function mapStateToProps(state) {
  console.log(state);
  return {
    config: state.config,
  };
};
export default withRouter(connect(mapStateToProps)(CommunicationRequest));


