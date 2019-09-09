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

	"go.uber.org/zap"

	"github.com/cesanta/docker_auth/auth_server/api"
	_ "github.com/go-sql-driver/mysql"
)

var dbConnection *sql.DB

const testUser = "testUser"

func createConn() bool {
	dbDriver := MYSQL_DRIVER
	dbUser := "root"
	dbPass := "mysql"
	dbName := DB_NAME
	host := "localhost"
	port := "3308"
	var err error
	dbConnection, err = sql.Open(dbDriver, dbUser+":"+dbPass+"@tcp("+host+":"+port+")/"+dbName)
	if err != nil {
		fmt.Println("Error while connecting to the database")
		os.Exit(1)
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

func setEnv() {
	err := os.Setenv(MYSQL_USER_ENV_VAR, "root")
	if err != nil {
		fmt.Println("Error setting up the environment", MYSQL_USER_ENV_VAR, ":", err)
	}
	err = os.Setenv(MYSQL_PASSWORD_ENV_VAR, "mysql")
	if err != nil {
		fmt.Println("Error setting up the environment", MYSQL_PASSWORD_ENV_VAR, ":", err)
	}
	err = os.Setenv(MYSQL_HOST_ENV_VAR, "localhost")
	if err != nil {
		fmt.Println("Error setting up the environment", MYSQL_HOST_ENV_VAR, ":", err)
	}
	err = os.Setenv(MYSQL_PORT_ENV_VAR, "3308")
	if err != nil {
		fmt.Println("Error setting up the environment", MYSQL_PORT_ENV_VAR, ":", err)
	}
}

func TestMain(m *testing.M) {
	fmt.Println("Acl test started to run")
	// make target dir
	makedir("../../target/test/mysql_scripts")
	moveFiles("../../test/init.sql", "../../target/test/mysql_scripts/1_init.sql")
	moveFiles("../../test/data.sql", "../../target/test/mysql_scripts/2_data.sql")
	setEnv()
	fmt.Println("User:", os.Getenv(MYSQL_USER_ENV_VAR), "pass:", os.Getenv(MYSQL_PASSWORD_ENV_VAR), "host::",
		os.Getenv(MYSQL_PORT_ENV_VAR))
	path, err := filepath.Abs("../../target/test/mysql_scripts")
	if err != nil {
		fmt.Println("Could not resolve absolute path :", err)
	}
	cmd := exec.Command("docker", "run", "--name", "some-mysql", "-e", "MYSQL_ROOT_PASSWORD=mysql",
		"-d", "-v", path+":/docker-entrypoint-initdb.d", "-p", "3308:3306", "mysql:5.7.26")
	_, err = cmd.Output()
	if err != nil {
		fmt.Println("Error in executing the docker run command :", err)
	}

	// Wait until the mysql db is up
	for {
		_, err := net.Listen("tcp", ":"+"3308")
		if err != nil {
			break
		}
	}

	for !createConn() {
		time.Sleep(1 * time.Second)
		// waiting for the mysql connection
	}
	time.Sleep(20 * time.Millisecond)
	fmt.Println("Docker container created")
	m.Run()
	// Cleaning up the docker container
	teardown()
}

func TestValidateAccess(t *testing.T) {
	label := make([]string, 1)
	label[0] = "true"
	authLabels := api.Labels{}
	authLabels["isAuthSuccess"] = label

	values := []struct {
		actions    []string
		username   string
		repository string
		labels     api.Labels
	}{
		{[]string{"pull"}, "wso2.com", "cellery/newImag", authLabels},
		{[]string{"pull"}, "admin@wso2.com", "cellery/image", authLabels},
		{[]string{"pull", "push"}, "admin.com", "cellery/image", authLabels},
		//	user trying to push with a new image which does not exists in the db
		{[]string{"pull", "push"}, "admin.com", "cellery/sample", authLabels},
		//	user that is not in the db trying to pull a public image
		{[]string{"pull"}, "user.com", "cellery/image", authLabels},
		{[]string{"pull"}, "other.com", "cellery/image", authLabels},
		{[]string{"pull", "push"}, "wso2.com", "cellery/newImage", authLabels},
		{[]string{"pull"}, "wso2.com", "cellery/newImage", authLabels},
	}
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		isAuthorized, err := ValidateAccess(dbConnection, value.actions, value.username, value.repository, value.labels,
			logger, testUser)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if !isAuthorized {
			t.Error("Access is not allowed for username :", value.username)
		}
	}
}

func TestInvalidAccess(t *testing.T) {
	label := make([]string, 1)
	label[0] = "true"
	authLabels := api.Labels{}
	authLabels["isAuthSuccess"] = label

	values := []struct {
		actions    []string
		username   string
		repository string
		labels     api.Labels
	}{
		// new user trying to pull a private image
		{[]string{"pull"}, "user.com", "cellery/newImag", authLabels},
		//	a user with pull permission trying to push
		{[]string{"pull", "push"}, "pull.com", "cellery/image", authLabels},
		//	user trying to pull a public image
		{[]string{"pull"}, "other.com", "cellery/newImage", authLabels},
		{[]string{"pull", "push"}, "other.com", "cellery/image", authLabels},
		{[]string{"pull", "push"}, "other.com", "cellery/pqr", authLabels},
	}
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		isAuthorized, err := ValidateAccess(dbConnection, value.actions, value.username, value.repository, value.labels,
			logger, testUser)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if isAuthorized {
			t.Error("Access is not allowed for username :", value.username)
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
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		isAuthorized, err := isAuthorizedToPush(dbConnection, value.username, value.organization, logger, testUser)
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
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		isAuthorized, err := isAuthorizedToPull(dbConnection, value.username, value.organization, value.image,
			logger, testUser)
		if err != nil {
			log.Println("Error while validating the access token :", err)
		}
		if !isAuthorized {
			t.Error("Cannot authorize ", value.username, "for ", value.organization,
				" organization in image ", value.username)
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
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		isAvailable, err := isUserAvailable(dbConnection, value.organization, value.username, logger, testUser)
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
		organization string
		image        string
		visib        string
	}{
		{"cellery", "image", "public"},
		{"is", "pqr", "private"},
	}
	logger := zap.NewExample().Sugar()
	for _, value := range values {
		visibility, err := getImageVisibility(dbConnection, value.image, value.organization, logger, testUser)
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
