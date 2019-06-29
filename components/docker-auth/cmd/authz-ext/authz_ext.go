package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const (
	logFile = "/extension-logs/authz-ext.log"
)

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
		os.Exit(1)
	}
	log.SetOutput(file)

	accessToken := extension.ReadStdIn()

	log.Printf("Access Token : %s", accessToken)
	url := "http://localhost:8080/authorization"
	payload := strings.NewReader(accessToken)
	log.Printf("Called http://localhost:8080/authorization")

	req, _ := http.NewRequest("POST", url, payload)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	log.Println(res)
	log.Println(string(body))
	log.Println(res.StatusCode)

	if res.StatusCode == 401 {
		os.Exit(1)
	}
	if res.StatusCode == 200 {
		os.Exit(0)
	}
}
