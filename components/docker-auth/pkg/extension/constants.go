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

package extension

const userAdminRole = "admin"
const userPullRole = "pull"
const userPushRole = "push"

const MYSQL_USER_ENV_VAR = "MYSQL_USER"
const MYSQL_PASSWORD_ENV_VAR = "MYSQL_PASSWORD"
const MYSQL_HOST_ENV_VAR = "MYSQL_HOST"
const MYSQL_PORT_ENV_VAR = "MYSQL_PORT"
const MYSQL_DRIVER = "mysql"
const DB_NAME = "CELLERY_HUB"

const MaxOpenConnectionsEnvVar = "MAX_OPEN_CONNECTIONS"
const MaxIdleConnectionsEnvVar = "MAX_IDLE_CONNECTIONS"
const ConnectionMaxLifetimeEnvVar = "MAX_LIFE_TIME"

const pullAction = "pull"
const publicVisibility = "PUBLIC"

const ExecIdHeaderName = "x-cellery-hub-exec-id"

// db queries
const getImageAndRoleQuery = "SELECT USER_ROLE, VISIBILITY FROM " +
	"REGISTRY_ORGANIZATION " +
	"INNER JOIN REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT_IMAGE.ORG_NAME = REGISTRY_ORGANIZATION.ORG_NAME " +
	"INNER JOIN REGISTRY_ORG_USER_MAPPING ON REGISTRY_ORG_USER_MAPPING.ORG_NAME = REGISTRY_ORGANIZATION.ORG_NAME " +
	"WHERE REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=? AND REGISTRY_ORG_USER_MAPPING.USER_UUID=?"
const getVisibilityQuery = "SELECT VISIBILITY FROM REGISTRY_ARTIFACT_IMAGE " +
	"INNER JOIN REGISTRY_ORGANIZATION ON REGISTRY_ORGANIZATION.ORG_NAME=REGISTRY_ARTIFACT_IMAGE.ORG_NAME " +
	"WHERE REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=? AND " +
	"REGISTRY_ORGANIZATION.ORG_NAME = ? LIMIT 1"
const getUserAvailabilityQuery = "SELECT 1 FROM " +
	"REGISTRY_ORG_USER_MAPPING " +
	"WHERE REGISTRY_ORG_USER_MAPPING.USER_UUID=? AND REGISTRY_ORG_USER_MAPPING.ORG_NAME=?"
const getUserRoleQuery = "SELECT USER_ROLE FROM " +
	"REGISTRY_ORG_USER_MAPPING " +
	"WHERE REGISTRY_ORG_USER_MAPPING.USER_UUID=? AND REGISTRY_ORG_USER_MAPPING.ORG_NAME=?"
