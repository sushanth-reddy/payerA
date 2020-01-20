import React, { Component } from 'react';
import {Switch} from 'react-router';
import {BrowserRouter, Redirect, Route} from 'react-router-dom';
import LoginPage from '../containers/loginPage';
import Launch from '../containers/Launch';
import Main from '../containers/Main';
import Configuration from '../containers/configuration';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faIgloo,faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import PayerCommunicationRequest from '../containers/PayerCommunicationRequest';
import Task from '../containers/Task';
import ProviderCommunicationRequest from '../containers/ProviderCommunicationRequest';
import { Request } from '../containers/Request';
import PDEXCommunicationHandler from '../containers/PDEXCommunicationHandler';
import CDEXCommunicationHandler from '../containers/CDEXCommunicationHandler';
import CareGaps from '../containers/CareGaps';

library.add(faIgloo,faNotesMedical)
export default class App extends Component {
    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={() => { return <Redirect to="/request" />}} />
                    <Route path={"/login"} component={LoginPage} />                    
                    <Route path={"/task"} component={Task} />
                    <Route path={"/care_gaps"} component={CareGaps} />
                    <Route path={"/payerA"} component={PayerCommunicationRequest} />                    
                    <Route path={"/request"} component={Request} />                    
                    <Route path={"/request_doc"} component={ProviderCommunicationRequest} />                    
                    <Route path={"/pdex_documents"} component={PDEXCommunicationHandler} />                    
                    <Route path={"/cdex_documents"} component={CDEXCommunicationHandler} />                    
                    <Route exact path="/index" component={Main} />
                    <Route path={"/launch"} component={Launch} />
                    <Route path={"/configuration"} component={Configuration} />
                </Switch>
            </BrowserRouter>
        );
    }
}