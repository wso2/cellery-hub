#!/usr/bin/env bash
source idp-variables.sh
export -n create_google_body=$(cat create-google-idp.xml)
export -n create_github_body=$(cat create-github-idp.xml)
export -n create_oauth2_app_cellery_hub=$(cat create-oauth2-app-cellery_hub.xml)
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

echo "============================"
echo $create_google_body;

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u admin:admin --data "$create_google_body" https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u admin:admin --data "$create_github_idp" https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k -v


curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u admin:admin --data "$create_oauth2_app_cli"l https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u admin:admin --data "$create_oauth2_app_cellery_hub" https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u admin:admin --data @create-cli-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u admin:admin --data @create-web-portal-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u admin:admin --data "$update_cellery_hub_application" https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u admin:admin --data "$update_cli_application" https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v


