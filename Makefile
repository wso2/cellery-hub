#  Copyright (c) 2019 WSO2 Inc. (http:www.wso2.org) All Rights Reserved.
#
#  WSO2 Inc. licenses this file to you under the Apache License,
#  Version 2.0 (the "License"); you may not use this file except
#  in compliance with the License.
#  You may obtain a copy of the License at
#
#  http:www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

PROJECT_ROOT := $(realpath $(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
PROJECT_PKG := github.com/cellery-io/cellery-hub
DOCKER_REPO ?= wso2cellery
DOCKER_IMAGE_TAG ?= latest

all: clean init build docker

.PHONY: clean
clean:
	rm -rf ./components/docker-auth/target/
	rm -rf ./components/portal/build

.PHONY: init
init:
	@command -v goimports >/dev/null; \
	if [ $$? -ne 0 ]; then \
		echo "goimports not found. Running 'go get golang.org/x/tools/cmd/goimports'"; \
		go get golang.org/x/tools/cmd/goimports; \
	fi
	cd ./components/portal; \
	npm ci
	cd ./components/portal/node-server; \
	npm ci

.PHONY: code-format
code-format:
	@goimports -local $(PROJECT_PKG) -w -l ./components/
	cd ./components/portal; \
	npm run lint:fix

.PHONY: check-style
check-style:
	test -z "$$(goimports -local $(PROJECT_PKG) -l ./components/ | tee /dev/stderr)"
	cd ./components/portal; \
	npm run lint

.PHONY: build
build: clean init
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./components/docker-auth/target/authentication ./components/docker-auth/cmd/authn/authentication.go
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./components/docker-auth/target/authorization ./components/docker-auth/cmd/authz/authorization.go
	cd ./components/portal; \
	npm run build

.PHONY: test
test: build
	cd ./components/portal; \
	npm run test

.PHONY: docker
docker: build
	docker build -t $(DOCKER_REPO)/cellery-hub-auth:$(DOCKER_IMAGE_TAG) -f ./docker/docker-auth/Dockerfile .
	docker build -t $(DOCKER_REPO)/cellery-hub-proxy:$(DOCKER_IMAGE_TAG) -f ./docker/proxy/Dockerfile .
	docker build -t $(DOCKER_REPO)/cellery-hub-portal:$(DOCKER_IMAGE_TAG) -f ./docker/portal/Dockerfile .

.PHONY: deploy
deploy:
	mkdir -p deployment/docker-auth/extension-logs
	mkdir -p deployment/docker-registry/mnt
	cd deployment; \
	docker-compose up

.PHONY: undeploy
undeploy:
	cd deployment; \
	docker-compose down
