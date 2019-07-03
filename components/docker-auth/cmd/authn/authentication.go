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
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const (
	logFile = "/extension-logs/authn-ext.log"
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
	}

	text := extension.ReadStdIn()
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		log.Printf("[%s] Cannot parse the Input from the Auth service", execId)
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	incomingToken := credentials[1]
	tokenArray := strings.Split(incomingToken, ":")
	token := tokenArray[0]

	authnEP := resolveAuthenticationUrl(execId)
	if authnEP == "" {
		log.Printf("[%s] Authentication end point not found. Exiting with error exit code", execId)
		os.Exit(extension.ErrorExitCode)
	}
	url := fmt.Sprintf("%s?uName=%s&token=%s", authnEP, uName, token)

	log.Printf("[%s] Calling %s", execId, url)
	req, _ := http.NewRequest("GET", url, nil)
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	log.Printf("[%s] Response received from the auth server with the status code %d", execId, res.StatusCode)

	if res.StatusCode == http.StatusUnauthorized {
		log.Printf("[%s] Authentication failed. Exiting with error exit code", execId)
		os.Exit(extension.ErrorExitCode)
	}
	if res.StatusCode == http.StatusOK {
		log.Printf("[%s] Authentication Success. Exiting with success exit code", execId)
		os.Exit(extension.SuccessExitCode)
	}
}

// resolves the authentication end point from the environment variables.
func resolveAuthenticationUrl(execId string) string {
	authServer := os.Getenv("AUTH_SERVER")
	authenticationEP := os.Getenv("AUTHENTICATION_END_POINT")
	if len(authServer) == 0 {
		log.Printf("[%s] Error: AUTH_SERVER environment variable is empty\n", execId)
		return ""
	}
	if len(authenticationEP) == 0 {
		log.Printf("[%s] Error: AUTHENTICATION_END_POINT environment variable is empty\n", execId)
		return ""
	}
	return authServer + authenticationEP
}
