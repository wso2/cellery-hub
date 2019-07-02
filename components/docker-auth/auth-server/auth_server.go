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

	http.HandleFunc("/authentication", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Authentication endpoint reached")
		var uName = r.FormValue("uName")
		var token = r.FormValue("token")

		log.Printf("Authentication request received by server. Uname : %s, Token : %s", uName, token)
		authnRes := Authenticate(uName, token)
		log.Println("authnRes :", authnRes)
		if authnRes == extension.SuccessExitCode {
			log.Println("Authentication Success")
			w.WriteHeader(http.StatusOK)
		} else {
			log.Println("Authentication Failed")
			w.WriteHeader(http.StatusUnauthorized)
		}
	})

	http.HandleFunc("/authorization", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Authorization endpoint reached")

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		log.Printf("Authorization request received by server. Token : %s", string(body))

		authzRes := Authorization(string(body))

		if authzRes == extension.SuccessExitCode {
			log.Println("Authorization Success")
			w.WriteHeader(http.StatusOK)
		} else {
			log.Println("Authorization Failed")
			w.WriteHeader(http.StatusUnauthorized)
		}
	})
	_ = http.ListenAndServe(authServerPort, nil)
}
