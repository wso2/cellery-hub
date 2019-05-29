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

package io.cellery.hub.identity.extension.post.authn.handler;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.identity.application.authentication.framework.context.AuthenticationContext;
import org.wso2.carbon.identity.application.authentication.framework.exception.PostAuthenticationFailedException;
import org.wso2.carbon.identity.application.authentication.framework.handler.request.AbstractPostAuthnHandler;
import org.wso2.carbon.identity.application.authentication.framework.handler.request.PostAuthnHandlerFlowStatus;
import org.wso2.carbon.identity.application.authentication.framework.util.FrameworkUtils;
import org.wso2.carbon.identity.core.util.IdentityDatabaseUtil;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import static org.wso2.carbon.identity.application.authentication.framework.handler.request.
        PostAuthnHandlerFlowStatus.SUCCESS_COMPLETED;

/**
 * In order to authenticate to CLI, users have to have an organization created.
 */
public class CliOrganizationValidationPostAuthnHandler extends AbstractPostAuthnHandler {

    private static final Log log = LogFactory.getLog(CliOrganizationValidationPostAuthnHandler.class);
    private static final String IS_ORGANIZATION_EXIST_FOR_USER_QUERY = "SELECT ORG_NAME FROM " +
            "REGISTRY_ORG_USER_MAPPING WHERE USER_UUID = ?";
    private static final String CREATE_ORG_ENDPOINT = "CREATE_ORG_ENDPOINT";
    private static final String ERROR_CODE_ORGANIZATION_CHECK_ERROR = "CLI001";
    private static final String ERROR_CODE_REDIRECTION_ERROR = "CLI002";

    public CliOrganizationValidationPostAuthnHandler() {

        this.init(null);
    }

    @Override
    public PostAuthnHandlerFlowStatus handle(HttpServletRequest httpServletRequest,
                                             HttpServletResponse httpServletResponse, AuthenticationContext
                                                     authenticationContext) throws
            PostAuthenticationFailedException {

        String redirectUri = System.getenv(CREATE_ORG_ENDPOINT);

        if (StringUtils.isEmpty(redirectUri)) {
            Object redirectUriObj = this.properties.get(CREATE_ORG_ENDPOINT);
            if (redirectUriObj != null) {
                redirectUri = redirectUriObj.toString();
            }
        }
        if (!FrameworkUtils.isStepBasedSequenceHandlerExecuted(authenticationContext)) {
            return SUCCESS_COMPLETED;
        }

        String applicationName = authenticationContext.getSequenceConfig().getApplicationConfig().
                getServiceProvider().getApplicationName();
        if (log.isDebugEnabled()) {
            log.info("Intercepted for application: " + applicationName);
        }
        if (!(StringUtils.isNotEmpty(applicationName) && applicationName.toLowerCase().contains("cli"))) {
            return SUCCESS_COMPLETED;
        }
        if (log.isDebugEnabled()) {
            log.debug("Application contains \"cli\" in it's name. Hence proceeding : " + applicationName);
        }
        Connection connection = DBPersistanceManager.getInstance().getDBConnection();
        PreparedStatement prepStmt = null;
        ResultSet rs;
        String username = authenticationContext.getSequenceConfig().
                getAuthenticatedUser().getUserName();
        try {
            prepStmt = connection.prepareStatement(IS_ORGANIZATION_EXIST_FOR_USER_QUERY);
            prepStmt.setString(1, username);
            rs = prepStmt.executeQuery();
            if (rs.next()) {
                if (log.isDebugEnabled()) {
                    log.debug("Organization found for the given userId : " + rs.getString(1));
                }
                return SUCCESS_COMPLETED;
            }
        } catch (SQLException e) {
            throw new PostAuthenticationFailedException(ERROR_CODE_REDIRECTION_ERROR,
                    "Error while redirecting to the uri : " + redirectUri, e);
        } finally {
            IdentityDatabaseUtil.closeAllConnections(connection, null, prepStmt);
        }

        try {
            if (log.isDebugEnabled()) {
                log.debug("No organizations found for user :" + username);
            }
            redirectUri = redirectUri + "?sessionDataKey=" + authenticationContext.getContextIdentifier();
            httpServletResponse.sendRedirect(redirectUri);
        } catch (IOException e) {
            throw new PostAuthenticationFailedException(ERROR_CODE_REDIRECTION_ERROR,
                    "Error while redirecting to the uri : " + redirectUri, e);

        }
        return PostAuthnHandlerFlowStatus.INCOMPLETE;
    }

    @Override
    public int getPriority() {

        int priority = super.getPriority();
        if (priority == -1) {
            priority = 21;
        }
        return priority;
    }

}
