import process from 'process';
import { Logger } from '@hmcts/nodejs-logging';
import config = require('config');
import {AccountManagementRequests} from '../resources/requests/accountManagementRequests';
import passportCustom from 'passport-custom';
import {
  AUTH_RETURN_URL,
  MEDIA_VERIFICATION_RETURN_URL,
  ADMIN_AUTH_RETURN_URL,
  FRONTEND_URL,
  CFT_IDAM_URL
} from '../helpers/envUrls';
import axios from "axios";
import jwt_decode from "jwt-decode";


const AzureOIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const passport = require('passport');
const authenticationConfig = require('./authentication-config.json');
const logger = Logger.getLogger('authentication');
const CustomStrategy = passportCustom.Strategy;
const querystring = require('querystring');
const accountManagementRequests = new AccountManagementRequests();

/**
 * This sets up the OIDC version of authentication, integrating with Azure.
 */
function oidcSetup(): void {
  let clientSecret;
  let clientId;
  let identityMetadata;
  let adminIdentityMetadata;
  let mediaVerificationIdentityMetadata;
  let cftIdamClientSecret;

  if(process.env.CLIENT_SECRET) {
    clientSecret = process.env.CLIENT_SECRET;
  } else {
    clientSecret = config.get('secrets.pip-ss-kv.CLIENT_SECRET') as string;
  }

  if(process.env.CLIENT_ID) {
    clientId = process.env.CLIENT_ID;
  } else {
    clientId = config.get('secrets.pip-ss-kv.CLIENT_ID') as string;
  }

  if(process.env.CONFIG_ENDPOINT) {
    identityMetadata = process.env.CONFIG_ENDPOINT;
  } else {
    identityMetadata = config.get('secrets.pip-ss-kv.CONFIG_ENDPOINT') as string;
  }

  if(process.env.CONFIG_ADMIN_ENDPOINT) {
    adminIdentityMetadata = process.env.CONFIG_ADMIN_ENDPOINT;
  } else {
    adminIdentityMetadata = config.get('secrets.pip-ss-kv.CONFIG_ADMIN_ENDPOINT') as string;
  }

  if(process.env.MEDIA_VERIFICATION_CONFIG_ENDPOINT) {
    mediaVerificationIdentityMetadata = process.env.MEDIA_VERIFICATION_CONFIG_ENDPOINT;
  } else {
    mediaVerificationIdentityMetadata = config.get('secrets.pip-ss-kv.MEDIA_VERIFICATION_CONFIG_ENDPOINT') as string;
  }

  if(process.env.CFT_IDAM_CLIENT_SECRET) {
    cftIdamClientSecret = process.env.CFT_IDAM_CLIENT_SECRET;
  } else {
    cftIdamClientSecret = config.get('secrets.pip-ss-kv.CFT_IDAM_CLIENT_SECRET') as string;
  }

  logger.info('secret', clientSecret ? clientSecret.substring(0,5) : 'client secret not set!' );

  const users = [];

  const findByOid = async function(oid, fn): Promise<any> {
    for (let i = 0, len = users.length; i < len; i++) {
      const user = users[i];
      if (user.oid === oid) {
        const returnedUser = await AccountManagementRequests.prototype.getPiUserByAzureOid(oid);
        user['piUserId'] = returnedUser.userId;
        user['piUserProvenance'] = returnedUser.userProvenance;
        return fn(user);
      }
    }
    return fn(null);
  };

  const passportStrategyFn = async function(iss, sub, profile, accessToken, refreshToken, done): Promise<any> {
    await findByOid(profile.oid, function(user) {
      if (!user) {
        // "Auto-registration"
        users.push(profile);
        return done(null, profile);
      }
      return done(null, user);
    });
  };

  passport.serializeUser(async function(foundUser, done) {
    if(foundUser['flow'] === 'CFT') {
      let user = await accountManagementRequests.getPiUserByCftID(foundUser['uid']);

      if (!user) {
        const piAccount = [{
          "userProvenance": "CFT_IDAM",
          "email": foundUser['sub'],
          "roles": "VERIFIED",
          "provenanceUserId": foundUser['uid']
        }]

        await accountManagementRequests.createPIAccount(piAccount, "");
      }
      done(null, {'uid': foundUser.uid, 'flow': 'CFT'});
    } else {
      done(null, {'oid': foundUser.oid, 'flow': 'AAD'});
    }
  });

  passport.deserializeUser(async function(userDetails, done) {
    let user;
    if (userDetails['flow'] === 'CFT') {
      user = await accountManagementRequests.getPiUserByCftID(userDetails['uid']);
    } else {
      user = await accountManagementRequests.getPiUserByAzureOid(userDetails['oid']);
    }

    user['piUserId'] = user.userId;
    user['piUserProvenance'] = user.userProvenance;
    return done(null, user);

  });

  passport.use('login', new AzureOIDCStrategy({
    identityMetadata:  identityMetadata,
    clientID: clientId,
    responseType: authenticationConfig.RESPONSE_TYPE,
    responseMode: authenticationConfig.RESPONSE_MODE,
    redirectUrl: AUTH_RETURN_URL,
    allowHttpForRedirectUrl: true,
    clientSecret: clientSecret,
    isB2C: true,
  },
  passportStrategyFn,
  ));

  passport.use('admin-login', new AzureOIDCStrategy({
    identityMetadata:  adminIdentityMetadata,
    clientID: clientId,
    responseType: authenticationConfig.RESPONSE_TYPE,
    responseMode: authenticationConfig.RESPONSE_MODE,
    redirectUrl: ADMIN_AUTH_RETURN_URL,
    allowHttpForRedirectUrl: true,
    clientSecret: clientSecret,
    isB2C: true,
  },
  passportStrategyFn,
  ));

  passport.use('media-verification', new AzureOIDCStrategy({
    identityMetadata:  mediaVerificationIdentityMetadata,
    clientID: clientId,
    responseType: authenticationConfig.RESPONSE_TYPE,
    responseMode: authenticationConfig.RESPONSE_MODE,
    redirectUrl: MEDIA_VERIFICATION_RETURN_URL,
    allowHttpForRedirectUrl: true,
    clientSecret: clientSecret,
    isB2C: true,
  },
  passportStrategyFn,
  ));


  passport.use('cft-idam', new CustomStrategy(
    async function(req, callback) {

      const params = {
        client_id: 'app-pip-frontend',
        client_secret: cftIdamClientSecret,
        grant_type: 'authorization_code',
        redirect_uri: FRONTEND_URL + '/cft-login/return',
        code: req.query.code as string,
      };

      const tokenRequest = axios.create({baseURL: CFT_IDAM_URL, timeout: 10000});

      try {
        const response = await tokenRequest.post('/o/token', querystring.stringify(params), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const data = response.data;
        const jwtToken = jwt_decode(data.id_token);
        jwtToken['flow'] = 'CFT';

        callback(null, jwtToken);

      } catch (e) {
        console.log(e);
      }
    }
  ));

}

/**
 * This function sets up the authentication service
 * Values are read from config, and from the environment passed in
 */
export default function(): void {
  oidcSetup();
}
