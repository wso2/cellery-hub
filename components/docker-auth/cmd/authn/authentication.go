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
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const (
	issuerClaim           = "iss"
	subjectClaim          = "sub"
	authTokenIssuerEnvVar = "REGISTRY_AUTH_TOKEN_ISSUER"
	idpCertEnvVar         = "IDP_CERT"
	dockerAuthCertEnvVar  = "REGISTRY_AUTH_TOKEN_ROOTCERTBUNDLE"
	logFile               = "/extension-logs/authentication.log"
)

func readCert(certPathEnv string, execId string) ([]byte, error) {
	key, err := ioutil.ReadFile(os.Getenv(certPathEnv))
	if err != nil {
		log.Printf("[%s] Unable to read the cert : %s\n", execId, err)
		return nil, err
	}
	log.Printf("[%s] Read cert successfully\n", execId)
	return key, nil
}

func getJWTClaims(token string, execId string) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token, nil)
	claims, ok := jwtToken.Claims.(jwt.MapClaims)
	if ok {
		log.Printf("[%s] Received JWT claims successfully\n", execId)
		return claims
	}
	return nil
}

func getClaimValue(claim jwt.MapClaims, claimKey string, execId string) string {
	value, ok := claim[claimKey].(string)
	if ok {
		log.Printf("[%s] Received JWT claim for the claim key %s successfully\n", execId, claimKey)
		return value
	}
	return ""
}

func validateToken(inToken string, cert []byte, execId string) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		log.Printf("[%s] Error parsing the cert : %s\n", execId, err)
		return false, err
	}
	token, err := jwt.Parse(inToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("[%s] Unexpected signing method: %s\n", execId, token.Header["alg"])
		}
		return publicRSA, err
	})
	if token != nil && token.Valid {
		log.Printf("[%s] Token received is valid\n", execId)
		return true, nil
	}
	log.Printf("[%s] Token received is invalid\n", execId)
	return false, err
}

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
		os.Exit(extension.ErrorExitCode)
	}
	log.SetOutput(file)

	execId, err := extension.GetExecID()
	if err != nil {
		log.Printf("Error in generating the execId : %s\n", err)
	}
	log.Printf("[%s] Authentication extension reached and token will be validated\n", execId)
	text := extension.ReadStdIn()

	log.Printf("[%s] Payload received from CLI : %s\n", execId, text)
	credentials := strings.Split(text, " ")
	if len(credentials) > 2 {
		log.Printf("[%s] Received more than two parameters\n", execId)
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
	if isJWT(execId) {
		validateJWT(token, uName, execId)
	} else {
		if validateAccessToken(token, uName, execId) {
			log.Printf("[%s] User successfully authenticated by validating token \n", execId)
			addAuthenticationLabel(true, execId)
			os.Exit(extension.SuccessExitCode)
		} else {
			log.Printf("[%s] User access token failed to authenticate\n", execId)
			if isPing {
				log.Printf("[%s] Since this is a ping request, exiting with auth fail status without passing to authorization filter\n", execId)
				os.Exit(extension.ErrorExitCode)
			} else {
				log.Printf("[%s] Failed authentication. But passing to authorization filter\n", execId)
				addAuthenticationLabel(false, execId)
				os.Exit(extension.SuccessExitCode)
			}
		}
	}
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

func validateJWT(token string, username string, execId string) {
	claim := getJWTClaims(token, execId)
	iss := getClaimValue(claim, issuerClaim, execId)
	sub := getClaimValue(claim, subjectClaim, execId)

	log.Printf("[%s] Token issuer : %s\n", execId, iss)
	log.Printf("[%s] Subject : %s\n", execId, sub)

	if sub != username {
		log.Printf("[%s] Username(%s) does not match with subject(%s) in JWT\n", execId, username, sub)
		os.Exit(extension.ErrorExitCode)
	}

	certificateInUse, err := readCert(idpCertEnvVar, execId)
	if err != nil {
		log.Printf("[%s] Unable to load idp cert file : %s\n", execId, err)
	}

	if iss == authTokenIssuerEnvVar {
		certificateInUse, err = readCert(dockerAuthCertEnvVar, execId)
		if err != nil {
			log.Printf("[%s] Unable to load docker auth file : %s\n", execId, err)
		}
	}

	tokenValidity, err := validateToken(token, certificateInUse, execId)
	if err != nil {
		log.Printf("[%s] Token is not valid : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Signature verified\n", execId)

	if tokenValidity {
		log.Printf("[%s] User successfully authenticated\n", execId)
		os.Exit(extension.SuccessExitCode)
	} else {
		log.Printf("[%s] Authentication failed\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
}

// isJWT checks whether the token is jwt token or access token.
func isJWT(execId string) bool {
	isJWTEnv := os.Getenv("IS_JWT")
	var isJWT bool
	if len(isJWTEnv) == 0 {
		log.Printf("[%s] Error: IS_JWT environment variable is empty\n", execId)
		os.Exit(extension.ErrorExitCode)
	} else {
		if isJWTEnv == "true" {
			log.Printf("[%s] Received a JWT token\n", execId)
			isJWT = true
		} else if isJWTEnv == "false" {
			log.Printf("[%s] Received an access token\n", execId)
			isJWT = false
		} else {
			log.Printf("[%s] Error: Wrong environment value given. The value should be either true or false\n",
				execId)
			os.Exit(extension.ErrorExitCode)
		}
	}
	return isJWT
}

// validateAccessToken is used to introspect the access token
func validateAccessToken(token string, providedUsername string, execId string) bool {
	introspectionUrl := resolveIntrospectionUrl(execId)
	payload := strings.NewReader("token=" + token)
	req, err := http.NewRequest("POST", introspectionUrl, payload)
	if err != nil {
		log.Printf("[%s] Error creating new request to the introspection endpoint : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	}
	username, password := resolveCredentials(execId)
	req.SetBasicAuth(username, password)
	// todo Remove the the host verification turning off
	certificateInUse, err := readCert(idpCertEnvVar, execId)
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(certificateInUse)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	res, err := client.Do(req)
	if err != nil {
		log.Printf("[%s] Error sending the request to the introspection endpoint : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	}

	if res.StatusCode == 400 {
		log.Printf("[%s] 400 status code returned from IDP probably due to empty token\n", execId)
		return false
	}
	if res.StatusCode != 200 {
		log.Printf("[%s] Error while calling IDP, status code :%d. Exiting without authorization\n", execId,
			res.StatusCode)
		os.Exit(extension.ErrorExitCode)
	}
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("[%s] Error reading the response from introspection endpoint. Exiting without authorization : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	} else {
		log.Printf("[%s] Response recieved from introspection endpoint : %s\n", execId, body)
	}

	var result map[string]interface{}
	err = json.Unmarshal([]byte(string(body)), &result)
	if err != nil {
		log.Printf("[%s] Error un marshalling the json : %s\n", execId, err)
		os.Exit(extension.ErrorExitCode)
	}
	isActive, ok := (result["active"]).(bool)
	if !ok {
		log.Printf("[%s] Error casting active to boolean. This may be due to a invalid token\n", execId)
		return false
	}
	log.Printf("[%s] Resolved acess token validity\n", execId)
	isExpired := isExpired(result["exp"], execId)
	isValidUser := isValidUser(result["username"], providedUsername, execId)
	return isExpired && isActive && isValidUser
}

// resolves the IS host and port from the environment variables.
// If the environment is not set the port and host will be resolved through the config file.
func resolveIntrospectionUrl(execId string) string {
	idpEndPoint := os.Getenv("IDP_END_POINT")
	introspectionEP := os.Getenv("INTROSPECTION_END_POINT")
	if len(introspectionEP) == 0 {
		log.Printf("[%s] Error: INTROSPECTION_END_POINT environment variable is empty\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
	if len(idpEndPoint) == 0 {
		log.Printf("[%s] Error: IDP_END_POINT environment variable is empty\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
	return idpEndPoint + introspectionEP
}

// resolveCredentials resolves the user credentials of the user that is used to communicate to introspection endpoint
func resolveCredentials(execId string) (string, string) {
	username := os.Getenv("USERNAME")
	if len(username) == 0 {
		log.Printf("[%s] Error: USERNAME environment variable is empty\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
	password := os.Getenv("PASSWORD")
	if len(password) == 0 {
		log.Printf("[%s] Error: PASSWORD environment variable is empty\n", execId)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Suceesfully received credentials\n", execId)
	return username, password
}

// isValidUser checks whether the provided username matches with the username in the token
func isValidUser(tokenUsername interface{}, providedUsername string, execId string) bool {
	if username, ok := tokenUsername.(string); ok {
		usernameTokens := strings.Split(username, "@")
		log.Printf("[%s] User needed to be validated %s with provided username %s\n",
			execId, usernameTokens[0], providedUsername)
		if providedUsername == usernameTokens[0] {
			log.Printf("[%s] User received is valid\n", execId)
			return true
		}
		log.Printf("[%s] Username does not match with the provided username %s\n", execId, providedUsername)
	} else {
		log.Printf("[%s] Error casting username to string. This may be due to a invalid token\n", execId)
		return false
	}
	return false
}

// isExpired validated whether the username is expired
func isExpired(timestamp interface{}, execId string) bool {
	if validity, ok := timestamp.(float64); ok {
		tm := time.Unix(int64(validity), 0)
		remainder := tm.Sub(time.Now())
		if remainder > 0 {
			log.Printf("[%s] Token received is not expired\n", execId)
			return true
		}
		log.Printf("[%s] Token received is expired. Token expiry time is %s, while the system time is %s\n",
			execId, tm, time.Now())
	} else {
		log.Printf("[%s] Error casting timestamp %s to string. This may be due to a invalid token\n",
			execId, timestamp)
		return false
	}
	return false
}
