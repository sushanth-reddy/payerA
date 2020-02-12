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
            senderOrganization: '',
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
            activeClaims: [],
            supportingClaims: [],
            activeClaimResponses: [],
            activeCoverageIds: [],
            claimResources: [],
            supportingClaimResponses: [],
            docBundle: [],
            referenceArray: [],
            referenceStrings: [],
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
            compositionJSON: {
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
                "date": currentDateTime,
                "author": [],
                "title": "Payer Coverage Transition Document",
                "event": [],
                "section": []
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
            collectionBundle: '',
            currentPayerIdentifier: '',
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
        this.setState({ currentPayerIdentifier: payer.payer_identifier })
        this.getOrganization(payer.payer_identifier)
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
            console.log("search:",searchParams,response)
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
        this.setState({ patient: {} });
        this.setState({ requesterOrganization: {} });
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
        this.setState({ selectedPlans: [] })
        this.setState({ contentStrings: [] })
        this.setState({ carePlanResources: '' })
        this.setState({ recievedDate: '' })
        this.setState({ claimResources: [] })
        this.setState({ activeClaimResponses: [] })
        this.setState({ activeClaims: [] })
        this.setState({ supportingClaims: [] })
        this.setState({ supportingClaimResponses: [] })
        this.setState({ activeCoverageIds: [] })

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
        // if (!communication_request.hasOwnProperty('sender')) {
        //     this.setState({ "reviewError": true })
        //     this.setState({ "reviewErrorMsg": "Request doesn't have Sender Organization's ID mentioned" })
        //     return false;
        // }
        if (!communication_request.hasOwnProperty('recipient')) {
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
        // else if (communication_request.hasOwnProperty('sender')) {
        //     if (communication_request.sender.hasOwnProperty('reference')) {
        //         let senderId = communication_request.sender.reference.split('/')[1]
        //         let sender_org = this.getResourceFromBundle(collectionBundle, "Organization", senderId)
        //         if (!sender_org.hasOwnProperty('endpoint')) {
        //             this.setState({ "reviewError": true })
        //             this.setState({ "reviewErrorMsg": " Sender organization doesn't have Endpoint Mentioned" })
        //             return false
        //         }
        //         else {
        //             let endpoint = sender_org.endpoint
        //             let endpointId = endpoint[0].reference.split('/')[1]
        //             let endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpointId)
        //             if (!endpoint_resource.hasOwnProperty('address')) {
        //                 this.setState({ "reviewError": true })
        //                 this.setState({ "reviewErrorMsg": "Sender organization's endpoint doesn't have address which is required" })
        //                 return false
        //             }


        //         }

        //     }


        // }
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

    async getReferences(resources, resourceType) {
        let referenceArray = this.state.referenceArray
        let referenceStrings = this.state.referenceStrings
        // console.log(object, 'objjj')
        if (resourceType === 'Claim') {
            console.log("In get references Claim")
            await Promise.all(resources.map(async(object) => {
                if (object.hasOwnProperty('enterer')) {
                    if (object.enterer.hasOwnProperty('reference')) {

                        if (referenceStrings.indexOf(object.enterer.reference) === -1) {
                            referenceStrings.push(object.enterer.reference)
                            this.setState({ referenceStrings })
                            let enterer = await this.getResources(object.enterer.reference).then((enterer) => {
                                referenceArray.push({ resource: enterer })
                                this.setState({ referenceArray })
                            })
                        }
                    }

                }
                if (object.hasOwnProperty('provider')) {
                    if (object.provider.hasOwnProperty('reference')) {

                        if (referenceStrings.indexOf(object.provider.reference) === -1) {
                            referenceStrings.push(object.provider.reference)
                            let provider = await this.getResources(object.provider.reference).then((provider) => {
                                referenceArray.push({ resource: provider })
                                this.setState({ referenceArray })

                            })
                        }
                    }
                }
                if (object.hasOwnProperty('insurer')) {
                    if (object.insurer.hasOwnProperty('reference')) {
                        if (referenceStrings.indexOf(object.insurer.reference) === -1) {
                            referenceStrings.push(object.insurer.reference)
                            let insurer = await this.getResources(object.insurer.reference).then((insurer) => {
                                referenceArray.push({ resource: insurer })
                                this.setState({ referenceArray })

                            })
                        }
                    }
                }
                if (object.hasOwnProperty('procedure')) {
                    console.log("Procedure:::")
                    await Promise.all(object.procedure.map(async(p) => {

                        console.log("Procedure--",p)
                        if (p.hasOwnProperty('procedureReference')) {
                            if (p.procedureReference.hasOwnProperty('reference')) {
                                if (referenceStrings.indexOf(p.procedureReference.reference) === -1) {
                                    referenceStrings.push(p.procedureReference.reference)
                                    await this.getResources(p.procedureReference.reference).then(async(procedure) => {
                                        console.log("ProcedureOBJ",procedure)
                                        referenceArray.push({ resource: procedure })
                                        this.setState({ referenceArray })
                                        if(procedure.hasOwnProperty("reasonReference")){
                                            if(procedure.reasonReference.length >=1){
                                                if(procedure.reasonReference[0].hasOwnProperty("reference")){
                                                    await Promise.all(procedure.reasonReference.map(async(reasonReferenceObj)=>{
                                                        if(reasonReferenceObj.hasOwnProperty("reference")){
                                                            var reasonReference = reasonReferenceObj.reference
                                                            referenceStrings.push(reasonReference)
                                                            console.log("653 reasonReference:",reasonReference)
                                                            let condition = await this.getResources(reasonReference).then((condition) => {
                                                                console.log("655 Condition:",condition)
                                                                referenceArray.push({ resource: condition })

                                                            })
                                                        }
                                                    }))
                                                }
                                            }
                                        }


                                    })
                                }
                            }
                        }


                    }))
            
                }

                if(object.hasOwnProperty("item")){
                    console.log("ITEM:",object.item)
                    await Promise.all(object.item.map(async(item) => {
                        if (item.hasOwnProperty('encounter')) {
                            console.log("Enc::",item.encounter)
                            await Promise.all(item.encounter.map(async(encounter_item)=>{
                                if(encounter_item.hasOwnProperty("reference")){
                                    var reference = encounter_item.reference
                                    if (referenceStrings.indexOf(reference) === -1) {
                                        referenceStrings.push(reference)
                                        await this.getResources(reference).then(async(encounter) => {
                                            console.log("Enc response",encounter)
                                            // this.getReferences(encounter, 'Encounter').then((arr) => {
                                            //     // referenceArray.concat(arr)
                                            //     // this.setState({referenceArray})
                                            // })
                                            if (encounter.hasOwnProperty('participant')) {
                                                await Promise.all(encounter.participant.map(async(participantObj)=>{
                                                    if (participantObj.hasOwnProperty('individual')) {
                                                        if (referenceStrings.indexOf(participantObj.individual.reference) === -1) {
                                                            referenceStrings.push(participantObj.individual.reference)
                                                            await this.getResources(participantObj.individual.reference).then((practitioner) => {
                                                                referenceArray.push({ resource: practitioner })
                                                                this.setState({ referenceArray })

                                                            });
                                                        }
                                                    }
                                                }))
                                               
                                            }
                                            if(encounter.hasOwnProperty('serviceProvider')){
                                                if(encounter.serviceProvider.hasOwnProperty("reference")){
                                                    var serviceProviderRef = encounter.serviceProvider.reference
                                                    referenceStrings.push(serviceProviderRef)
                                                    await this.getResources(serviceProviderRef).then(async(organization) => {
                                                            referenceArray.push({ resource: organization })
                                                            this.setState({ referenceArray })
                                                            if(organization.hasOwnProperty("endpoint")){
                                                                if(organization.endpoint.length > 0){
                                                                    if(organization.endpoint[0].hasOwnProperty("reference")){
                                                                        var endPointRef = organization.endpoint[0].reference
                                                                        referenceStrings.push(endPointRef)
                                                                        await this.getResources(endPointRef).then((endpoint) => {
                                                                            referenceArray.push({ resource: endpoint })
                                                                            this.setState({ referenceArray })

                                                                        });
                                                                    }
                                                                }
                                                            }

                                                        });

                                                }
                                                
                                            }
                                            referenceArray.push({ resource: encounter })
                                            this.setState({ referenceArray })

                                        })
                                    }
                                }
                            }))
                        }
                    }))
                }
                if (object.hasOwnProperty('encounter')) {
                    if (object.encounter.hasOwnProperty('reference')) {

                        if (referenceStrings.indexOf(object.encounter.reference) === -1) {
                            referenceStrings.push(object.encounter.reference)
                            this.getResources(object.encounter.reference).then((encounter) => {
                                this.getReferences(encounter, 'Encounter').then((arr) => {
                                    // referenceArray.concat(arr)
                                    // this.setState({referenceArray})
                                })
                                referenceArray.push({ resource: encounter })
                                this.setState({ referenceArray })

                            })
                        }
                    }

                }
                if (object.hasOwnProperty('insurance')) {
                    Promise.all(object.insurance.map(async(ins) => {
                        if (ins.hasOwnProperty('coverage')) {
                            if (ins.coverage.hasOwnProperty('reference')) {
                                if (referenceStrings.indexOf(ins.coverage.reference) === -1) {
                                    referenceStrings.push(ins.coverage.reference)
                                    let coverage =await this.getResources(ins.coverage.reference).then((coverage) => {
                                        referenceArray.push({ resource: coverage })
                                        this.setState({ referenceArray })

                                    })
                                }
                            }

                        }
                    }))

                }
                if (object.hasOwnProperty('prescription')) {
                    if (object.prescription.hasOwnProperty('extension')) {
                        await Promise.all(object.prescription.extension.map(async(ext) => {
                            if (ext.hasOwnProperty('valueReference')) {
                                if (ext.valueReference.hasOwnProperty('reference')) {
                                    if (referenceStrings.indexOf(ext.valueReference.reference) === -1) {
                                        referenceStrings.push(ext.valueReference.reference)
                                        let coverage = await this.getResources(ext.valueReference.reference).then((serviceRequest) => {

                                            if (serviceRequest.hasOwnProperty('performer')) {
                                                serviceRequest.performer.map(async(p) => {
                                                    if (p.hasOwnProperty('reference')) {
                                                        if (referenceStrings.indexOf(p.reference) === -1) {
                                                            referenceStrings.push(p.reference)
                                                            let practitionerRole = await this.getResources(p.reference).then(async(practitionerRole) => {
                                                                if (practitionerRole.hasOwnProperty('practitioner')) {
                                                                    if (practitionerRole.practitioner.hasOwnProperty('reference')) {
                                                                        if (referenceStrings.indexOf(practitionerRole.practitioner.reference) === -1) {
                                                                            referenceStrings.push(practitionerRole.practitioner.reference)
                                                                            console.log("739 PractitionerRef:",practitionerRole.practitioner.reference)
                                                                            let practitioner = await this.getResources(practitionerRole.practitioner.reference).then((practitioner) => {
                                                                                console.log("740 Practitioner:",practitioner)
                                                                                referenceArray.push({ resource: practitioner })
                                                                            })
                                                                        }
                                                                    }
                                                                }
                                                                referenceArray.push({ resource: practitionerRole })
                                                                this.setState({ referenceArray })

                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                            referenceArray.push({ resource: serviceRequest })
                                            this.setState({ referenceArray })

                                        })
                                    }
                                }
                            }
                        }))
                    }


                }
            }))

        }
        else if (resourceType === "CarePlan") {
            await Promise.all(resources.map(async(object) => {
                if (object.hasOwnProperty('encounter')) {
                    if (referenceStrings.indexOf(object.encounter.reference) === -1) {
                        referenceStrings.push(object.encounter.reference)
                        await this.getResources(object.encounter.reference).then(async(encounter) => {
                            if (encounter.hasOwnProperty('participant')) {
                                await Promise.all(encounter.participant.map(async(participantObj)=>{
                                    if (participantObj.hasOwnProperty('individual')) {
                                        if (referenceStrings.indexOf(participantObj.individual.reference) === -1) {
                                            referenceStrings.push(participantObj.individual.reference)
                                            await this.getResources(participantObj.individual.reference).then((practitioner) => {
                                                referenceArray.push({ resource: practitioner })
                                                this.setState({ referenceArray })

                                            });
                                        }
                                    }
                                }))
                            }
                            referenceArray.push({ resource: encounter })
                            this.setState({ referenceArray })

                        })
                    }

                }
                if (object.hasOwnProperty('careTeam')) {
                    if (referenceStrings.indexOf(object.careTeam[0].reference) === -1) {
                        referenceStrings.push(object.careTeam[0].reference)
                        let careTeam = await this.getResources(object.careTeam[0].reference).then((careTeam) => {
                            referenceArray.push({ resource: careTeam })
                            this.setState({ referenceArray })

                        })

                    }
                }
                if (object.hasOwnProperty('addresses')) {
                    await Promise.all(object.addresses.map(async (address) => {
                        if (address.hasOwnProperty('reference')) {
                            if (referenceStrings.indexOf(address.reference) === -1) {
                                referenceStrings.push(address.reference)
                                await this.getResources(address.reference).then(async(condition) => {
                                    await this.getReferences(condition, 'Condition')
                                    referenceArray.push({ resource: condition })
                                    this.setState({ referenceArray })
                                })
                            }
                        }

                    }))
                }
            }))

        }
        else if (resourceType === 'Coverage') {
            if (resources.hasOwnProperty('payor')) {
                 await Promise.all(resources.payor.map(async(p) => {
                    if (p.hasOwnProperty('reference')) {
                        console.log("Payor Reference",p.reference,referenceStrings)
                        if (referenceStrings.indexOf(p.reference) === -1) {
                            referenceStrings.push(p.reference)
                            await this.getResources(p.reference).then(async(response) => {
                                referenceArray.push({ resource: response })
                                if (response.hasOwnProperty('evidence')) {
                                    response.evidence.map((e) => {
                                        if (e.hasOwnProperty('detail')) {
                                            e.detail.map(async(d) => {
                                                if (d.hasOwnProperty('reference')) {
                                                    if (referenceStrings.indexOf(d.reference) === -1) {
                                                        referenceStrings.push(d.reference)
                                                        await this.getResources(d.reference).then((documentReference) => {
                                                            referenceArray.push({ resource: documentReference })
                                                            this.setState({ referenceArray })
                                                        })

                                                    }
                                                }
                                            })
                                        }
                                    })
                                }
                                this.setState({ referenceArray })

                            })
                        }
                    }

                }))
            }

        }
        else if (resourceType === 'Encounter') {
            if (resources.hasOwnProperty('participant')) {
                if (resources.participant[0].hasOwnProperty('individual')) {
                    await this.getResources(resources.participant[0].individual.reference).then((practitioner) => {
                        referenceArray.push({ resource: practitioner })
                        this.setState({ referenceArray })
                    });
                }
            }
        }
        else if (resourceType === 'Condition') {
            if (resources.hasOwnProperty('evidence')) {
                 await Promise.all(resources.evidence.map((e) => {
                    if (e.hasOwnProperty('detail')) {
                        e.detail.map((d) => {
                            if (d.hasOwnProperty('reference')) {
                                if (referenceStrings.indexOf(d.reference) === -1) {
                                    referenceStrings.push(d.reference)
                                    this.getResources(d.reference).then((response) => {
                                        referenceArray.push({ resource: response })
                                        this.setState({ referenceArray })

                                    })
                                }
                            }
                        })
                    }
                }))
            }

        }
        else if(resourceType ==="PractitionerRole"){
            console.log("practitionerRole::",resources)
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
                    // let carePlanResources = response.entry;
                    this.setState({ carePlanResources: response.entry })
                }

            })
        this.getResources('Claim?status=active&patient=' + this.state.patient.id).then((response) => {
            if (response.hasOwnProperty('entry')) {
                // let claimResources = response.entry;
                this.setState({ claimResources: response.entry })
            }
        })
    }

    // async getDetails(communication_request, collectionBundle) {
    //     var date = new Date()
    //     var currentDateTime = date.toISOString()
    //     let Bundle = this.state.bundle
    //     let compositionJson = {
    //         "resourceType": "Composition",
    //         "id": 'composition-json',
    //         "status": "final",
    //         "type": {
    //             "coding": [
    //                 {
    //                     "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEDocumentCode",
    //                     "code": "pcde"
    //                 }
    //             ]
    //         },
    //         "subject": {
    //             "reference": "Patient/" + this.state.patient.id
    //         },
    //         "date": currentDateTime,
    //         "author": [],
    //         "title": "Example PCDE Document for Diabetes patient",
    //         "event": [],
    //         "section": []
    //     }


    //     var arr = []
    //     let conditionResource = ''
    //     var claims = ''
    //     let claim = ''
    //     let claimResponse = ''
    //     await this.getResources('CarePlan?status=active&subject=' + this.state.patient.id)
    //         .then((response) => {
    //             if (response.hasOwnProperty('entry')) {
    //                 let carePlanResources = response.entry;
    //                 this.setState({ carePlanResources: response.entry })
    //                 if (carePlanResources !== '') {
    //                     carePlanResources.map(async (c, key) => {
    //                         console.log(c, 'care paln resource')
    //                         if (c.resource.hasOwnProperty('activity')) {
    //                             c.resource.activity.map((act) => {
    //                                 if (act.hasOwnProperty('detial')) {
    //                                     if (act.detail.hasOwnProperty('reasonReference')) {
    //                                         if (act.detail.reasonReference.reference.indexOf('Condition') > -1) {
    //                                             arr.push(act.detail.reasonReference.reference)
    //                                         }
    //                                     }
    //                                 }
    //                             })
    //                         }
    //                         if (c.resource.hasOwnProperty('addresses')) {
    //                             c.resource.addresses.map((address => {
    //                                 arr.push(address.reference)
    //                             }))
    //                         }
    //                         let ref = await this.getReferences(c.resource, 'CarePlan')
    //                         ref.map((r) => {
    //                             Bundle.entry.push(r)
    //                         })
    //                         conditionResource = await this.getResources(arr[0])

    //                         claims = await this.getResources('Claim?patient=' + this.state.patient.id)
    //                         if (claims.hasOwnProperty('entry')) {
    //                             claims.entry.map((c) => {
    //                                 if (c.resource.hasOwnProperty('diagnosis')) {
    //                                     if (c.resource.diagnosis[0].hasOwnProperty("diagnosisReference")) {
    //                                         if (c.resource.diagnosis[0].diagnosisReference.reference === arr[0]) {
    //                                             claim = c.resource
    //                                         }
    //                                     }
    //                                 }
    //                             })
    //                         }
    //                         if (claim !== '') {
    //                             let cr = await this.getResources('ClaimResponse?request=' + claim.id)
    //                             if (cr.hasOwnProperty('entry')) {
    //                                 claimResponse = cr.entry[0].resource
    //                             }
    //                             let ref = await this.getReferences(claim, 'Claim')
    //                             ref.map((r) => {
    //                                 Bundle.entry.push(r)
    //                             })
    //                         }
    //                         Bundle.entry.push({ resource: this.state.patient })
    //                         if (this.state.patient.hasOwnProperty('generalPractitioner')) {
    //                             this.getResources(this.state.patient.generalPractitioner[0].reference).then((prac) => {
    //                                 Bundle.entry.push({ resource: prac })
    //                             })
    //                         }
    //                         console.log('1234', conditionResource, claim, claimResponse, 'conditionsArray')
    //                         compositionJson.section.push(
    //                             {
    //                                 "code": {
    //                                     "coding": [
    //                                         {
    //                                             "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
    //                                             "code": "activeTreatment"
    //                                         }
    //                                     ]
    //                                 },
    //                                 "section": [
    //                                     {
    //                                         "code": {
    //                                             "coding": [
    //                                                 {
    //                                                     "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
    //                                                     "code": "treatment"
    //                                                 }
    //                                             ]
    //                                         },
    //                                         "entry": [
    //                                             {
    //                                                 "reference": "CarePlan/" + c.resource.id
    //                                             }
    //                                         ]
    //                                     },

    //                                 ]
    //                             }
    //                         )
    //                         if (claim !== '' && claimResponse !== '') {
    //                             compositionJson.section[key].section.push(
    //                                 {
    //                                     "code": {
    //                                         "coding": [
    //                                             {
    //                                                 "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
    //                                                 "code": "priorCoverage"
    //                                             }
    //                                         ]
    //                                     },
    //                                     "entry": [
    //                                         {
    //                                             "reference": "Claim/" + claim.id
    //                                         },
    //                                         {
    //                                             "reference": "ClaimResponse/" + claimResponse.id
    //                                         }
    //                                     ]
    //                                 }
    //                             )
    //                         }
    //                         Bundle.entry.push({ resource: c.resource })
    //                         Bundle.entry.push({ resource: conditionResource })
    //                         Bundle.entry.push({ resource: claim })
    //                         Bundle.entry.push({ resource: claimResponse })
    //                         Bundle.entry.push({ resource: this.state.endpoint })
    //                     })


    //                     this.setState({ compositionJson: compositionJson })
    //                     Bundle.entry.push({ resource: compositionJson })
    //                     let sender_org_id = ""
    //                     let sender_org = ''
    //                     if (communication_request.hasOwnProperty("sender")) {
    //                         let sender_org_ref = communication_request.sender.reference;
    //                         sender_org_id = sender_org_ref.split("/")[1]
    //                         sender_org = this.getResourceFromBundle(collectionBundle, "Organization", sender_org_id)
    //                         console.log("Sender Org---", sender_org);
    //                         this.setState({ senderOrganization: sender_org });
    //                     }
    //                     if (sender_org_id !== "") {
    //                         compositionJson.author.push({ "reference": "Organization/" + sender_org_id })
    //                     }
    //                     if (sender_org!=='') {
    //                         Bundle.entry.push({ "resource": sender_org });
    //                         let endpoint = ""
    //                         let endpoint_id = ""
    //                         let endpoint_resource = {}
    //                         this.setState({ "sender_name": sender_org.name });
    //                         if (sender_org.hasOwnProperty("endpoint")) {
    //                             endpoint = sender_org.endpoint
    //                             endpoint_id = endpoint[0].reference.split("/")[1]
    //                             console.log("Endpoint id---", sender_org.endpoint);
    //                             endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpoint_id)
    //                             if (endpoint_resource) {
    //                                 console.log("Endpoint---", endpoint_resource);
    //                                 Bundle.entry.push({ "resource": endpoint_resource });
    //                             }
    //                         }
    //                     }

    //                     let requester_org_id = ""
    //                     let requester_org = {}
    //                     if (communication_request.hasOwnProperty("requester")) {
    //                         let requester_org_ref = communication_request.requester.reference;
    //                         requester_org_id = requester_org_ref.split("/")[1]
    //                         requester_org = this.getResourceFromBundle(collectionBundle, "Organization", requester_org_id)
    //                         console.log("Requester Org---", requester_org);
    //                         this.setState({ "requesterOrganization": requester_org });
    //                     }
    //                     if (requester_org) {
    //                         console.log("Inside if requestor---")
    //                         let endpoint = ""
    //                         let endpoint_id = ""
    //                         let endpoint_resource = {}
    //                         this.setState({ "sender_name": requester_org.name });
    //                         if (requester_org.hasOwnProperty("endpoint")) {
    //                             endpoint = requester_org.endpoint
    //                             endpoint_id = endpoint[0].reference.split("/")[1]
    //                             console.log("Endpoint id---", requester_org.endpoint);
    //                             endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpoint_id)
    //                             if (endpoint_resource) {
    //                                 console.log("Endpoint---", endpoint_resource);
    //                                 Bundle.entry.push({ "resource": endpoint_resource });
    //                                 this.setState({ "endpoint": endpoint_resource });
    //                             }
    //                         } else {
    //                             this.setState({ "reviewError": true })
    //                             this.setState({ "reviewErrorMsg": "There is no endpoint defined in requester!!" })
    //                         }

    //                         Bundle.entry.push({ "resource": requester_org });

    //                     }

    //                     console.log(compositionJson, 'compositionJSON', Bundle)
    //                     this.setState({ bundle: Bundle })
    //                 }
    //                 else {

    //                 }
    //             }
    //         })
    // }


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
                <input type="checkbox" className="form-check-input" name={resource.id} id={key} checked={this.state.selectedPlans.find((plan) => plan.id === resource.id)}
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
                // console.log('selected careplans are', this.state.checkCarePlan, this.state.selectedPlans)
                this.submit_info();
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
        console.log("Uniquer Array In",arr.length)
        let new_array = []
        let ids = []
        for (var i = 0; i < arr.length; i++) {
            console.log("IDSs",arr[i].id,ids)
            if (ids.indexOf(arr[i].id) == -1) {
                ids.push(arr[i].id)
                // new_array.push({ 'resource': arr[i].resource })
                new_array.push(arr[i])
            }
        }

        return new_array;
    }
     getUniqueResources(arr) {
        console.log("Uniquer Array In",arr.length)
        let new_array = []
        let ids = []
        for (var i = 0; i < arr.length; i++) {
            var id = arr[i].resource.id
            console.log("IDSs",id,ids)
            if (ids.indexOf(id) == -1) {
                ids.push(id)
                // new_array.push({ 'resource': arr[i].resource })
                new_array.push(arr[i])
            }
        }

        return new_array;
    }

    getOrganization(identifier) {
        this.getResources('Organization?identifier=' + identifier).then((bundle) => {
            if (bundle.hasOwnProperty('entry')) {
                let senderOrganization = bundle.entry[0].resource
                this.setState({ senderOrganization })
            }
        })

    }
    getUniqueReferences(arr) {
        let new_array = []
        let ids = []
        for (var i = 0; i < arr.length; i++) {
            if (ids.indexOf(arr[i]) == -1) {
                ids.push(arr[i])
                new_array.push(arr[i])
            }
        }
        return new_array;
    }
    getCarePlanInfo(carePlan, claimResources) {
        let compositionJSON
        let arr = []
        let Bundle = []
        let claimResponse = ''
        let communication_request = this.state.communicationRequest
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
                if (index === -1) {
                    arr.push(address.reference)
                }

            }))
        }
        // this.getReferences(carePlan, 'CarePlan').then((ref)=>{
        //     ref.map((r) => {
        //         Bundle.push(r)
        //     })
        // })
        console.log(arr, 'conditions')
        let referenceArray = this.getUniqueReferences(arr)
        console.log('unique conditions', referenceArray)
        let activeClaims = this.state.activeClaims
        let activeCoverageIds = this.state.activeCoverageIds
        let supportingClaims = this.state.supportingClaims
        claimResources.map((claim) => {
            console.log('cccccc', claim)
            if (claim.resource.hasOwnProperty('diagnosis')) {
                if (claim.resource.diagnosis[0].hasOwnProperty("diagnosisReference")) {
                    if (referenceArray.indexOf(claim.resource.diagnosis[0].diagnosisReference.reference) >= 0) {
                        if (claim.resource.hasOwnProperty('insurance')) {
                            claim.resource.insurance.map((ins) => {
                                if (ins.hasOwnProperty('coverage')) {
                                    if (ins.coverage.hasOwnProperty('reference')) {
                                        activeCoverageIds.push(ins.coverage.reference)
                                    }
                                }
                            })
                        }
                        console.log(claim.resource, 'active')
                        activeClaims.push(claim.resource)

                    }
                    else {
                        console.log('supporting', claim.resource)
                        supportingClaims.push(claim.resource)
                    }
                }
            }
        })


        this.setState({ activeClaims })
        this.setState({ supportingClaims })
        this.setState({ activeCoverageIds })
        // console.log("here",activeClaims,activeCoverageIds)
        // activeClaims.map((claim)=>{

        // })


        // if (claim.length>0) {

        //     let cr = this.getResources('ClaimResponse?request=' + claim.id).then((cr)=>{
        //         if (cr.hasOwnProperty('entry')) {
        //             claimResponse = cr.entry[0].resource
        //         }
        //     })

        //     this.getReferences(claim, 'Claim').then((ref)=>{
        //         ref.map((r) => {
        //             Bundle.entry.push(r)
        //         })
        //     })

        // }
        // Bundle.entry.push({ resource: this.state.patient })
        // if (this.state.patient.hasOwnProperty('generalPractitioner')) {
        //     this.getResources(this.state.patient.generalPractitioner[0].reference).then((prac) => {
        //         Bundle.entry.push({ resource: prac })
        //     })
        // }
        // console.log('1234', claim, claimResponse, 'conditionsArray')
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

    async getClaimResponse(claim, type) {
        let activeClaimResponses = this.state.activeClaimResponses
        let supportingClaimResponses = this.state.supportingClaimResponses
        if (claim.hasOwnProperty('id')) {
            let cr = this.getResources('ClaimResponse?request=' + claim.id).then((claimResponse) => {
                if (claimResponse.hasOwnProperty('entry')) {
                    if (type === 'active') {
                        activeClaimResponses.push(claimResponse.entry[0].resource)
                        this.setState({ activeClaimResponses })
                    }
                    else {
                        supportingClaimResponses.push(claimResponse.entry[0].resource)
                        this.setState({ supportingClaimResponses })
                    }
                }
            })
        }
    }

    buildCompositionJSON(compositionJSON, coverageIds, carePlanResources, activeClaims, activeClaimResponses, supportingClaims, supportingClaimResponses) {
        let currentPayerIdentifier = this.state.currentPayerIdentifier
        if (this.state.senderOrganization !== '') {
            compositionJSON.author.push({
                "reference": "Organization/" + this.state.senderOrganization.id,
                "_reference": {
                    "fhir_comments": [
                        "Authored by the old payer."
                    ]
                }
            })
        }
        // let author = this.getResources('Organization?identifier=' + currentPayerIdentifier).then((bundle) => {
        //     if (bundle.hasOwnProperty('entry')) {
        //         if (bundle.entry[0].hasOwnProperty('resource')) {
        //             compositionJSON.author.push({
        //                 "reference": "Organization/" + bundle.entry[0].resource.id,
        //                 "_reference": {
        //                     "fhir_comments": [
        //                         "Authored by the old payer."
        //                     ]
        //                 }
        //             })
        //         }
        //     }
        // })
        if (this.state.patient !== null) {
            compositionJSON.subject = {
                "reference": "Patient/" + this.state.patient.id
            }
        }
        // filling out Treatment section
        console.log("carePlanResources",carePlanResources)
        if (carePlanResources.length > 0) {
            let carePlanIds = []
            carePlanResources.map((careplan) => {
                if (careplan.hasOwnProperty("id")) {
                    carePlanIds.push({ 'reference': "CarePlan/" + careplan.id })
                }
            })
            compositionJSON.section.push(
                {
                    "code": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                                "code": "activeTreatment"
                            }
                        ]
                    },
                    "section": [
                        {
                            "code": {
                                "coding": [
                                    {
                                        "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                                        "code": "treatment"
                                    }
                                ]
                            },
                            "entry": carePlanIds
                        },

                    ]
                }
            )
        }
        //filling out Prior Coverage Section
        if (activeClaims.length > 0 || activeClaimResponses.length > 0) {
            let coverageReference = []
            if (coverageIds.length > 0) {
                coverageIds.map((coverageId) => {
                    coverageReference.push({ "reference": coverageId })
                    compositionJSON.event.push({
                        "detail": [
                            {
                                "reference": coverageId,
                                "_reference": {
                                    "fhir_comments": [
                                        "Event driven by patient transitioning coverage plans between old and new payer."
                                    ]
                                }
                            }
                        ]
                    })
                })
            }
            let entry = []
            let claimReference = this.getReferenceIds('Claim', activeClaims)
            let claimResponseReference = this.getReferenceIds('ClaimResponse', activeClaimResponses)
            entry = coverageReference.concat(claimReference, claimResponseReference)
            compositionJSON.section[0].section.push(
                {
                    "code": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                                "code": "priorCoverage"
                            }
                        ]
                    },
                    "entry": entry
                }
            )
        }
        //filling out Supporting Info section
        if (supportingClaims.length > 0 || supportingClaimResponses.length > 0) {
            let entry = []
            let claimReference = this.getReferenceIds('Claim', supportingClaims)
            let claimResponseReference = this.getReferenceIds('ClaimResponse', supportingClaimResponses)
            entry = claimReference.concat(claimResponseReference)
            compositionJSON.section[0].section.push(
                {
                    "code": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                                "code": "supportingInfo"
                            }
                        ]
                    },
                    "entry": entry
                }
            )
        }

        return compositionJSON

    }
    getReferenceIds(resourceType, resources) {
        let referenceArray = []
        resources.map((resource) => {
            referenceArray.push({ "reference": resourceType + '/' + resource.id })
        })
        return referenceArray
    }
    async buildDocumentBundle(coverageIds, compositionJSON, patient, carePlanResources, activeClaims, supportingClaims, ) {
        let bundle = this.state.bundle
        console.log(bundle.entry,'entry')
        bundle.entry.push({ resource: compositionJSON })
        console.log("1719",JSON.stringify(bundle.entry))
        bundle.entry.push({ resource: patient })
        bundle.entry.push({resource:this.state.senderOrganization})
        console.log("1720",JSON.stringify(bundle.entry))
        console.log('eeee', bundle,JSON.stringify(bundle))
        let files_arr = []
                console.log('bundleLenght - 1724',bundle.entry.length)

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
                console.log('bundleLenght - 1744',bundle.entry.length)

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
        console.log('bundleLenght - 1757',bundle.entry.length)

        let coverageResources = await this.getResources('Coverage?_id=' + coverageIds).then((response) => {
            if (response.hasOwnProperty('entry')) {
                response.entry.map((entry) => {
                    bundle.entry.push({ resource: entry.resource })
                    this.setState({ bundle })

                    this.getReferences(entry.resource, 'Coverage').then((ref) => {
                        ref.map((r) => {
                            bundle.entry.push(r)
                            this.setState({ bundle })

                        })
                    })
                })
            }
        })
        console.log('bundleLenght , carePlanResources- 1774',bundle.entry.length,carePlanResources)

        if (carePlanResources.length > 0) {
            this.getReferences(carePlanResources, 'CarePlan').then((ref) => {
                carePlanResources.map((careplan) => {
                    bundle.entry.push({ resource: careplan })
                    this.setState({ bundle })

                })
                ref.map((r) => {
                    bundle.entry.push(r)
                    this.setState({ bundle })

                })
            })
        }
                console.log('bundleLenght - 1788,activeClaims',bundle.entry.length,activeClaims)

        if (activeClaims.length > 0) {
            activeClaims.map((claim) => {
                bundle.entry.push({ resource: claim })
            })
            await this.getReferences(activeClaims, 'Claim').then((ref) => {
                console.log("GETTING CLAIMSSS 1",)
                ref.map((r) => {
                    bundle.entry.push(r)
                    this.setState({ bundle })

                })
            })
        }
        console.log('bundleLenght - 1800,supportingClaims',bundle.entry.length,supportingClaims)
        if (supportingClaims.length > 0) {
            supportingClaims.map((claim) => {
                bundle.entry.push({ resource: claim })
                this.setState({ bundle })
            })
            await this.getReferences(supportingClaims, 'Claim').then((ref) => {
                console.log("GETTING CLAIMSSS 2")
                ref.map((r) => {
                    bundle.entry.push(r)
                    this.setState({ bundle })

                })
            })
        }
        console.log('Returning bundle', bundle,bundle.entry.length,JSON.stringify(bundle))
        return bundle


    }
    async submit_info() {

        let carePlanResources = this.state.selectedPlans
        carePlanResources.map((carePlan, k) => {
            this.getCarePlanInfo(carePlan, this.state.claimResources)
        })
        let activeClaims = this.getUnique(this.state.activeClaims)
        let supportingClaims = this.getUnique(this.state.supportingClaims)
        if (activeClaims.length > 0) {
            activeClaims.map((activeClaim) => {
                this.getClaimResponse(activeClaim)
            })
        }
        // let compositionJSON = this.state.compositionJSON

        let coverageReferences = this.getUniqueReferences(this.state.activeCoverageIds)
        let compositionJSON = this.buildCompositionJSON(this.state.compositionJSON, coverageReferences, carePlanResources, activeClaims, this.state.activeClaimResponses, supportingClaims, this.state.supportingClaimResponses)
        var coverageIds = ''
        coverageReferences.map((ref, key) => {
            if (key !== 0) {
                coverageIds = coverageIds + ',' + ref.split('/')[1]
            }
            else {
                coverageIds = ref.split('/')[1]
            }
        })
        // let bundle = this.state.bundle
        console.log(coverageIds, 'coverage ids ')
        let patient = this.state.patient
        let arr = await this.buildDocumentBundle(coverageIds, compositionJSON, patient, carePlanResources, activeClaims, supportingClaims).then(async (bundle) => {
            console.log(compositionJSON, 'compositionJson')
            console.log("retrieved bundle:",bundle,JSON.stringify(bundle))
            let randomString = this.randomString()
            bundle.entry = this.getUniqueResources(bundle.entry)
            console.log("unique bundle",bundle,JSON.stringify(bundle))

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



                    // "occurrencePeriod": communicationRequest.occurrencePeriod,
                    "authoredOn": authoredOn,


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
            if (communicationRequest.hasOwnProperty('category')) {
                commJson.category = communicationRequest.category
            }
            console.log(this.state.senderOrganization, 'senderOrg')
            let sender_orgId = ''
            if (this.state.senderOrganization !== '') {
                commJson.resource.sender = {
                    "reference": "Organization/" + this.state.senderOrganization.id
                }
            }

            if (communicationRequest.hasOwnProperty('recipient')) {
                commJson.resource.recipient = communicationRequest.recipient
            }
            let collectionBundle = this.state.collectionBundle
            let sender_id = ''
            let requester_id = ''
            let endpoint = ''
            if (this.state.communicationRequest.hasOwnProperty('id')) {
                commJson.resource.basedOn[0].reference = "CommunicationRequest/" + this.state.communicationRequest.id
                collectionBundle.entry.map((entry, k) => {
                    if (entry.resource.resourceType === 'CommunicationRequest') {
                        // entry.resource.id = id
                        if (entry.resource.hasOwnProperty('status')) {
                            entry.resource.status = 'completed'
                        }
                        if (entry.resource.hasOwnProperty('subject')) {
                            entry.resource.subject.reference = "Patient/" + this.state.patient.id
                        }
                        if (entry.resource.hasOwnProperty('sender')) {
                            sender_id = entry.resource.sender.reference.split('/')[1]

                            entry.resource.sender.reference = "Organization/" + this.state.senderOrganization.id
                        }

                        if (entry.resource.hasOwnProperty('requester')) {
                            requester_id = entry.resource.requester.reference.split('/')[1]
                        }
                    }
                    if (entry.resource.resourceType === "Patient") {
                        entry.resource = this.state.patient
                    }
                    if (entry.resource.resourceType === 'Organization' && entry.resource.id === sender_id) {
                        console.log('pwwwwww')
                        entry.resource = this.state.senderOrganization
                    }
                    
                    if (entry.resource.resourceType === 'Organization' && entry.resource.id === requester_id) {
                        if (entry.resource.hasOwnProperty("endpoint")) {
                            let endpoint = entry.resource.endpoint
                            let endpoint_id = endpoint[0].reference.split("/")[1]
                            console.log("Endpoint id---", entry.resource.endpoint);
                            let endpoint_resource = this.getResourceFromBundle(collectionBundle, "Endpoint", endpoint_id)
                            if (endpoint_resource) {
                                console.log("Endpoint---", endpoint_resource);
                                this.setState({ "endpoint": endpoint_resource });
                            }
                        }

                    }
                })
            }
            else {
                let id = this.randomString()
                collectionBundle.entry.map((entry, k) => {
                    if (entry.resource.resourceType === 'CommunicationRequest') {
                        entry.resource.id = id
                        if (entry.resource.hasOwnProperty('status')) {
                            entry.resource.status = 'completed'
                        }
                        if (entry.resource.hasOwnProperty('subject')) {
                            entry.resource.subject.reference = "Patient/" + this.state.patient.id
                        }
                    }
                    if (entry.resource.resourceType === "Patient") {
                        entry.resource = this.state.patient
                    }
                })
                commJson.resource.basedOn[0].reference = "CommunicationRequest/" + id
            }
            // loop to replace sender organization 

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
                this.setState({ errorMsg: "No response recieved from the server" + reason })

            }

            );
            this.setState({ communicationJson: commJson })
        })

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
                                            completed
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
