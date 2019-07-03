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
	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	authServerPort := ":8080"
	log.Printf("Auth server is starting on port %s", authServerPort)
	execId, err := extension.GetExecID()
	if err != nil {
		log.Printf("Error in generating the execId : %s\n", err)
	}

	http.HandleFunc("/authentication", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] Authentication endpoint reached", execId)
		var uName = r.FormValue("uName")
		var token = r.FormValue("token")

		log.Printf("[%s] Authentication request received by server. Uname : %s, Token : %s",execId, uName, token)

		authnRes := Authenticate(uName, token, execId)

		if authnRes == extension.SuccessExitCode {
			log.Printf("[%s] Authentication Success. Writing status code %d as response", execId,
				http.StatusOK)
			w.WriteHeader(http.StatusOK)
		} else {
			log.Printf("[%s] Authentication Failed. Writing status code %d as response", execId,
				http.StatusUnauthorized)
			w.WriteHeader(http.StatusUnauthorized)
		}
	})

	http.HandleFunc("/authorization", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] Authorization endpoint reached", execId)

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			log.Printf("[%s] Error occured while reading POST request for authorization : %s", execId, err)
		}

		log.Printf("[%s] Authorization request received by server", execId)

		authzRes := Authorization(string(body), execId)

		if authzRes == extension.SuccessExitCode {
			log.Printf("[%s] Authorization Success. Writing status code %d as response", execId,
				http.StatusOK)
			w.WriteHeader(http.StatusOK)
		} else {
			log.Printf("[%s] Authorization Failed. Writing status code %d as response", execId,
				http.StatusUnauthorized)
			w.WriteHeader(http.StatusUnauthorized)
		}
	})
	_ = http.ListenAndServe(authServerPort, nil)
}
