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

func readCert(certPathEnv string) ([]byte, error) {
	key, err := ioutil.ReadFile(os.Getenv(certPathEnv))
	if err != nil {
		return nil, err
	}
	return key, nil
}

func getJWTClaims(token string) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token, nil)
	claims, ok := jwtToken.Claims.(jwt.MapClaims)
	if ok {
		return claims
	}
	return nil
}

func getClaimValue(claim jwt.MapClaims, claimKey string) string {
	value, ok := claim[claimKey].(string)
	if ok {
		return value
	}
	return ""
}

func validateToken(inToken string, cert []byte) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		return false, err
	}
	token, err := jwt.Parse(inToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicRSA, err
	})
	if token != nil && token.Valid {
		return true, nil
	}
	return false, err
}

func main() {
	file, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Error opening file: %v", err)
	}
	defer func() {
		err = file.Close()
		if err != nil {
			os.Exit(2)
		}
	}()
	if err != nil {
		log.Println("Error while closing the file :", err)
		os.Exit(extension.ErrorExitCode)
	}
	log.SetOutput(file)
	log.Println("Authorization extension reached and token will be validated")
	text := extension.ReadStdIn()
	log.Println("Payload received from CLI :")
	credentials := strings.Split(text, " ")
	if len(credentials) != 2 {
		log.Println("Received more than two parameters")
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]
	if isJWT() {
		validateJWT(token, uName)
	} else {
		if validateAccessToken(token, uName) {
			log.Println("User successfully authenticated")
			os.Exit(extension.SuccessExitCode)
		}
	}
}

func validateJWT(token string, username string) {
	claim := getJWTClaims(token)
	iss := getClaimValue(claim, issuerClaim)
	sub := getClaimValue(claim, subjectClaim)

	log.Println("Token issuer :", iss)
	log.Println("Subject :", sub)

	if sub != username {
		log.Println("Username does not match with subject in JWT")
		os.Exit(extension.ErrorExitCode)
	}

	certificateInUse, err := readCert(idpCertEnvVar)

	if iss == authTokenIssuerEnvVar {
		certificateInUse, err = readCert(dockerAuthCertEnvVar)
	}
	if err != nil {
		log.Println("Unable to load cert file")
	}

	tokenValidity, err := validateToken(token, certificateInUse)
	if err != nil {
		log.Println("Token is not valid - ", err)
		os.Exit(extension.ErrorExitCode)
	}
	log.Println("Signature verified")

	if tokenValidity {
		log.Println("user successfully authenticated")
		os.Exit(extension.SuccessExitCode)
	} else {
		log.Println("Authentication failed")
		os.Exit(extension.ErrorExitCode)
	}
}

// isJWT checks whether the token is jwt token or access token.
func isJWT() bool {
	isJWTEnv := os.Getenv("IS_JWT")
	var isJWT bool
	if len(isJWTEnv) == 0 {
		log.Println("Error: IS_JWT environment variable is empty")
		os.Exit(extension.ErrorExitCode)
	} else {
		if isJWTEnv == "true" {
			isJWT = true
		} else if isJWTEnv == "false" {
			isJWT = false
		} else {
			log.Println("[Wrong environment value given. The value should be either true or false")
			os.Exit(extension.ErrorExitCode)
		}
	}
	return isJWT
}

// validateAccessToken is used to introspect the access token
func validateAccessToken(token string, providedUsername string) bool {
	idpHost, idpPort := resolveIdpHostAndPort()
	url := "https://" + idpHost + ":" + idpPort + "/oauth2/introspect"
	payload := strings.NewReader("token=" + token)
	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		log.Println("Error creating new request to the introspection endpoint: ", err)
		os.Exit(extension.ErrorExitCode)
	}
	username, password := resolveCredentials()
	req.SetBasicAuth(username, password)
	// todo Remove the the host verification turning off
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("Error sending the request to the introspection endpoint: ", err)
		os.Exit(extension.ErrorExitCode)
	}
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Println("Error reading the response from introspection endpoint: ", err)
		os.Exit(extension.ErrorExitCode)
	}
	var result map[string]interface{}
	err = json.Unmarshal([]byte(string(body)), &result)
	if err != nil {
		log.Println("Error un marshalling the json: ", err)
		os.Exit(extension.ErrorExitCode)
	}
	isActive, ok := (result["active"]).(bool)
	if !ok {
		log.Println("Error casting active to boolean. This may be due to a invalid token")
		os.Exit(extension.ErrorExitCode)
	}
	isExpired := isExpired(result["exp"])
	isValidUser := isValidUser(result["username"], providedUsername)
	return isExpired && isActive && isValidUser
}

// resolves the IS host and port from the environment variables.
// If the environment is not set the port and host will be resolved through the config file.
func resolveIdpHostAndPort() (string, string) {
	idpHost := os.Getenv("IDP_HOST")
	if len(idpHost) == 0 {
		log.Println("Error: IDP_HOST environment variable is empty")
		os.Exit(extension.ErrorExitCode)
	}
	isPort := os.Getenv("IDP_PORT")
	if len(isPort) == 0 {
		log.Println("Error: IDP_PORT environment variable is empty")
		os.Exit(extension.ErrorExitCode)
	}
	return idpHost, isPort
}

// resolveCredentials resolves the user credentials of the user that is used to communicate to introspection endpoint
func resolveCredentials() (string, string) {
	username := os.Getenv("USERNAME")
	if len(username) == 0 {
		log.Println("Error: USERNAME environment variable is empty")
		os.Exit(extension.ErrorExitCode)
	}
	password := os.Getenv("PASSWORD")
	if len(password) == 0 {
		log.Println("Error: PASSWORD environment variable is empty")
		os.Exit(extension.ErrorExitCode)
	}
	return username, password
}

// isValidUser checks whether the provided username matches with the username in the token
func isValidUser(tokenUsername interface{}, providedUsername string) bool {
	if username, ok := tokenUsername.(string); ok {
		if providedUsername == username {
			return true
		}
	} else {
		log.Println("Error casting username to string. This may be due to a invalid token")
		os.Exit(extension.ErrorExitCode)
	}
	return false
}

// isExpired validated whether the username is expired
func isExpired(timestamp interface{}) bool {
	if validity, ok := timestamp.(float64); ok {
		tm := time.Unix(int64(validity), 0)
		remainder := tm.Sub(time.Now())
		if remainder > 0 {
			return true
		}
	} else {
		log.Println("Error casting timestamp to string. This may be due to a invalid token")
		os.Exit(extension.ErrorExitCode)
	}
	return false
}
