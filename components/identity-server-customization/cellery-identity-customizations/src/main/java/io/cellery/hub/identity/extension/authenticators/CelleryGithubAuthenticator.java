/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package io.cellery.hub.identity.extension.authenticators;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.oltu.oauth2.client.OAuthClient;
import org.apache.oltu.oauth2.client.URLConnectionClient;
import org.apache.oltu.oauth2.client.request.OAuthClientRequest;
import org.apache.oltu.oauth2.client.response.OAuthAuthzResponse;
import org.apache.oltu.oauth2.client.response.OAuthClientResponse;
import org.apache.oltu.oauth2.common.exception.OAuthProblemException;
import org.apache.oltu.oauth2.common.exception.OAuthSystemException;
import org.apache.oltu.oauth2.common.message.types.GrantType;
import org.json.JSONArray;
import org.json.JSONObject;
import org.wso2.carbon.identity.application.authentication.framework.context.AuthenticationContext;
import org.wso2.carbon.identity.application.authentication.framework.exception.AuthenticationFailedException;
import org.wso2.carbon.identity.application.authentication.framework.model.AuthenticatedUser;
import org.wso2.carbon.identity.application.authenticator.oidc.OIDCAuthenticatorConstants;
import org.wso2.carbon.identity.application.common.model.ClaimMapping;
import org.wso2.carbon.identity.authenticator.github.GithubAuthenticator;
import org.wso2.carbon.identity.authenticator.github.GithubAuthenticatorConstants;
import org.wso2.carbon.identity.authenticator.github.GithubOAuthClient;

import java.io.IOException;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * The existing default authenticator calls user info endpoint two times which is costly.
 * Also it does not retrieve user emails if email is not configured in public profile. Hence default authenticator is
 * extended.
 */
public class CelleryGithubAuthenticator extends GithubAuthenticator {

    private static Log log = LogFactory.getLog(CelleryGithubAuthenticator.class);

    private static final String GITHUB_EMAIL_ENDPOINT = "https://api.github.com/user/emails";
    private static final String CELLERY_GITHUB_AUTHENTICATOR_FRIENDLY_NAME = "Cellery Github";
    private static final String CELLERY_GITHUB_AUTHENTICATOR_NAME = "CelleryGithubAuthenticator";
    private static final String GITHUB_CLAIM_EMAIL = "email";
    private static final String GITHUB_CLAIM_NAME = "name";
    private static final String GITHUB_CLAIM_LOGIN = "login";
    private static final String PRIMARY_LABEL = "primary";

    @Override
    public String getFriendlyName() {

        return CELLERY_GITHUB_AUTHENTICATOR_FRIENDLY_NAME;
    }

    /**
     * Get the name of the Authenticator
     */
    @Override
    public String getName() {

        return CELLERY_GITHUB_AUTHENTICATOR_NAME;
    }

    /**
     * Process the response of first call
     */
    @Override
    protected void processAuthenticationResponse(HttpServletRequest request, HttpServletResponse response,
                                                 AuthenticationContext context) throws AuthenticationFailedException {

        try {
            Map<String, String> authenticatorProperties = context.getAuthenticatorProperties();
            String clientId = authenticatorProperties.get(OIDCAuthenticatorConstants.CLIENT_ID);
            String clientSecret = authenticatorProperties.get(OIDCAuthenticatorConstants.CLIENT_SECRET);
            String tokenEndPoint = getTokenEndpoint(authenticatorProperties);
            String callbackUrl = getCallbackUrl(authenticatorProperties);

            OAuthAuthzResponse authorizationResponse = OAuthAuthzResponse.oauthCodeAuthzResponse(request);
            String code = authorizationResponse.getCode();

            OAuthClientRequest accessRequest =
                    getAccessRequest(tokenEndPoint, clientId, code, clientSecret, callbackUrl);
            GithubOAuthClient oAuthClient = new GithubOAuthClient(new URLConnectionClient());
            OAuthClientResponse oAuthResponse = getOauthResponse(oAuthClient, accessRequest);
            String accessToken = oAuthResponse.getParam(OIDCAuthenticatorConstants.ACCESS_TOKEN);
            if (StringUtils.isBlank(accessToken)) {
                throw new AuthenticationFailedException("Access token is empty or null");
            }

            AuthenticatedUser authenticatedUserObj;
            Map<ClaimMapping, String> claims;
            claims = getSubjectAttributes(oAuthResponse, authenticatorProperties);

            // Github sends string null when public profile "name" is not filled.
            String name = getAttributeValue(claims, GITHUB_CLAIM_NAME);
            if (StringUtils.isEmpty(name) || "null".equalsIgnoreCase(name)) {
                ClaimMapping nameClaimMapping = ClaimMapping.build(GITHUB_CLAIM_NAME, GITHUB_CLAIM_NAME, null, false);
                claims.remove(nameClaimMapping);
            }

            ClaimMapping emailClaimMapping = ClaimMapping.build(GITHUB_CLAIM_EMAIL,
                    GITHUB_CLAIM_EMAIL, null, false);
            claims.put(emailClaimMapping, resolveEmail(accessToken, getAttributeValue(claims, GITHUB_CLAIM_LOGIN)));
            String userId = getAttributeValue(claims, GithubAuthenticatorConstants.USER_ID);
            authenticatedUserObj = AuthenticatedUser
                    .createFederateAuthenticatedUserFromSubjectIdentifier(userId);
            authenticatedUserObj.setAuthenticatedSubjectIdentifier(userId);
            authenticatedUserObj.setUserAttributes(claims);
            context.setSubject(authenticatedUserObj);
        } catch (OAuthProblemException e) {
            throw new AuthenticationFailedException("Authentication process failed", e);
        }
    }

    private String resolveEmail(String token, String username) throws AuthenticationFailedException {

        String emails = null;
        try {
            log.debug("Trying to retrieve emails for user : " + username);
            emails = super.sendRequest(GITHUB_EMAIL_ENDPOINT, token);
            if (StringUtils.isNotEmpty(emails)) {
                JSONArray emailResponse = new JSONArray(emails);
                for (int i = 0; i < emailResponse.length(); i++) {
                    JSONObject emailDetails = emailResponse.getJSONObject(i);
                    String email = emailDetails.getString(GITHUB_CLAIM_EMAIL);
                    boolean isPrimary = emailDetails.getBoolean(PRIMARY_LABEL);
                    if (isPrimary && StringUtils.isNotEmpty(email)) {
                        log.debug("Found a primary email for user : " + email);
                        return email;
                    }
                }
            }
            log.debug("Couldn't find any verified primary email for the user");
        } catch (IOException e) {
            throw new AuthenticationFailedException("Could call user info email endpoint to retrieve emails of user :" +
                    " " + username);
        }
        throw new AuthenticationFailedException("Could not retrieve primary email for Github user : " + username);
    }

    private OAuthClientResponse getOauthResponse(OAuthClient oAuthClient, OAuthClientRequest accessRequest)
            throws AuthenticationFailedException {

        OAuthClientResponse oAuthResponse;
        try {
            oAuthResponse = oAuthClient.accessToken(accessRequest);
        } catch (OAuthSystemException | OAuthProblemException e) {
            throw new AuthenticationFailedException("Error while retrieving access token from github", e);
        }
        return oAuthResponse;
    }

    private OAuthClientRequest getAccessRequest(String tokenEndPoint, String clientId, String code, String clientSecret,
                                                String callbackurl) throws AuthenticationFailedException {

        OAuthClientRequest accessRequest;
        try {
            accessRequest = OAuthClientRequest.tokenLocation(tokenEndPoint)
                    .setGrantType(GrantType.AUTHORIZATION_CODE).setClientId(clientId)
                    .setClientSecret(clientSecret).setRedirectURI(callbackurl).setCode(code)
                    .buildBodyMessage();
        } catch (OAuthSystemException e) {
            throw new AuthenticationFailedException(e.getMessage(), e);
        }
        return accessRequest;
    }

    private String getAttributeValue(Map<ClaimMapping, String> claims, String attributeName) throws
            AuthenticationFailedException {

        ClaimMapping claimMapping = ClaimMapping.build(attributeName,
                attributeName, null, false);
        String claimValue = claims.get(claimMapping);
        if (StringUtils.isEmpty(claimValue)) {
            throw new AuthenticationFailedException("Couldn't find user Id in for github user");
        }
        return claimValue;
    }
}
