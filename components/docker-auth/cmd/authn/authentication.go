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
	"encoding/json"
	"fmt"
	"github.com/golang/glog"
	"io/ioutil"
	"log"
	"net/http"
	"os"
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

func readCert(certPathEnv string, uuid string) ([]byte, error) {
	key, err := ioutil.ReadFile(os.Getenv(certPathEnv))
	if err != nil {
		log.Printf("[%s] Unable to read the cert : %s\n", uuid, err)
		return nil, err
	}
	log.Printf("[%s] Read cert successfully\n", uuid)
	return key, nil
}

func getJWTClaims(token string, uuid string) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token, nil)
	claims, ok := jwtToken.Claims.(jwt.MapClaims)
	if ok {
		log.Printf("[%s] Received JWT claims successfully\n", uuid)
		return claims
	}
	return nil
}

func getClaimValue(claim jwt.MapClaims, claimKey string, uuid string) string {
	value, ok := claim[claimKey].(string)
	if ok {
		log.Printf("[%s] Received JWT claim for the claim key %s successfully\n", uuid, claimKey)
		return value
	}
	return ""
}

func validateToken(inToken string, cert []byte, uuid string) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		log.Printf("[%s] Error parsing the cert : %s\n", uuid, err)
		return false, err
	}
	token, err := jwt.Parse(inToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("[%s] Unexpected signing method: %s\n", uuid, token.Header["alg"])
		}
		return publicRSA, err
	})
	if token != nil && token.Valid {
		log.Printf("[%s] Token received is valid\n", uuid)
		return true, nil
	}
	log.Printf("[%s] Token received is invalid\n", uuid)
	return false, err
}

func main() {
	file, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("Error opening file: %s\n", err)
	}
	defer func() {
		err = file.Close()
		if err != nil {
			log.Printf("Error while closing the file : %s\n", err)
			os.Exit(2)
		}
	}()
	if err != nil {
		os.Exit(extension.ErrorExitCode)
	}
	log.SetOutput(file)

	uuid, err := extension.GetUUID()
	log.Println("Uuid", uuid)
	if err != nil {
		log.Printf("Error in generating the uuid : %s\n", err)
	}

	glog.Info("File ", file)
	glog.Flush()
	log.Printf("[%s] Authentication extension reached and token will be validated\n", uuid)
	text := extension.ReadStdIn()
	log.Printf("[%s] Payload received from CLI\n", uuid)
	credentials := strings.Split(text, " ")
	if len(credentials) != 2 {
		log.Printf("[%s] Received more than two parameters\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]
	if isJWT(uuid) {
		validateJWT(token, uName, uuid)
	} else {
		if validateAccessToken(token, uName, uuid) {
			log.Printf("[%s] User successfully authenticated\n", uuid)
			os.Exit(extension.SuccessExitCode)
		} else {
			log.Printf("[%s] User failed to authenticate\n", uuid)
			os.Exit(extension.ErrorExitCode)
		}
	}
}

func validateJWT(token string, username string, uuid string) {
	claim := getJWTClaims(token, uuid)
	iss := getClaimValue(claim, issuerClaim, uuid)
	sub := getClaimValue(claim, subjectClaim, uuid)

	log.Printf("[%s] Token issuer : %s\n", uuid, iss)
	log.Printf("[%s] Subject : %s\n", uuid, sub)

	if sub != username {
		log.Printf("[%s] Username(%s) does not match with subject(%s) in JWT\n", uuid, username, sub)
		os.Exit(extension.ErrorExitCode)
	}

	certificateInUse, err := readCert(idpCertEnvVar, uuid)

	if iss == authTokenIssuerEnvVar {
		certificateInUse, err = readCert(dockerAuthCertEnvVar, uuid)
	}
	if err != nil {
		log.Printf("[%s] Unable to load cert file : %s\n", uuid, err)
	}

	tokenValidity, err := validateToken(token, certificateInUse, uuid)
	if err != nil {
		log.Printf("[%s] Token is not valid : %s\n", uuid, err)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Signature verified\n", uuid)

	if tokenValidity {
		log.Printf("[%s] User successfully authenticated\n", uuid)
		os.Exit(extension.SuccessExitCode)
	} else {
		log.Printf("[%s] Authentication failed\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
}

// isJWT checks whether the token is jwt token or access token.
func isJWT(uuid string) bool {
	isJWTEnv := os.Getenv("IS_JWT")
	var isJWT bool
	if len(isJWTEnv) == 0 {
		log.Printf("[%s] Error: IS_JWT environment variable is empty\n", uuid)
		os.Exit(extension.ErrorExitCode)
	} else {
		if isJWTEnv == "true" {
			log.Printf("[%s] Received a JWT token\n", uuid)
			isJWT = true
		} else if isJWTEnv == "false" {
			log.Printf("[%s] Received a access token\n", uuid)
			isJWT = false
		} else {
			log.Printf("[%s] Error: Wrong environment value given. The value should be either true or false\n",
				uuid)
			os.Exit(extension.ErrorExitCode)
		}
	}
	return isJWT
}

// validateAccessToken is used to introspect the access token
func validateAccessToken(token string, providedUsername string, uuid string) bool {
	idpHost, idpPort := resolveIdpHostAndPort(uuid)
	url := "https://" + idpHost + ":" + idpPort + "/oauth2/introspect"
	payload := strings.NewReader("token=" + token)
	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		log.Printf("[%s] Error creating new request to the introspection endpoint : %s\n", uuid, err)
		os.Exit(extension.ErrorExitCode)
	}
	username, password := resolveCredentials(uuid)
	req.SetBasicAuth(username, password)
	// todo Remove the the host verification turning off
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[%s] Error sending the request to the introspection endpoint : %s\n", uuid, err)
		os.Exit(extension.ErrorExitCode)
	}
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("[%s] Error reading the response from introspection endpoint : %s\n", uuid, err)
		os.Exit(extension.ErrorExitCode)
	}
	var result map[string]interface{}
	err = json.Unmarshal([]byte(string(body)), &result)
	if err != nil {
		log.Printf("[%s] Error un marshalling the json : %s\n", uuid, err)
		os.Exit(extension.ErrorExitCode)
	}
	isActive, ok := (result["active"]).(bool)
	if !ok {
		log.Printf("[%s] Error casting active to boolean. This may be due to a invalid token\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Resolved access token values successfully\n", uuid)
	isExpired := isExpired(result["exp"], uuid)
	isValidUser := isValidUser(result["username"], providedUsername, uuid)
	return isExpired && isActive && isValidUser
}

// resolves the IS host and port from the environment variables.
// If the environment is not set the port and host will be resolved through the config file.
func resolveIdpHostAndPort(uuid string) (string, string) {
	idpHost := os.Getenv("IDP_HOST")
	if len(idpHost) == 0 {
		log.Printf("[%s] Error: IDP_HOST environment variable is empty\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	idpPort := os.Getenv("IDP_PORT")
	if len(idpPort) == 0 {
		log.Printf("[%s] Error: IDP_PORT environment variable is empty\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Suceesfully resolved idp host and idp port as :%s:%s\n", uuid, idpHost, idpPort)
	return idpHost, idpPort
}

// resolveCredentials resolves the user credentials of the user that is used to communicate to introspection endpoint
func resolveCredentials(uuid string) (string, string) {
	username := os.Getenv("USERNAME")
	if len(username) == 0 {
		log.Printf("[%s] Error: USERNAME environment variable is empty\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	password := os.Getenv("PASSWORD")
	if len(password) == 0 {
		log.Printf("[%s] Error: PASSWORD environment variable is empty\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	log.Printf("[%s] Suceesfully received credentials\n", uuid)
	return username, password
}

// isValidUser checks whether the provided username matches with the username in the token
func isValidUser(tokenUsername interface{}, providedUsername string, uuid string) bool {
	if username, ok := tokenUsername.(string); ok {
		log.Printf("[%s] User needed to be validated %s with provided username %s\n",
			uuid, username, providedUsername)
		if providedUsername == username {
			log.Printf("[%s] User received is valid\n", uuid)
			return true
		}
		log.Printf("[%s] Username does not match with the provided username %s\n", uuid, providedUsername)
	} else {
		log.Printf("[%s] Error casting username to string. This may be due to a invalid token\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	return false
}

// isExpired validated whether the username is expired
func isExpired(timestamp interface{}, uuid string) bool {
	if validity, ok := timestamp.(float64); ok {
		tm := time.Unix(int64(validity), 0)
		remainder := tm.Sub(time.Now())
		if remainder > 0 {
			log.Printf("[%s] Token received is not expired\n", uuid)
			return true
		}
		log.Printf("[%s] Token received is expired. Token expiry time is %s, while the system time is %s\n",
			uuid, tm, time.Now())
	} else {
		log.Printf("[%s] Error casting timestamp to string. This may be due to a invalid token\n", uuid)
		os.Exit(extension.ErrorExitCode)
	}
	return false
}
