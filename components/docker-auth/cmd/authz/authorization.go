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
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const (
	logFile = "/extension-logs/authz-ext.log"
)

func main() {
	err := os.MkdirAll("/extension-logs", os.ModePerm)
	file, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	defer func() {
		err = file.Close()
		if err != nil {
			log.Printf("Error while closing the file : %s\n", err)
			os.Exit(2)
		}
	}()
	if err != nil {
		log.Println("Error creating the file :", err)
		os.Exit(1)
	}
	log.SetOutput(file)

	execId, err := extension.GetExecID()
	if err != nil {
		log.Printf("Error in generating the execId : %s\n", err)
		os.Exit(extension.ErrorExitCode)
	}

	accessToken := extension.ReadStdIn()
	log.Printf("[%s] Access token received\n", execId)

	url := resolveAuthorizationUrl(execId)
	if url == "" {
		log.Printf("[%s] Authorization end point not found. Exiting with error exit code", execId)
		os.Exit(extension.ErrorExitCode)
	}

	payload := strings.NewReader(accessToken)
	log.Printf("[%s] Calling %s with accessToken : %s as payload", execId, url, accessToken)

	req, _ := http.NewRequest("POST", url, payload)
	req.Header.Add(extension.ExecIdHeaderName, execId)

	res, _ := http.DefaultClient.Do(req)

	defer func() {
		err := res.Body.Close()
		if err != nil {
			log.Printf("[%s] Error occured while closing the response received from auth server "+
				" : %v\n", execId, err)
		}
	}()

	log.Printf("[%s] Response received from the auth server with the status code : %d", execId, res.StatusCode)

	if res.StatusCode == http.StatusUnauthorized {
		log.Printf("[%s] Unauthorized request. Exiting with error exit code", execId)
		os.Exit(extension.ErrorExitCode)
	}
	if res.StatusCode == http.StatusOK {
		log.Printf("[%s] Authorized request. Exiting with success exit code", execId)
		os.Exit(extension.SuccessExitCode)
	}
}

// resolves the authorization end point from the environment variables.
func resolveAuthorizationUrl(execId string) string {
	authServer := os.Getenv("AUTH_SERVER_URL")
	authorizationEP := os.Getenv("AUTHORIZATION_END_POINT")
	if len(authServer) == 0 {
		log.Printf("[%s] Error: AUTH_SERVER environment variable is empty\n", execId)
		return ""
	}
	if len(authorizationEP) == 0 {
		log.Printf("[%s] Error: AUTHORIZATION_END_POINT environment variable is empty\n", execId)
		return ""
	}
	return authServer + authorizationEP
}
