import React, { Component } from 'react';
import {Switch} from 'react-router';
import {BrowserRouter, Redirect, Route} from 'react-router-dom';
//import PrivateRoute from './privateRoute';
//import PriorAuthorization from '../containers/PriorAuthorization';
//import Review from '../containers/Review';
import LoginPage from '../containers/loginPage';
import Launch from '../containers/Launch';
import Main from '../containers/Main';
import Configuration from '../containers/configuration';
import { library } from '@fortawesome/fontawesome-svg-core'
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIgloo,faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import PayerCommunicationRequest from '../containers/PayerCommunicationRequest';
import PDEX from '../containers/PDEX';
import CommunicationHandler from '../containers/CommunicationHandler';

library.add(faIgloo,faNotesMedical)
export default class App extends Component {
    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={() => { return <Redirect to="/payerA" />}} />
                    <Route path={"/login"} component={LoginPage} />                    
                    <Route path={"/pdex"} component={PDEX} />
                    {/* <Route path={"/prior_auth"} component={PriorAuthorization} /> */}
                    <Route path={"/payerA"} component={PayerCommunicationRequest} />                    
                    <Route path={"/pdex_documents"} component={CommunicationHandler} />                    
                    {/* <Route path={"/review"} component={Review} /> */}
                    <Route exact path="/index" component={Main} />
                    <Route path={"/launch"} component={Launch} />
                    <Route path={"/configuration"} component={Configuration} />
                </Switch>
            </BrowserRouter>
        );
    }
}