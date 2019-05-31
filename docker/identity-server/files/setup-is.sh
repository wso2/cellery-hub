curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u admin:admin --data @create-google-idp.xml https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:addIdP" -u admin:admin --data @create-github-idp.xml https://localhost:9443/services/IdentityProviderMgtService.IdentityProviderMgtServiceHttpsSoap12Endpoint -k -v


curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u admin:admin --data @create-oauth2-app-cli.xml https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:registerOAuthApplicationData" -u admin:admin --data @create-oauth2-app-cellery-hub.xml https://localhost:9443/services/OAuthAdminService.OAuthAdminServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u admin:admin --data @create-cli-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:createApplication" -u admin:admin --data @create-web-portal-app.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u admin:admin --data @update-cli-application.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v

curl --header "Content-Type: application/soap+xml;charset=UTF-8" --header "SOAPAction:urn:updateApplication" -u admin:admin --data @update-cellery-hub-application.xml https://localhost:9443/services/IdentityApplicationManagementService.IdentityApplicationManagementServiceHttpsSoap12Endpoint/ -k -v


