package main

import (
	"io/ioutil"
	"log"
	"net/http"

	"github.com/cellery-io/cellery-hub/components/docker-auth/cmd/authn"
	"github.com/cellery-io/cellery-hub/components/docker-auth/cmd/authz"
)

func main() {
	http.HandleFunc("/authentication", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Authentication endpoint reached")
		var uName = r.FormValue("uName")
		var token = r.FormValue("token")

		log.Printf("Authentication request received by server. Uname : %s, Token : %s", uName, token)
		authnRes := authn.Authenticate(uName, token)
		log.Println("authnRes :", authnRes)
		if authnRes == 0 {
			log.Println("Authentication Success")
			w.WriteHeader(http.StatusOK)
		} else {
			log.Println("Authentication Failed")
			w.WriteHeader(http.StatusUnauthorized)
		}
	})

	http.HandleFunc("/authorization", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Authorization endpoint reached")

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		log.Printf("Authorization request received by server. Token : %s", string(body))

		authzRes := authz.Authorization(string(body))

		if authzRes == 0 {
			log.Println("Authorization Success")
			w.WriteHeader(http.StatusOK)
		} else {
			log.Println("Authorization Failed")
			w.WriteHeader(http.StatusUnauthorized)
		}
	})

	_ = http.ListenAndServe(":8080", nil)

}
