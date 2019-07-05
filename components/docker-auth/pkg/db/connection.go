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

package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

func GetDbConnection() (*sql.DB, error) {
	dbDriver := extension.MYSQL_DRIVER
	dbUser := os.Getenv(extension.MYSQL_USER_ENV_VAR)
	dbPass := os.Getenv(extension.MYSQL_PASSWORD_ENV_VAR)
	dbName := extension.DB_NAME
	host := os.Getenv(extension.MYSQL_HOST_ENV_VAR)
	port := os.Getenv(extension.MYSQL_PORT_ENV_VAR)

	conn := fmt.Sprint(dbUser, ":", dbPass, "@tcp(", host, ":", port, ")/"+dbName)
	log.Printf("Creating a new connection: %v", conn)

	dbConnection, err := sql.Open(dbDriver, conn)

	if err != nil {
		log.Printf("Failed to create database connection : %s", err)
		return nil, fmt.Errorf("error occurred while establishing database connection "+
			" : %s", err)
	}
	err = dbConnection.Ping()
	if err != nil {
		log.Printf("Failed to verify the liveness of connection to the database : %s", err)
		return nil, err
	}
	log.Printf("DB connection established")

	dbConnection.SetMaxOpenConns(extension.MaxOpenConnectionsEnvVar)
	dbConnection.SetMaxIdleConns(extension.MaxIdleConnectionsEnvVar)
	dbConnection.SetConnMaxLifetime(extension.ConnectionMaxLifetimeEnvVar)

	return dbConnection, nil
}
