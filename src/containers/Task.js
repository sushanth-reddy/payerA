import React, { Component } from 'react';
// import ReactJson from 'react-json-view';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Client from 'fhir-kit-client';
import Loader from 'react-loader-spinner';
import { NotificationContainer } from 'react-notifications';
import moment from "moment";
import Dropzone from 'react-dropzone';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Header } from '../components/Header';
var date = new Date()
var currentDateTime = date.toISOString()
var dateFormat = require('dateformat');

const types = {
    error: "errorClass",
    info: "infoClass",
    debug: "debugClass",
    warning: "warningClass"
}
class Task extends Component {
    constructor(props) {
        super(props);
        this.state = {
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            listLoading: false,
            patient: {},
            form_load: false,
            loading: false,
            patient_name: "",
            patient_identifier: "",
            docs_required: [],
            requester_org: '',
            sender_name: '',
            files: [],
            contentStrings: [],
            communicationRequest: {},
            searchParameter: '',
            documentReference: {},
            startDate: '',
            endDate: '',
            recievedDate: '',
            check: false,
            documentCheck: false,
            content: [],
            senderOrganization: {},
            requesterOrganization: {},
            requesterIdentifier: '',
            valueString: '',
            communicationPayload: [],
            documentContent: [],
            observationValuestring: '',
            extensionUrl: '',
            extValueCodableConcept: '',
            error: false,
            errorMsg: '',
            success: false,
            successMsg: '',
            documentList: [],
            selectedDocs: [],
            compositionJson: '',
            carePlanResources: '',
            selectedPlans: [],
            checkCarePlan: false,
            payerName: '',
            bundle: {
                "resourceType": "Bundle",
                "id": "pcde-example",
                "identifier": {
                    "system": "http://example.org/documentIDs",
                    "value": this.randomString()
                },
                "type": "document",
                "timestamp": currentDateTime,
                "entry": []
            },
            communicationIdentifier: this.randomString(),
            fhir_url: '',
            endpoint: '',
            show: false,
            currentPayer: '',
            bundleResources: [],
            reviewError: false,
            reviewErrorMsg: "",
            collectionBundleId: "",
            updatedCommReq: '',
            collectionBundle: ''
        };
        this.goTo = this.goTo.bind(this);
        this.getCommunicationRequests = this.getCommunicationRequests.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.getSenderDetails = this.getSenderDetails.bind(this);
        this.getSenderResource = this.getSenderResource.bind(this);
        this.startLoading = this.startLoading.bind(this);
        this.updateDocuments = this.updateDocuments.bind(this);
        this.onChangeSearchParameter = this.onChangeSearchParameter.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDocumentChange = this.handleDocumentChange.bind(this);
        this.showError = this.showError.bind(this);
        this.onDocSelect = this.onDocSelect.bind(this);
        this.renderDocs = this.renderDocs.bind(this);
        this.getResources = this.getResources.bind(this);
        this.getToken = this.getToken.bind(this);
        this.getCarePlans = this.getCarePlans.bind(this);
        this.showBundlePreview = this.showBundlePreview.bind(this);
        this.validateCommunicationRequest = this.validateCommunicationRequest.bind(this);


    }
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

    goTo(title) {
        window.location = window.location.protocol + "//" + window.location.host + "/" + title;
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
            sessionStorage.setItem('redirectTo', "/task");
            this.props.history.push("/login");
        }

        let payersList = await this.getPayerList()
        let payer;
        if (this.state.config !== null) {
            payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
        }
        this.setState({ fhir_url: payer.payer_end_point })
        this.setState({ currentPayer: payer })
        this.setState({ requesterIdentifier: payer.payer_identifier })
        this.setState({ payerName: payer.payer_name })
        this.getCommunicationRequests('');

    }
    showBundlePreview() {
        let show = this.state.show;
        this.setState({ show: !show });
    }
    indexOfFile(file) {
        for (var i = 0; i < this.state.files.length; i++) {
            console.log(this.state.files[i].name, file.name, 'lets check')
            if (this.state.files[i].name === file.name) {
                return i;
            }

        }
        return -1;

    }

    getResourceFromBundle(bundle, resourceType, id = false) {
        var filtered_entry = bundle.entry.find(function (entry) {
            if (entry.resource !== undefined) {
                if (id !== false) {
                    return entry.resource.id === id;
                }
                return entry.resource.resourceType === resourceType;
            }
        });
        if (filtered_entry !== undefined) {
            return filtered_entry.resource;
        }
        return null
    }

    onDrop(files) {

        let new_files = [];

        new_files = this.state.files;
        // new_files.concat(this.state.files);
        // let old_files= this.state.files;
        for (var i = 0; i < files.length; i++) {
            console.log(files[i], 'what file', JSON.stringify(this.state.files).indexOf(JSON.stringify(files[i])), this.state.files)
            if (this.indexOfFile(files[i]) === - 1) {
                console.log(this.indexOfFile(files[i]), i)
                new_files = this.state.files.concat(files);
            }
        }
        // if( this.state.files.every((value, index) => value !== files[index])){
        //     new_files= this.state.files.concat(files);
        //     console.log('includes')
        // }
        this.setState({ files: new_files }, () => {
            this.showError()
        });


    }
    onCancel(file) {
        let new_files = this.state.files;
        for (var i = 0; i < new_files.length; i++) {
            if (new_files[i] === file) {
                new_files.splice(i, 1);
            }
        }
        this.setState({
            files: new_files
        });
    }
    onRemove(file) {
        var new_files = this.state.files;
        for (var i = 0; i < new_files.length; i++) {
            if (new_files[i] === file) {
                new_files.splice(i, 1);
            }
        }
        this.setState({ files: new_files }, () => {
            this.showError()
        })
    }

    async getResources(searchParams) {
        var tempUrl = this.state.fhir_url;
        let headers = {
            "Content-Type": "application/json",
        }
        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);

        // const token = await createToken(this.state.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        // if (config.payerB.authorized_fhir) {
        //     // console.log('The token is : ', token, tempUrl);
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        const fhirResponse = await fetch(tempUrl + "/" + searchParams, {
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
        return fhirResponse;
    }

    async getCommunicationRequests() {
        this.setState({ listLoading: true });
        var tempUrl = this.state.fhir_url;
        let bundleResources = this.state.bundleResources;
        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);
        // const token = await createToken(this.state.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        // if (config.payerB.authorized_fhir) {
        //     // console.log('The token is : ', token, tempUrl);
        // }
        await fetch(tempUrl + "/Bundle?type=collection&_count=100000&_sort=-_lastUpdated", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
                // ,"Authorization" : 'Bearer ' + token
            }
        }).then(response => {
            console.log("Recieved response", response);
            return response.json();
        }).then((response) => {
            this.setState({ listLoading: false });
            if (response.resourceType === "Bundle" && response.hasOwnProperty("entry")) {
                //search bundle entry
                response.entry.map((e, k) => {
                    //entry of bundle with type collection
                    if (e.resource.hasOwnProperty('entry')) {
                        e.resource.entry.map((entry, k) => {
                            // console.log("Resource---",entry.resource,"resource id---",entry.id);
                            //if entry has payload as key in its resource
                            if (entry.resource.resourceType === 'CommunicationRequest' && entry.resource.hasOwnProperty('payload')) {
                                entry.resource.payload.map((p) => {
                                    if (p.hasOwnProperty('extension')) {
                                        if (p.extension[0].hasOwnProperty('valueCodeableConcept')) {
                                            if (p.extension[0].valueCodeableConcept.coding[0].code === 'pcde') {
                                                bundleResources.push(e.resource)
                                                this.setState({ bundleResources });
                                            }
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                console.log('no communications')
            }
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
    }

    async getCarePlans() {
        let carePlanResources = await this.getResources('CarePlan?status=active&subject=' + this.state.patient.id).then((resource) => {
            if (resource.hasOwnProperty('entry')) {
                this.setState({ carePlanResources: resource.entry })
            }
        })
    }
    resetData() {
        this.setState({ patient_name: "" });
        this.setState({ reviewError: false });
        this.setState({ reviewErrorMsg: "" });
        this.setState({ requester_org: "" });
        this.setState({ sender_name: "" });
        this.setState({ observationList: [] });
        this.setState({ check: false });
        this.setState({ content: [] });
        this.setState({ documentContent: [] });
        this.setState({ communicationPayload: [] })
        this.setState({ observationValuestring: '' })
        this.setState({ extensionUrl: '' })
        this.setState({ extValueCodableConcept: '' })
        this.setState({ error: false })
        this.setState({ success: false })
        this.setState({ documentList: [] })
        this.setState({ loading: false })
        this.setState({ files: [] })
    }
    async getPatientData(patient_identifier) {

        var tempUrl = this.state.fhir_url + "/Patient?identifier=" + patient_identifier.value;
        // let token = await createToken(this.state.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        let gotData = await fetch(tempUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        }).then(response => {
            return response.json();
        }).then((response) => {
            let patient = null;
            if (response.hasOwnProperty("entry") && response.entry.length > 0) {
                patient = response.entry[0].resource;
            }
            console.log("patient---", patient);
            if (patient !== null) {
                this.setState({ patient: patient });
                if (patient.hasOwnProperty("name")) {
                    var name = '';
                    if (patient['name'][0].hasOwnProperty('given')) {
                        name = patient['name'][0]['given'][0] + " " + patient['name'][0]['family'];
                        console.log("name---" + name);
                        this.setState({ patient_name: name })
                    }
                }
                return true;
            } else {
                return false;
            }
        }).catch((reason) => {
            console.log("No response recieved from the server", reason);
            return false;
        });
        return gotData;
    }
    validateCommunicationRequest(communication_request, patient_resource, collectionBundle) {
        if (!communication_request.hasOwnProperty('sender')) {
            this.setState({ "reviewError": true })
            this.setState({ "reviewErrorMsg": "Request doesn't have Sender Organization's ID mentioned" })
            return false;
        }
        else if (!communication_request.hasOwnProperty('recipient')) {
            this.setState({ "reviewError": true })
            this.setState({ "reviewErrorMsg": "Request doesn't have Recipient Organization's ID mentioned" })
            return false;
        }
        else if (!communication_request.hasOwnProperty('requester')) {
            this.setState({ "reviewError": true })
            this.setState({ "reviewErrorMsg": "Request doesn't have Requester Organization's ID mentioned" })
            return false;
        }
        else if (!communication_request.hasOwnProperty('subject')) {
            this.setState({ "reviewError": true })
            this.setState({ "reviewErrorMsg": "Request doesn't have Patient's ID mentioned" })
            return false;
        }
        else if (communication_request.hasOwnProperty('subject')) {
            if (patient_resource.hasOwnProperty("identifier")) {
                let patient_identifier = null
                if (patient_resource.hasOwnProperty("identifier")) {
                    patient_identifier = patient_resource.identifier.find(function (ident) {
                        if (ident.system === "http://hospital.smarthealthit.org" || ident.system === "http://hospital.davinciproject.org") {
                            return ident.value;
                        }
                    })
                }
                console.log("Patientidentifier---", patient_identifier);
                if (patient_identifier === null || patient_identifier === undefined) {
                    this.setState({ "reviewError": true })
                    this.setState({ "reviewErrorMsg": "Patient should contain identifier with system 'http://hospital.smarthealthit.org'" })
                    return false
                } else {
                    this.setState({ patient_identifier: patient_identifier })
                    // return true
                }
            }
        }
        else if (communication_request.hasOwnProperty('sender')) {
            if (communication_request.sender.hasOwnProperty('reference')) {
                let senderId = communication_request.sender.referenc.split('/')[1]
                let sender_org = this.getResourceFromBundle(collectionBundle, "Organization", senderId)
                if (!sender_org.hasOwnProperty('endpoint')) {
                    this.setState({ "reviewError": true })
                    this.setState({ "reviewErrorMsg": " Sender organization's doesn't have Endpoint Mentioned" })
                    return false
                }
                else {
                    let endpoint = sender_org.endpoint
                    let endpointId = endpoint[0].reference.split('/')[1]
                    let endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpointId)
                    if (!endpoint_resource.hasOwnProperty('address')) {
                        this.setState({ "reviewError": true })
                        this.setState({ "reviewErrorMsg": "Sender organization's endpoint doesn't have address which is required" })
                        return false
                    }


                }

            }


        }
        return true
        // else {
        //     return true
        // }
    }
    async fetchData(patient_id, patient_resource, collectionBundle, communication_request) {
        this.resetData();
        // Set CommunicationRequest
        let isValidated = this.validateCommunicationRequest(communication_request, patient_resource, collectionBundle)
        if (isValidated) {
            this.setState({ communicationRequest: communication_request });
            if (communication_request.hasOwnProperty('authoredOn')) {
                this.setState({ recievedDate: communication_request.authoredOn })
            }
            // Set CollectionBundle
            this.setState({ "collectionBundleId": collectionBundle.id })
            if (communication_request.hasOwnProperty('payload')) {
                await this.getDocuments(communication_request['payload']);
            }
            this.setState({ collectionBundle: collectionBundle })
            this.getPatientData(this.state.patient_identifier).then((gotData) => {
                if (gotData) {
                    this.getDetails(communication_request, collectionBundle).then(() => {
                        this.showError()
                        this.setState({ form_load: true });
                    })
                } else {
                    this.setState({ "reviewError": true })
                    this.setState({ "reviewErrorMsg": "Patient with identifier " + this.state.patient_identifier + " was not found" })
                }
            })
        }

    }
    randomString() {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var string_length = 8;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring
    }
    async getDocuments(payload) {
        let strings = [];
        payload.map((c) => {
            if (c.hasOwnProperty('contentString')) {
                strings.push(c.contentString)
            }
            this.setState({ contentStrings: strings })
        });


    }
    async showError() {
        if (this.state.carePlanResources === "") {
            this.setState({ error: true });
            this.setState({ errorMsg: "No Active Care Plans Found!!" })
        }
        else {
            this.setState({ error: false });
        }
    }

    async getReferences(object, resource) {
        let referenceArray = []
        // console.log(object, 'objjj')
        if (resource === 'Claim') {
            if (object.hasOwnProperty('enterer')) {
                let enterer = await this.getResources(object.enterer.reference)
                referenceArray.push({ resource: enterer })
            }
            if (object.hasOwnProperty('provider')) {
                let provider = await this.getResources(object.provider.reference)
                referenceArray.push({ resource: provider })
            }
            if (object.hasOwnProperty('insurer')) {
                let insurer = await this.getResources(object.insurer.reference)
                referenceArray.push({ resource: insurer })
            }
            if (object.hasOwnProperty('procedure')) {
                let procedure = await this.getResources(object.procedure[0].procedureReference.reference)
                // if(procedure.hasOwnProperty('encounter')){
                //     let encounter = await this.getResources(procedure.encounter.reference)
                //     referenceArray.push({resource:encounter})

                // }
                referenceArray.push({ resource: procedure })
            }
            if (object.hasOwnProperty('encounter')) {
                await this.getResources(object.encounter.reference).then((encounter) => {
                    if (encounter.hasOwnProperty('participant')) {
                        if (encounter.participant[0].hasOwnProperty('individual')) {
                            this.getResources(encounter.participant[0].individual.reference).then((practitioner) => {
                                referenceArray.push({ resource: practitioner })
                            });
                        }
                    }
                    referenceArray.push({ resource: encounter })
                })
            }
            if (object.hasOwnProperty('insurance')) {
                if (object.insurance[0].hasOwnProperty('coverage')) {
                    if (object.insurance[0].coverage.hasOwnProperty('reference')) {
                        let coverage = await this.getResources(object.insurance[0].coverage)
                        referenceArray.push({ resource: coverage })
                    }

                }

            }

        }
        else if (resource === "CarePlan") {
            if (object.hasOwnProperty('encounter')) {
                await this.getResources(object.encounter.reference).then((encounter) => {
                    if (encounter.hasOwnProperty('participant')) {
                        if (encounter.participant[0].hasOwnProperty('individual')) {
                            this.getResources(encounter.participant[0].individual.reference).then((practitioner) => {
                                referenceArray.push({ resource: practitioner })
                            });
                        }
                    }
                    referenceArray.push({ resource: encounter })
                })

            }
            if (object.hasOwnProperty('careTeam')) {
                let careTeam = await this.getResources(object.careTeam[0].reference)
                referenceArray.push({ resource: careTeam })
            }
        }

        return referenceArray
    }

    async createFhirResource(json, resourceName, url, ) {
        // this.setState({ loading: true });
        try {
            const fhirClient = new Client({ baseUrl: url });
            // let token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);
            // fhirClient.bearerToken = token;

            //   console.log('The json is : ', json);
            let data = fhirClient.create({
                resourceType: resourceName,
                body: json,
                headers: { "Content-Type": "application/fhir+json" }
            }).then((data) => {
                console.log("Data::", data);
                this.setState({ compositionJson: data })
                this.setState({ loading: false });
                return data;
            }).catch((err) => {
                console.log(err);
                this.setState({ loading: false });
            })
            return data
        } catch (error) {
            console.error('Unable to create resource', error.message);
            this.setState({ loading: false });
            this.setState({ dataLoaded: false })
        }
    }


    async getDetails(communication_request, collectionBundle) {
        var date = new Date()
        var currentDateTime = date.toISOString()
        let Bundle = this.state.bundle
        let compositionJson = {
            "resourceType": "Composition",
            "id": 'composition-json',
            "status": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEDocumentCode",
                        "code": "pcde"
                    }
                ]
            },
            "subject": {
                "reference": "Patient/" + this.state.patient.id
            },
            "date": currentDateTime,
            "author": [],
            "title": "Example PCDE Document for Diabetes patient",
            "event": [],
            "section": []
        }


        var arr = []
        let conditionResource = ''
        var claims = ''
        let claim = ''
        let claimResponse = ''
        await this.getResources('CarePlan?status=active&subject=' + this.state.patient.id)
            .then((response) => {
                if (response.hasOwnProperty('entry')) {
                    let carePlanResources = response.entry;
                    this.setState({ carePlanResources: response.entry })
                }

            })
    }


    onDocSelect(event) {
        console.log("event --", event, event.target, this.state.selectedDocs);
        let val = event.target.name;
        let selectedDocs = [...this.state.selectedDocs]
        let valueIndex = this.state.selectedDocs.indexOf(val)
        if (valueIndex == -1) {

            selectedDocs.push(val);

        }
        else {
            selectedDocs.splice(valueIndex, 1)
        }
        this.setState({ selectedDocs: selectedDocs })

    }

    renderDocs(item, key) {
        let resource = item.resource
        return (<div key={key}>
            <div key={key} style={{ padding: "15px", paddingTop: "0px", paddingBottom: "0px" }}>
                <label>
                    <input type="checkbox" name={resource.id}
                        onChange={this.onDocSelect} />
                </label>

                <span style={{ lineHeight: "0.1px" }}>{resource.type.coding[0].code + " - " + resource.type.coding[0].display + '  dated- ' + moment(resource.date).format(" YYYY-MM-DD")}</span>

            </div>
        </div>
        )
    }

    onPlanSelect(resource) {
        let selectedPlans = [...this.state.selectedPlans]
        let valueIndex = this.state.selectedPlans.indexOf(resource)
        if (valueIndex == -1) {
            selectedPlans.push(resource);
        }
        else {
            selectedPlans.splice(valueIndex, 1)
        }
        this.setState({ selectedPlans: selectedPlans })
        // this.setState()
    }

    renderCarePlans(item, key) {
        let resource = item.resource
        let categoryName = ''
        if (resource.hasOwnProperty('category')) {
            if (resource.category[0].hasOwnProperty('text')) {
                categoryName = resource.category[0].text
            }
        }
        console.log('oh ueah')
        return (<div key={key}>
            <div key={key} style={{ padding: "15px", paddingTop: "0px", paddingBottom: "0px" }}>
                <input type="checkbox" className="form-check-input" name={resource.id} id={key}
                    onChange={() => this.onPlanSelect(resource)} />
                <label className="form-check-label" for={key}>
                    {categoryName !== '' &&
                        <span>{resource.resourceType}-{categoryName}</span>
                    }
                    {categoryName === '' &&
                        <span>{resource.resourceType}-{resource.id}</span>
                    }
                </label>


            </div>
        </div>
        )
    }



    startLoading() {
        this.setState({ loading: true }, () => {
            if (!this.state.error) {
                console.log('selected careplans are', this.state.checkCarePlan, this.state.selectedPlans)
                // this.submit_info();
            }
        })
    }

    async UpdateCommunicationRequest(collectionBundle) {
        let headers = {
            "Content-Type": "application/json",
        }
        // const token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);

        // const token = await createToken(config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        // if (config.payerA.authorized_fhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        // var communicationUrl = '';
        // var url = config.payerA.fhir_url + "/CommunicationRequest/" + this.state.communicationRequest.id;
        // var url = endPointUrl;
        // var bundle = {
        //     "resourceType": "Bundle",
        //     "type": "transaction",
        //     "entry": [{
        //         "resource": this.state.communicationRequest,
        //         "request": {
        //             "method": "PUT",
        //             "url": "CommunicationRequest?identifier=" + this.state.communicationRequest.identifier[0].value
        //         }
        //     }]

        // }
        let communication_request = this.state.communicationRequest
        communication_request.status = 'completed'
        this.setState({ updatedCommReq: communication_request })
        collectionBundle.entry.map((entry, k) => {
            if (entry.resource.resourceType === 'CommunicationRequest') {
                entry.resource = this.state.updatedCommReq
            }
        })
        var fhir_url = this.state.fhir_url;

        let CommunicationRequest = await fetch(fhir_url + "/Bundle/" + collectionBundle.id, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(collectionBundle)
        }).then(response => {
            return response.json();
        }).then((response) => {
            console.log(response, 'yes its working')
        }
        )

    }
    getUnique(arr) {
        let new_array = []
        let ids = []
        for (var i = 0; i < arr.length; i++) {
            if (ids.indexOf(arr[i].resource.id) == -1) {
                ids.push(arr[i].resource.id)
                new_array.push({ 'resource': arr[i].resource })
            }
        }

        return new_array;
    }
    getCarePlanInfo(carePlan) {
        let compositionJSON
        let arr = []
        let Bundle=[]
        let claim=''
        let claimResponse =''
        let communication_request=this.state.communicationRequest
        console.log(carePlan, 'care paln resource')
        if (carePlan.hasOwnProperty('activity')) {
            carePlan.activity.map((act) => {
                if (act.hasOwnProperty('detial')) {
                    if (act.detail.hasOwnProperty('reasonReference')) {
                        if (act.detail.reasonReference.reference.indexOf('Condition') > -1) {
                            arr.push(act.detail.reasonReference.reference)
                        }
                    }
                }
            })
        }
        if (carePlan.hasOwnProperty('addresses')) {
            carePlan.addresses.map((address => {
                let index = arr.indexOf(address)

                if(index===-1){
                    arr.push(address.reference)
                }

            }))
        }
        this.getReferences(carePlan, 'CarePlan').then((ref)=>{
            ref.map((r) => {
                Bundle.entry.push(r)
            })
        })
        

        this.getResources('Claim?patient=' + this.state.patient.id).then((claims)=>{
            if (claims.hasOwnProperty('entry')) {
                claims.entry.map((c) => {
                    if (c.resource.hasOwnProperty('diagnosis')) {
                        if (c.resource.diagnosis[0].hasOwnProperty("diagnosisReference")) {
                            if (c.resource.diagnosis[0].diagnosisReference.reference === arr[0]) {
                                claim = c.resource
                            }
                        }
                    }
                })
            }
        })
        
        if (claim !== '') {
            let cr = this.getResources('ClaimResponse?request=' + claim.id).then((cr)=>{
                if (cr.hasOwnProperty('entry')) {
                    claimResponse = cr.entry[0].resource
                }
            })
            
            this.getReferences(claim, 'Claim').then((ref)=>{
                ref.map((r) => {
                    Bundle.entry.push(r)
                })
            })
            
        }
        Bundle.entry.push({ resource: this.state.patient })
        if (this.state.patient.hasOwnProperty('generalPractitioner')) {
            this.getResources(this.state.patient.generalPractitioner[0].reference).then((prac) => {
                Bundle.entry.push({ resource: prac })
            })
        }
        console.log('1234', claim, claimResponse, 'conditionsArray')
        // compositionJson.section.push(
        //     {
        //         "code": {
        //             "coding": [
        //                 {
        //                     "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
        //                     "code": "activeTreatment"
        //                 }
        //             ]
        //         },
        //         "section": [
        //             {
        //                 "code": {
        //                     "coding": [
        //                         {
        //                             "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
        //                             "code": "treatment"
        //                         }
        //                     ]
        //                 },
        //                 "entry": [
        //                     {
        //                         "reference": "CarePlan/" + c.resource.id
        //                     }
        //                 ]
        //             },

        //         ]
        //     }
        // )
        // if (claim !== '' && claimResponse !== '') {
        //     compositionJson.section[key].section.push(
        //         {
        //             "code": {
        //                 "coding": [
        //                     {
        //                         "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
        //                         "code": "priorCoverage"
        //                     }
        //                 ]
        //             },
        //             "entry": [
        //                 {
        //                     "reference": "Claim/" + claim.id
        //                 },
        //                 {
        //                     "reference": "ClaimResponse/" + claimResponse.id
        //                 }
        //             ]
        //         }
        //     )
        // }
        // Bundle.entry.push({ resource: c.resource })
        // arr.map((resource,k)=>{
        //     this.getResources(resource).then((conditionResource)=>{
        //         Bundle.entry.push({ resource: conditionResource })
        //     })
            
        // })
        // Bundle.entry.push({ resource: claim })
        // Bundle.entry.push({ resource: claimResponse })
        // Bundle.entry.push({ resource: this.state.endpoint })


        // this.setState({ compositionJson: compositionJson })
        // Bundle.entry.push({ resource: compositionJson })
        // let sender_org_id = ""
        // let sender_org = {}
        // if (communication_request.hasOwnProperty("sender")) {
        //     let sender_org_ref = communication_request.sender.reference;
        //     sender_org_id = sender_org_ref.split("/")[1]
        //     sender_org = this.getResourceFromBundle(collectionBundle, "Organization", sender_org_id)
        //     console.log("Sender Org---", sender_org);
        //     this.setState({ senderOrganization: sender_org });
        // }
        // if (sender_org_id !== "") {
        //     compositionJson.author.push({ "reference": "Organization/" + sender_org_id })
        // }
        // if (sender_org) {
        //     Bundle.entry.push({ "resource": sender_org });
        //     let endpoint = ""
        //     let endpoint_id = ""
        //     let endpoint_resource = {}
        //     this.setState({ "sender_name": sender_org.name });
        //     if (sender_org.hasOwnProperty("endpoint")) {
        //         endpoint = sender_org.endpoint
        //         endpoint_id = endpoint[0].reference.split("/")[1]
        //         console.log("Endpoint id---", sender_org.endpoint);
        //         endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpoint_id)
        //         if (endpoint_resource) {
        //             console.log("Endpoint---", endpoint_resource);
        //             Bundle.entry.push({ "resource": endpoint_resource });
        //         }
        //     }
        // }

        // let requester_org_id = ""
        // let requester_org = {}
        // if (communication_request.hasOwnProperty("requester")) {
        //     let requester_org_ref = communication_request.requester.reference;
        //     requester_org_id = requester_org_ref.split("/")[1]
        //     requester_org = this.getResourceFromBundle(collectionBundle, "Organization", requester_org_id)
        //     console.log("Requester Org---", requester_org);
        //     this.setState({ "requesterOrganization": requester_org });
        // }
        // if (requester_org) {
        //     console.log("Inside if requestor---")
        //     let endpoint = ""
        //     let endpoint_id = ""
        //     let endpoint_resource = {}
        //     this.setState({ "sender_name": requester_org.name });
        //     if (requester_org.hasOwnProperty("endpoint")) {
        //         endpoint = requester_org.endpoint
        //         endpoint_id = endpoint[0].reference.split("/")[1]
        //         console.log("Endpoint id---", requester_org.endpoint);
        //         endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpoint_id)
        //         if (endpoint_resource) {
        //             console.log("Endpoint---", endpoint_resource);
        //             Bundle.entry.push({ "resource": endpoint_resource });
        //             this.setState({ "endpoint": endpoint_resource });
        //         }
        //     } else {
        //         this.setState({ "reviewError": true })
        //         this.setState({ "reviewErrorMsg": "There is no endpoint defined in requester!!" })
        //     }

        //     Bundle.entry.push({ "resource": requester_org });

        // }

        // console.log(compositionJson, 'compositionJSON', Bundle)
        this.setState({ bundle: Bundle })
    }

    async submit_info() {
        let carePlanResources = this.state.selectedPlans
        carePlanResources.map((carePlan, k) => {
            this.getCarePlanInfo(carePlan)
        })
        let randomString = this.randomString()
        let bundle = this.state.bundle
        bundle.entry = this.getUnique(bundle.entry)
        console.log(bundle, 'pppppp')
        let files_arr = []
        if (this.state.files !== null) {
            for (var i = 0; i < this.state.files.length; i++) {
                (function (file) {
                    let content_type = file.type;
                    let file_name = file.name;
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        // get file content  
                        files_arr.push({
                            "contentAttachment": {
                                'contentType': content_type,
                                'data': reader.result
                            }
                        })
                    }
                    console.log('files')
                    reader.readAsBinaryString(file);
                })(this.state.files[i])
            }
        }
        if (this.state.files.length > 0) {
            bundle.entry[0].resource.section.push({
                "code": {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                            "code": "otherDocumentation"
                        }
                    ]
                },
                "entry": files_arr
            })
        }
        this.setState({ bundle: bundle })
        // let comp = await this.createFhirResource(this.state.compositionJson, 'Composition', this.state.fhir_url)
        console.log(this.state.bundle, 'composition Resource has been Created')
        this.setState({ loading: true });
        // let objJsonStr = JSON.stringify(this.state.bundle);
        // let objJsonB64 = Buffer.from(objJsonStr).toString("base64");
        // var encoded = btoa(JSON.stringify(dataResult))
        //             console.log(encoded, 'base64')
        let encodedJson = btoa(JSON.stringify(this.state.bundle))
        let fullUrl = this.randomString()
        let communicationRequest = this.state.communicationRequest;
        // console.log(this.state.communicationRequest, 'submitted', communicationRequest.sender.reference)
        // let communicationRequestJson = {};
        let doc_ref = {};
        // console.log(this.state.requesterOrganization, this.state.senderOrganization)
        var date = new Date()
        var authoredOn = date.toISOString()
        // console.log(authoredOn,communicationRequest.occurrencePeriod,'timeeee')
        let communicationPayload = this.state.communicationPayload
        let payload = [{
            'extension': this.state.communicationRequest.payload[0].extension,
            "contentAttachment": {
                "contentType": "application/fhir+xml",
                "data": encodedJson
            }
        }]
        this.setState({ communicationPayload: communicationPayload })
        var commJson = {
            "resource": {
                "resourceType": "Communication",
                "status": "completed",
                "subject": {
                    'reference': "Patient/" + this.state.patient.id
                },
                "recipient": [
                    {
                        "reference": "Organization/" + this.state.requesterOrganization.id
                    }
                ],
                "sender": {
                    "reference": "Organization/" + this.state.senderOrganization.id
                },
                // "occurrencePeriod": communicationRequest.occurrencePeriod,
                "authoredOn": authoredOn,
                "category": communicationRequest.category,
                // "contained": communicationRequest.contained,
                "basedOn": [
                    {
                        'reference': ''
                    }
                ],
                "identifier": [
                    {
                        "system": "http://www.providerco.com/communication",
                        "value": this.state.communicationIdentifier
                    }
                ],
                "payload": payload
            }
        }
        let collectionBundle = this.state.collectionBundle

        if (this.state.communicationRequest.hasOwnProperty('id')) {

            commJson.resource.basedOn[0].reference = "CommunicationRequest/" + this.state.communicationRequest.id
        }
        else {
            let id = this.randomString()
            collectionBundle.entry.map((entry, k) => {
                if (entry.resource.resourceType === 'CommunicationRequest') {
                    entry.resource.id = id
                    if (entry.resource.hasOwnProperty('status')) {
                        entry.resource.status = 'completed'
                    }
                }
            })
            commJson.resource.basedOn[0].reference = "CommunicationRequest/" + id
        }
        console.log(this.state.patient.id, 'iddd', commJson, this.state.collectionBundle)
        collectionBundle.entry.push(commJson)
        // commJson.entry.push({
        //     "resource": this.state.communicationRequest,
        //     "request": { "method": "POST", "url": "CommunicationRequest" }
        // })

        let headers = {
            "Content-Type": "application/json",
        }
        // const token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);

        // if (config.payerA.authorizedPayerFhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        var communicationUrl = this.state.endpoint.address;
        console.log("")
        console.log("Comm request json---", JSON.stringify(collectionBundle));
        let requesterCommunication = await fetch("https://cors-anywhere.herokuapp.com/" + communicationUrl + "/Bundle", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(collectionBundle)
        }).then(response => {
            return response.json();
        }).then((response) => {
            console.log("----------response123", response);
            // this.setState({ loading: false });
            // this.UpdateCommunicationRequest();
            if (response.hasOwnProperty('id')) {
                let communicationId = response.id
                this.UpdateCommunicationRequest(this.state.collectionBundle).then((res) => {
                    this.setState({ loading: false });
                    console.log(res, 'Sender Communication has been Created')
                })



                this.setState({ success: true })
                this.setState({ successMsg: 'Document has been posted  successfully with id - ' + communicationId })
                // NotificationManager.success('Communication has been posted to payer successfully.', 'Success');
                return response
            }
            if (response.hasOwnProperty('issue')) {
                this.setState({ loading: false })
                this.setState({ error: true });
                this.setState({ errorMsg: response.issue[0].diagnostics })
            }
            // this.setState({response})
            console.log(response, 'res')
        }).catch((reason) => {
            console.log("No response recieved from the server", reason)
            this.setState({ loading: false })

            this.setState({ error: true });
            this.setState({ errorMsg: "No response recieved from the server!!" + reason })
        }

        );
        this.setState({ communicationJson: commJson })

    }
    onChangeSearchParameter(event) {
        let searchParameter = this.state.searchParameter;
        searchParameter = event.target.value
        this.setState({ searchParameter: searchParameter });
        this.getDetails();
    }
    handleChange(obs, event) {
        let observation = obs.observation
        let check = this.state.check;
        let value;
        console.log(event.target.checked, "is it true")
        check = event.target.checked
        this.setState({ check: check });
        value = observation.code.coding[0].display + ": " + observation.valueQuantity.value + " " + observation.valueQuantity.unit

        // this.state.observationList.map((observation)=>{
        //     value = observation.valueQuantity.value +observation.valueQuantity.unit
        //     if (content.indexOf(value) == -1) {
        //         content.push(value)
        //     }
        // })
        let content = this.state.content;
        if (check == true) {
            content.push({
                "extension": obs.extension,
                "contentString": value
            })
        }
        else {
            for (var i = 0; i < content.length; i++) {
                console.log(content.hasOwnProperty('value'), 'check')
                if (content[i].hasOwnProperty('contentString') && content[i].contentString == value) {
                    console.log(content[i])
                    content.splice(i, 1)
                }
            }
        }
        console.log(content, 'content')
        this.setState({ content: content })


        // if(obs.hasOwnProperty('value')== false && check == true){
        //     // content.push(value)
        //     obs['value'] = value
        // }
        // else {
        //     var index = content.indexOf(value);
        //     if (obs.hasOwnProperty('value') === true){
        //         // content.splice(index, 1);
        //         delete obs['value']
        //     }
        //     // content.pop(value)
        // }
        // console.log(obs,'new checked observation')
        // this.setState({content:content})
    }


    handleDocumentChange(docs, event) {
        let document = docs.document
        let documentCheck = this.state.documentCheck;
        let value;
        console.log(event.target.checked, "is it true")
        documentCheck = event.target.checked
        this.setState({ documentCheck: documentCheck });
        let content = this.state.documentContent;
        let data = document.content[0].attachment.data

        console.log('doc', docs)
        if (documentCheck == true) {
            content.push({
                "extension": docs.extension,
                "contentAttachment": {
                    "contentType": document.content[0].attachment.contentType,
                    "data": document.content[0].attachment.data,
                    "title": document.content[0].attachment.title
                }
            })
        }
        else {
            for (var i = 0; i < content.length; i++) {
                console.log(content.hasOwnProperty('value'), 'check')
                if (content[i].hasOwnProperty('contentAttachment') && content[i].contentAttachment.data == data) {
                    console.log(content[i])
                    content.splice(i, 1)
                }
            }
        }
        console.log(content, 'content-111111111')
        this.setState({ documentContent: content })

    }
    updateDocuments(elementName, object) {
        this.setState({ [elementName]: object })
    }
    async getSenderDetails(communication_request, token) {
        let sender_obj;
        let senderreference;
        let recipientReference;
        if (communication_request.hasOwnProperty('sender')) {
            senderreference = communication_request.sender.reference
        }
        if (communication_request.hasOwnProperty('recipient')) {
            recipientReference = communication_request.recipient[0].reference
        }
        // communication_request['contained'].map((c) => {
        //     if (c['id'] == communication_request['sender']['reference'].replace('#', '')) {
        //         // console.log("------------sender", c);
        //         sender_obj = c;
        //     }
        // });
        var tempUrl = this.state.fhir_url;
        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);
        // const token = await createToken(sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        let headers = {
            "Content-Type": "application/json",
        }
        // if (config.payerB.authorized_fhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        const fhirResponse = await fetch(tempUrl + "/" + senderreference, {
            method: "GET",
            headers: headers
        }).then(response => {
            console.log("Recieved response", response);
            return response.json();
        }).then((response) => {
            console.log("----------response", response);
            return response;
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        // return fhirResponse;
        console.log(fhirResponse, 'respo')
        if (fhirResponse) {
            this.setState({ senderOrganization: fhirResponse })
            this.setState({ sender_name: fhirResponse.name });
            // this.setState({ requester_org: fhirResponse['resourceType'] });
            // const sender_res = await this.getSenderResource(sender_obj);
            // if (sender_res['resourceType'] == 'Patient' || sender_res['resourceType'] == 'Practitioner') {
            //     if (sender_res.hasOwnProperty("name")) {
            //         var sender_name = '';
            //         if (sender_res['name'][0].hasOwnProperty('given')) {
            //             sender_res['name'][0]['given'].map((n) => {
            //                 sender_name += ' ' + n;
            //             });
            //             this.setState({ sender_name: sender_name });
            //         }
            //     }
            // }
            // else 
            // if (sender_obj['resourceType'] === 'Organization') {
            //     if (sender_obj.hasOwnProperty("identifier")) {
            //         let sender = sender_obj['identifier'][0]['value'];
            //         this.setState({ sender_name:  sender});
            //     }
            // }
            // console.log("sender['name']", this.state.sender_name);
        }
        const recipientResponse = await fetch(tempUrl + "/" + recipientReference, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                // 'Authorization': 'Bearer ' + token
            }
        }).then(response => {
            console.log("Recieved response", response);
            return response.json();
        }).then((response) => {
            console.log("----------response", response);
            return response;
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        // return fhirResponse;
        console.log(recipientResponse, 'rest')
        if (recipientResponse) {
            if (recipientResponse.hasOwnProperty('endpoint')) {
                const endpoint = await fetch(tempUrl + "/" + recipientResponse.endpoint[0].reference, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"

                        // 'Authorization': 'Bearer ' + token
                    }
                }).then(response => {
                    console.log("Recieved response", response);
                    return response.json();
                }).then((response) => {
                    console.log("----------response", response);
                    this.setState({ endpoint: response })
                    return response;
                }).catch(reason =>
                    console.log("No response recieved from the server", reason)
                );
            }

            this.setState({ requesterOrganization: recipientResponse })
        }


    }

    async getSenderResource(c) {
        var sender_url = this.state.fhir_url + "/" + c['resourceType'] + "?identifier=" + c['identifier'][0]['value'];
        console.log("url---------", sender_url);
        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);
        let headers = {
            "Content-Type": "application/json",
        }
        // if (this.props.config.provider.authorized_fhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        let sender = await fetch(sender_url, {
            method: "GET",
            headers: headers
        }).then(response => {
            return response.json();
        }).then((response) => {
            console.log("----------response", response);
            if (response.hasOwnProperty('entry')) {
                if (response['entry'][0].hasOwnProperty('resource')) {
                    return response['entry'][0]['resource'];
                }
            }
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        return sender;
    }
    renderList() {
        return (
            <table className="table">
                <thead>
                    <tr>
                        <th>Request Id</th>
                        <th>Requester</th>
                        <th>Patient</th>
                        <th>Received On</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.listLoading &&
                        <tr><td colSpan="4">
                            Loading  <div id="fse" className="spinner visible">
                                <Loader
                                    type="ThreeDots"
                                    color="#333"
                                    height="15"
                                    width="15"
                                />
                            </div>
                        </td>
                        </tr>}
                    {!this.state.listLoading &&
                        this.state.bundleResources.map((collectionBundle, i) => {
                            let commReq = this.getResourceFromBundle(collectionBundle, "CommunicationRequest")
                            let patientResource = this.getResourceFromBundle(collectionBundle, "Patient")
                            let requester_org_id = ""
                            let requester = ""
                            let requester_org = {}
                            if (commReq.hasOwnProperty("requester")) {
                                let requester_org_ref = commReq.requester.reference;
                                requester_org_id = requester_org_ref.split("/")[1]
                                requester_org = this.getResourceFromBundle(collectionBundle, "Organization", requester_org_id)
                            }
                            if (requester_org) {
                                requester = requester_org.name;
                            }
                            var patient_name = '';
                            if (patientResource.hasOwnProperty("name")) {
                                if (patientResource['name'][0].hasOwnProperty('given')) {
                                    patient_name = patientResource['name'][0]['given'][0] + " " + patientResource['name'][0]['family'];
                                }
                            }
                            let patientId = commReq['subject']['reference'];
                            if (commReq !== null) {
                                if (commReq['status'] === 'active') {

                                    return (<tr key={i}>
                                        <td>
                                            {collectionBundle.id}
                                        </td>
                                        <td>
                                            {requester}
                                        </td>
                                        <td>
                                            {patient_name}
                                        </td>
                                        <td>
                                            {dateFormat(collectionBundle.meta.lastUpdated, "mm/dd/yyyy")}
                                        </td>
                                        <td>
                                            <button className="btn list-btn" onClick={() => this.fetchData(patientId, patientResource, collectionBundle, commReq)}>
                                                Review</button>
                                        </td>
                                    </tr>)
                                }
                                if (commReq['status'] === 'completed') {
                                    return (<tr key={i}>
                                        <td>
                                            {collectionBundle.id}
                                        </td>
                                        <td>
                                            {requester}
                                        </td>
                                        <td>
                                            {patient_name}
                                        </td>
                                        <td>
                                            {dateFormat(collectionBundle.meta.lastUpdated, "mm/dd/yyyy")}
                                        </td>
                                        <td>
                                        </td>
                                    </tr>)
                                }
                            }

                        })
                    }
                </tbody>
            </table>
        )
    }
    renderData() {
        const files = this.state.files.map(file => (
            <div className='file-block' key={file.name}>
                <a onClick={() => this.onRemove(file)} className="close-thik" />
                {file.name}
            </div>
        ))
        let requests = this.state.contentStrings.map((request, key) => {
            if (request) {
                return (
                    <div key={key}>
                        {request}
                    </div>
                )
            }
        });
        return (<div>
            <div className="data-label">
                Patient : <span className="data1">{this.state.patient_name}</span>
            </div>
            {this.state.patient.hasOwnProperty('gender') &&
                <div className="data-label">
                    Patient Gender : <span className="data1">{this.state.patient.gender}</span>
                </div>}
            {/* {this.state.ident &&
                                <div className="data-label">
                                    Patient Identifier : <span className="data1">{this.state.ident}</span>
                                </div>} */}
            {this.state.patient.hasOwnProperty('birthDate') &&
                <div className="data-label">
                    Patient Date of Birth : <span className="data1">{this.state.patient.birthDate}</span>
                </div>}
            <div className="data-label">
                Requester Payer : <span className="data1">{this.state.requesterOrganization.name}</span>
            </div>
            {this.state.recievedDate !== '' &&
                <div className="data-label">
                    Recieved Date : <span className="data1">{moment(this.state.recievedDate).format(" YYYY-MM-DD, hh:mm a")}</span>
                </div>
            }
            <div className="data-label">
                Requested for : <span className="data1">{requests}</span>
            </div>
            <div className="data-label" style={{ paddingTop: "0px" }}>
                Select Care Plans to submit :
            </div>
            {this.state.carePlanResources.length > 0 &&
                <div>
                    {this.state.carePlanResources.map((item, key) => {
                        return this.renderCarePlans(item, key);
                    })}
                </div>
            }
            {this.state.carePlanResources !== '' &&
                <div className="data-label form-row" >
                    <div className="form-group col-2" >
                        <button className="btn list-btn" style={{ float: "left" }} onClick={this.showBundlePreview}>
                            Preview</button>
                    </div>
                    {this.state.show &&
                        <div className="form-group col-10"><pre>{JSON.stringify(this.state.bundle, null, 2)}</pre></div>
                    }
                </div>

            }
            <div className="header">
                Upload Required/Additional Documentation
                            </div>
            <div className="drop-box">
                <section>
                    <Dropzone
                        onDrop={this.onDrop.bind(this)}
                        onFileDialogCancel={this.onCancel.bind(this)
                        }
                    >
                        {({ getRootProps, getInputProps }) => (
                            <div    >
                                <div className='drag-drop-box' {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <div className="file-upload-icon"><FontAwesomeIcon icon={faCloudUploadAlt} /></div>
                                    <div>Drop files here, or click to select files </div>
                                </div>
                            </div>
                        )}
                    </Dropzone>
                </section>
                <div  >{files}</div>
            </div>
            {this.state.error &&
                <div className="decision-card alert-error">
                    {this.state.errorMsg}
                </div>
            }
            {this.state.success &&
                <div className="decision-card alert-success">
                    {this.state.successMsg}
                </div>
            }
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

                <NotificationContainer />
            </div>
        </div>)
    }
    render() {
        return (
            <React.Fragment>
                <div>
                    <Header payer={this.state.currentPayer.payer_name} />
                    <main id="main" style={{ marginTop: "92px", paddingBottom: "100px" }}>
                        <div className="section-header">
                            <h3>Transfer Coverage Decision Documents</h3>
                        </div>
                        <div className="form">
                            <div className="left-form" style={{ padding: "2%" }}>
                                {this.renderList()}
                            </div>
                            {this.state.reviewError &&
                                <div>
                                    <h3>{this.state.reviewErrorMsg}</h3>
                                </div>
                            }
                            {this.state.form_load && !this.state.reviewError &&
                                <div className="right-form" style={{ padding: "2%" }} >
                                    {this.renderData()}
                                </div>}
                        </div>
                    </main>
                </div>
            </React.Fragment >
        );
    }
}

function mapStateToProps(state) {
    return {
        config: state.config,
    };
};

export default withRouter(connect(mapStateToProps)(Task));
