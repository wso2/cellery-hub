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

func getJWTClaims(token string) jwt.MapClaims {
	jwtToken, _ := jwt.Parse(token, nil)
	claims, ok := jwtToken.Claims.(jwt.MapClaims)
	if ok {
		return claims
	}
	return nil
}

func getClaimValue(claim jwt.MapClaims, claimKey string) string {
	value, ok := claim[claimKey].(string)
	if ok {
		return value
	}
	return ""
}

func validateToken(inToken string, cert []byte) (bool, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		return false, err
	}
	token, err := jwt.Parse(inToken, func(token *jwt.Token) (interface{}, error) {
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

func glogFlushAndExit(exitCode int) {
	glog.Flush()
	os.Exit(exitCode)
}

func main() {
	flag.Parse()
	text := extension.ReadStdIn()
	glog.Infof("text received from CLI : %s", text)
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		glog.Error("received more than two parameters")
		glogFlushAndExit(extension.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]

	claim := getJWTClaims(token)
	iss := getClaimValue(claim, issuerClaim)
	sub := getClaimValue(claim, subjectClaim)

	glog.Info("Token issuer :" + iss)
	glog.Info("Subject :" + sub)

	if sub != uName {
		glog.Error("username does not match with subject in JWT")
		glogFlushAndExit(extension.ErrorExitCode)
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
		glogFlushAndExit(extension.ErrorExitCode)
	}
	glog.Info("signature verified")

	if tokenValidity {
		glog.Info("user successfully authenticated")
		glogFlushAndExit(extension.SuccessExitCode)
	} else {
		glog.Error("authentication failed")
		glogFlushAndExit(extension.ErrorExitCode)
	}
}
