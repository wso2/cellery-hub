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
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const logFile = "/extension-logs/authorization.log"

func dbConn() (*sql.DB, error) {
	dbDriver := extension.MYSQL_DRIVER
	dbUser := os.Getenv(extension.MYSQL_USER_ENV_VAR)
	dbPass := os.Getenv(extension.MYSQL_PASSWORD_ENV_VAR)
	dbName := extension.DB_NAME
	host := os.Getenv(extension.MYSQL_HOST_ENV_VAR)
	port := os.Getenv(extension.MYSQL_PORT_ENV_VAR)

	db, err := sql.Open(dbDriver, fmt.Sprint(dbUser, ":", dbPass, "@tcp(", host, ":", port, ")/"+dbName))
	if err != nil {
		log.Println("Error occurred while connecting to the database")
		return nil, err
	}
	return db, nil
}

func main() {
	err := os.MkdirAll("/extension-logs", os.ModePerm)
	if err != nil {
		log.Println("Error creating the file :", err)
	}
	file, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("Error opening file: %s\n", err)
	}
	defer func() {
		err = file.Close()
		if err != nil {
			log.Printf("Error occurred  while closing the file : %s\n", err)
			os.Exit(2)
		}
	}()
	if err != nil {
		os.Exit(extension.ErrorExitCode)
	}
	log.SetOutput(file)
	execId, err := extension.GetExecID()
	log.Printf("[%s] Authorization extension reached and access will be validated\n", execId)
	accessToken := extension.ReadStdIn()
	log.Printf("[%s] Access token received\n", execId)
	db, err := dbConn()
	if err != nil {
		log.Printf("[%s] Error occurred while establishing the mysql connection : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	}
	isValid, err := extension.ValidateAccess(db, accessToken, execId)
	if err != nil {
		log.Printf("[%s] Error occurred while validating the user :%s\n", execId, err)
	}
	if isValid {
		err = db.Close()
		if err != nil {
			log.Printf("[%s] Error occurred while closing the db connection :%s\n", execId, err)
		}
		log.Printf("[%s] User access granted\n", execId)
		os.Exit(extension.SuccessExitCode)
	} else {
		err = db.Close()
		if err != nil {
			log.Printf("[%s] Error occurred while closing the db connection :%s\n", execId, err)
		}
		log.Printf("[%s] User access denied\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
}
