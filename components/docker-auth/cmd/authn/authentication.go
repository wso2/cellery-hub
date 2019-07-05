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
	"strconv"
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
			os.Exit(extension.MisuseExitCode)
		}
	}()
	if err != nil {
		log.Println("Error creating the file :", err)
		os.Exit(extension.ErrorExitCode)
	}
	log.SetOutput(file)

	execId, err := extension.GetExecID()
	if err != nil {
		log.Printf("Error in generating the execId : %s\n", err)
		os.Exit(extension.ErrorExitCode)
	}

	text := extension.ReadStdIn()
	log.Printf("[%s] Payload received from CLI : %s\n", execId, text)
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		log.Printf("[%s] Cannot parse the Input from the Auth service", execId)
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	incomingToken := credentials[1]
	tokenArray := strings.Split(incomingToken, ":")
	token := tokenArray[0]

	isPing := len(tokenArray) > 1 && tokenArray[1] == "ping"
	if isPing {
		log.Printf("[%s] Ping request recieved\n", execId)
	}

	url := resolveAuthenticationUrl(execId)
	if url == "" {
		log.Printf("[%s] Authentication end point not found. Exiting with error exit code", execId)
		os.Exit(extension.ErrorExitCode)
	}
	payload := strings.NewReader("{\"uName\":\"" + uName + "\",\"token\":\"" + token + "\"}")

	log.Printf("[%s] Calling %s", execId, url)
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

	log.Printf("[%s] Response received from the auth server with the status code %d", execId, res.StatusCode)

	if res.StatusCode == http.StatusUnauthorized {
		log.Printf("[%s] User access token failed to authenticate. Evaluating ping", execId)
		if isPing {
			log.Printf("[%s] Since this is a ping request, exiting with auth fail status without passing to "+
				" authorization filter\n", execId)
			os.Exit(extension.ErrorExitCode)
		} else {
			log.Printf("[%s] Failed authentication. But passing to authorization filter", execId)
			addAuthenticationLabel(false, execId)
			os.Exit(extension.SuccessExitCode)
		}
	}
	if res.StatusCode == http.StatusOK {
		log.Printf("[%s] User successfully authenticated by validating token. Exiting with success exit code",
			execId)
		addAuthenticationLabel(true, execId)
		os.Exit(extension.SuccessExitCode)
	}
}

// resolves the authentication end point from the environment variables.
func resolveAuthenticationUrl(execId string) string {
	authServer := os.Getenv("AUTH_SERVER_URL")
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

func addAuthenticationLabel(isAuthenticated bool, execId string) {
	authResultString := strconv.FormatBool(isAuthenticated)
	label := "{\"labels\": {\"isAuthSuccess\": [\"" + authResultString + "\"]}}"
	log.Printf("[%s] Adding labels to authorization ext from authn ext: %s\n", execId, label)
	_, err := os.Stdout.WriteString(label)
	if err != nil {
		log.Printf("[%s] Error in writing to standard output. Hence failing authentication. No authorizatino done", err)
		os.Exit(extension.ErrorExitCode)
	}
}
