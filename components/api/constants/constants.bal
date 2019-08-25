// ------------------------------------------------------------------------
//
// Copyright 2019 WSO2, Inc. (http://wso2.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License
//
// ------------------------------------------------------------------------

public const string APPLICATION_URL_ENCODED_CONTENT_TYPE = "application/x-www-form-urlencoded";

public const string AUTHENTICATED_USER = "x-cellery-hub-user";
public const string CONSTRUCTED_TOKEN = "x-cellery-hub-user-token";
public const string G_CAPTCHA_RESPONSE = "g-recaptcha-response";
public const string SET_COOKIE_HEADER = "Set-Cookie";

public const int API_ERROR_CODE = 1;
public const int ENTRY_ALREADY_EXISTING_ERROR_CODE = 2;
public const int ALLOWED_LIMIT_EXCEEDED_ERROR_CODE = 3;
public const int ENTRY_NOT_FOUND_ERROR_CODE = 4;

public const string VALIDATE_USER = "validateUser";
public const string OFFSET = "offset";
public const string RESULT_LIMIT = "resultLimit";
public const string ARTIFACT_VERSION = "artifactVersion";
public const string ORG_NAME = "orgName";
public const string IMAGE_NAME = "imageName";
public const string ORDER_BY = "orderBy";

public const string IDP_ENDPOINT_VAR = "idp.endpoint";
public const string IDP_INTROSPCET_VAR = "idp.introspection.endpoint";
public const string IDP_USERNAME_VAR = "idp.username";
public const string IDP_PASSWORD_VAR = "idp.password";

public const string DEFAULT_IDP_ENDPOINT = "https://localhost:9443/oauth2/introspect";
public const string IDP_DEFAULT_PASSWORD = "admin";
public const string IDP_DEFAULT_USERNAME = "admin";

public const string AUTHORIZATION_HEADER = "Authorization";
public const string COOKIE_HEADER = "Cookie";
public const string TOKEN_COOKIE_KEY = "chpat";
public const string TOKEN_BEARER_KEY = "Bearer";

public const string ROLE_ADMIN = "admin";
public const string ROLE_PUSH = "push";
public const string DEFAULT_IMAGE_VISIBILITY = "PUBLIC";
public const string PULL_COUNT = "PULL_COUNT";
public const string UPDATED_DATE = "UPDATED_DATE";

public const string CACHE_EXPIRY_VAR = "token.cache.expiry";
public const string CACHE_CAPACITY_VAR = "token.cache.capacity";

public const string DOCKER_REGISTRY_REPOSITORIES_FILEPATH = "/var/lib/registry/docker/registry/v2/repositories";
