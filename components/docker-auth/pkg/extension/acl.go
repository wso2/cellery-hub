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

func ValidateAccess(db *sql.DB, accessToken string, uuid string) (bool, error) {
	var authReqInfo AuthRequestInfo
	err := json.Unmarshal([]byte(accessToken), &authReqInfo)
	if err != nil {
		log.Printf("[%s] Unable to unmarshal the json :%s\n", uuid, err)
		return false, err
	}
	log.Printf("[%s] Required actions for the username are :%s\n", uuid, authReqInfo.Actions)
	isPullOnly := true
	if len(authReqInfo.Actions) == pushActionCount {
		isPullOnly = false
	}
	organization, image, err := getOrganizationAndImage(authReqInfo.Name, uuid)
	if err != nil {
		return false, err
	}
	log.Printf("[%s] Image name is declared as :%s\n", uuid, image)
	if isPullOnly {
		log.Printf("[%s] Received a pulling task\n", uuid)
		return isAuthorizedToPull(db, authReqInfo.Account, organization, image, uuid)
	} else {
		log.Printf("[%s] Received a pushing task\n", uuid)
		return isAuthorizedToPush(db, authReqInfo.Account, organization, uuid)
	}
}

func getOrganizationAndImage(imageFullName string, uuid string) (string, string, error) {
	tokens := strings.Split(imageFullName, "/")
	log.Printf("[%s] Organization and image info: %s\n", uuid, tokens)
	if len(tokens) == 2 {
		return tokens[0], tokens[1], nil
	} else {
		return "", "", errors.New("token length mismatched")
	}
}

func checkImageAndRole(db *sql.DB, image, user string, uuid string) (string, string, error) {
	results, err := db.Query(getImageAndRoleQuery, image, user)
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getImageAndRoleQuery : %s\n", uuid, err)
		return "", "", err
	}
	var userRole string
	var visibility string
	if results.Next() {
		err = results.Scan(&userRole, &visibility)
		if err != nil {
			log.Printf("[%s] Error in retrieving the username role and visibility from the database :%s\n",
				uuid, err)
			return "", "", err
		}
	}
	return userRole, visibility, errors.New("image not available")
}

func getImageVisibility(db *sql.DB, image string, uuid string) (string, error) {
	var visibility = ""
	results, err := db.Query(getVisibilityQuery, image)
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getVisibilityQuery :%s\n", uuid, err)
		return visibility, err
	}
	if results.Next() {
		err = results.Scan(&visibility)
	}
	if err != nil {
		log.Printf("[%s] Error in retrieving the visibility from the database :%s\n", uuid, err)
		return visibility, err
	}
	log.Printf("[%s] Visibility of the image is :%s\n", uuid, visibility)
	return visibility, nil
}

func isUserAvailable(db *sql.DB, organization, user string, uuid string) (bool, error) {
	results, err := db.Query(getUserAvailabilityQuery, user, organization)
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getUserAvailabilityQuery :%s\n", uuid, err)
		return false, err
	}
	return results.Next(), nil
}

func isAuthorizedToPull(db *sql.DB, user, organization, image string, uuid string) (bool, error) {
	log.Printf("[%s] %s user is trying to push the image %s for the organization %s\n",
		uuid, user, image, organization)
	// check if image PUBLIC
	visibility, err := getImageVisibility(db, image, uuid)
	if strings.EqualFold(visibility, publicVisibility) {
		return true, nil
	}
	userRole, visibility, err := checkImageAndRole(db, image, user, uuid)
	if err != nil && err.Error() == "image not available" {
		// Check whether the username exists in the organization when a fresh image come and tries to push
		return isUserAvailable(db, organization, user, uuid)
	} else if err != nil {
		log.Printf("[%s] User does not have pulling rights\n", uuid)
		return false, err
	}
	// allows pulling if the visibility of the image is PUBLIC
	if (userRole == userAdminRole) || (userRole == userPushRole) || (userRole == userPullRole) {
		log.Printf("[%s] User is allowed to pull the image\n", uuid)
		return true, nil
	} else {
		log.Printf("[%s] User does not have pulling rights\n", uuid)
		return false, err
	}
}

func isAuthorizedToPush(db *sql.DB, user, organization string, uuid string) (bool, error) {
	log.Printf("[%s] User %s is trying to push to organization :%s\n", uuid, user, organization)
	results, err := db.Query(getUserRoleQuery, user, organization)
	if err != nil {
		log.Printf("[%s] Error while calling the mysql query getUserRoleQuery :%s\n", uuid, err)
		return false, err
	}
	if results.Next() {
		var userRole string
		// for each row, scan the result into our tag composite object
		err = results.Scan(&userRole)
		if err != nil {
			log.Printf("[%s] Error in retrieving the username role from the database :%s\n", uuid, err)
			return false, err
		}
		log.Printf("[%s] User role is declared as %s\n", uuid, userRole)
		if (userRole == userAdminRole) || (userRole == userPushRole) {
			log.Printf("[%s] User is allowed to push the image\n", uuid)
			return true, nil
		} else {
			log.Printf("[%s] User does not have push rights\n", uuid)
			return false, err
		}
	}
	return false, nil
}
