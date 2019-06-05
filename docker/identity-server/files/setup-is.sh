#!/usr/bin/env bash
source idp-variables.sh
export -n create_google_body=$(cat create-google-idp.xml)
export -n create_github_body=$(cat create-github-idp.xml)
export -n create_oauth2_app_cellery_hub=$(cat create-oauth2-app-cellery-hub.xml)
export -n create_oauth2_app_cli=$(cat create-oauth2-app-cli.xml)
export -n update_cellery_hub_application=$(cat update-cellery-hub-application.xml)
export -n update_cli_application=$(cat update-cli-application.xml)



unset IFS
args=() i=0
for var in $(compgen -e); do



    if [[ $var == CELLERY_HUB_* ]] ;
    then
        export tempEnvVal=$(echo ${!var})
        export create_google_body=$(echo $create_google_body | sed "s#{$var}#${tempEnvVal}#g")
        export create_github_body=$(echo $create_github_body | sed "s#{$var}#${tempEnvVal}#g")
        export create_oauth2_app_cellery_hub=$(echo $create_oauth2_app_cellery_hub | sed "s#{$var}#${tempEnvVal}#g")
        export create_oauth2_app_cli=$(echo $create_oauth2_app_cli | sed "s#{$var}#${tempEnvVal}#g")
        export update_cellery_hub_application=$(echo $update_cellery_hub_application | sed "s#{$var}#${tempEnvVal}#g")
        export update_cli_application=$(echo $update_cli_application | sed "s#{$var}#${tempEnvVal}#g")

    fi
done


split_resluts(){
export BODY=$(echo $HTTP_RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')
export STATUS=$(echo $HTTP_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
}

echo_results () {
split_resluts
  if [ $STATUS -eq 200 ]; then
  tput setaf 2;
    echo $1
    tput sgr0;
  else
    tput setaf 1;
    echo "$2 , Status code : $STATUS"
    tput sgr0;
    echo "response from server: $BODY"
  fi
}


HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$create_google_body" https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k)

echo_results "Google IDP added successfully" "Error while adding Google IDP"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$create_github_body" https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k)

echo_results "Github IDP added successfully" "Error while adding Github IDP"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$create_oauth2_app_cli"l https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k)

echo_results "CLI OAuth2 application added successfully" "Error while adding CLI OAuth2 application"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$create_oauth2_app_cellery_hub" https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k)

echo_results "Cellery Hub application added successfully" "Error while adding Cellery hub OAuth2 application"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data @create-cli-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k)

echo_results "CLI service provider created" "Error while creating CLI service provider"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data @create-web-portal-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k)

echo_results "Cellery Hub Web Portal service provider created" "Error while creating Cellery Hub Web Portal service provider"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$update_cellery_hub_application" https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k)

echo_results "Cellery Hub service provider updated with OAuth2 app" "Error while updating Cellery Hub service provider with OAuth2 app"

HTTP_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u ${CELLERY_HUB_IDP_ADMIN_USERNAME}:${CELLERY_HUB_IDP_ADMIN_PASSWORD} --data "$update_cli_application" https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k)

echo_results "CLI service provider updated with OAuth2 app" "Error while updating CLI service provider with OAuth2 app"

