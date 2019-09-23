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
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"go.uber.org/zap"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

func GetDbConnectionPool(logger *zap.SugaredLogger) (*sql.DB, error) {
	dbDriver := extension.MysqlDriver
	dbUser := os.Getenv(extension.MysqlUserEnvVar)
	dbPass := os.Getenv(extension.MysqlPasswordEnvVar)
	dbName := extension.DbName
	host := os.Getenv(extension.MysqlHostEnvVar)
	port := os.Getenv(extension.MysqlPortEnvVar)
	dbPoolConfigurations, err := resolvePoolingConfigurations(logger)
	if err != nil {
		logger.Debugf("No db connection pooling configurations found : %s", err)
		return nil, fmt.Errorf("failed to fetch db connection pooling configurations : %v", err)
	}

	conn := fmt.Sprint(dbUser, ":", dbPass, "@tcp(", host, ":", port, ")/"+dbName)
	logger.Debugf("Creating a new db connection pool: %v", conn)

	dbConnection, err := sql.Open(dbDriver, conn)

	if err != nil {
		return nil, fmt.Errorf("error occurred while establishing database connection pool "+
			" : %v", err)
	}

	dbConnection.SetMaxOpenConns(dbPoolConfigurations[extension.MaxIdleConnectionsEnvVar])
	dbConnection.SetMaxIdleConns(dbPoolConfigurations[extension.ConnectionMaxLifetimeEnvVar])
	dbConnection.SetConnMaxLifetime(time.Minute * time.Duration(dbPoolConfigurations[extension.
		ConnectionMaxLifetimeEnvVar]))

	err = dbConnection.Ping()
	if err != nil {
		return nil, fmt.Errorf("error occurred while pinging database connection pool "+
			" : %v", err)
	}

	logger.Debugf("Ping successful. DB connection pool established")

	return dbConnection, nil
}

func resolvePoolingConfigurations(logger *zap.SugaredLogger) (map[string]int, error) {
	m := make(map[string]int)

	maxOpenConnections, err := strconv.Atoi(os.Getenv(extension.MaxOpenConnectionsEnvVar))
	if err != nil {
		return nil, fmt.Errorf("error occurred while converting max open connections string into integer "+
			" : %v", err)
	}
	m[extension.MaxOpenConnectionsEnvVar] = maxOpenConnections
	maxIdleConnections, err := strconv.Atoi(os.Getenv(extension.MaxIdleConnectionsEnvVar))
	if err != nil {
		return nil, fmt.Errorf("error occurred while converting max idle connections string into integer "+
			" : %v", err)
	}
	m[extension.MaxIdleConnectionsEnvVar] = maxIdleConnections
	maxLifetime, err := strconv.Atoi(os.Getenv(extension.ConnectionMaxLifetimeEnvVar))
	if err != nil {
		return nil, fmt.Errorf("error occurred while converting max lifetime string into integer "+
			" : %v", err)
	}
	m[extension.ConnectionMaxLifetimeEnvVar] = maxLifetime
	logger.Debugf("Fetched db connection pooling configurations. MaxOpenConns = %d, "+
		"MaxIdleConns = %d, MaxLifetime = %d", maxOpenConnections, maxIdleConnections, maxLifetime)

	return m, nil
}
