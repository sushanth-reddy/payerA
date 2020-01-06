import React, { Component } from 'react';
// import ReactJson from 'react-json-view';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Client from 'fhir-kit-client';
import { createToken } from '../components/Authentication';
import { Link } from 'react-router-dom';
import { send } from 'q';
import Loader from 'react-loader-spinner';
import { Input, Checkbox, IconGroup } from 'semantic-ui-react';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import { faCommentDollar } from '@fortawesome/free-solid-svg-icons';
import Moment from 'react-moment';
import moment from "moment";
import Dropzone from 'react-dropzone';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import config from '../globalConfiguration.json';
import { ThemeProvider } from 'styled-components';
import logo from "../Palm_GBA_H.JPG";


var date = new Date()
var currentDateTime = date.toISOString()


const types = {
    error: "errorClass",
    info: "infoClass",
    debug: "debugClass",
    warning: "warningClass"
}
class TASK extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // config: this.props.config,
            config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
            comm_req: [],
            patient: {},
            form_load: false,
            loading: false,
            patient_name: "",
            docs_required: [],
            sender_resource: '',
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
            show: false
        };
        this.goTo = this.goTo.bind(this);
        this.getCommunicationRequests = this.getCommunicationRequests.bind(this);
        this.displayCommunicataionRequests = this.displayCommunicataionRequests.bind(this);
        this.getPatientDetails = this.getPatientDetails.bind(this);
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
        let resources = [];
        let payersList = await this.getPayerList()
        console.log(this.state.config, 'ooo', payersList)
        let payer;
        console.log(this.state.config.payer_id, "currentPayer")

        if (this.state.config.hasOwnProperty('payer_id')) {
            payer = payersList.find(payer => payer.id === parseInt(this.state.config.payer_id));
        }
        this.setState({ fhir_url: payer.payer_end_point })
        this.setState({ requesterIdentifier: payer.payer_identifier })
        this.setState({ payerName: payer.payer_name })
        // sessionStorage.setItem('requesterPayer', JSON.stringify(requesterPayer))

        let resp = await this.getCommunicationRequests('sender.identifier=' + payer.payer_identifier);
        // console.log("resp------", resp);
        if (resp != undefined) {
            if (resp.entry != undefined) {
                Object.keys(resp.entry).forEach((key) => {
                    if (resp.entry[key].resource != undefined) {
                        if (resp.entry[key].resource.hasOwnProperty('payload')) {
                            if (resp.entry[key].resource.payload[0].extension[0].hasOwnProperty('valueCodeableConcept')) {
                                console.log(resp.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code, '----------')
                                if (resp.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code === 'pcde') {
                                    resources.push(resp.entry[key].resource);
                                }
                            }
                        }

                    }
                });
            }
        }
        else {
            console.log('no communications')
        }
        console.log("-------", resources);
        this.setState({ comm_req: resources });
        // this.displayCommunicataionRequests();
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

    async getCommunicationRequests(searchParams) {
        console.log(this.state.fhir_url, 'fhir_url')
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
        const fhirResponse = await fetch(tempUrl + "/CommunicationRequest?" + searchParams + "&_count=100000", {
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

    async displayCommunicataionRequests() {
        let resources = [];
        let resp = await this.getCommunicationRequests();
        // console.log("resp------", resp);
        if (resp != undefined) {
            if (resp.entry != undefined) {
                Object.keys(resp.entry).forEach((key) => {
                    if (resp.entry[key].resource != undefined) {
                        if (resp.entry[key].resource.hasOwnProperty('payload')) {
                            if (resp.entry[key].resource.payload[0].extension[0].hasOwnProperty('valueCodeableConcept')) {
                                console.log(resp.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code, '----------')
                                if (resp.entry[key].resource.payload[0].extension[0].valueCodeableConcept.coding[0].code === 'pcde') {
                                    resources.push(resp.entry[key].resource);
                                }
                            }
                        }

                    }
                });
            }
        }
        else {
            console.log('no communications')
        }
        // console.log("-------", resources);
        this.setState({ comm_req: resources });
    }
    async getCarePlans() {
        let carePlanResources = await this.getResources('CarePlan?status=active&subject=' + this.state.patient.id).then((resource) => {
            if (resource.hasOwnProperty('entry')) {
                this.setState({ carePlanResources: resource.entry })
            }

        })
        // console.log(carePlanResources, 'resources')
    }
    async getPatientDetails(patient_id, communication_request, identifier) {
        this.setState({ patient_name: "" });
        this.setState({ sender_resource: "" });
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
        this.setState({ files: [] })

        // let f = this.state.files;
        // f = null;
        // this.setState({ files: f });
        // console.log(this.state.files)
        var tempUrl = this.state.fhir_url + "/" + patient_id;
        let token;
        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);

        // const token = await createToken(this.state.config.payer.grant_type, 'payer', sessionStorage.getItem('username'), sessionStorage.getItem('password'));
        let headers = {
            "Content-Type": "application/json",
        }
        // if (config.payerB.authorized_fhir) {
        //     headers['Authorization'] = 'Bearer ' + token
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
                        // patient['name'][0]['given'].map((n) => {
                        //     name += ' ' + n;
                        // });

                        name = patient['name'][0]['given'][0] + " " + patient['name'][0]['family'];
                        console.log("name---" + name);
                        this.setState({ patient_name: name })
                    }
                }
                // console.log("patient name----------", this.state.patient_name, this.state.patient.resourceType + "?identifier=" + this.state.patient.identifier[0].value);
            }
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );
        // console.log("patient---", patient);
        // if (patient) {
        //     this.setState({ patient: patient });
        //     if (patient.hasOwnProperty("name")) {
        //         var name = '';
        //         if (patient['name'][0].hasOwnProperty('given')) {
        //             // patient['name'][0]['given'].map((n) => {
        //             //     name += ' ' + n;
        //             // });

        //             name = patient['name'][0]['given'][0] + patient['name'][0]['family'];
        //             console.log("name---"+name);
        //             this.setState({ patient_name: name })
        //         }
        //     }
        //     // console.log("patient name----------", this.state.patient_name);
        // }
        // console.log("state patient-------", this.state.patient);
        await this.getCarePlans().then(() => {

        })
        if (communication_request.hasOwnProperty('sender')) {
            let s = await this.getSenderDetails(communication_request, token);
        }
        if (communication_request.hasOwnProperty('payload')) {
            await this.getDocuments(communication_request['payload']);
        }
        if (communication_request.hasOwnProperty('occurrencePeriod')) {
            // await this.getDocuments(communication_request['payload']);
            this.setState({ startDate: communication_request.occurrencePeriod.start })
            this.setState({ endDate: communication_request.occurrencePeriod.end })
        }
        if (communication_request.hasOwnProperty('authoredOn')) {
            this.setState({ recievedDate: communication_request.authoredOn })
        }
        this.setState({ communicationRequest: communication_request });
        // communication_request.payload.map(async (p)=>{
        //     if(p.hasOwnProperty('extension')){
        //         console.log(p,'pp')
        //         if(p.extension[0].hasOwnProperty('valueString')){
        //             console.log('here-123')
        //             await this.getObservationDetails(p.extension[0].valueString);
        //         }

        //     }
        // })

        await this.getObservationDetails().then(() => {
            this.showError()
        })
        // await this.getCarePlans().then(() => {

        // })
        // await this.getObservationDetails().then(() => {
        //     // this.showError()
        // })

        // await this.getClinicalNoteDetails()


        this.setState({ form_load: true });
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
                let encounter = await this.getResources(object.encounter.reference)
                if (encounter.hasOwnProperty('participant')) {
                    if (encounter.participant[0].hasOwnProperty('individual')) {
                        let practitioner = await this.getResources(encounter.participant[0].individual.reference)
                        referenceArray.push({ resource: practitioner })
                    }
                }
                referenceArray.push({ resource: encounter })
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
                let encounter = await this.getResources(object.encounter.reference)
                if (encounter.hasOwnProperty('participant')) {
                    if (encounter.participant[0].hasOwnProperty('individual')) {
                        let practitioner = await this.getResources(encounter.participant[0].individual.reference)
                        referenceArray.push({ resource: practitioner })
                    }
                }
                referenceArray.push({ resource: encounter })
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


    async getObservationDetails() {
        // let searchParameter = this.state.searchParameter;
        // console.log(searchParameter,'search')
        let communicationRequest = this.state.communicationRequest
        let practitionerResource = ''
        if (this.state.patient.hasOwnProperty('generalPractitioner')) {
            practitionerResource = await this.getResources(this.state.patient.generalPractitioner[0].reference)
        }
        let payload = communicationRequest.payload
        let code;
        var date = new Date()
        var currentDateTime = date.toISOString()
        let patientId = communicationRequest.subject.reference
        let dateParameter;
        let valueString;
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
        var conditionsArray = []
        let conditionResource = ''
        var claims = ''
        let claim = ''
        let claimResponse = ''
        let carePlanResources = await this.getResources('CarePlan?status=active&subject=' + this.state.patient.id).then((response) => {
            if (response.hasOwnProperty('entry')) {
                this.setState({ carePlanResources: response.entry })

            }
        })

        // let carePlanResources = this.state.carePlanResources
        // this.setState({carePlanResources:carePlanResources})
        // console.log(carePlanResources.entry[0], 'resources')
        if (this.state.carePlanResources !== '') {

            this.state.carePlanResources.map(async (c, key) => {
                console.log(c, 'police')
                if (c.resource.hasOwnProperty('activity')) {
                    c.resource.activity.map((act) => {
                        if (act.hasOwnProperty('detial')) {
                            if (act.detail.hasOwnProperty('reasonReference')) {
                                if (act.detail.reasonReference.reference.indexOf('Condition') > -1) {
                                    arr.push(act.detail.reasonReference.reference)
                                }
                            }
                        }
                    })
                }
                if (c.resource.hasOwnProperty('addresses')) {
                    c.resource.addresses.map((address => {
                        arr.push(address.reference)
                    }))
                }
                let ref = await this.getReferences(c.resource, 'CarePlan')
                ref.map((r) => {
                    Bundle.entry.push(r)
                })
                conditionResource = await this.getResources(arr[0])
                // if (arr.length > 0) {
                //     conditionsArray.push(await this.getResources(arr[0]))
                // }
                claims = await this.getResources('Claim?patient=' + this.state.patient.id)
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
                if (claim !== '') {
                    let cr = await this.getResources('ClaimResponse?request=' + claim.id)
                    if (cr.hasOwnProperty('entry')) {
                        claimResponse = cr.entry[0].resource
                    }
                    let ref = await this.getReferences(claim, 'Claim')
                    ref.map((r) => {
                        Bundle.entry.push(r)
                    })
                }
                Bundle.entry.push({ resource: this.state.patient })

                Bundle.entry.push({ resource: practitionerResource })


                console.log('1234', conditionResource, claim, claimResponse, 'conditionsArray')


                compositionJson.section.push(
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
                                "entry": [
                                    {
                                        "reference": "CarePlan/" + c.resource.id
                                    }
                                ]
                            },

                        ]
                    }
                )
                if (claim !== '' && claimResponse !== '') {


                    compositionJson.section[key].section.push(
                        {
                            "code": {
                                "coding": [
                                    {
                                        "system": "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDESectionCode",
                                        "code": "priorCoverage"
                                    }
                                ]
                            },
                            "entry": [
                                {
                                    "reference": "Claim/" + claim.id
                                },
                                {
                                    "reference": "ClaimResponse/" + claimResponse.id
                                }
                            ]
                        }
                    )
                }
                Bundle.entry.push({ resource: c.resource })
                Bundle.entry.push({ resource: conditionResource })
                Bundle.entry.push({ resource: claim })
                Bundle.entry.push({ resource: claimResponse })
                Bundle.entry.push({ resource: this.state.endpoint })

            })
            if (this.state.patient.hasOwnProperty('generalPractitioner')) {
                console.log('aaaa', JSON.stringify(this.state.patient.generalPractitioner[0].reference))
                compositionJson.author.push({ "reference": this.state.patient.generalPractitioner[0].reference })
            }
            this.setState({ compositionJson: compositionJson })
            Bundle.entry.push({ resource: compositionJson })
            console.log(compositionJson, 'compositionJSON', Bundle)
            this.setState({ bundle: Bundle })

            // Bundle.entry.push({resource:compositionJson})
        }
        else{
            
        }




        // var searchString = "?type=" + code + "&patient=" + this.state.patient.id
        // var Url = this.state.config.provider.fhir_url + "/DocumentReference" + searchString;
        // var Url=''



        // const token = await this.getToken(config.payerB.grant_type, config.payerB.client_id, config.payerB.client_secret);

        // let headers = {
        //     "Content-Type": "application/json",
        // }
        // if (config.payerB.authorized_fhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        // let documents = await fetch(Url, {
        //     method: "GET",
        //     headers: headers
        // }).then(response => {
        //     console.log(response)
        //     return response.json();
        // }).then((response) => {
        //     if (response.hasOwnProperty('entry')) {
        //         return response
        //     }
        // }).catch(reason =>
        //     console.log("No response recieved from the server", reason)
        // );





        // await this.showError()
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

    onPlanSelect(event) {
        console.log("event --", event, event.target);
        // let val = event.target.value;
        // let selectedPlans = [...this.state.selectedPlans]
        // let valueIndex = this.state.selectedPlans.indexOf(val)
        // if (valueIndex == -1) {
        //     selectedPlans.push(val);
        // }
        // else {
        //     selectedPlans.splice(valueIndex, 1)
        // }
        // this.setState({ checkCarePlan: selectedPlans })
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
                <label>
                    <input type="checkbox" name={resource.id}
                        onChange={this.onPlanSelect} />
                </label>
                {categoryName !== '' &&
                    <span>{resource.resourceType}-{categoryName}</span>
                }
                {categoryName === '' &&
                    <span>{resource.resourceType}-{resource.id}</span>
                }


            </div>
        </div>
        )
    }



    startLoading() {
        this.setState({ loading: true }, () => {
            if (!this.state.error) {
                this.submit_info();
            }
        })
    }

    async UpdateCommunicationRequest() {
        let headers = {
            "Content-Type": "application/json",
        }
        let comm_req = this.state.communicationRequest
        comm_req.status = 'completed'
        console.log(this.state.communicationRequest, 'what value')
        this.setState({ communicationRequest: comm_req })
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
        var fhir_url = this.state.fhir_url;
        var req_bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [{
                "resource": this.state.communicationRequest,
                "request": {
                    "method": "PUT",
                    "url": "CommunicationRequest?identifier=" + this.state.communicationRequest.identifier[0].value,
                    "ifNoneExist": "identifier=" + this.state.communicationRequest.identifier[0].value
                }
            }]

        }

        // let Communication = await fetch(url, {
        //     method: "PUT",
        //     headers: headers,
        //     body: JSON.stringify(bundle)
        // }).then(response => {
        //     return response.json();
        // }).then((response) => {
        //     console.log(response, 'yes its working')
        // }
        // )
        let CommunicationRequest = await fetch(fhir_url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(req_bundle)
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

    async submit_info() {
        let randomString = this.randomString()
        let bundle = this.state.bundle
        bundle.entry = this.getUnique(bundle.entry)
        let files_arr = []
        if (this.state.files != null) {
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
                    reader.readAsBinaryString(file);
                })(this.state.files[i])
            }
        }
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
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [{
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
                            'reference': this.state.communicationRequest.resourceType + "?identifier=" + this.state.communicationRequest.identifier[0].value
                        }
                    ],
                    "identifier": [
                        {
                            "system": "http://www.providerco.com/communication",
                            "value": this.state.communicationIdentifier
                        }
                    ],
                    "payload": payload
                },
                "request": {
                    'method': "POST",
                    "url": "Communication",
                    "ifNoneExist": "identifier=" + this.state.communicationIdentifier
                }
            }

            ]
        }
        commJson.entry.push({
            'resource': this.state.patient,
            'request': {
                "method": "POST",
                "url": "Patient",
                "ifNoneExist": "identifier=" + this.state.patient.identifier[0].value
            }
        })
        commJson.entry.push({
            'resource': this.state.requesterOrganization,
            'request': {
                "method": "POST",
                "url": "Organization",
                "ifNoneExist": "identifier=" + this.state.requesterOrganization.identifier[0].value
            }
        })
        commJson.entry.push({
            'resource': this.state.senderOrganization,
            'request': {
                "method": "POST",
                "url": "Organization",
                "ifNoneExist": "identifier=" + this.state.senderOrganization.identifier[0].value
            }
        })

        console.log(this.state.patient.id, 'iddd', commJson)

        let headers = {
            "Content-Type": "application/json",
        }
        // const token = await this.getToken(config.payerA.grant_type, config.payerA.client_id, config.payerA.client_secret);

        // if (config.payerA.authorizedPayerFhir) {
        //     headers['Authorization'] = 'Bearer ' + token
        // }
        var communicationUrl = this.state.endpoint.address;

        let requesterCommunication = await fetch(communicationUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(commJson)
        }).then(response => {
            return response.json();
        }).then((response) => {
            console.log("----------response123", response);
            // this.setState({ loading: false });
            this.UpdateCommunicationRequest();
            if (response.hasOwnProperty('entry')) {
                let communicationId = response.entry[0].response.location.split('/')[1]
                this.setState({ success: true })
                this.setState({ successMsg: 'Communication has been posted to payer successfully with id - ' + communicationId })
                // NotificationManager.success('Communication has been posted to payer successfully.', 'Success');
                return response
            }

            // this.setState({response})
            console.log(response, 'res')
        }).catch(reason =>
            console.log("No response recieved from the server", reason)
        );

        let senderCommunication = await this.createFhirResource(commJson, '', this.state.fhir_url).then(() => {
            this.setState({ loading: false });
        })
        console.log(senderCommunication, 'Sender Communication has been Created')





        // this.props.saveDocuments(this.props.files,fileInputData)
        this.setState({ communicationJson: commJson })

    }
    onChangeSearchParameter(event) {
        let searchParameter = this.state.searchParameter;
        searchParameter = event.target.value
        this.setState({ searchParameter: searchParameter });
        this.getObservationDetails();
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
            // this.setState({ sender_resource: fhirResponse['resourceType'] });
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
                        "Content-Type": "application/json",
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

    render() {
        let data = this.state.comm_req;
        const files = this.state.files.map(file => (
            <div className='file-block' key={file.name}>
                <a onClick={() => this.onRemove(file)} className="close-thik" />
                {file.name}
            </div>
        ))
        console.log(data, 'how may')
        let content = data.map((d, i) => {
            // console.log(d, i);
            if (d['status'] === 'active') {
                let recievedDate = ''
                if (d.hasOwnProperty('authoredOn')) {
                    recievedDate = d['authoredOn']
                }
                // console.log(startDate.substring(0,10),'stdate')
                if (d.hasOwnProperty("subject")) {
                    let patientId = d['subject']['reference'];
                    if (recievedDate !== '') {
                        return (
                            <div key={i} className="main-list">
                                {i + 1}.  {d['resourceType']} (#{d['id']}) for {patientId} , Recieved On ({recievedDate.substring(0, 10)})
                            <button className="btn list-btn" onClick={() => this.getPatientDetails(patientId, d, patientId)}>
                                    Review</button>
                            </div>
                        )
                    }
                    else {
                        return (
                            <div key={i} className="main-list">
                                {i + 1}.  {d['resourceType']} (#{d['id']}) for {patientId}
                                <button className="btn list-btn" onClick={() => this.getPatientDetails(patientId, d, patientId)}>
                                    Review</button>
                            </div>
                        )
                    }

                }
            }
        });
        let requests = this.state.contentStrings.map((request, key) => {
            if (request) {
                return (
                    <div key={key}>
                        {request}
                    </div>
                )

            }
        });
        return (

            <React.Fragment>
                <div>
                    <header id="inpageheader">
                        <div className="">

                            <div id="logo" className="pull-left">
                                {this.state.payerName !== '' &&
                                    <h1><img style={{height: "60px", marginTop: "-13px"}} src={logo}  /><a href="#intro" className="scrollto">{this.state.payerName}</a></h1>


                                }
                                {/* <a href="#intro"><img src={process.env.PUBLIC_URL + "/assets/img/logo.png"} alt="" title="" /></a> */}
                            </div>

                            <nav id="nav-menu-container">
                                <ul className="nav-menu">
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>List Of CT documents</a></li>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/request"}>Request for Document</a></li>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li>
                                    {/* <li className="menu-active menu-has-children"><a href="">Services</a>
                    <ul>
                      <li className="menu-active"><a href={window.location.protocol + "//" + window.location.host + "/provider_request"}>Prior Auth Submit</a></li>
                      <li><a href={window.location.protocol + "//" + window.location.host + "/mips"}>MIPS Score</a></li>
                    </ul>
                  </li> */}
                                    {/* <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li> */}
                                    {/* <li className="menu-has-children"><a href="">{sessionStorage.getItem('username')}</a>
                    <ul>
                      <li><a href="" onClick={this.onClickLogout}>Logout</a></li>
                    </ul>
                  </li> */}
                                </ul>
                            </nav>
                        </div>
                    </header>

                    <main id="main" style={{ marginTop: "92px", marginBottom: "100px" }}>

                        <div className="section-header">
                            <h3>Transfer Coverage Decision Documents</h3>
                        </div>
                    </main>
                    <div className="content">
                        <div className="left-form" style={{ paddingLeft: "2%", paddingTop: "1%" }}>
                            <div style={{ paddingTop: "10px", color: "#8a6d3b", marginBottom: "10px" }}><strong> List of Requests for Coverage Transition document </strong></div>
                            <div>{content}</div>
                        </div>
                        {this.state.form_load &&
                            <div className="right-form" style={{ paddingTop: "1%" }} >
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
                                    Requester Payer {this.state.sender_resource} : <span className="data1">{this.state.sender_name}</span>
                                </div>
                                {/* <div className="data-label">
                                    Start Date : <span className="data1">{moment(this.state.startDate).format(" YYYY-MM-DD, hh:mm a")}</span>
                                </div>
                                <div className="data-label">
                                    End Date : <span className="data1">{moment(this.state.endDate).format(" YYYY-MM-DD, hh:mm a")}</span>
                                </div> */}
                                {this.state.recievedDate !== '' &&
                                    <div className="data-label">
                                        Recieved Date : <span className="data1">{moment(this.state.recievedDate).format(" YYYY-MM-DD, hh:mm a")}</span>
                                    </div>
                                }


                                <div className="data-label">
                                    Requested for : <span className="data1">{requests}</span>
                                </div>
                                {/* {this.state.observationList.length >0 &&
                                    <div className="data-label">
                                        Obsersvation : <span className="data1">{observations}</span>
                                    </div>
                                } */}
                                {/* {this.state.documentList.length >0 &&
                                    <div className="data-label">
                                        Documents : <span className="data1">{documents}</span>
                                    </div>  
                                } */}

                                {/* <div className="data-label" style={{ paddingTop: "0px" }}>
                                    Select documents :

                                </div>
                                <div>
                                    {this.state.documentList.map((item, key) => {
                                        return this.renderDocs(item, key);
                                    })}
                                </div> */}
                                {/* {this.state.documentList.length === 0 &&
                                    <div >
                                        {"No Documents found.Please Upload the required documents"}
                                    </div>
                                } */}

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
                                {this.state.carePlanResources!=='' &&
                                <div className="form-row" >
                                    <div className="form-group col-2" >
                                <button className="btn list-btn" style={{ float: "left" }} onClick={this.showBundlePreview}>
                                    Preview</button>
                                    </div>
                                {this.state.show &&

                                    <div className="form-group col-10"><pre>{JSON.stringify(this.state.bundle, null, 2)}</pre></div>
                                }
                                </div>

                                }
                                 {this.state.error &&
                                    <div className="decision-card alert-error">
                                        {this.state.errorMsg}
                                    </div>
                                }
                                
                                {/* <div className='data-label'>
                                    <div>Search Observations form FHIR
                                        <small> - Enter a search keyword. (ex: height)</small>
                                    </div>
                                    <Input style={{ width: "100%" }}
                                        icon='search'
                                        placeholder='Search'
                                        className='ui fluid  input' type="text" name="searchParameter"
                                        onChange={this.onChangeSearchParameter}
                                    >
                                    </Input>
                                    // {/* <button style={{ width:"30%", float:"left"}}className="btn list-btn" onClick={() => this.getObservationDetails()}>
                                    //         Search</button> 
                                    {this.state.observationList.length > 0 &&
                                        <div className="data1">Found {this.state.observationList.length} observation(s)</div>
                                    }
                                    {this.state.observationList.length === 0 &&
                                        <div className="data1">When no observations found. Please upload requested documents.</div>
                                    }
                                </div> */}
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
                                <NotificationContainer />
                            </div>}
                    </div>
                </div>
            </React.Fragment >
        );
    }
}

function mapStateToProps(state) {
    console.log(state);
    return {
        config: state.config,
    };
};

export default withRouter(connect(mapStateToProps)(TASK));
