//import KJUR, {KEYUTIL} from 'jsrsasign';
import config from '../globalConfiguration.json';


export async function createToken(grantType, user, username, password, login = false) {
    const types = {
        error: "errorClass",
        info: "infoClass",
        debug: "debugClass",
        warning: "warningClass"
    };
    // const config = (sessionStorage.getItem('config') !== undefined) ? JSON.parse(sessionStorage.getItem('config')) : {}
    const tokenUrl = config.token_url;
    // console.log("Retrieving OAuth token from "+tokenUrl,types.info);
    let params = {}
    if (login === true) {
        params['grant_type'] = "password"
        params['client_id'] = 'app-login'
        params['username'] = username
        params['password'] = password
    }
    else {
        if (grantType == 'password') {
            params['grant_type'] = grantType
            // if(user == 'provider'){
            //      params['client_id'] = config.provider_client_id
            // }
            // else{
            //     params['client_id'] = config.payer_client_id
            // }
            params['client_id'] = 'app-login'
            params['username'] = username
            params['password'] = password
        }
        else {
            const user_config = sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {}
            params['grant_type'] = grantType
            if (user == 'provider') {
                params['client_id'] = user_config.provider_client_id
                params['client_secret'] = user_config.provider_client_secret
            }
            else {
                params['client_id'] = user_config.payer_client_id
                params['client_secret'] = user_config.payer_client_secret
            }
        }

    }
    // let params = {
    //     grant_type:"password",
    //     username:username,
    //     password:password,
    //     client_id:config.provider.client_id
    //   };
    // if (config.provider_client_id) {
    //     console.log("Using client {" + config.provider_client_id + "}", types.info)
    // } else {
    //     console.log("No client id provided in GlobalConfiguration", this.warning);
    // }
    // console.log('params',params.client_id,params )
    // Encodes the params to be compliant with
    // x-www-form-urlencoded content types.
    const searchParams = Object.keys(params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    // We get the token from the url
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