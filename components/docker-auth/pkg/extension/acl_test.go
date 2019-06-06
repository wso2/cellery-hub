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
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

var dbConnection *sql.DB

func createConn() bool {
	dbDriver := MYSQL_DRIVER
	dbUser := os.Getenv(MYSQL_USER_ENV_VAR)
	dbPass := os.Getenv(MYSQL_PASSWORD_ENV_VAR)
	dbName := DB_NAME
	host := os.Getenv(MYSQL_HOST_ENV_VAR)
	port := os.Getenv(MYSQL_PORT_ENV_VAR)
	var err error
	dbConnection, err = sql.Open(dbDriver, dbUser+":"+dbPass+"@tcp("+host+":"+port+")/"+dbName)
	if err != nil {
		fmt.Println("Error while connecting to the database")
		os.Exit(ErrorExitCode)
	}
	err = dbConnection.Ping()
	if err != nil {
		return false
	}
	return true
}

func moveFiles(from, to string) {
	source, err := os.Open(from)
	if err != nil {
		log.Fatal(err)
	}
	defer source.Close()

	destination, err := os.OpenFile(to, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		log.Fatal(err)
	}
	defer destination.Close()
	_, err = io.Copy(destination, source)
	if err != nil {
		log.Fatal(err)
	}
}

func makedir(path string) {
	err := os.MkdirAll(path, os.ModePerm)
	if err != nil {
		fmt.Println("Error creating the file :", err)
	}
}

func TestMain(m *testing.M) {
	// make target dir
	makedir("../../target/test/mysql_scripts")
	moveFiles("../../../../deployment/mysql/dbscripts/init.sql", "../../target/test/mysql_scripts/1_init.sql")
	moveFiles("../../test/data.sql", "../../target/test/mysql_scripts/2_data.sql")

	path, err := filepath.Abs("../../target/test/mysql_scripts")
	if err != nil {
		fmt.Println("Could not resolve absolute path :", err)
	}
	cmd := exec.Command("docker", "run", "--name", "some-mysql", "-e", "MYSQL_ROOT_PASSWORD="+
		os.Getenv("MYSQL_PASSWORD"),
		"-d", "-v", path+":/docker-entrypoint-initdb.d", "-p", os.Getenv("MYSQL_PORT")+":3306", "mysql:5.7.26")
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error in executing the docker run command :", err)
	}

	// Wait until the mysql db is up
	for {
		ln, _ := net.Listen("tcp", ":"+"3308")
		if ln != nil {
			break
		}
	}

	for !createConn() {
		time.Sleep(1 * time.Second)
		// waiting for the mysql connection
	}
	time.Sleep(20 * time.Millisecond)
	m.Run()
	// Cleaning up the docker container
	teardown()
}

func TestValidateAccess(t *testing.T) {
	values := []struct {
		text string
	}{
		{"{\"Account\":\"wso2.com\",\"Type\":\"repository\",\"Name\":\"cellery/newImage\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		{"{\"Account\":\"admin@wso2.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		{"{\"Account\":\"admin.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\",\"push\"],\"Labels\":null}"},
		//	user trying to push with a new image which does not exists in the db
		{"{\"Account\":\"admin.com\",\"Type\":\"repository\",\"Name\":\"cellery/sample\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\",\"push\"],\"Labels\":null}"},
		//	user that is not in the db trying to pull a public image
		{"{\"Account\":\"user.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		{"{\"Account\":\"other.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		{"{\"Account\":\"wso2.com\",\"Type\":\"repository\",\"Name\":\"cellery/newImage\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\",\"push\"],\"Labels\":null}"},
		{"{\"Account\":\"wso2.com\",\"Type\":\"repository\",\"Name\":\"cellery/newImage\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
	}
	for _, value := range values {
		isAuthorized, err := ValidateAccess(dbConnection, value.text)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if !isAuthorized {
			t.Error("Access is not allowed for text :", value.text)
		}
	}
}

func TestInvalidAccess(t *testing.T) {
	values := []struct {
		text string
	}{
		// new user trying to pull a private image
		{"{\"Account\":\"user.com\",\"Type\":\"repository\",\"Name\":\"cellery/newImage\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		//	a user with pull permission trying to push
		{"{\"Account\":\"pull.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\",\"push\"],\"Labels\":null}"},
		//	user trying to pull a public image
		{"{\"Account\":\"other.com\",\"Type\":\"repository\",\"Name\":\"cellery/newImage\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"pull\"],\"Labels\":null}"},
		{"{\"Account\":\"other.com\",\"Type\":\"repository\",\"Name\":\"cellery/image\",\"Service\":" +
			"\"Docker registry\",\"IP\":\"172.25.0.1\",\"Actions\":[\"push\",\"pull\"],\"Labels\":null}"},
	}
	for _, value := range values {
		isAuthorized, err := ValidateAccess(dbConnection, value.text)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if isAuthorized {
			t.Error("Access is should not be allowed for text :", value.text)
		}
	}
}

func TestIsAuthorizedToPush(t *testing.T) {
	values := []struct {
		username     string
		organization string
	}{
		{"wso2.com", "cellery"},
		{"admin.com", "cellery"},
	}
	for _, value := range values {
		isAuthorized, err := isAuthorizedToPush(dbConnection, value.username, value.organization)
		if !isAuthorized {
			t.Error("Cannot authorize ", value.username, "for ", value.organization, " organization")
		}
		if err != nil {
			log.Println("Error while pushing :", err)
		}
	}
}

func TestIsAuthorizedToPull(t *testing.T) {
	values := []struct {
		username     string
		organization string
		image        string
	}{
		{"wso2.com", "cellery", "image"},
		{"wso2.com", "cellery", "newImage"},
		{"ibm.com", "cellery", "image"},
	}
	for _, value := range values {
		isAuthorized, err := isAuthorizedToPull(dbConnection, value.username, value.organization, value.image)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if !isAuthorized {
			t.Error("Cannot authorize ", value.username, "for ", value.organization,
				" organization in image ", value.username)
		}
	}
}

func TestCheckImage(t *testing.T) {
	values := []struct {
		username   string
		image      string
		visibility string
		userRole   string
	}{
		{"wso2.com", "image", "public", "push"},
	}
	for _, value := range values {
		role, visib, err := checkImageAndRole(dbConnection, value.image, value.username)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if (!strings.EqualFold(role, value.userRole)) && (!strings.EqualFold(visib, value.visibility)) {
			fmt.Println("sss:", role, "ddd:", visib)
			t.Error("Image and organization is not correct")
		}
	}

}

func TestIsUserAvailable(t *testing.T) {
	values := []struct {
		organization string
		username     string
	}{
		{"cellery", "wso2.com"},
		{"cellery", "admin.com"},
	}
	for _, value := range values {
		isAvailable, err := isUserAvailable(dbConnection, value.organization, value.username)
		if !isAvailable {
			t.Error("For username " + value.username + " user is " + value.organization + " invalid")
		}
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
	}
}

func TestGetImageVisibility(t *testing.T) {
	values := []struct {
		image string
		visib string
	}{
		{"image", "public"},
		{"newImage", "private"},
	}
	for _, value := range values {
		visibility, err := getImageVisibility(dbConnection, value.image)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if !strings.EqualFold(visibility, value.visib) {
			t.Error("Visibility test fails")
		}
	}
}

func teardown() {
	cmd := exec.Command("docker", "rm", "-f", "some-mysql")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("Error in executing the docker cleanup command :", err)
	}
	defer dbConnection.Close()
}
