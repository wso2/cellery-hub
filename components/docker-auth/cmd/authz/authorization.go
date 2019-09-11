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

	"github.com/cesanta/docker_auth/auth_server/api"
	"go.uber.org/zap"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/auth"
	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/db"
	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

var logger *zap.SugaredLogger

type PluginAuthz struct {
}

func (*PluginAuthz) Stop() {
}

func (*PluginAuthz) Name() string {
	return "plugin authz"
}

func (c *PluginAuthz) Authorize(ai *api.AuthRequestInfo) ([]string, error) {
	if logger == nil {
		logger = extension.NewLogger()
	}
	return doAuthorize(ai, logger)
}

var Authz PluginAuthz

func doAuthorize(ai *api.AuthRequestInfo, logger *zap.SugaredLogger) ([]string, error) {
	execId, err := extension.GetExecID(logger)
	if err != nil {
		return nil, fmt.Errorf("error in generating the execId : %s", err)
	}
	logger.Debugf("Authorization logic reached. User will be authorized")
	dbConnectionPool, err := db.GetDbConnectionPool(logger)
	if err != nil {
		return nil, fmt.Errorf("error while establishing database connection pool: %v", err)
	}
	authorized, err := auth.Authorization(dbConnectionPool, ai, logger, execId)
	if err != nil {
		return nil, fmt.Errorf("error while executing authorization logic: %v", err)
	}
	if !authorized {
		logger.Debugf("[%s] User : %s is unauthorized for %s actions", execId, ai.Account, ai.Actions)
		return nil, nil
	} else {
		logger.Debugf("[%s] User : %s is authorized for %s actions", execId, ai.Account, ai.Actions)
		return ai.Actions, nil
	}
}
