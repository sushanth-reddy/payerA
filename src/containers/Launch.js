import React, {Component} from 'react';
import queryString from 'query-string';
import simpleOauthModule from 'simple-oauth2';
import Client from 'fhir-kit-client';
// import config from '../globalConfiguration.json';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';



class Review extends Component {
  constructor(props){
    super(props);
    this.state = {
       launch : queryString.parse(this.props.location.search, { ignoreQueryPrefix: true }).launch,
       iss : queryString.parse(this.props.location.search, { ignoreQueryPrefix: true }).iss
    }
    this.initialize = this.initialize.bind(this);   
       
    // if (sessionStorage.getItem('username') === 'john'){
    //   this.initialize({
    //       client_id: "app-login",
    //       scope: "patient/* openid profile"
    //     });
    // } else {
       
        this.initialize({
          client_id: "b7cb53e9-5e8e-4748-a790-1f45a0101255",//cerner
          scope: "patient/* openid profile"
        });
    // }
  }
  setSettings(data) {
    sessionStorage.setItem("app-settings", JSON.stringify(data));
  }
  clearAuthToken() {
    sessionStorage.removeItem('tokenResponse');
  }

  getSettings() {
    var data = sessionStorage.getItem("app-settings");
    return JSON.parse(data);
  }
  async initialize(settings) {
      sessionStorage.removeItem('app-settings');
      this.setSettings({
          client_id     :  settings.client_id,
          secret        : "7e5e0e32-0dcd-4f6f-9b72-d0021e08c0e",
          scope         : settings.scope + " launch",
          launch_id     : this.state.launch,
          api_server_uri: this.state.iss
          // api_server_uri: "http://54.227.218.17:8280/fhir/baseDstu3/"
      });
      
      settings = this.getSettings();
      this.clearAuthToken();
      console.log(settings.api_server_uri)
      const fhirClient = new Client({ baseUrl: settings.api_server_uri });
      if (this.props.config.provider.authorized_fhir === true){
         var { authorizeUrl, tokenUrl } = await fhirClient.smartAuthMetadata();
      
         if(settings.api_server_uri.search('cdex.mettles.com') > 0){
           authorizeUrl
            = {protocol:"https://",host:"auth.mettles.com/",pathname:"auth/realms/ProviderCredentials/protocol/openid-connect/auth"}
           tokenUrl = {protocol:"https:",host:"auth.mettles.com",pathname:"auth/realms/ProviderCredentials/protocol/openid-connect/token"}
         }

         // //////////////

         //  authorizeUrl= {protocol:"https://",host:"54.227.218.17:8443/",pathname:"auth/realms/ProviderCredentials/protocol/openid-connect/auth"}
         //  tokenUrl = {protocol:"https:",host:"54.227.218.17:8443",pathname:"auth/realms/ProviderCredentials/protocol/openid-connect/token"}

         // //////////////
         const oauth2 = simpleOauthModule.create({
          client: {
          id: settings.client_id,
          secret:settings.secret
          },
          auth: {
          tokenHost: `${tokenUrl.protocol}//${tokenUrl.host}`,
          // tokenHost:tokenUrl.host,
          tokenPath: tokenUrl.pathname,
          authorizeHost: `${authorizeUrl.protocol}//${authorizeUrl.host}`,
          authorizePath: authorizeUrl.pathname,
          },
         });
         
         console.log("Current URL--",`${window.location.protocol}//${window.location.host}/index`);
         // Authorization uri definition
         const authorizationUri = oauth2.authorizationCode.authorizeURL({
             redirect_uri: `${window.location.protocol}//${window.location.host}/mips`,
             aud: settings.api_server_uri,
             scope: settings.scope,
             state: '3(#0/!~',
         });
         console.log(authorizationUri,'authorize')
         window.location = authorizationUri;
	}
        if (!this.props.config.provider.authorized_fhir){
        	window.location = `${window.location.protocol}//${window.location.host}/mips`;
      	}
  }

  render() {
    return (
      <div className="attributes mdl-grid">
         Launching......
      </div>)
  }
}
function mapStateToProps(state) {
  console.log(state);
  return {
      config: state.config,
  };
};
export default withRouter(connect(mapStateToProps)(Review));


