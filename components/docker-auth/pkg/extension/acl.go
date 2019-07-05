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

package extension

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

type Labelstest map[string][]string

type AuthRequestInfo struct {
	Account string
	Type    string
	Name    string
	Service string
	IP      net.IP
	Actions []string
	Labels  Labelstest
}

func ValidateAccess(db *sql.DB, accessToken string, execId string) (bool, error) {
	var authReqInfo AuthRequestInfo
	err := json.Unmarshal([]byte(accessToken), &authReqInfo)
	if err != nil {
		log.Printf("[%s] Unable to unmarshal the json :%s\n", execId, err)
		return false, err
	}
	log.Printf("[%s] Required actions for the username are :%s\n", execId, authReqInfo.Actions)
	log.Printf("[%s] Received labels are :%s\n", execId, authReqInfo.Labels)

	isPullOnly := false
	if len(authReqInfo.Actions) == 1 && authReqInfo.Actions[0] == pullAction {
		log.Printf("[%s] Received a request for pull only action\n", execId)
		isPullOnly = true
	}

	log.Printf("[%s] Label map length : %d\n", execId, len(authReqInfo.Labels))
	if len(authReqInfo.Labels) < 1 {
		log.Printf("[%s] Not received any label\n", execId)
		return false, nil
	}

	if authReqInfo.Labels["isAuthSuccess"][0] == "true" {
		log.Printf("[%s] Validating access for authenticated user\n", execId)
	} else {
		if isPullOnly {
			log.Printf("[%s] Validating access for unauthenticated user for pull action\n", execId)
		} else {
			log.Printf("[%s] Denying access for unauthenticated user for push action\n", execId)
			return false, nil
		}
	}

	organization, image, err := getOrganizationAndImage(authReqInfo.Name, execId)
	if err != nil {
		return false, err
	}
	log.Printf("[%s] Image name is declared as :%s\n", execId, image)
	if isPullOnly {
		log.Printf("[%s] Received a pulling task\n", execId)
		return isAuthorizedToPull(db, authReqInfo.Account, organization, image, execId)
	} else {
		log.Printf("[%s] Received a pushing task\n", execId)
		return isAuthorizedToPush(db, authReqInfo.Account, organization, execId)
	}
}

func getOrganizationAndImage(imageFullName string, execId string) (string, string, error) {
	tokens := strings.Split(imageFullName, "/")
	log.Printf("[%s] Organization and image info: %s\n", execId, tokens)
	if len(tokens) == 2 {
		log.Printf("[%s] Organization : %s, image : %s\n", execId, tokens[0], tokens[1])
		return tokens[0], tokens[1], nil
	} else {
		log.Printf("[%s] Organization and image info not found\n", execId)
		return "", "", errors.New("token length mismatched")
	}
}

func checkImageAndRole(db *sql.DB, image, user string, execId string) (string, string, error) {
	results, err := db.Query(getImageAndRoleQuery, image, user)
	defer func() {
		closeResultSet(results, "checkImageAndRole", execId)
	}()
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getImageAndRoleQuery : %s\n", execId, err)
		return "", "", err
	}
	var userRole string
	var visibility string
	if results.Next() {
		err = results.Scan(&userRole, &visibility)
		if err != nil {
			log.Printf("[%s] Error in retrieving the username role and visibility from the database :%s\n",
				execId, err)
			return "", "", err
		}
	}
	return userRole, visibility, errors.New("image not available")
}

func getImageVisibility(db *sql.DB, image string, execId string) (string, error) {
	var visibility = ""
	results, err := db.Query(getVisibilityQuery, image)
	defer func() {
		closeResultSet(results, "getImageVisibility", execId)
	}()
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getVisibilityQuery :%s\n", execId, err)
		return visibility, err
	}
	if results.Next() {
		err = results.Scan(&visibility)
		log.Printf("[%s] Visibility of the image is found as %s\n", execId, visibility)
	}
	if err != nil {
		log.Printf("[%s] Error in retrieving the visibility from the database :%s\n", execId, err)
		return visibility, err
	}
	return visibility, nil
}

func isUserAvailable(db *sql.DB, organization, user string, execId string) (bool, error) {
	results, err := db.Query(getUserAvailabilityQuery, user, organization)
	defer func() {
		closeResultSet(results, "isUserAvailable", execId)
	}()
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getUserAvailabilityQuery :%s\n", execId, err)
		return false, err
	}
	if results.Next() {
		log.Printf("[%s] User is available in the organization :%s\n", execId, organization)
		return true, nil
	} else {
		log.Printf("[%s] User is not available in the organization :%s\n", execId, organization)
		return false, nil
	}
}

func isAuthorizedToPull(db *sql.DB, user, organization, image string, execId string) (bool, error) {
	log.Printf("[%s] %s user is trying to pull the image %s for the organization %s\n",
		execId, user, image, organization)
	// check if image PUBLIC
	visibility, err := getImageVisibility(db, image, execId)
	if strings.EqualFold(visibility, publicVisibility) {
		log.Printf("[%s] Received a public image\n", execId)
		return true, nil
	}
	userRole, visibility, err := checkImageAndRole(db, image, user, execId)
	if err != nil && err.Error() == "image not available" {
		// Check whether the username exists in the organization when a fresh image come and tries to push
		return isUserAvailable(db, organization, user, execId)
	} else if err != nil {
		log.Printf("[%s] User does not have pulling rights\n", execId)
		return false, err
	}
	// allows pulling if the visibility of the image is PUBLIC
	if (userRole == userAdminRole) || (userRole == userPushRole) || (userRole == userPullRole) {
		log.Printf("[%s] User is allowed to pull the image\n", execId)
		return true, nil
	} else {
		log.Printf("[%s] User does not have pulling rights\n", execId)
		return false, err
	}
}

func isAuthorizedToPush(db *sql.DB, user, organization string, execId string) (bool, error) {
	log.Printf("[%s] User %s is trying to push to organization :%s\n", execId, user, organization)
	results, err := db.Query(getUserRoleQuery, user, organization)
	defer func() {
		closeResultSet(results, "isAuthorizedToPush", execId)
	}()
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getUserRoleQuery :%s\n", execId, err)
		return false, err
	}
	if results.Next() {
		var userRole string
		// for each row, scan the result into our tag composite object
		err = results.Scan(&userRole)
		if err != nil {
			log.Printf("[%s] Error in retrieving the username role from the database :%s\n", execId, err)
			return false, err
		}
		log.Printf("[%s] User role is declared as %s\n", execId, userRole)
		if (userRole == userAdminRole) || (userRole == userPushRole) {
			log.Printf("[%s] User is allowed to push the image\n", execId)
			return true, nil
		} else {
			log.Printf("[%s] User does not have push rights\n", execId)
			return false, err
		}
	}
	return false, nil
}

func closeResultSet(r *sql.Rows, caller string, execId string) {
	if r != nil {
		err := r.Close()
		if err != nil {
			log.Printf("[%s] Error while closing result set in %s : %v\n", execId, caller, err)
		}
	}
}
