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
const userPushRole = "push"

const MysqlUserEnvVar = "MYSQL_USER"
const MysqlPasswordEnvVar = "MYSQL_PASSWORD"
const MysqlHostEnvVar = "MYSQL_HOST"
const MysqlPortEnvVar = "MYSQL_PORT"
const MysqlDriver = "mysql"
const DbName = "CELLERY_HUB"
const IdpUsernameEnvVar = "USERNAME"
const IdppasswordEnvVar = "PASSWORD"

const MaxOpenConnectionsEnvVar = "MAX_OPEN_CONNECTIONS"
const MaxIdleConnectionsEnvVar = "MAX_IDLE_CONNECTIONS"
const ConnectionMaxLifetimeEnvVar = "MAX_LIFE_TIME"

const pullAction = "pull"
const pushAction = "push"
const deleteAction = "delete"
const publicVisibility = "PUBLIC"

// db queries
const getVisibilityQuery = "SELECT VISIBILITY FROM REGISTRY_ARTIFACT_IMAGE " +
	"INNER JOIN REGISTRY_ORGANIZATION ON REGISTRY_ORGANIZATION.ORG_NAME=REGISTRY_ARTIFACT_IMAGE.ORG_NAME " +
	"WHERE REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=? AND " +
	"REGISTRY_ORGANIZATION.ORG_NAME=? LIMIT 1"
const getUserAvailabilityQuery = "SELECT 1 FROM " +
	"REGISTRY_ORG_USER_MAPPING " +
	"WHERE REGISTRY_ORG_USER_MAPPING.USER_UUID=? AND REGISTRY_ORG_USER_MAPPING.ORG_NAME=?"
const getUserRoleQuery = "SELECT USER_ROLE FROM " +
	"REGISTRY_ORG_USER_MAPPING " +
	"WHERE REGISTRY_ORG_USER_MAPPING.USER_UUID=? AND REGISTRY_ORG_USER_MAPPING.ORG_NAME=?"
