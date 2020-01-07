import React, { Component } from 'react';
// import DropdownCDSHook from '../components/DropdownCDSHook';
// import DropdownFrequency from '../components/DropdownFrequency';
// import DropdownTreating from '../components/DropdownTreating';
// import DropdownPayer from '../components/DropdownPayer';
// import DropdownServiceCode from '../components/DropdownServiceCode';
import DropdownDocument from '../components/DropdownDocument';
import DropdownVitalSigns from '../components/DropdownVitalSigns';
import { Input } from 'semantic-ui-react';
// import { DateInput } from 'semantic-ui-calendar-react';
import { withRouter } from 'react-router-dom';
// import Select from 'react-select';
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
import DatetimeRangePicker from 'react-datetime-range-picker';
import moment from "moment";
import DropdownPurpose from '../components/DropdownPurpose';
import DropdownClaim from '../components/DropdownClaim';
// import DropdownPatient from '../components/DropDownPatient';
import SelectPatient from '../components/SelectPatient';

let now = new Date();
let occurenceStartDate = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0, 0)).toISOString();
let occurenceEndDate = moment(occurenceStartDate).add(8, "days").subtract(1, "seconds").toISOString();
let yesterday = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0, 0));
let clinicalNoteStartDate = moment(yesterday).subtract(8, "days").toISOString();
let clinicalNoteEndDate = moment(clinicalNoteStartDate).add(8, "days").subtract(1, "seconds").toISOString();

let payloadStartDate = moment(yesterday).subtract(8, "days").toISOString();
let payloadEndDate = moment(payloadStartDate).add(8, "days").subtract(1, "seconds").toISOString();


const types = {
    error: "errorClass",
    info: "infoClass",
    debug: "debugClass",
    warning: "warningClass"
}

class ProviderCommunicationRequest extends Component {
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
            clinicalNoteStartDate: clinicalNoteStartDate,
            clinicalNoteEndDate: clinicalNoteEndDate,
            isDocument: true,
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
            currentPayer: '',
            payer_name: '',
            patientResource: '',
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
        this.onFhirUrlChange = this.onFhirUrlChange.bind(this);
        this.onAccessTokenChange = this.onAccessTokenChange.bind(this);
        this.onScopeChange = this.onScopeChange.bind(this);
        this.onEncounterChange = this.onEncounterChange.bind(this);
        this.onPatientChange = this.onPatientChange.bind(this);
        this.onPractitionerChange = this.onPractitionerChange.bind(this);
        this.onPayerChange = this.onPayerChange.bind(this);
        this.onReasonChange = this.onReasonChange.bind(this);
        this.changeDosageAmount = this.changeDosageAmount.bind(this);
        this.changeMedicationInput = this.changeMedicationInput.bind(this);
        this.onCoverageChange = this.onCoverageChange.bind(this);
        this.changeMedicationStDate = this.changeMedicationStDate.bind(this);
        this.changeMedicationEndDate = this.changeMedicationEndDate.bind(this);
        this.onClickLogout = this.onClickLogout.bind(this);
        this.consoleLog = this.consoleLog.bind(this);
        this.getPrefetchData = this.getPrefetchData.bind(this);
        this.readFHIR = this.readFHIR.bind(this);
        this.onClickMenu = this.onClickMenu.bind(this);
        this.redirectTo = this.redirectTo.bind(this);
        this.updateStateElement = this.updateStateElement.bind(this);
        this.updateClaimID = this.updateClaimID.bind(this);
        this.updateDocumentType = this.updateDocumentType.bind(this);
        this.updatetimePeriod = this.updatetimePeriod.bind(this);
        this.updatePayloadtimePeriod = this.updatePayloadtimePeriod.bind(this);
        this.updateClinicalNoteTimePeriod = this.updateClinicalNoteTimePeriod.bind(this);
        this.updateDataElement = this.updateDataElement.bind(this);
        this.updateDoc = this.updateDoc.bind(this);
        this.addQuery = this.addQuery.bind(this);

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
    addQuery = (e) => {
        this.setState((prevState) => ({
            queries: [...prevState.queries, { query: "", searchString: "", resource: "" }],
        }));
    }
    handleChange = (e) => {
        if (["query", "searchString", "resource"].includes(e.target.name)) {
            let queries = [...this.state.queries]
            queries[e.target.id][e.target.name] = e.target.value
            this.setState({ queries }, () => console.log(this.state.queries))
        } else {
            this.setState({ [e.target.name]: e.target.value })
        }
        // console.log("In queries--,", this.state.queries)
    }
    //   let queries = this.state.queries;
    //   console.log("queries--",queries)
    //   queries= queries.push({query:"", searchString:"",resource:""});
    //   this.setState({queries:queries})
    //   console.log("qState queries--,",this.state.queries)
    updateStateElement = (elementName, value) => {
        console.log("event----------", value, elementName)
        this.setState({ [elementName]: value })
        // console.log(this.state.vitalSigns, 'yooopo')
        // if (value.hasOwnProperty('value')) {
        //   // this.setState({ docType: event });
        // }
        // this.set 
    }

    updateClaimID = (elementName, value) => {
        console.log("event----------", value, elementName)
        this.setState({ [elementName]: value })
        // console.log(this.state.vitalSigns, 'yooopo')
        // if (value.hasOwnProperty('value')) {
        //   // this.setState({ docType: event });
        // }
        // this.set 
    }

    updateDocumentType(event) {
        // console.log("event", event)
        if (event.hasOwnProperty('value')) {
            this.setState({ docType: event });
        }
    }

    updateDoc(e) {
        console.log("event", e)
        if (this.state.isClinicalNote) {
            this.setState({ "isClinicalNote": false });
        }
        else {
            this.setState({ "isClinicalNote": true });
        }
        // this.setState({ vitalSigns: [] })
        console.log(this.state.isClinicalNote)
    }

    updateDataElement(e) {
        if (this.state.isDataElement) {
            this.setState({ "isDataElement": false });
        }
        else {
            this.setState({ "isDataElement": true });
        }
        // this.setState({ documents: [] })
    }

    updatetimePeriod(event) {
        // console.log("red-------", startDate,endDate)
        let endDate = event.end.toISOString();
        let startDate = event.start.toISOString();
        this.setState({ occurenceStartDate: startDate });
        this.setState({ occurenceEndDate: endDate });
    }
    updatePayloadtimePeriod(event) {
        // console.log("event-------", event)
        let endDate = event.end.toISOString();
        let startDate = event.start.toISOString();
        this.setState({ payloadStartDate: startDate });
        this.setState({ payloadEndDate: endDate });

        // this.setState({ payloadtimePeriod: event }); 
    }
    updateClinicalNoteTimePeriod(event) {
        // console.log("event-------", event)
        let endDate = event.end.toISOString();
        let startDate = event.start.toISOString();
        this.setState({ clinicalNoteStartDate: startDate });
        this.setState({ clinicalNoteEndDate: endDate });

        // this.setState({ payloadtimePeriod: event }); 
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

    async componentDidMount() {

        try {
            if (!sessionStorage.getItem('isLoggedIn')) {
                sessionStorage.setItem('redirectTo', "/request");
                this.props.history.push("/login");
            }
            let payersList = await this.getPayerList()
            let payer;
            if (payersList !== undefined) {
                payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
                this.setState({ currentPayer: payer })
                this.setState({ payer_name: payer.payer_name })
            }
            // console.log("this.props.config.::", this.props.config, this.props.config.payer.fhir_url)
            const fhirClient = new Client({ baseUrl: this.state.config.payer_fhir_url });
            // const token = await createToken(sessionStorage.getItem('username'), sessionStorage.getItem('password'));
            // this.setState({ accessToken: token });
            // var today = new Date()
            // this.setState({occurenceStartDate:today.toISOString()})
            // today.setDate(today.getDate() + 7);
            // this.setState({occurenceEndDate:today.toISOString()})
            // var yesterday = new Date()
            // yesterday.setDate(yesterday.getDate() - 7);
            // this.setState({payloadStartDate:yesterday.toISOString()})
            // var date = new Date()
            // this.setState({payloadEndDate:date.toISOString()})

            // console.log('The token is : ', token);
        } catch (error) {
            console.log('Communication Creation failed', error);
        }

    }

    onClickMenu() {
        var showMenu = this.state.showMenu;
        this.setState({ showMenu: !showMenu });
    }

    async getAllRecords(resourceType) {
        const fhirClient = new Client({ baseUrl: this.state.config.payer_fhir_url });
        // if (this.state.config.payer_authorised) {
        //     fhirClient.bearerToken = this.state.accessToken;
        // }
        let readResponse = await fhirClient.search({ resourceType: resourceType });
        // console.log('Read Rsponse', readResponse)
        return readResponse;

    }

    async readFHIR(resourceType, resourceId) {
        const fhirClient = new Client({ baseUrl: this.state.config.payer_fhir_url });
        // if (this.props.config.payer.authorised_fhir) {
        // console.log("read comm req", resourceType, resourceId);
        // fhirClient.bearerToken = this.state.accessToken;
        // }
        // let token = await createToken(config.payer_grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        // if (config.payer_authorised) {
        //     fhirClient.bearerToken = token;
        // }
        let readResponse = await fhirClient.read({ resourceType: resourceType, id: resourceId });
        // console.log('Read Rsponse', readResponse)
        return readResponse;
    }

    async getResources(resource, identifier) {
        var url = this.state.config.payer_fhir_url + "/" + resource + "?identifier=" + identifier;
        let token;
        let headers = {
            "Content-Type": "application/json",
        }
        // token = await createToken(this.state.config.payer_grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'))
        // if (this.state.config.payer_authorised) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        let sender = await fetch(url, {
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
        return sender;
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
    /*not using this method */
    // async getResourceData(token, prefectInput) {
    //   console.log("Prefetch input--", JSON.stringify(prefectInput));
    //   const url = this.props.config.crd.crd_url + "prefetch";
    //   await fetch(url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "authorization": "Bearer " + token,
    //     },
    //     body: JSON.stringify(prefectInput),
    //   }).then((response) => {
    //     return response.json();
    //   }).then((response) => {
    //     this.setState({ prefetchData: response });
    //   })
    // }

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
    onPatientChange = (elementName, value) => {
        console.log("event----------", value, elementName)
        this.setState({ [elementName]: value })
        this.setState({ validatePatient: false });

    }
    onPractitionerChange(event) {
        this.setState({ practitionerId: event.target.value });
        this.setState({ validatePractitioner: false });
    }
    onPayerChange(event) {
        this.setState({ payerId: event.target.value });
        this.setState({ validatePayer: false });
    }

    onReasonChange(event) {
        this.setState({ reasons: event.target.value });
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
    redirectTo(path) {
        window.location = `${window.location.protocol}//${window.location.host}/` + path;
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
                console.log(index, steps[index])
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

    async createFhirResource(json, resourceName, url, user, claim = false,load=false) {
        //  console.log("this.state.procedure_code")
        // console.log(this.state.procedure_code)
        try {
            // if (claim == true) {
            //   json.about = [{
            //     "reference": "Claim?identifier=" + this.state.claimid
            //   }];
            // }
            const fhirClient = new Client({ baseUrl: url });
            let token;
            // if (user == 'provider') {
            //     console.log('using Provider Client Credentials')

            //     if (this.state.config.provider_grant_type == 'client_credentials') {
            //         token = await createToken(this.state.config.provider_grant_type, user, this.state.config.provider_username, this.state.config.provider_password);
            //     }
            //     else {
            //         token = await createToken(this.state.config.provider_grant_type, user, this.state.config.provider_username, this.state.config.provider_password);

            //     }
            //     if (this.state.config.provider_authorised) {
            //         fhirClient.bearerToken = token;
            //     }
            // }
            // else if (user == 'payer') {
            //     console.log('using payer Client Credentials')
            //     if (this.state.config.payer_grant_type == 'client_credentials') {
            //         token = await createToken(this.state.config.payer_grant_type, user, sessionStorage.getItem('username'), sessionStorage.getItem('password'));
            //     }
            //     else {
            //         token = await createToken(this.state.config.payer_grant_type, user, sessionStorage.getItem('username'), sessionStorage.getItem('password'));
            //     }
            //     if (this.state.config.payer_authorised) {
            //         fhirClient.bearerToken = token;
            //     }
            // }
            console.log('The json is : ', json);
            let data = fhirClient.create({
                // resourceType: resourceName,
                body: json,
                headers: { "Content-Type": "application/fhir+json" }
            }).then((data) => {
                console.log("Data::", data);
                this.setState({ response: data })
                if (user == 'provider') {
                    this.setState({ dataLoaded: true })
                    var commReqId = data.entry[2].response.location.split('/')[1]
                    this.setState({ reqId: commReqId })
                }
                
                return data;
            }).catch((err) => {
                console.log(err);
                
                // this.setState({ loading: false });
            })
            return data
        } catch (error) {
            console.error('Unable to create resource', error.message);
            this.setState({ dataLoaded: false })
        }
    }
    /*Not  using this method Anywhere*/
    // async getFhirResource(resourceType, searchParameter) {
    //   //  console.log("this.state.procedure_code")
    //   // console.log(this.state.procedure_code)
    //   // this.setState({ loading: true });

    //   try {
    //     const fhirClient = new Client({ baseUrl: this.props.config.provider.fhir_url });
    //     const token = await createToken(this.props.config.provider.username, this.props.config.provider.password);
    //     console.log('The token is : ', token);
    //     fhirClient.bearerToken = token;
    //     fhirClient.search({ resourceType: resourceType, searchParams: searchParameter  })
    //       .then((response) => {
    //         console.log(response,'++++');
    //         return response;
    //       })
    //       .catch((error) => {
    //         console.error(error);
    //       });
    //   } catch (error) {
    //     console.error( error.message);
    //     // this.setState({ dataLoaded: false })
    //   }

    // }

    async getRequestID() {
        const min = 1;
        const max = 1000000000;
        const num = parseInt(min + Math.random() * (max - min));
        // console.log("num----------", num);
        let req_check = await this.getResources("CommunicationRequest", num);
        // console.log("random------------", req_check);
        if (req_check.hasOwnProperty('total')) {
            if (req_check.total > 0) {
                await this.getRequestID();
            }
            else {
                return num;
            }
        }
    }
    onRemoveQuery(id) {
        let new_queries = this.state.queries
        console.log(new_queries[id], 'here in remove method')

        new_queries.splice(id, 1);
        console.log(new_queries, 'after splice')
        this.setState({ queries: new_queries }, () => console.log(this.state.queries, 'Updated Queries after deleting '))
        // if (["query", "search:String", "resource"].includes(e.target.name)) {
        //     let queries = [...this.state.queries]
        //     queries[e.target.id][e.target.name] = e.target.value
        //     this.setState({ queries }, () => console.log(this.state.queries))
        // } else {
        //     this.setState({ [e.target.name]: e.target.value })
        // }
        // console.log("In queries--,", this.state.queries)
        // var new_files = this.state.files;
        // for (var i = 0; i < new_files.length; i++) {
        //     if (new_files[i] === file) {
        //         new_files.splice(i, 1);
        //     }
        // }
        // this.setState({ files: new_files }, () => {
        //     this.showError()
        // })
    }
    currentDate() {
        // var date = new Date().getDate(); //Current Date
        // var month = new Date().getMonth() + 1; //Current Month
        // var year = new Date().getFullYear(); //Current Year
        // var hours = new Date().getHours(); //Current Hours
        // var min = new Date().getMinutes(); //Current Minutes
        // var sec = new Date().getSeconds(); //Current Seconds
        // //Setting the value of the date time

        // return year + '-' + month + '-' + date + 'T' + hours + ':' + min + ':' + sec + '-08:00'
        var date = new Date()
        var currentDateTime = date.toISOString()
        return currentDateTime
    }

    async submit_info() {

        try {

            let res_json = {}
            this.setState({ loading: true });
            this.setState({ dataLoaded: false, reqId: '' })
            // let token = await createToken(sessionStorage.getItem('username'), sessionStorage.getItem('password'));
            // let json_request = await this.getJson();
            // let accessToken = this.state.accessToken;
            // let accessToken = token;
            // this.setState({ accessToken });
            // let patientResource = await this.readFHIR("Patient", "" + this.state.patientId)
            // let practitionerResource = await this.readFHIR("Practitioner", "" + this.state.practitionerId)
            // let payerResource = await this.readFHIR("Organization", "" + this.state.payerId)
            // console.log(patientResource, practitionerResource, payerResource);
            // let req_json = {
            //   "resourceType": "CommunicationRequest",
            //   "contained": [patientResource, practitionerResource, payerResource],
            //   "subject": { "reference": "#" + patientResource.id },
            //   "status": "active",
            //   "recipient": [
            //     {
            //       "reference": "#" + practitionerResource.id
            //     }
            //   ],
            //   "sender": {
            //     "reference": "#" + payerResource.id
            //   }
            // }
            // console.log(this.state.timePeriod.end.toISOString(),"++")
            var date = new Date()
            var currentDateTime = date.toISOString()
            let request_id = await this.getRequestID();
            let endPoint_identifier = await this.getRequestID();
            let endPointFullUri = await this.getRequestID();
            let organizationFullUri = await this.getRequestID();
            let commRequestFullUri = await this.getRequestID();
            let patientObj = {}
            // let patientObject = await this.getResources('Patient', this.state.patientId)
            let organizationObj
            patientObj['given'] = this.state.patientResource.name[0].given
            patientObj['family'] = this.state.patientResource.name[0].family
            patientObj['birthDate'] = this.state.patientResource.birthDate
            patientObj['postalCode'] = this.state.patientResource.address[0].postalCode
            // console.log('p', patientObject)
            // if ('entry' in patientObject) {

            //     // if('managingOrganization' in patientObj.entry[0].resource){
            //     //   organizationId = patientObj.entry[0].resource.managingOrganization.reference
            //     // }
            // }
            // let requesterOrganizationBundle = await this.getResources('Organization', this.state.currentPayer.payer_identifier)

            let organizationObject = await this.getResources('Organization', this.state.currentPayer.payer_identifier)
            if ('entry' in organizationObject) {
                organizationObj = organizationObject.entry[0].resource
            }
            console.log('patientobj', organizationObj, patientObj)


            // console.log("this.state.timePeriod-----", this.state.timePeriod);
            // let provider_req_json = {
            //   "resourceType": "CommunicationRequest",
            //   "identifier": [
            //     {
            //       "system": "http://www.jurisdiction.com/insurer/123456",
            //       "value": request_id
            //     }
            //   ],
            //   "contained": [
            //     {
            //       "resourceType": "Endpoint",
            //       "id": "END123",
            //       "meta": {
            //         "versionId": "1",
            //         "lastUpdated": "2019-04-09T14:11:04.000+00:00"
            //       },
            //       "address": "http://auth.mettles.com:8180/hapi-fhir-jpaserver/fhir/Communication"
            //     },
            //     {
            //       "resourceType": "Organization",
            //       "id": this.state.payerId,
            //       "identifier": [
            //         {
            //           "system": "http://www.Anthem.com/edi",
            //           "value": "DemoPayer"
            //         },
            //         {
            //           "system": "https://www.maxmddirect.com/fhir/identifier",
            //           "value": "MaxMDDemoPayerOrganization-eval"
            //         }
            //       ],
            //       "name": "MaxMD Demo Payer Solutions",
            //       "endpoint": [
            //         {
            //           "reference": "#END123"
            //         }
            //       ]
            //     }
            //   ],
            //   "category": [
            //     {
            //       "coding": [
            //         {
            //           "system": "http://acme.org/messagetypes",
            //           "code": "SolicitedAttachmentRequest"
            //         }
            //       ]
            //     }
            //   ],
            //   "priority": "routine",
            //   "medium": [
            //     {
            //       "coding": [
            //         {
            //           "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationMode",
            //           "code": "WRITTEN",
            //           "display": "written"
            //         }
            //       ],
            //       "text": "written"
            //     }
            //   ],
            //   "subject": {
            //     "reference": "Patient?identifier=" + this.state.patientId
            //   },
            //   "requester": {
            //     // "reference": "Organization?identifier=" + this.state.payerId
            //     "reference": "#" + this.state.payerId
            //   },
            //   // 'about': [{
            //   //   "reference": "Claim?identifier=" + this.state.claimid
            //   // }],
            //   "status": "active",
            //   "recipient": [
            //     {
            //       "reference": "Organization?identifier=" + this.state.practitionerId
            //     }
            //   ],
            //   "sender": {
            //     "reference": "#" + this.state.payerId
            //   },
            //   "occurrencePeriod": {
            //     "start": this.state.occurenceStartDate,
            //     "end": this.state.occurenceEndDate
            //   },
            //   "authoredOn": currentDateTime
            // }

            let provider_req_json =
            {
                "resourceType": "Bundle",
                "id": "bundle-transaction",
                "type": "transaction",
                "entry": [
                    {
                        // "fullUrl": "urn:uuid:"+endPointFullUri,
                        "resource": {
                            "resourceType": "Endpoint",
                            "id": "Payer-Endpoint-Id",
                            "identifier": [
                                {
                                    "system": "http://www.jurisdiction.com/insurer/123456",
                                    "value": endPoint_identifier
                                }
                            ],
                            "connectionType": {
                                "system": "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
                                "code": "hl7-fhir-rest"
                            },
                            "address": this.state.config.payer_fhir_url
                        },
                        "request": {
                            "method": "POST",
                            "url": "Endpoint",
                            "ifNoneExist": "identifier=" + endPoint_identifier

                        }
                    },
                    // organizationObj['endpoint']={
                    //   "reference":"Endpoint/Payer-Endpoint-Id"
                    // }
                    // organizationObj.id = "Payer-organization-id"
                    // console.log(organizationObj,'org')
                    {
                        // "fullUrl": "urn:uuid:"+organizationFullUri,
                        // "resource": organizationObj,
                        "resource": {
                            'resourceType': organizationObj.resourceType,
                            'identifier': organizationObj.identifier,
                            'id': "Payer-Organization-Id",
                            'name': organizationObj.name,
                            'telecom': organizationObj.telecom,
                            'address': organizationObj.address,
                            'endpoint': [{
                                'reference': 'Endpoint/Payer-Endpoint-Id'
                            }]
                        },
                        "request": {
                            "method": "POST",
                            "url": "Organization",
                            "ifNoneExist": "identifier=" + organizationObj.identifier[0].value
                        }
                    },
                    {
                        // "fullUrl": "urn:uuid:"+commRequestFullUri,
                        "resource": {
                            "resourceType": "CommunicationRequest",
                            "identifier": [
                                {
                                    "system": "http://www.jurisdiction.com/insurer/123456",
                                    "value": request_id
                                }
                            ],
                            "contained": [
                                {
                                    "resourceType": "Organization",
                                    "id": "Provider-organization-id",
                                    "identifier": [
                                        {
                                            "system": "http://www.Anthem.com/edi",
                                            "value": "DemoPayer"
                                        },
                                        {
                                            "system": "https://www.maxmddirect.com/fhir/identifier",
                                            "value": "MaxMDDemoPayerOrganization-eval"
                                        }
                                    ],
                                    "name": "MaxMD Demo Payer Solutions",
                                    "endpoint": [
                                        {
                                            "reference": "#END123"
                                        }
                                    ]
                                }
                            ],
                            "category": [
                                {
                                    "coding": [
                                        {
                                            "system": "http://acme.org/messagetypes",
                                            "code": "SolicitedAttachmentRequest"
                                        }
                                    ]
                                }
                            ],
                            "priority": "routine",
                            "medium": [
                                {
                                    "coding": [
                                        {
                                            "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationMode",
                                            "code": "WRITTEN",
                                            "display": "written"
                                        }
                                    ],
                                    "text": "written"
                                }
                            ],
                            "subject": {
                                "reference": "Patient?given=" + patientObj.given + "&family=" + patientObj.family + "&address-postalcode=" + patientObj.postalCode + "&birthdate=" + patientObj.birthDate
                            },
                            "requester": {
                                // "reference": "Organization?identifier=" + this.state.payerId
                                "reference": "Organization/Payer-Organization-Id"
                            },
                            // 'about': [{
                            //   "reference": "Claim?identifier=" + this.state.claimid
                            // }],
                            "status": "active",
                            "recipient": [
                                {
                                    "reference": "Organization/Payer-Organization-Id"
                                }
                            ],
                            "sender": {
                                // "reference": "Organization?identifier=" + this.state.practitionerId
                                "reference": "#Provider-organization-id"
                            },
                            "occurrencePeriod": {
                                "start": this.state.occurenceStartDate,
                                "end": this.state.occurenceEndDate
                            },
                            "authoredOn": currentDateTime
                        },
                        "request": {
                            "method": "POST",
                            "url": "CommunicationRequest",
                            "ifNoneExist": "identifier=" + request_id
                        }
                    }
                ]
            }
            for (var i = 0; i < provider_req_json.entry.length; i++) {
                if (provider_req_json.entry[i].resource.resourceType == 'CommunicationRequest') {
                    provider_req_json.entry[i].resource.payload = [];
                }
            }
            // provider_req_json.payload = [];
            // console.log("this.state.docType", this.state.docType);
            if (this.state.isClinicalNote) {
                let documents = this.state.documents;
                let ext = [];
                // let timePeriod = this.state.payloadtimePeriod
                // let endDate= timePeriod.end.toISOString();
                // let endDate = this.state.payloadEndDate
                let endDate = this.state.clinicalNoteEndDate
                // let startDate = timePeriod.start.toISOString();
                // let startDate = this.state.payloadStartDate
                let startDate = this.state.clinicalNoteStartDate

                // console.log('payloadstart:', startDate, 'Payloadendate:', endDate)
                // console.log(timePeriod,'uoo')
                for (var i = 0; i < documents.length; i++) {
                    var fields = documents[i].split('|')
                    for (var j = 0; j < provider_req_json.entry.length; j++) {
                        if (provider_req_json.entry[j].resource.resourceType == 'CommunicationRequest') {
                            provider_req_json.entry[j].resource.payload.push({
                                'extension': [{
                                    'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-clinical-note-type',
                                    'valueCodeableConcept': {
                                        "coding": [
                                            {
                                                "system": "http://loinc.org",
                                                "code": fields[0]
                                            }
                                        ]
                                    }
                                }],
                                // 'cdex-payload-clinical-note-type': {
                                //   'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-clinical-note-type',
                                //   'extension': [{
                                //     'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-clinical-note-type',
                                //     'valueCodeableConcept': {
                                //       "coding": [
                                //         {
                                //           "system": "http://loinc.org",
                                //           "code": fields[0]
                                //         }
                                //       ]
                                //     }
                                //   }],
                                //   'valueCodeableConcept': {
                                //     "coding": [
                                //       {
                                //         "system": "http://loinc.org",
                                //         "code": fields[0]
                                //       }
                                //     ]
                                //   }
                                // },
                                "contentString": "Please provide " + fields[1] + " recorded during " + startDate.substring(0, 10) + " - " + endDate.substring(0, 10)
                            })
                        }
                    }

                }
            }
            if (this.state.isDataElement) {
                // let vitalSigns = this.state.vitalSigns
                // // console.log('inside else', vitalSigns)
                let endDate = this.state.payloadEndDate
                let startDate = this.state.payloadStartDate
                // // console.log('payloadstart:', startDate, 'Payloadendate:', endDate)
                // for (var i = 0; i < vitalSigns.length; i++) {
                //   // console.log('in this looop')
                //   var fields = vitalSigns[i].split("|")
                //   for(var i=0;i<provider_req_json.entry.length;i++){
                //     if(provider_req_json.entry[i].resource.resourceType == 'CommunicationRequest'){
                //       provider_req_json.entry[i].resource.payload.push({
                //         'extension': [{
                //           'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-query-string',
                //           'valueString': "Observation?patient.identifier=" + this.state.patientId + "&date=gt" + startDate + "&date=lt" + endDate + "&code=" + fields[0]
                //         }],
                //         'cdex-payload-query-string': {
                //           'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-query-string',
                //           'extension': [{
                //             'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-query-string',
                //             'valueString': "Observation?patient.identifier=" + this.state.patientId + "&date=gt" + startDate + "&date=lt" + endDate + "&code=" + fields[0]

                //           }],
                //           'valueString': "Observation?patient.identifier=" + this.state.patientId + "&date=gt" + startDate + "&date=lt" + endDate + "&code=" + fields[0]
                //         },
                //         "contentString": "Please provide " + fields[1] + " recorded during " + startDate.substring(0, 10) + " - " + endDate.substring(0, 10)
                //       })
                //     }
                //   }
                // }
                let queries = this.state.queries;
                for (var i = 0; i < queries.length; i++) {
                    let resourceType = queries[i].resource[0].toUpperCase() + queries[i].resource.slice(1);
                    for (var j = 0; j < provider_req_json.entry.length; j++) {
                        if (provider_req_json.entry[j].resource.resourceType == 'CommunicationRequest') {
                            provider_req_json.entry[j].resource.payload.push({
                                'extension': [{
                                    'url': 'http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-query-string',
                                    // 'valueString': "Observation?patient.identifier=" + this.state.patientId + "&date=gt" + startDate + "&date=lt" + endDate + "&code=" + fields[0],
                                    'valueString': resourceType + '?' + queries[i].query + '=' + queries[i].searchString
                                }],

                                "contentString": queries[i].query
                            })
                        }
                    }
                }
            }
            // let documents = this.state.documents
            // if (documents != undefined) {
            //   for (var i = 0; i < documents.length; i++) {
            //     req_json.payload.push({ "contentReference": { "reference": "#" + documents[i] } })
            //   }
            // }

            // console.log("Requestqqqq:", req_json)
            // console.log(JSON.stringify(req_json))
            // console.log("provider----------------", provider_req_json);
            let commRequest = await this.createFhirResource(
                provider_req_json, 'Bundle', this.state.config.provider_fhir_url, 'provider'
            );
            // for(var i=0;i<provider_req_json.entry.length;i++){
            //   if(provider_req_json.entry[i].resource.resourceType == 'CommunicationRequest'){
            //     provider_req_json.entry[i].resource.identifier.value = commRequest.identifier.value;
            //   }
            // }

            // let commRequest = await this.createFhirResource(
            //   provider_req_json, 'CommunicationRequest', this.props.config.provider.fhir_url, 'provider'
            // ).then(async () => {
            //   // let payer_req_json = provider_req_json;
            //   // payer_req_json.about = [{
            //   //   "reference": "Claim?identifier=" + this.state.claimid
            //   // }];
            //   // payer_req_json.identifier.value = commRequest.identifier.value;
            // console.log("payer----------------", provider_req_json);
            let communication = await this.createFhirResource(provider_req_json, 'CommunicationRequest', this.state.config.payer_fhir_url, 'payer', true).then(()=>{
                this.setState({loading:false})
            })

            console.log(commRequest, 'yess')
            console.log(communication, 'yess plese')
            sessionStorage.setItem('patientId', this.state.patientId)
            sessionStorage.setItem('practitionerId', this.state.practitionerId)
            sessionStorage.setItem('payerId', this.state.payerId)
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


    renderForm() {
        let local = {
            "format": "DD-MM-YYYY HH:mm",
            "sundayFirst": false
        }
        return (
            <React.Fragment>
                <div>
                    {/* <header id="inpageheader">
                    <div className="container">

                        <div id="logo" className="pull-left">
                            {this.state.currentPayer !== '' &&
                                <h1><a href="#intro" className="scrollto">{this.state.currentPayer.payer_name}</a></h1>
                            }
                            <a href="#intro"><img src={process.env.PUBLIC_URL + "/assets/img/logo.png"} alt="" title="" /></a>
                        </div>

                        <nav id="nav-menu-container">
                            <ul className="nav-menu">
                                <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>List Of documents</a></li>
                                <li><a href={window.location.protocol + "//" + window.location.host + "/task"}>TASK</a></li>
                                <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li>

                            </ul>
                        </nav>
                    </div>
                </header> */}
                    <main id="main" >
                        <div className="form">
                            {/* <div>
                                <div className="header">
                                    Practitioner NPI*
                      </div>
                                <div className="dropdown">
                                    <Input className='ui fluid   input' type="text" name="practitionerId" fluid value={this.state.practitionerId} onChange={this.onPractitionerChange}></Input>

                                </div>
                                {this.state.validatePractitioner === true &&
                                    <div className='errorMsg dropdown'>{this.props.config.errorMsg}</div>
                                }
                            </div> */}
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
                                            </div>
                                        }
                                        {this.state.patientResource.hasOwnProperty('birthDate') &&
                                            <div className="form-group col-md-4">
                                                <span className="title-small">Birth Date</span>
                                                <input type="text" name="birthDate" className="form-control" id="birthDate" placeholder="Birth Date"
                                                    value={this.state.patientResource.birthDate} disabled
                                                />
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
                            {/* <div className="form-row">
                                <div className="form-group col-3 offset-1">
                                    <h4 className="title">Select Claim ID*</h4>

                                </div>
                                <div className="form-group col-8">
                                    <DropdownClaim elementName="claimid" updateCB={this.updateClaimID} />
                                </div>

                            </div> */}
                            <div className="form-row">
                                <div className="form-group col-3 offset-1">
                                    <h4 className="title">Document type*</h4>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input type="checkbox" class="form-check-input" id="Check1" checked={this.state.isClinicalNote} onChange={this.updateDoc} />
                                    <label class="form-check-label" for="Check1">Clinical Notes</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    {/* <input type="checkbox" checked={this.state.isClinicalNote} onChange={this.updateDoc} /> Clinical Note */}
                                    <input type="checkbox" class="form-check-input" id="Check2" checked={this.state.isDataElement} onChange={this.updateDataElement} />
                                    <label class="form-check-label" for="Check2">FHIR Resources</label>
                                </div>
                            </div>
                            {this.state.isClinicalNote &&
                                <div className="form-row">
                                    <div className="form-group col-3 offset-1">
                                        <h4 className="title">Clinical Notes*</h4>
                                    </div>
                                    <div className="form-group col-8">
                                        <DropdownDocument elementName="documents" updateCB={this.updateStateElement} />
                                        {/* <Select options={this.typeOfDocuments} onChange={this.updateDocumentType} value={this.typeOfDocuments.label} /> */}
                                    </div>

                                </div>}
                            {this.state.isDataElement &&
                                <div className="form-row">
                                    <div className="form-group col-3 offset-1">
                                        <h4 className="title">Requesting for</h4>
                                    </div>
                                    <div className="form-group col-8">
                                        {/* <Input className='ui fluid   input' type="text" name="reason" fluid value={this.state.reasons} onChange={this.onReasonChange}></Input>
                    <span>( NOTE: Use ',' to separate multiple values.For Example: "Red,Green,Blue" )
                    </span> */}
                                        {/* /<DropdownVitalSigns elementName="vitalSigns" updateCB={this.updateStateElement} /> */}
                                        <button onClick={this.addQuery}>Add new query</button>
                                        {
                                            this.state.queries.map((val, idx) => {
                                                let QueryId = `query-${idx}`, searchStrId = `searchStr-${idx}`
                                                return (
                                                    <div key={idx} className="form-row">

                                                        {/* <label htmlFor={QueryId}>{`Query #${idx + 1}`}</label> */}
                                                        <div className="form-group col-12" style={{ paddingTop: "13px" }}>
                                                            <div className="form-row">
                                                                <a id={idx} onClick={() => this.onRemoveQuery(idx)} className="close-thik" />
                                                                <div className="form-group col-4" >
                                                                    <span className="title-small" htmlFor={searchStrId} >Resource Type</span>
                                                                    <input type="text" name="resource" id={idx} placeholder="Resource Type" className="resource" className="form-control"
                                                                        onChange={this.handleChange} value={val.resource}
                                                                    />
                                                                    {/* <label htmlFor={searchStrId}>Resource</label> */}
                                                                    {/* <Input
                                                            type="text"
                                                            name="resource"
                                                            id={idx}
                                                            className="resource"
                                                            onChange={this.handleChange}
                                                        /> */}
                                                                </div>
                                                                <div className="form-group col-4"  >

                                                                    <span className="title-small" htmlFor={QueryId} >{`Query`}</span>
                                                                    <input type="text" name="query" id={idx} placeholder="Query" className="query" className="form-control"
                                                                        onChange={this.handleChange} value={val.query}
                                                                    />
                                                                    {/* <Input
                                                            type="text"
                                                            name="query"
                                                            id={idx}
                                                            className="query"
                                                            onChange={this.handleChange}
                                                        /> */}
                                                                </div>
                                                                <div className="form-group col-4" >
                                                                    <span className="title-small" htmlFor={searchStrId} >Search String</span>
                                                                    <input type="text" name="searchString" id={idx} placeholder="Search String" className="searchString" className="form-control"
                                                                        onChange={this.handleChange} value={val.searchString}
                                                                    />
                                                                    {/* <label htmlFor={searchStrId}>Search String</label> */}
                                                                    {/* <Input
                                                            type="text"
                                                            name="searchString"
                                                            id={idx}
                                                            className="searchString"
                                                            onChange={this.handleChange}
                                                        /> */}
                                                                </div>
                                                                
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>

                                    {/* <div className="dropdown">
                  <Select options={this.typeOfVitalSigns} 
                    isMulti
                    name="vitalsigns"
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={this.updateVitalSigns} 
                    value={this.typeOfVitalSigns.label} />
                  </div> */}

                                </div>}
                            <div className="form-row">
                                <div className="form-group col-3 offset-1">
                                    <h4 className="title">Occurence Time period</h4>
                                </div>
                                <div className="form-group col-8">
                                    <DatetimeRangePicker onChange={this.updatetimePeriod} startDate={this.state.occurenceStartDate} endDate={this.state.occurenceEndDate} />

                                    {/* <Select options={this.typeOfDocuments} onChange={this.updateDocumentType} value={this.typeOfDocuments.label} /> */}
                                </div>

                            </div>
                            <div>

                                {this.state.isClinicalNote &&
                                    <div className="form-row">
                                        <div className="form-group col-3 offset-1">
                                            <h4 className="title">Clinical Note Time period</h4>
                                        </div>
                                        <div className="form-group col-8">
                                            <DatetimeRangePicker onChange={this.updateClinicalNoteTimePeriod} startDate={this.state.clinicalNoteStartDate} endDate={this.state.clinicalNoteEndDate} />
                                        </div>
                                    </div>

                                }
                                {this.state.isDataElement &&
                                    <div className="form-row">
                                        <div className="form-group col-3 offset-1">
                                            <h4 className="title">FHIR Resource Time period</h4>
                                        </div>
                                        <div className="form-group col-8">
                                            <DatetimeRangePicker onChange={this.updatePayloadtimePeriod} startDate={this.state.payloadStartDate} endDate={this.state.payloadEndDate} />
                                        </div>
                                    </div>
                                }


                            </div>


                            {/*
                <div> ocuments
                  </3div>
                  <div className="dropdown">
                    <DropdownDocument
                      elementName='documents'
                      updateCB={this.updateStateElement}
                     />
                  </div>
                </div>
                */}
                            <div className="text-center">
                                <button className="submit-btn btn btn-class button-ready" onClick={this.startLoading}>Submit
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
                            {this.state.dataLoaded &&
                                <div style={{ textAlign: "center", paddingTop: "5%" }}>
                                    <p style={{ color: "green" }}>{"Communication Request has been created successfully with id : " + this.state.reqId + "."}</p>
                                </div>
                            }
                        </div>
                    </main>
                </div>
            </React.Fragment>);
    };

    async getJson() {
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
                "access_token": this.state.accessToken,
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
export default withRouter(connect(mapStateToProps)(ProviderCommunicationRequest));

