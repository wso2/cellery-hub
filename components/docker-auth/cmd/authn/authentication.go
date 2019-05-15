package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg/extension"

	"github.com/dgrijalva/jwt-go"
	"github.com/golang/glog"
)

const (
	issuerClaim           = "iss"
	subjectClaim          = "sub"
	authTokenIssuerEnvVar = "REGISTRY_AUTH_TOKEN_ISSUER"
	idpCertEnvVar         = "IDP_CERT"
	dockerAuthCertEnvVar  = "REGISTRY_AUTH_TOKEN_ROOTCERTBUNDLE"
)

func readCert(certPathEnv string) ([]byte, error) {
	key, err := ioutil.ReadFile(os.Getenv(certPathEnv))
	if err != nil {
		return nil, err
	}
	return key, nil
}

func getJWTClaims(token interface{}) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token.(string), nil)
	claims := jwtToken.Claims.(jwt.MapClaims)
	return claims
}

func validateToken(inToken interface{}, cert []byte) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		return false, err
	}
	token, err := jwt.Parse(inToken.(string), func(token *jwt.Token) (interface{}, error) {
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
	flag.Parse()
	text := extension.ReadStdIn()
	glog.Infof("text received from CLI : %s", text)
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		glog.Error("received more than two parameters")
		glog.Flush()
		os.Exit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]

	claim := getJWTClaims(token)
	iss := claim[issuerClaim].(string)
	sub := claim[subjectClaim].(string)

	glog.Info("Token issuer :" + iss)
	glog.Info("Subject :" + sub)

	if sub != uName {
		glog.Error("username does not match with subject in JWT")
		glog.Flush()
		os.Exit(extension.ErrorExitCode)
	}

	certificateInUse, err := readCert(idpCertEnvVar)

	if iss == authTokenIssuerEnvVar {
		certificateInUse, err = readCert(dockerAuthCertEnvVar)
	}
	if err != nil {
		glog.Error("unable to load cert file")
	}

	tokenValidity, err := validateToken(token, certificateInUse)
	if err != nil {
		glog.Errorf("Token is not valid - %s", err)
		glog.Flush()
		os.Exit(extension.ErrorExitCode)
	}
	glog.Info("signature verified")

	if tokenValidity {
		glog.Info("user successfully authenticated")
		glog.Flush()
		os.Exit(extension.SuccessExitCode)
	} else {
		glog.Error("authentication failed")
		glog.Flush()
		os.Exit(extension.ErrorExitCode)
	}
}
