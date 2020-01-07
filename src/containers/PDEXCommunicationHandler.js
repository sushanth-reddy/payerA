import React, { Component } from 'react';
// import DropdownCDSHook from '../components/DropdownCDSHook';
// import DropdownFrequency from '../components/DropdownFrequency';
// import DropdownTreating from '../components/DropdownTreating';
// import DropdownPayer from '../components/DropdownPayer';
// import DropdownServiceCode from '../components/DropdownServiceCode';
// import { Input } from 'semantic-ui-react';
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
// import config from '../globalConfiguration.json';
import { KEYUTIL } from 'jsrsasign';
import { createToken } from '../components/Authentication';
import { connect } from 'react-redux';
import config from '../globalConfiguration.json';
import logo from "../Palm_GBA_H.JPG";



const types = {
  error: "errorClass",
  info: "infoClass",
  debug: "debugClass",
  warning: "warningClass"
}

class PDEXCommunicationHandler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      patient: null,
      fhirUrl: (sessionStorage.getItem('username') === 'john') ? this.props.config.provider.fhir_url : 'https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca',
      accessToken: '',
      scope: '',
      payer: '',
      patientId: '',
      practitionerId: sessionStorage.getItem('npi'),
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
      communicationReqList: [],
      withCommunication: [],
      withoutCommunication: [],
      form_load: false,
      patient_name: '',
      gender: '',
      ident: '',
      birthDate: '',
      contentStrings: [],
      received: [],
      payer_org: '',
      provider_org: '',
      currentPayer: '',
      config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
      payer_name: '',
      payloadData: '',
      requirementSteps: [{ 'step_no': 1, 'step_str': 'Communicating with CRD system.', 'step_status': 'step_loading' },
      {
        'step_no': 2, 'step_str': 'Retrieving the required 4 FHIR resources on crd side.', 'step_status': 'step_not_started'
      },
      { 'step_no': 3, 'step_str': 'Executing HyperbaricOxygenTherapy.cql on cds server and generating requirements', 'step_status': 'step_not_started', 'step_link': 'https://github.com/mettlesolutions/coverage_determinations/blob/master/src/data/Misc/Home%20Oxygen%20Therapy/homeOxygenTherapy.cql', 'cql_name': 'homeOxygenTheraphy.cql' },
      { 'step_no': 4, 'step_str': 'Generating cards based on requirements .', 'step_status': 'step_not_started' },
      { 'step_no': 5, 'step_str': 'Retrieving Smart App', 'step_status': 'step_not_started' }],
      errors: {},
      loadingSteps: false,
      loading: false,
      dataLoaded: false,
      showMsg: false,
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

    this.onFhirUrlChange = this.onFhirUrlChange.bind(this);
    this.onAccessTokenChange = this.onAccessTokenChange.bind(this);
    this.onScopeChange = this.onScopeChange.bind(this);
    this.onEncounterChange = this.onEncounterChange.bind(this);
    this.onPatientChange = this.onPatientChange.bind(this);
    this.onPractitionerChange = this.onPractitionerChange.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changeMedicationInput = this.changeMedicationInput.bind(this);
    this.onCoverageChange = this.onCoverageChange.bind(this);
    this.changeMedicationStDate = this.changeMedicationStDate.bind(this);
    this.changeMedicationEndDate = this.changeMedicationEndDate.bind(this);
    this.onClickLogout = this.onClickLogout.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.getCommunicationReq = this.getCommunicationReq.bind(this);
    this.getPrefetchData = this.getPrefetchData.bind(this);
    this.readFHIR = this.readFHIR.bind(this);
    this.onClickMenu = this.onClickMenu.bind(this);
    this.getPatientDetails = this.getPatientDetails.bind(this);
    this.redirectTo = this.redirectTo.bind(this);
    this.sortCommunications = this.sortCommunications.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.submit_info = this.submit_info.bind(this);


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

  updateStateElement = (elementName, text) => {
    // console.log(elementName, 'elenAME')

    this.setState({ [elementName]: text });
    this.setState({ validateIcdCode: false })

  }

  validateForm() {
    let formValidate = true;
    if (this.state.patientId === '') {
      formValidate = false;
      this.setState({ validatePatient: true });
    }
    if (this.state.hook === '' || this.state.hook === null) {
      formValidate = false;
      this.setState({ validateIcdCode: true });
    }
    return formValidate;
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
      sessionStorage.setItem('redirectTo', "/pdex_documents");
      this.props.history.push("/login");
    }

    try {

      let payersList = await this.getPayerList()
      let payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
      // console.log(payer, "currentPayer")
      this.setState({ currentPayer: payer })
      this.setState({ payer_name: payer.payer_name })
      // console.log("this.props.config.::",this.props.config,this.state.currentPayer.payer_end_point)
      // const fhirClient = new Client({ baseUrl: this.state.currentPayer.payer_end_point });
      // const token  = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
      // const token = await createToken(sessionStorage.getItem('username'), sessionStorage.getItem('password'));
      // this.setState({ accessToken: token });
      // console.log('The token is : ', token);

      // let searchResponse = await fhirClient.search({ resourceType: "Communication" })
      let communicationBundle = await this.getCommunications("recipient.identifier=" + payer.payer_identifier)
      // console.log("Seacrjh ress",communicationBundle)
      let comm = [];
      if (communicationBundle.total > 0) {
        if (communicationBundle.hasOwnProperty('entry')) {
          Object.keys(communicationBundle.entry).forEach((key) => {
            if (communicationBundle.entry[key].resource != undefined) {
              if (communicationBundle.entry[key].resource.hasOwnProperty('payload')) {
                if (communicationBundle.entry[key].resource.payload[0].extension[0].hasOwnProperty('valueCodeableConcept')) {
                  console.log(communicationBundle.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code, '----------')
                  if (communicationBundle.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code === 'pcde') {
                    comm.push(communicationBundle.entry[key].resource);
                  }
                }
              }

            }
          });
        }
        // let items = communicationBundle.entry.map((item, key) =>
        //   comm.push(item.resource)
        // );
        this.setState({ communicationList: comm });
      }
      let communicationReqBundle = await this.getCommunicationReq("requester.identifier=" + payer.payer_identifier)
      let comm_req = [];
      if (communicationReqBundle.total > 0) {
        if (communicationReqBundle.hasOwnProperty('entry')) {
          Object.keys(communicationReqBundle.entry).forEach((key) => {
            if (communicationReqBundle.entry[key].resource != undefined) {
              if (communicationReqBundle.entry[key].resource.hasOwnProperty('payload')) {
                if (communicationReqBundle.entry[key].resource.payload[0].extension[0].hasOwnProperty('valueCodeableConcept')) {
                  console.log(communicationReqBundle.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code, '----------')
                  if (communicationReqBundle.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code === 'pcde') {
                    comm_req.push(communicationReqBundle.entry[key].resource);
                  }
                }
              }

            }
          });
        }
        // let items = communicationReqBundle.entry.map((item, key) =>
        //   comm_req.push(item.resource)
        // );
        this.setState({ communicationReqList: comm_req });
      }
      this.sortCommunications(comm_req, comm);
    } catch (error) {

      console.log('Communication Creation failed', error);
    }

  }

  sortCommunications(comm_req, comm) {
    // console.log(comm_req, comm);
    let withC = [];
    let withoutC = [];
    let request = comm_req.map((req, key) => {
      let added = false;
      let communication = comm.map((c, k) => {
        if (req.hasOwnProperty("id") && c.hasOwnProperty('basedOn')) {
          // if (c.hasOwnProperty('contained') && c['basedOn'][0]['reference'])
          //   let contained = c['contained'].map((cont, l) => {
          //     if (cont['id'] in c['basedOn'][0]['reference']) {
          //   }
          // });
          if (c['basedOn'][0]['reference'].charAt(0) == '#') {
            if (req['id'] == c['basedOn'][0]['reference'].slice(0, 1)) {
              added = true;
              withC.push({ 'communication_request': req, 'communication': c });
            }
          }
          else if (c['basedOn'][0]['reference'].includes('/')) {
            let a = c['basedOn'][0]['reference'].split('/')
            if (a.length > 0) {
              if (req['id'] == a[a.length - 1]) {
                added = true;
                withC.push({ 'communication_request': req, 'communication': c });
              }
            }
          }
        }
      });
      if (added == false) {
        withoutC.push(req);
      }
    });
    this.setState({ withCommunication: withC });
    this.setState({ withoutCommunication: withoutC });
  }

  onClickMenu() {
    var showMenu = this.state.showMenu;
    this.setState({ showMenu: !showMenu });
  }
  /*Not using this Method Anywhere*/
  // async getAllRecords(resourceType) {
  //   const fhirClient = new Client({ baseUrl: this.state.currentPayer.payer_end_point });
  //   // if (this.props.config.payer.authorized_fhir) {
  //   //   fhirClient.bearerToken = this.state.accessToken;
  //   // }
  //   const token = await createToken(this.props.config.payer.grant_type,'payer',sessionStorage.getItem('username'), sessionStorage.getItem('password'));

  //   fhirClient.bearerToken = token;
  //   let readResponse = await fhirClient.search({ resourceType: resourceType });
  //   // console.log('Read Rsponse', readResponse)
  //   return readResponse;

  // }
  async getToken(grant_type, client_id, client_secret) {
    let params = {}
    const tokenUrl = this.state.config.token_url;
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

  async getCommunications(searchParams) {
    var tempUrl = this.state.currentPayer.payer_end_point;
    // const token  = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
    // console.log('The token is : ', token, tempUrl);
    let headers = {
      "Content-Type": "application/json",
    }
    // if (this.props.config.payer.authorizedPayerFhir) {
    //   headers['Authorization'] = 'Bearer ' + token
    // }
    const fhirResponse = await fetch(tempUrl + "/Communication?" + searchParams + "&_count=100000", {
      method: "GET",
      headers: headers,
    }).then(response => {
      // console.log("Recieved response", response);
      return response.json();
    }).then((response) => {
      console.log("----------response", response);
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    return fhirResponse;
  }

  async getCommunicationReq(searchParams) {
    var tempUrl = this.state.currentPayer.payer_end_point;
    // const token  = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);

    let headers = {
      "Content-Type": "application/json",
    }
    // if (this.props.config.payer.authorizedPayerFhir) {
    //   headers['Authorization'] = 'Bearer ' + token
    // }
    const fhirResponse = await fetch(tempUrl + "/CommunicationRequest?" + searchParams + "&_count=100000", {
      method: "GET",
      headers: headers
    }).then(response => {
      // console.log("Recieved response", response);
      return response.json();
    }).then((response) => {
      console.log("----------response", response);
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    return fhirResponse;
  }

  async readFHIR(resourceType, resourceId) {
    const fhirClient = new Client({ baseUrl: this.state.currentPayer.payer_end_point });
    // const token  = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
    // if (this.props.config.payer.authorizedPayerFhir) {
    //   fhirClient.bearerToken = token;
    // }
    let readResponse = await fhirClient.read({ resourceType: resourceType, id: resourceId });
    // console.log('Read Rsponse', readResponse)
    return readResponse;
  }

  async getPrefetchData() {
    // console.log(this.state.hook);
    var docs = [];
    if (this.state.hook === "patient-view") {
      var prefectInput = { "Patient": this.state.patientId };
    }
    else if (this.state.hook === "liver-transplant") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Practitioner": this.state.practitionerId
      }
    }
    else if (this.state.hook === "order-review") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Encounter": this.state.encounterId,
        "Practitioner": this.state.practitionerId,
        "Coverage": this.state.coverageId
      };
    } else if (this.state.hook === "medication-prescribe") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Practitioner": this.state.practitionerId
      };
    }
    var self = this;
    docs.push(prefectInput);

    var prefetchData = {};
    for (var key in docs[0]) {
      var val = docs[0][key]
      if (key === 'patientId') {
        key = 'Patient';
      }
      if (val !== '') {
        prefetchData[key.toLowerCase()] = await self.readFHIR(key, val);
      }
    }
    return prefetchData;
  }

  async getResourceData(token, prefectInput) {
    // console.log("Prefetch input--", JSON.stringify(prefectInput));
    const url = this.props.config.crd.crd_url + "prefetch";
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "authorization": "Bearer " + token,
      },
      body: JSON.stringify(prefectInput),
    }).then((response) => {
      return response.json();
    }).then((response) => {
      this.setState({ prefetchData: response });
    })
  }

  setRequestType(req) {
    this.setState({ request: req });
    if (req === "coverage-requirement") {
      this.setState({ auth_active: "" });
      this.setState({ req_active: "active" });
      this.setState({ hook: "" })
    }
    if (req === "patient-view") {
      this.setState({ auth_active: "active" });
      this.setState({ req_active: "" });
      this.setState({ request: "coverage-requirement" });
      this.setState({ hook: "patient-view" });
    }
    if (req === "config-view") {
      window.location = `${window.location.protocol}//${window.location.host}/configuration`;
    }
  }

  redirectTo(path) {
    window.location = `${window.location.protocol}//${window.location.host}/` + path;
  }

  setPatientView(req, res) {
    this.setState({ request: req });
    this.setState({ hook: res });
    this.setState({ auth_active: "active" });
    this.setState({ req_active: "" });
  }
  onFhirUrlChange(event) {
    this.setState({ fhirUrl: event.target.value });
    this.setState({ validateFhirUrl: false });
  }
  onAccessTokenChange(event) {
    this.setState({ accessToken: event.target.value });
    this.setState({ validateAccessToken: false });
  }
  onScopeChange(event) {
    this.setState({ scope: event.target.value });
  }
  onEncounterChange(event) {
    this.setState({ encounterId: event.target.value });
  }
  onPatientChange(event) {
    this.setState({ patientId: event.target.value });
    this.setState({ validatePatient: false });
  }
  onPractitionerChange(event) {
    this.setState({ practitionerId: event.target.value });
  }
  onCoverageChange(event) {
    this.setState({ coverageId: event.target.value });
  }
  changeMedicationInput(event) {
    this.setState({ medicationInput: event.target.value });
  }
  changeMedicationStDate = (event, { name, value }) => {

    if (this.state.hasOwnProperty(name)) {
      this.setState({ [name]: value });
    }
  }
  changeMedicationEndDate = (event, { name, value }) => {
    if (this.state.hasOwnProperty(name))
      this.setState({ [name]: value });
  }
  changeDosageAmount(event) {
    if (event.target.value !== undefined) {
      let transformedNumber = Number(event.target.value) || 1;
      if (transformedNumber > 5) { transformedNumber = 5; }
      if (transformedNumber < 1) { transformedNumber = 1; }
      this.setState({ dosageAmount: transformedNumber });
    }

  }
  onClickLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('fhir_url');
    this.props.history.push('/login');
  }

  setSteps(index) {
    var steps = this.requirementSteps;
    if (this.state.hook === "home-oxygen-theraphy") {
      this.requirementSteps[2].step_link = 'https://github.com/mettlesolutions/coverage_determinations/blob/master/src/data/Misc/Home%20Oxygen%20Therapy/homeOxygenTherapy.cql'
      this.requirementSteps[2].cql_name = "homeOxygenTheraphy.cql"
    }
    else if (this.state.hook === "order-review") {
      this.requirementSteps[2].cql_name = "HyperbaricOxygenTherapy.cql"
      this.requirementSteps[2].step_link = "https://github.com/mettlesolutions/coverage_determinations/blob/master/src/data/NCD/Cat1/HyperbaricOxygenTherapy/HyperbaricOxygenTherapy.cql"
    }
    if (index <= steps.length) {
      var self = this;
      setTimeout(function () {
        if (index !== 0) {
          steps[index - 1].step_status = "step_done"
        }
        // console.log(index, steps[index])
        if (index !== steps.length) {
          steps[index].step_status = "step_loading"
        }
        for (var i = index + 1; i < steps.length; i++) {
          steps[i].step_status = "step_not_started"
        }
        self.setState({ requirementSteps: steps });
        if (index < steps.length) {
          if (!(self.state.patientId === 37555 && index >= 1)) {
            self.setSteps(index + 1);
            steps[index].hideLoader = false;
          }
          else {
            setTimeout(function () {
              steps[index].hideLoader = true;
              self.setState({ stepsErrorString: "Unable to generate requirements.", requirementSteps: steps });
            }, 5000)
          }
        }
        if (index === steps.length) {
          self.setState({ "loadCards": true })
        }

      }, 3000)
    }
  }

  resetSteps() {
    var steps = this.requirementSteps;
    steps[0].step_status = "step_loading"
    for (var i = 1; i < steps.length; i++) {
      steps[i].step_status = "step_not_started"
    }
    this.setState({ requirementSteps: steps, loadCards: false });
  }



  async getPatientDetails(communication_request, communication) {
    let patientId;
    if (communication_request.hasOwnProperty("subject")) {
      // let patientId = d['subject']['reference'].replace('#', '');

      if (communication_request['subject']['reference'].charAt(0) == '#') {
        patientId = communication_request['subject']['reference'].replace('#', '')
      }
      else if (communication_request['subject']['reference'].includes('/')) {
        let a = communication_request['subject']['reference'].split('/');
        if (a.length > 0) {
          patientId = a[a.length - 1];

        }
        this.setState({ patient_name: "" });
        this.setState({ gender: "" });
        this.setState({ ident: "" });
        this.setState({ birthDate: "" });
        this.setState({ provider_org: "" });
        this.setState({ payer_org: "" });
        this.setState({ payloadData: '' });
        this.setState({ contentStrings: [] });
        // console.log("patient_id---------", patient_id, communication_request);
        var tempUrl = this.state.currentPayer.payer_end_point + "/Patient/" + patientId;
        // var grant_type = this.props.config.payer.grant_type
        let token;
        // token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);

        let headers = {
          "Content-Type": "application/json",
        }
        // if (this.props.config.provider.authorized_fhir) {
        // headers['Authorization'] = 'Bearer ' + token
        // }
        let patient = await fetch(tempUrl, {
          method: "GET",
          headers: headers
        }).then(response => {
          return response.json();
        }).then((response) => {
          // console.log("----------response", response);
          let patient = response;
          console.log("patient---", patient);
          if (patient) {
            this.setState({ patient: patient });
            if (patient.hasOwnProperty("name")) {
              var name = '';
              if (patient['name'][0].hasOwnProperty('given')) {
                patient['name'][0]['given'].map((n) => {
                  name += ' ' + n;
                });

                // name = patient['name'][0]['given'][0] + " " + patient['name'][0]['family'];

              }
              if (patient['name'][0].hasOwnProperty('family')) {
                name = name + " " + patient['name'][0]['family'];
              }
              console.log("name---" + name);
              this.setState({ patient_name: name })
            }
            if (patient.hasOwnProperty("identifier")) {
              console.log("iden---" + patient['identifier'][0]['value']);
              this.setState({ ident: patient['identifier'][0]['value'] });
            }
            if (patient.hasOwnProperty("gender")) {
              console.log("gender---" + patient['gender']);
              this.setState({ gender: patient['gender'] });
            }
            if (patient.hasOwnProperty("birthDate")) {
              console.log("birthdate---" + patient['birthDate']);
              this.setState({ birthDate: patient['birthDate'] });
            }
            // console.log("patient name----------", this.state.patient_name, this.state.patient.resourceType + "?identifier=" + this.state.patient.identifier[0].value);
          }
        }).catch(reason =>
          console.log("No response recieved from the server", reason)
        );
        // console.log("state----------", this.state);
        if (communication_request.hasOwnProperty('sender')) {
          let s = await this.getSenderDetails(communication_request, token);
        }
        if (communication_request.hasOwnProperty('payload')) {
          await this.getRequestedDocuments(communication_request['payload']);
        }


        // if (communication_request.hasOwnProperty('occurrencePeriod')) {
        //   // await this.getDocuments(communication_request['payload']);
        //   this.setState({ startDate: communication_request.occurrencePeriod.start })
        //   this.setState({ endDate: communication_request.occurrencePeriod.end })
        // }
        // if (communication_request.hasOwnProperty('authoredOn')) {
        //   this.setState({ recievedDate: communication_request.authoredOn })
        // }
        // this.setState({ communicationRequest: communication_request });
        // await this.getObservationDetails();
        if(communication!==''){
          await this.getPdeDocumnet(communication).then(() => {

          })
        }
        

        this.setState({ form_load: true });
      }
    }
  }
  async getPdeDocumnet(communication) {
    let data;
    if (communication.hasOwnProperty('payload')) {
      data = communication.payload[0].contentAttachment.data
    }
    // let od =JSON.parse(data)
    // let decodeData = Buffer.from(data, 'base64')
    let decodeData = atob(data)
    console.log(data, decodeData, 'decode data', communication)
    this.setState({ payloadData: JSON.parse(decodeData) })
  }


  async getRequestedDocuments(payload) {
    let strings = [];
    payload.map((c) => {
      // console.log("ccccccc", c);
      // if (c.hasOwnProperty('contentReference')) {
      //     if (c['contentReference']['reference'].replace('#', '')) {

      //     }
      // }
      // if (c.hasOwnProperty('extension')) {
      //     strings.push(c.extension[0]['valueCodeableConcept']['coding'][0]['display']);
      // }
      if (c.hasOwnProperty('contentString')) {
        strings.push(c.contentString)
      }
      this.setState({ contentStrings: strings })
    });
  }

  async getSenderDetails(communication_request, token) {
    let payer_org;
    let provider_org;
    if (communication_request.hasOwnProperty('sender')) {
      if (communication_request.sender.reference.charAt(0) == '#') {
        payer_org = communication_request.sender.reference.replace('#', '')
      }
      else if (communication_request.sender.reference.includes('/')) {
        let a = communication_request.sender.reference.split('/');
        if (a.length > 0) {
          payer_org = a[a.length - 1];

        }
      }
    }
    if (communication_request.hasOwnProperty('recipient')) {
      if (communication_request.recipient[0].reference.charAt(0) == '#') {
        provider_org = communication_request.recipient[0].reference.replace('#', '')
      }
      else if (communication_request.recipient[0].reference.includes('/')) {
        let a = communication_request.recipient[0].reference.split('/');
        if (a.length > 0) {
          provider_org = a[a.length - 1];

        }
      }
    }

    var tempUrl = this.state.currentPayer.payer_end_point;
    let headers = {
      "Content-Type": "application/json",
      // 'Authorization': 'Bearer ' + token
    }

    const fhirResponse = await fetch(tempUrl + "/Organization/" + payer_org, {
      method: "GET",
      headers: headers
    }).then(response => {
      // console.log("Recieved response", response);
      return response.json();
    }).then((response) => {
      // console.log("----------response", response);
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    // return fhirResponse;
    // console.log(fhirResponse, 'respo')
    if (fhirResponse) {
      this.setState({ payerOrganization: fhirResponse })
      this.setState({ payer_org: fhirResponse.name });

    }
    const recipientResponse = await fetch(tempUrl + "/Organization/" + provider_org, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': 'Bearer ' + token
      }
    }).then(response => {
      // console.log("Recieved response", response);
      return response.json();
    }).then((response) => {
      // console.log("----------response", response);
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    // return fhirResponse;
    // console.log(recipientResponse, 'rest')
    if (fhirResponse) {
      this.setState({ provider_org: recipientResponse.name })
    }
  }

  async createFhirResource(json, resourceName, url) {

    try {
      const fhirClient = new Client({ baseUrl: url });
      let token;
      console.log('The json is : ', json);
      let data = fhirClient.create({
        resourceType: resourceName,
        body: json,
        headers: { "Content-Type": "application/fhir+json" }
      }).then((data) => {
        console.log("Data::", data);
        this.setState({ dataLoaded: true })

        this.setState({ reqId: data.id })
        return data;
      }).catch((err) => {
        console.log(err);
      })
      return data
    } catch (error) {
      console.error('Unable to create resource', error.message);
      // this.setState({ loading: false });
      this.setState({ dataLoaded: false })
    }
  }

  startLoading() {
    // if (this.validateForm()) {
    this.setState({ loading: true }, () => {
      this.submit_info();
    })
    // }
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

  async submit_info() {

    try {
      this.setState({ dataLoaded: false, reqId: '' })
      let payloadData = this.state.payloadData
      this.setState({ loading: true });
      if (payloadData !== '' || payloadData !== undefined) {
        let bundleResource = await this.getResources("Bundle", payloadData.identifier.value)
        if (!bundleResource.hasOwnProperty('entry')) {
          await this.createFhirResource(payloadData, 'Bundle', this.state.currentPayer.payer_end_point).then(() => {
            this.setState({ loading: false })
          })
        }
        else {
          this.setState({ showMsg: true })
          let id = bundleResource.entry[0].resource.id
          this.setState({ reqId: id })
          this.setState({ loading: false })
        }

      }

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

  async getJson() {
    // const token  = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);
    // let token = await createToken('password', 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'), true)
    var patientId = null;
    patientId = this.state.patientId;
    let coverage = {
      resource: {
        resourceType: "Coverage",
        id: this.state.coverageId,
        class: [
          {
            type: {
              system: "http://hl7.org/fhir/coverage-class",
              code: "plan"
            },
            value: "Medicare Part D"
          }
        ],
        payor: [
          {
            reference: "Organization/6"
          }
        ]
      }
    };
    let medicationJson = {
      resourceType: "MedicationOrder",
      dosageInstruction: [
        {
          doseQuantity: {
            value: this.state.dosageAmount,
            system: "http://unitsofmeasure.org",
            code: "{pill}"
          },
          timing: {
            repeat: {
              frequency: this.state.frequency,
              boundsPeriod: {
                start: this.state.medicationStartDate,
                end: this.state.medicationEndDate,
              }
            }
          }
        }
      ],
      medicationCodeableConcept: {
        text: "Pimozide 2 MG Oral Tablet [Orap]",
        coding: [
          {
            display: "Pimozide 2 MG Oral Tablet [Orap]",
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: this.state.medication,
          }
        ]
      },
      reasonCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: this.state.treating,
          }
        ],
        text: "Alzheimer's disease"
      }

    };
    let request = {
      hookInstance: "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
      fhirServer: this.state.fhirUrl,
      hook: this.state.hook,
      payerName: this.state.payer,
      service_code: this.state.service_code,
      fhirAuthorization: {
        // "access_token": token,
        "token_type": this.props.config.authorization_service.token_type, // json
        "expires_in": this.props.config.authorization_service.expires_in, // json
        "scope": this.props.config.authorization_service.scope,
        "subject": this.props.config.authorization_service.subject,
      },
      userId: this.state.practitionerId,
      patientId: patientId,
      context: {
        userId: this.state.practitionerId,
        patientId: patientId,
        coverageId: this.state.coverageId,
        encounterId: this.state.encounterId,
        orders: {
          resourceType: "Bundle",
          entry: [{
            resource: {
              resourceType: "Patient",
              id: patientId,
            }
          }
          ]
        }
      }
    };
    if (this.state.hook === 'order-review') {
      request.context.encounterId = this.state.encounterId
      request.context.orders.entry.push(coverage);
    }
    if (this.state.hook === 'medication-prescribe') {
      request.context.orders.entry.push(medicationJson);
    }
    if (this.state.prefetch) {
      var prefetchData = await this.getPrefetchData()
      this.setState({ prefetchData: prefetchData })
      request.prefetch = this.state.prefetchData;
    }
    return request;
  }

  render() {
    let data = this.state.withCommunication;
    // console.log(this.state.withCommunication, this.state.withoutCommunication)
    let requests = this.state.withoutCommunication;
    let docs = this.state.contentStrings.map((request, key) => {
      if (request) {
        return (
          <div key={key}>
            {request}
          </div>
        )

      }
    });
    return (
      //       let creceivedDate;
      //       if (d['communication'].hasOwnProperty('received')) {
      //         creceivedDate = d['communication']["received"]
      //       }
      //       // console.log(startDate.substring(0, 10), 'stdate')
      //       if (d['communication_request'].hasOwnProperty("subject")) {
      //         // console.log("-------------------");
      //         // let patientId = d['communication_request']['subject']['reference'].replace('#','');
      //         let patientId;
      //         if (d['communication_request']['subject']['reference'].charAt(0) == '#') {
      //           patientId = d['communication_request']['subject']['reference'].replace('#', '')
      //         }
      //         else if (d['communication_request']['subject']['reference'].includes('/')) {
      //           let a = d['communication_request']['subject']['reference'].split('/')
      //           if (a.length > 0) {
      //             patientId = a[a.length - 1];

      //           }
      // }
      // let endDate;
      //       let startDate;
      //       let recievedDate;
      //       if (d.hasOwnProperty('occurrencePeriod')) {
      //         startDate = d["occurrencePeriod"]['start']

      //         if (d['occurrencePeriod'].hasOwnProperty("end")) {
      //           endDate = d["occurrencePeriod"]['end']
      //         }
      //         else {
      //           endDate = "No End Date"
      //         }
      //       }
      //       if (d.hasOwnProperty('authoredOn')) {
      //         recievedDate = d["authoredOn"]
      //       }

      //       // console.log(startDate.substring(0, 10), 'stdate')
      //       if (d.hasOwnProperty("subject")) {
      //         // let patientId = d['subject']['reference'].replace('#', '');
      //         let patientId;
      //         if (d['subject']['reference'].charAt(0) == '#') {
      //           patientId = d['subject']['reference'].replace('#', '')
      //         }
      //         else if (d['subject']['reference'].includes('/')) {
      //           let a = d['subject']['reference'].split('/');
      //           if (a.length > 0) {
      //             patientId = a[a.length - 1];

      //           }
      // }
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
                  <li className=" menu-has-children"><a href="">Request</a>
                    <ul>
                      <li ><a href={window.location.protocol + "//" + window.location.host + "/request"}>Request for documents</a></li>
                      <li ><a href={window.location.protocol + "//" + window.location.host + "/care_gaps"}>Request Care Gaps</a></li>
                    </ul>
                  </li>
                  <li className=" menu-active menu-has-children"><a href="">TASKS</a>
                    <ul>
                      <li className="menu-active" ><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>Coverage Documents</a></li>
                      <li ><a href={window.location.protocol + "//" + window.location.host + "/cdex_documents"}>Clinical Documents</a></li>
                      <li ><a href={window.location.protocol + "//" + window.location.host + "/task"}>Submit Coverage Documents</a></li>
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

              <div className="left-form">
                <div><h2> Coverage Transition documents (Received)</h2></div>

                <div className="form-row">
                  {/* <table className="table col-10 offset-1"> */}
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Request for Document ID</th>
                        <th>Request for Document Identifier</th>
                        <th>ID for information transmitted from a sender to a receiver</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        data.map((d, i) => (
                          <tr key={i}>
                            <td>
                              <span>{d['communication_request']['id']}</span>
                            </td>
                            <td>
                              {d['communication_request']['identifier'] != undefined &&
                                <span>{d['communication_request']['identifier'][0]['value']}</span>
                              }
                            </td>
                            <td>
                              <span>{d['communication']['id']}</span>
                            </td>
                            <td>
                              <button className="btn list-btn" onClick={() => this.getPatientDetails(d['communication_request'], d['communication'])}>
                                Review
                            </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div></div>
                <div><h2>Coverage Transition documents (Not-Received)</h2></div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request for Document ID</th>
                      <th>Request for Document Identifier</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      requests.map((d, i) => (
                        <tr key={i}>
                          <td>
                            <span>{d['id']}</span>
                          </td>
                          <td>
                            {d['identifier'] != undefined &&
                              <span>{d['identifier'][0]['value']}</span>
                            }
                          </td>
                          <td>
                            <button className="btn list-btn" onClick={() => this.getPatientDetails(d, '')}>
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
              {this.state.form_load &&
                <div className="right-form" style={{ paddingTop: "2%" }} >
                  {this.state.patient_name &&
                    <div className="data-label">
                      Patient : <span className="data1"><strong>{this.state.patient_name}</strong></span>
                    </div>}
                  {this.state.gender &&
                    <div className="data-label">
                      Patient Gender : <span className="data1"><strong>{this.state.gender}</strong></span>
                    </div>}
                  {this.state.ident &&
                    <div className="data-label">
                      Patient Identifier : <span className="data1"><strong>{this.state.ident}</strong></span>
                    </div>}
                  {this.state.birthDate &&
                    <div className="data-label">
                      Patient Date of Birth : <span className="data1"><strong>{this.state.birthDate}</strong></span>
                    </div>}
                  {this.state.payer_org &&
                    <div className="data-label">
                      Requester Payer : <span className="data1"><strong>{this.state.payer_org}</strong></span>
                    </div>}
                  {this.state.provider_org &&
                    <div className="data-label">
                      Sender Payer : <span className="data1"><strong>{this.state.provider_org}</strong></span>
                    </div>}
                  {this.state.contentStrings.length > 0 &&
                    <div className="data-label">
                      Requests Sent : <span className="data1"><strong>{docs}</strong></span>
                    </div>}

                </div>}
              {this.state.payloadData !== '' &&
                <div className="form-group"><pre>{JSON.stringify(this.state.payloadData, null, 2)}</pre></div>

              }
              {this.state.payloadData !== '' &&
                <div className=" form-group col-10 right-form text-center">
                  <button type="button" onClick={this.startLoading}>Accept and Import
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
                      <p style={{ color: "green" }}>{"Document has been imported successfully with id : " + this.state.reqId + "."}</p>
                    </div>
                  }
                  {this.state.showMsg &&
                    <div style={{ textAlign: "center", paddingTop: "5%" }}>
                      <p style={{ color: "green" }}>{"Document has already been imported with id : " + this.state.reqId + "."}</p>
                    </div>
                  }
                </div>

              }

            </div>


          </main>
        </div>
      </React.Fragment >
    )
  }
}



function mapStateToProps(state) {
  console.log(state);
  return {
    config: state.config,
  };
};
export default withRouter(connect(mapStateToProps)(PDEXCommunicationHandler));


