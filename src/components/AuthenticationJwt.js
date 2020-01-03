import config from '../properties.json';
import KJUR, {KEYUTIL} from 'jsrsasign';


export async function createJwt(){
    var text = [];
    var keypair = KEYUTIL.generateKeypair('RSA',2048);
    var possible = config.make_id_possible;
    for (var i = 0; i < 25; i++)
        text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

    text.join('');

    var pubKey =keypair.pubKeyObj;
    const jwkPrv2 = KEYUTIL.getJWKFromKey(keypair.prvKeyObj);
    const jwkPub2 = KEYUTIL.getJWKFromKey(keypair.pubKeyObj);
    console.log(pubKey);
    const currentTime = KJUR.jws.IntDate.get('now');
    const endTime = KJUR.jws.IntDate.get('now + 1day');
    const kid = KJUR.jws.JWS.getJWKthumbprint(jwkPub2)
    // const pubPem = {"pem":KEYUTIL.getPEM(pubKey),"id":kid};
//    const pubPem = {"pem":jwkPub2,"id":kid};

    // Check if the public key is already in the db
    const checkForPublic = await fetch("http://localhost:3001/public_keys?id="+kid,{
    "headers":{
        "Content-Type":"application/json"
    },
    "method":"GET"
    }).then(response => {return response.json()});
    if(!checkForPublic.length){
    // POST key to db if it's not already there
   /* const alag = await fetch("http://localhost:3001/public_keys",{
        "body": JSON.stringify(pubPem),
        "headers":{
        "Content-Type":"application/json"
        },
        "method":"POST"
    });*/
    }
    const header = {
    "alg":config.jwt_header_alg,
    "typ":config.jwt_header_type,
    "kid":kid,
    "jku":config.jwt_header_jku,
    };
    const body = {
    "iss":"http://54.227.173.76:8181/fhir",
    "aud":"http://54.227.173.76:8181/fhir",
    "iat": currentTime,
    "exp": endTime,
    "jti": text,
    }

    var sJWT = KJUR.jws.JWS.sign("RS256",JSON.stringify(header),JSON.stringify(body),jwkPrv2)

    return sJWT;
}