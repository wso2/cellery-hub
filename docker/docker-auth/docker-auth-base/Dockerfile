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

FROM golang:1.12.9
RUN mkdir -p /go/src/github.com/cesanta
RUN cd /go/src/github.com && cd cesanta && git clone https://github.com/cesanta/docker_auth.git
COPY ./target/docker_auth/ /go/src/github.com/cesanta/
RUN export GO111MODULE=on && cd /go/src/github.com/cesanta/docker_auth/auth_server && git checkout 82573a5f102c2d886428415bf6fcb8d94706834a && sed -i 's/Version/"1.0.0"/g' main.go && sed -i 's/BuildId/"1.0.0"/g' main.go && go build main.go
