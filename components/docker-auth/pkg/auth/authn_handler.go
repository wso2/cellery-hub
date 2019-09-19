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

package auth

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"go.uber.org/zap"
)

const (
	issuerClaim           = "iss"
	subjectClaim          = "sub"
	authTokenIssuerEnvVar = "REGISTRY_AUTH_TOKEN_ISSUER"
	idpCertEnvVar         = "IDP_CERT"
	dockerAuthCertEnvVar  = "REGISTRY_AUTH_TOKEN_ROOTCERTBUNDLE"
)

func readCert(certPathEnv string, logger *zap.SugaredLogger, execId string) ([]byte, error) {
	key, err := ioutil.ReadFile(os.Getenv(certPathEnv))
	if err != nil {
		return nil, fmt.Errorf("error occured while reading the cert %s", err)
	}
	logger.Debugf("[%s] Read cert successfully", execId)
	return key, nil
}

func getJWTClaims(token string, logger *zap.SugaredLogger, execId string) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token, nil)
	claims, ok := jwtToken.Claims.(jwt.MapClaims)
	if ok {
		logger.Debugf("[%s] Received JWT claims successfully", execId)
		return claims
	}
	return nil
}

func getClaimValue(claim jwt.MapClaims, claimKey string, logger *zap.SugaredLogger, execId string) string {
	value, ok := claim[claimKey].(string)
	if ok {
		logger.Debugf("[%s] Received JWT claim for the claim key %s successfully", execId, claimKey)
		return value
	}
	return ""
}

func validateToken(inToken string, cert []byte, logger *zap.SugaredLogger, execId string) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		return false, fmt.Errorf("error occured while parsing the cert : %s", err)
	}
	token, err := jwt.Parse(inToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("[%s] Unexpected signing method: %s", execId, token.Header["alg"])
		}
		return publicRSA, err
	})
	if token != nil && token.Valid {
		logger.Debugf("[%s] Token received is valid", execId)

		return true, nil
	}
	logger.Debugf("[%s] Token received is invalid", execId)
	return false, err
}

func Authenticate(uName string, token string, logger *zap.SugaredLogger, execId string) (bool, error) {
	logger.Debugf("[%s] Authentication logic handler reached and token will be validated", execId)
	isJwt, err := isJWT()
	if err != nil {
		return false, fmt.Errorf("error occured while reading 'IS_JWT' environment variable")
	}
	if isJwt {
		logger.Debugf("[%s] Performing authentication by using JWT", execId)
		jwtValidity, err := validateJWT(token, uName, logger, execId)
		if err != nil {
			return false, fmt.Errorf("eroor occured while validating JWT")
		}
		if jwtValidity {
			logger.Debugf("[%s] User successfully authenticated. Returning success status code", execId)
			return true, nil
		} else {
			logger.Debugf("[%s] User failed to authenticate. Returning error status code", execId)
			return false, nil
		}
	} else {
		logger.Debugf("[%s] Performing authentication by using access token", execId)
		accessTokenValidity, err := validateAccessToken(token, uName, logger, execId)
		if err != nil {
			return false, fmt.Errorf("error occured while validating access token : %s", err)
		}
		if accessTokenValidity {
			logger.Debugf("[%s] User successfully authenticated. Returning success status code", execId)
			return true, nil
		} else {
			logger.Debugf("[%s] User failed to authenticate. Returning error status code", execId)
			return false, nil
		}
	}
}

func validateJWT(token string, username string, logger *zap.SugaredLogger, execId string) (bool, error) {
	claim := getJWTClaims(token, logger, execId)
	iss := getClaimValue(claim, issuerClaim, logger, execId)
	sub := getClaimValue(claim, subjectClaim, logger, execId)

	logger.Debugf("[%s] Token issuer : %s", execId, iss)
	logger.Debugf("[%s] Subject : %s", execId, sub)

	if sub != username {
		logger.Debugf("[%s] Username(%s) does not match with subject(%s) in JWT", execId, username, sub)
		return false, nil
	}

	certificateInUse, err := readCert(idpCertEnvVar, logger, execId)
	if err != nil {
		return false, fmt.Errorf("unable to load idp cert file : %s", err)
	}

	if iss == authTokenIssuerEnvVar {
		certificateInUse, err = readCert(dockerAuthCertEnvVar, logger, execId)
		if err != nil {
			return false, fmt.Errorf("unable to load docker auth file : %s", err)
		}
	}

	tokenValidity, err := validateToken(token, certificateInUse, logger, execId)
	if err != nil {
		return false, fmt.Errorf("token is not valid : %s", err)
	}
	logger.Debugf("[%s] Signature verified", execId)

	if tokenValidity {
		logger.Debugf("[%s] User successfully authenticated", execId)
		return true, nil
	} else {
		logger.Debugf("[%s] Authentication failed", execId)
		return false, nil
	}
}

// isJWT checks whether the token is jwt token or access token.
func isJWT() (bool, error) {
	isJWTEnv := os.Getenv("IS_JWT")
	var isJWT bool
	if len(isJWTEnv) == 0 {
		return false, fmt.Errorf("error: IS_JWT environment variable is empty")
	} else {
		var err error
		isJWT, err = strconv.ParseBool(isJWTEnv)
		if err != nil {
			return false, fmt.Errorf("wrong environment value given. The value should be either true or false")
		}
	}
	return isJWT, nil
}

// validateAccessToken is used to introspect the access token
func validateAccessToken(token string, providedUsername string, logger *zap.SugaredLogger,
	execId string) (bool, error) {
	introspectionUrl, urlAvailability, err := resolveIntrospectionUrl(logger, execId)
	if err != nil {
		return false, fmt.Errorf("error occured while resolving introspection url: %v", err)
	}
	if !urlAvailability {
		return false, nil
	}
	payload := strings.NewReader("token=" + token)
	req, err := http.NewRequest("POST", introspectionUrl, payload)
	if err != nil {
		return false, fmt.Errorf("error creating new request to the introspection endpoint : %s", err)
	}
	logger.Debugf("[%s] Created new request to the introspection endpoint : %s", execId, introspectionUrl)
	username, password, err := resolveCredentials(logger, execId)
	if err != nil {
		return false, err
	}
	req.SetBasicAuth(username, password)
	// todo Remove the the host verification turning off
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
		},
	}
	client := &http.Client{Transport: tr}
	res, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("error sending the request to the introspection endpoint : %s", err)
	}

	if res.StatusCode == http.StatusBadRequest {
		return false, fmt.Errorf("[%s] %d status code returned from IDP probably due to empty token", execId,
			res.StatusCode)
	} else if res.StatusCode != http.StatusOK {
		return false, fmt.Errorf("[%s] Error while calling IDP, status code :%d. Exiting without "+
			"authorization\n", execId, res.StatusCode)
	}

	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return false, fmt.Errorf("error reading the response from introspection endpoint. Returing without "+
			"authorization : %s", err)
	} else {
		logger.Debugf("[%s] Response received from introspection endpoint : %s", execId, body)
	}

	type Response struct {
		Active   bool   `json:"active"`
		Username string `json:"username"`
		Exp      int64  `json:"exp"`
	}
	var response Response
	err = json.Unmarshal(body, &response)
	if err != nil {
		return false, fmt.Errorf("error unmarshalling the json. This may be due to a invalid token : %s", err)
	}
	logger.Debugf("[%s] Resolved access token validity", execId)
	isExpired, err := isExpired(response.Exp, logger, execId)
	if err != nil {
		return false, err
	}
	isValidUser, err := isValidUser(response.Username, providedUsername, logger, execId)
	if err != nil {
		return false, err
	}
	return isExpired && response.Active && isValidUser, nil
}

// resolves the IS host and port from the environment variables.
// If the environment is not set the port and host will be resolved through the config file.
func resolveIntrospectionUrl(logger *zap.SugaredLogger, execId string) (string, bool, error) {
	idpEndPoint := os.Getenv("IDP_END_POINT")
	introspectionEP := os.Getenv("INTROSPECTION_END_POINT")
	if len(introspectionEP) == 0 {
		return "", false, fmt.Errorf("'INTROSPECTION_END_POINT' environment variable is empty")
	}
	if len(idpEndPoint) == 0 {
		return "", false, fmt.Errorf("'IDP_END_POINT' environment variable is empty")
	}
	logger.Debugf("[%s] Successfully resolved introspection url", execId)
	return idpEndPoint + introspectionEP, true, nil
}

// resolveCredentials resolves the user credentials of the user that is used to communicate to introspection endpoint
func resolveCredentials(logger *zap.SugaredLogger, execId string) (string, string, error) {
	username := os.Getenv("USERNAME")
	if len(username) == 0 {
		return "", "", fmt.Errorf("'USERNAME' environment variable is empty")
	}
	password := os.Getenv("PASSWORD")
	if len(password) == 0 {
		return "", "", fmt.Errorf("'PASSWORD' environment variable is empty")
	}
	logger.Debugf("[%s] Suceesfully received credentials", execId)
	return username, password, nil
}

// isValidUser checks whether the provided username matches with the username in the token
func isValidUser(tokenUsername interface{}, providedUsername string, logger *zap.SugaredLogger,
	execId string) (bool, error) {
	if username, ok := tokenUsername.(string); ok {
		usernameTokens := strings.Split(username, "@")
		logger.Debugf("[%s] User %s, needed to be validated with provided username %s",
			execId, usernameTokens[0], providedUsername)
		if providedUsername == usernameTokens[0] {
			logger.Debugf("[%s] User received is valid", execId)
			return true, nil
		}
		logger.Debugf("[%s] Username does not match with the provided username %s", execId, providedUsername)
	} else {
		return false, fmt.Errorf("error casting username to string. This may be due to a invalid token")
	}
	return false, nil
}

// isExpired validated whether the username is expired
func isExpired(expTime int64, logger *zap.SugaredLogger, execId string) (bool, error) {
	tm := time.Unix(expTime, 0)
	remainder := tm.Sub(time.Now())
	if remainder > 0 {
		logger.Debugf("[%s] Token received is not expired", execId)
		return true, nil
	}
	logger.Debugf("[%s] Token received is expired. Token expiry time is %s, while the system time is %s",
		execId, tm, time.Now())

	return false, nil
}
