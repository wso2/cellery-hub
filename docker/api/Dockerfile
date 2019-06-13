# ------------------------------------------------------------------------
#
# Copyright 2019 WSO2, Inc. (http://wso2.com)
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

FROM ballerina/ballerina:0.991.0 as builder
LABEL MAINTAINER="WSO2 Cellery Maintainers <dev@wso2.org>"

ARG PROJECT_DIR="/workspace"
WORKDIR ${PROJECT_DIR}
USER root

COPY ./target/ ./

RUN chown -R ballerina ${PROJECT_DIR}
USER ballerina

RUN ballerina build

FROM ballerina/ballerina:0.991.0

ARG WORK_DIR="/home/ballerina"
WORKDIR ${WORK_DIR}
USER ballerina

COPY --from=builder /workspace/target/core.balx ./

RUN wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.16/mysql-connector-java-8.0.16.jar -P ${BALLERINA_HOME}/bre/lib

EXPOSE 9090

ENTRYPOINT cp ${API_CONF} ./ballerina.conf && ballerina run core.balx 2>&1 | tee hub_api.log
