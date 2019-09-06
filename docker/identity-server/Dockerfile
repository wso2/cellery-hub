# ------------------------------------------------------------------------
#
# Copyright 2018 WSO2, Inc. (http://wso2.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License
#
# ------------------------------------------------------------------------

FROM wso2cellery/cellery-hub-idp-base:5.8.0

ARG USER_HOME=/home/wso2carbon
ARG FILES=./target/files
ARG AUTHENTICATION_ENDPOINT_WEBAPP=${USER_HOME}/wso2is-5.8.0/repository/deployment/server/webapps/authenticationendpoint

# Copy the jar files
COPY --chown=wso2carbon:wso2 ${FILES}/dropins/** ${USER_HOME}/wso2is-5.8.0/repository/components/dropins/

# Copy the error pages

RUN mkdir ${AUTHENTICATION_ENDPOINT_WEBAPP}

RUN cd ${AUTHENTICATION_ENDPOINT_WEBAPP}; \
    jar -xvf ${AUTHENTICATION_ENDPOINT_WEBAPP}.war

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/css/custom-common.css ${AUTHENTICATION_ENDPOINT_WEBAPP}/css/custom-common.css
COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/images/ ${AUTHENTICATION_ENDPOINT_WEBAPP}/images/
COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/cellery_error.jsp ${AUTHENTICATION_ENDPOINT_WEBAPP}/oauth2_error.jsp
COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/cellery_error.jsp ${AUTHENTICATION_ENDPOINT_WEBAPP}/retry.jsp
COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/localize/* ${AUTHENTICATION_ENDPOINT_WEBAPP}/WEB-INF/classes/org/wso2/carbon/identity/application/authentication/endpoint/i18n/
