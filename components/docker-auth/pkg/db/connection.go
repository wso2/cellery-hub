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
	"strconv"
	"time"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

func GetDbConnectionPool() (*sql.DB, error) {
	dbDriver := extension.MYSQL_DRIVER
	dbUser := os.Getenv(extension.MYSQL_USER_ENV_VAR)
	dbPass := os.Getenv(extension.MYSQL_PASSWORD_ENV_VAR)
	dbName := extension.DB_NAME
	host := os.Getenv(extension.MYSQL_HOST_ENV_VAR)
	port := os.Getenv(extension.MYSQL_PORT_ENV_VAR)
	dbPoolConfigurations, err := resolvePoolingConfigurations()
	if err != nil {
		log.Printf("No db connction pooling configurations found : %s", err)
		return nil, fmt.Errorf("failed to fetch db connection pooling configurations : %v", err)
	}

	conn := fmt.Sprint(dbUser, ":", dbPass, "@tcp(", host, ":", port, ")/"+dbName)
	log.Printf("Creating a new db connection pool: %v", conn)

	dbConnection, err := sql.Open(dbDriver, conn)

	if err != nil {
		log.Printf("Failed to create database connection pool: %s", err)
		return nil, fmt.Errorf("error occurred while establishing database connection pool "+
			" : %v", err)
	}

	dbConnection.SetMaxOpenConns(dbPoolConfigurations[extension.MaxIdleConnectionsEnvVar])
	dbConnection.SetMaxIdleConns(dbPoolConfigurations[extension.ConnectionMaxLifetimeEnvVar])
	dbConnection.SetConnMaxLifetime(time.Minute * time.Duration(dbPoolConfigurations[extension.
		ConnectionMaxLifetimeEnvVar]))

	err = dbConnection.Ping()
	if err != nil {
		log.Printf("Failed to ping database connection pool: %s", err)
		return nil, fmt.Errorf("error occurred while pinging database connection pool "+
			" : %v", err)
	}

	log.Printf("Ping successful. DB connection pool established")

	return dbConnection, nil
}

func resolvePoolingConfigurations() (map[string]int, error) {
	m := make(map[string]int)

	maxOpenConnections, err := strconv.Atoi(os.Getenv(extension.MaxOpenConnectionsEnvVar))
	if err != nil {
		log.Printf("Failed to convert max open connections string into integer : %s", err)
		return nil, fmt.Errorf("error occurred while converting max open connections string into integer "+
			" : %v", err)
	}
	m[extension.MaxOpenConnectionsEnvVar] = maxOpenConnections
	maxIdleConnections, err := strconv.Atoi(os.Getenv(extension.MaxIdleConnectionsEnvVar))
	if err != nil {
		log.Printf("Failed to convert max idle connections string into integer : %s", err)
		return nil, fmt.Errorf("error occurred while converting max idle connections string into integer "+
			" : %v", err)
	}
	m[extension.MaxIdleConnectionsEnvVar] = maxIdleConnections
	maxLifetime, err := strconv.Atoi(os.Getenv(extension.ConnectionMaxLifetimeEnvVar))
	if err != nil {
		log.Printf("Failed to convert max lifetime string into integer : %s", err)
		return nil, fmt.Errorf("error occurred while converting max lifetime string into integer "+
			" : %v", err)
	}
	m[extension.ConnectionMaxLifetimeEnvVar] = maxLifetime
	log.Printf("Fetched db connection pooling configurations. MaxOpenConns = %d, "+
		"MaxIdleConns = %d, MaxLifetime = %d", maxOpenConnections, maxIdleConnections, maxLifetime)

	return m, nil
}
