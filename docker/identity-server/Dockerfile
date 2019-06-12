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

FROM wso2cellery/cellery-hub-idp-base:5.7.0

ARG USER_HOME=/home/wso2carbon
ARG FILES=./target/files

# Copy the jar files
COPY --chown=wso2carbon:wso2 ${FILES}/dropins/** ${USER_HOME}/wso2is-5.7.0/repository/components/dropins/

RUN mkdir ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint

RUN cd ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint ; \
jar -xvf ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint.war

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/css/custom-common.css ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint/css/custom-common.css

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/images/ ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint/images/

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/cellery_error.jsp ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint/oauth2_error.jsp

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/cellery_error.jsp ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint/retry.jsp

COPY --chown=wso2carbon:wso2 ${FILES}/authenticationendpoint/localize/* ${USER_HOME}/wso2is-5.7.0/repository/deployment/server/webapps/authenticationendpoint/WEB-INF/classes/org/wso2/carbon/identity/application/authentication/endpoint/i18n/
