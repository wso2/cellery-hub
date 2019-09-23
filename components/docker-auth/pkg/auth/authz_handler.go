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

package auth

import (
	"fmt"

	"database/sql"

	"github.com/cesanta/docker_auth/auth_server/api"
	"go.uber.org/zap"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

func Authorize(dbConn *sql.DB, ai *api.AuthRequestInfo, logger *zap.SugaredLogger, execId string) (bool, error) {
	logger.Debugf("[%s] Authorization logic handler reached and access will be validated", execId)
	isValid, err := extension.IsUserAuthorized(dbConn, ai.Actions, ai.Account, ai.Name, ai.Labels, logger, execId)
	if err != nil {
		return false, fmt.Errorf("[%s] Error occurred while validating the user :%s", execId, err)
	}
	if isValid {
		logger.Debugf("[%s] Authorized user. Access granted by authz handler", execId)
		return true, nil
	} else {
		logger.Debugf("[%s] User access denied by authz handler", execId)
		return false, nil
	}
}
