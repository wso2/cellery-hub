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

FROM ubuntu:bionic
LABEL MAINTAINER="WSO2 Cellery Maintainers <dev@wso2.org>"

COPY ./files/ ./

RUN apt-get -y update;\
    apt-get -y upgrade;\
    apt-get -y install curl

ENV TERM=xterm-256color

ENTRYPOINT ["bash", "setup-is.sh"]
