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

	text := extension.ReadStdIn()
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		log.Printf("Cannot parse the Input from the Auth service")
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]

	log.Printf("Username : %s, Password : %s", uName, token)
	url := fmt.Sprintf("http://localhost:8080/authentication?uName=%s&token=%s", uName, token)
	log.Printf("Called %s", url)

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()

	log.Printf("Response received from the auth server with the status code : %d", res.StatusCode)

	if res.StatusCode == http.StatusUnauthorized {
		log.Printf("Authentication failed for user %s. Exiting with error exit code", uName)
		os.Exit(extension.ErrorExitCode)
	}
	if res.StatusCode == http.StatusOK {
		log.Printf("user %s is successfully authenticated. Exiting with success exit code", uName)
		os.Exit(extension.SuccessExitCode)
	}

}
