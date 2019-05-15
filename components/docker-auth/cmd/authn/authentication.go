package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/golang/glog"

	"github.com/cellery-io/cellery-hub/components/docker-auth/pkg"
)

var (
	idpKey        []byte
	dockerAuthKey []byte
	err           error
)

const (
	issuerClaim = "iss"
	subjectClaim = "sub"
	expirationClaim = "exp"
	idpCertEnvVar = "IDP_CERT"
	authTokenIssuer = "REGISTRY_AUTH_TOKEN_ISSUER"
	dockerAuthCertEnvVar = "REGISTRY_AUTH_TOKEN_ROOTCERTBUNDLE"
)

func errLog(err error) {
	if err != nil {
		log.Fatal("Error:", err.Error())
	}
}

func init() {
	flag.Usage = usage
	flag.Parse()
	idpKey, err = ioutil.ReadFile(os.Getenv(idpCertEnvVar))
	if err != nil {
		glog.Info("unable to find the idp key")
		glog.Flush()
		os.Exit(pkg.ErrorExitCode)
	}
	dockerAuthKey, err = ioutil.ReadFile(os.Getenv(dockerAuthCertEnvVar))
	if err != nil {
		glog.Info("unable to find the docker auth key")
		glog.Flush()
		os.Exit(pkg.ErrorExitCode)
	}
}

func usage() {
	flag.PrintDefaults()
	os.Exit(pkg.MisuseExitCode)
}

func getJWTClaim(token interface{}, claimKey string) string {
	jwtToken, _ := jwt.Parse(token.(string), nil)
	claims, _ := jwtToken.Claims.(jwt.MapClaims)
	return claims[claimKey].(string)
}

func SignatureValidate(inToken interface{}, cert []byte) (interface{}, error) {
	publicRSA, err := jwt.ParseRSAPublicKeyFromPEM(cert)
	if err != nil {
		return nil, err
	}
	token, err := jwt.Parse(inToken.(string), func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicRSA, err
	})
	if token != nil {
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			return claims, nil
		} else {
			return nil, err
		}
	}
	return nil, err
}

func getTokenValidity(timestamp interface{}) bool {
	if validity, ok := timestamp.(float64); ok {
		tm := time.Unix(int64(validity), 0)
		remainder := tm.Sub(time.Now())
		if remainder > 0 {
			return true
		}
	}
	return false
}

func main() {
	text := pkg.ReadStdIn()
	credentials := strings.Split(text, " ")

	if len(credentials) != 2 {
		os.Exit(pkg.ErrorExitCode)
	}
	uName := credentials[0]
	token := credentials[1]

	glog.Infof("id_token received %s:", token)

	iss := getJWTClaim(token, issuerClaim)
	sub := getJWTClaim(token, subjectClaim)

	glog.Info("Token issuer :" + iss)
	glog.Info("Subject :" + sub)

	if sub != uName {
		glog.Info("Username does not match with subject in JWT")
		os.Exit(pkg.ErrorExitCode)
	}

	var certificateInUse = idpKey

	if iss == authTokenIssuer {
		certificateInUse = dockerAuthKey
	}

	claims, err := SignatureValidate(token, certificateInUse)
	glog.Info("JWT read successfully")
	if err != nil {
		errLog(err)
	}

	claimValue := claims.(jwt.MapClaims)
	glog.Info("Claims retrieved successfully")
	tokenValidity := getTokenValidity(claimValue[expirationClaim])

	isUserAuthenticated := false
	if tokenValidity {
		isUserAuthenticated = true
		glog.Info("Token is not expired")
	}

	if isUserAuthenticated {
		glog.Info("User successfully authenticated")
		glog.Flush()
		os.Exit(pkg.SuccessExitCode)
	} else {
		glog.Info("Authentication failed")
		glog.Flush()
		os.Exit(pkg.ErrorExitCode)
	}
}
