/*
 * Copyright (c) 2019 WSO2 Inc. (http:www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http:www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package main

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/cesanta/docker_auth/auth_server/api"
	"go.uber.org/zap"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/auth"
	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

type PluginAuthn struct {
	cfg *api.Authenticator
}

func (c *PluginAuthn) Authenticate(user string, password api.PasswordString) (bool, api.Labels, error) {
	logger := zap.NewExample().Sugar()
	slogger := logger.Named("authentication")
	return doAuthentication(user, string(password), slogger)
}

func (c *PluginAuthn) Stop() {
}

func (c *PluginAuthn) Name() string {
	return "plugin auth"
}

var Authn PluginAuthn

func doAuthentication(user, incomingToken string, logger *zap.SugaredLogger) (bool, api.Labels, error) {
	execId, err := extension.GetExecID(logger)
	if err != nil {
		return false, nil, fmt.Errorf("error in generating the execId : %s", err)
	}

	logger.Debugf("[%s] Username (%s) and password received from CLI", execId, user)

	tokenArray := strings.Split(incomingToken, ":")
	token := tokenArray[0]

	isPing := len(tokenArray) > 1 && tokenArray[1] == "ping"
	if isPing {
		logger.Debugf("[%s] Ping request received", execId)
	}

	isAuthenticated, err := auth.Authenticate(user, token, logger, execId)
	if err != nil {
		return false, nil, fmt.Errorf("something went wrong while authenticating %v", err)
	}
	if !isAuthenticated {
		logger.Debugf("[%s] User access token failed to authenticate. Evaluating ping", execId)
		if isPing {
			return false, nil, fmt.Errorf("since this is a ping request, exiting with auth fail status " +
				"without passing to authorization filter")
		} else {
			logger.Debugf("[%s] Failed authentication. But passing to authorization filter", execId)
			return true, addAuthenticationLabel(false, execId), nil
		}
	} else {
		logger.Debugf("[%s] User successfully authenticated by validating token. Exiting with success "+
			"exit code", execId)
		return true, addAuthenticationLabel(true, execId), nil
	}
}

func addAuthenticationLabel(isAuthenticated bool, execId string) api.Labels {
	authResultString := strconv.FormatBool(isAuthenticated)
	label := make([]string, 1)
	label[0] = authResultString
	authLabels := api.Labels{}
	authLabels["isAuthSuccess"] = label
	return authLabels
}
