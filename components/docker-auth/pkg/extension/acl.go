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

func ValidateAccess(db *sql.DB, accessToken string) (bool, error) {
	var authReqInfo AuthRequestInfo
	err := json.Unmarshal([]byte(accessToken), &authReqInfo)
	if err != nil {
		log.Println("Unable to unmarshal the json :", err)
		return false, err
	}
	log.Println("Required actions for the username are :", authReqInfo.Actions)
	isPullOnly := true
	if len(authReqInfo.Actions) == pushActionCount {
		isPullOnly = false
	}
	organization, image := getOrganizationAndImage(authReqInfo.Name)
	log.Println("Image name is declared as :", image)
	if isPullOnly {
		log.Println("Received a pulling task")
		return isAuthorizedToPull(db, authReqInfo.Account, organization, image)
	} else {
		log.Println("Received a pushing task")
		return isAuthorizedToPush(db, authReqInfo.Account, organization)
	}
}

func getOrganizationAndImage(imageFullName string) (string, string) {
	tokens := strings.Split(imageFullName, "/")
	log.Println("Organization and image info: ", tokens)
	return tokens[0], tokens[1]
}

func checkImageAndRole(db *sql.DB, image, user string) (string, string, error) {
	results, err := db.Query(getImageAndRoleQuery, image, user)
	if err != nil {
		log.Println("Error while calling the mysql query getImageAndRoleQuery:", err)
		return "", "", err
	}
	var userRole string
	var visibility string
	if results.Next() {
		err = results.Scan(&userRole, &visibility)
		if err != nil {
			log.Println("Error in retrieving the username role and visibility from the database :", err)
			return "", "", err
		}
	}
	return userRole, visibility, errors.New("image not available")
}

func getImageVisibility(db *sql.DB, image string) (string, error) {
	var visibility = ""
	results, err := db.Query(getVisibilityQuery, image)
	if err != nil {
		log.Println("Error while calling the mysql query getVisibilityQuery :", err)
		return visibility, err
	}
	if results.Next() {
		err = results.Scan(&visibility)
	}
	if err != nil {
		log.Println("Error in retrieving the visibility from the database :", err)
		return visibility, err
	}
	return visibility, nil
}

func isUserAvailable(db *sql.DB, organization, user string) (bool, error) {
	results, err := db.Query(getUserAvailabilityQuery, user, organization)
	if err != nil {
		log.Println("Error while calling the mysql query getUserAvailabilityQuery :", err)
		return false, err
	}
	return results.Next(), nil
}

func isAuthorizedToPull(db *sql.DB, user, organization, image string) (bool, error) {
	// check if image PUBLIC
	visibility, err := getImageVisibility(db, image)
	if strings.EqualFold(visibility, publicVisibility) {
		return true, nil
	}
	userRole, visibility, err := checkImageAndRole(db, image, user)
	log.Println("Visibility of the image :", image, "is", visibility,
		"for the username", user)
	if err != nil && err.Error() == "image not available" {
		// Check whether the username exists in the organization when a fresh image come and tries to push
		return isUserAvailable(db, organization, user)
	} else if err != nil {
		log.Println("User does not have pulling rights")
		return false, err
	}
	// allows pulling if the visibility of the image is PUBLIC
	if (userRole == userAdminRole) || (userRole == userPushRole) || (userRole == userPullRole) {
		log.Println("User is allowed to pull the image")
		return true, nil
	} else {
		log.Println("User does not have pulling rights")
		return false, err
	}
}

func isAuthorizedToPush(db *sql.DB, user, organization string) (bool, error) {
	log.Println("Trying to push to organization :", organization)
	results, err := db.Query(getUserRoleQuery, user, organization)
	if err != nil {
		log.Println("Error while calling the mysql query getUserRoleQuery :", err)
		return false, err
	}
	if results.Next() {
		var userRole string
		// for each row, scan the result into our tag composite object
		err = results.Scan(&userRole)
		if err != nil {
			log.Println("Error in retrieving the username role from the database :", err)
			return false, err
		}
		log.Println("User role is declared as", userRole)
		if (userRole == userAdminRole) || (userRole == userPushRole) {
			log.Println("User is allowed to push the image")
			return true, nil
		} else {
			log.Println("User does not have push rights")
			return false, err
		}
	}
	return false, nil
}
