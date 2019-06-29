package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"
)

const (
	logFile = "/extension-logs/authn-ext.log"
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

	text := extension.ReadStdIn()
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		log.Printf("Cannot parse the Input from the Auth service")
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]

	log.Printf("Username : %s, Password : %s", uName, token)
	url := fmt.Sprintf("http://localhost:8080/authentication?uName=%s&token=%s", uName, token)
	log.Printf("Called http://localhost:8080/authentication")

	req, _ := http.NewRequest("GET", url, nil)

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
