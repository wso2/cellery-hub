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
VERSION ?= latest

PROXY := proxy
DOCKER_AUTH := docker-auth
PORTAL := portal
API := api
IDENTITY_SERVER_CUSTOMIZATION := identity-server-customization
DEPLOYMENT_INIT := deployment-init
COMPONENTS := $(PROXY) $(DOCKER_AUTH) $(PORTAL) $(API) $(IDENTITY_SERVER_CUSTOMIZATION) $(DEPLOYMENT_INIT)

CLEAN_TARGETS := $(addprefix clean., $(COMPONENTS))
INIT_TARGETS := $(addprefix init., $(COMPONENTS))
CODE_FORMAT_TARGETS := $(addprefix code-format., $(COMPONENTS))
CHECK_STYLE_TARGETS := $(addprefix check-style., $(COMPONENTS))
BUILD_TARGETS := $(addprefix build., $(COMPONENTS))
TEST_TARGETS := $(addprefix test., $(COMPONENTS))
DOCKER_TARGETS := $(addprefix docker., $(COMPONENTS))
DOCKER_PUSH_TARGETS := $(addprefix docker-push., $(COMPONENTS))



all: clean init build docker

.PHONY: clean
clean: $(CLEAN_TARGETS)

.PHONY: init
init: $(INIT_TARGETS)

.PHONY: code-format
code-format: $(CODE_FORMAT_TARGETS)

.PHONY: check-style
check-style: $(CHECK_STYLE_TARGETS)

.PHONY: build
build: $(BUILD_TARGETS)

.PHONY: test
test: $(TEST_TARGETS)

.PHONY: docker
docker: $(DOCKER_TARGETS)

.PHONY: docker-push
docker-push: $(DOCKER_PUSH_TARGETS)



.PHONY: clean.$(PROXY)
clean.$(PROXY):
	rm -rf ./components/$(PROXY)/target/

.PHONY: clean.$(DOCKER_AUTH)
clean.$(DOCKER_AUTH):
	rm -rf ./components/$(DOCKER_AUTH)/target/

.PHONY: clean.$(PORTAL)
clean.$(PORTAL):
	rm -rf ./components/$(PORTAL)/build

.PHONY: clean.$(API)
clean.$(API):
	rm -rf ./components/$(API)/target/

.PHONY: clean.$(IDENTITY_SERVER_CUSTOMIZATION)
clean.$(IDENTITY_SERVER_CUSTOMIZATION):
	mvn clean -f ./components/$(IDENTITY_SERVER_CUSTOMIZATION)/cellery-identity-customizations/pom.xml

.PHONY: clean.$(DEPLOYMENT_INIT)
clean.$(DEPLOYMENT_INIT):
	@:


.PHONY: init.$(PROXY)
init.$(PROXY):
	@:

.PHONY: init.$(DOCKER_AUTH)
init.$(DOCKER_AUTH):
	@command -v goimports >/dev/null; \
	if [ $$? -ne 0 ]; then \
		echo "goimports not found. Running 'go get golang.org/x/tools/cmd/goimports'"; \
		go get golang.org/x/tools/cmd/goimports; \
	fi

.PHONY: init.$(PORTAL)
init.$(PORTAL):
	cd ./components/$(PORTAL); \
	npm ci
	cd ./components/$(PORTAL)/node-server; \
	npm ci

.PHONY: init.$(API)
init.$(API):
	@:

.PHONY: init.$(IDENTITY_SERVER_CUSTOMIZATION)
init.$(IDENTITY_SERVER_CUSTOMIZATION):
	@:

.PHONY: init.$(DEPLOYMENT_INIT)
init.$(DEPLOYMENT_INIT):
	@:


.PHONY: code-format.$(PROXY)
code-format.$(PROXY):
	@:

.PHONY: code-format.$(DOCKER_AUTH)
code-format.$(DOCKER_AUTH):
	@goimports -local $(PROJECT_PKG) -w -l ./components/$(DOCKER_AUTH)/

.PHONY: code-format.$(PORTAL)
code-format.$(PORTAL):
	cd ./components/$(PORTAL); \
	npm run lint:fix

.PHONY: code-format.$(API)
code-format.$(API):
	@:

.PHONY: code-format.$(IDENTITY_SERVER_CUSTOMIZATION)
code-format.$(IDENTITY_SERVER_CUSTOMIZATION):
	@:

.PHONY: code-format.$(DEPLOYMENT_INIT)
code-format.$(DEPLOYMENT_INIT):
	@:


.PHONY: check-style.$(PROXY)
check-style.$(PROXY):
	@:

.PHONY: check-style.$(DOCKER_AUTH)
check-style.$(DOCKER_AUTH):
	test -z "$$(goimports -local $(PROJECT_PKG) -l ./components/ | tee /dev/stderr)"

.PHONY: check-style.$(PORTAL)
check-style.$(PORTAL):
	cd ./components/portal; \
	npm run lint

.PHONY: check-style.$(API)
check-style.$(API):
	@:

.PHONY: check-style.$(IDENTITY_SERVER_CUSTOMIZATION)
check-style.$(IDENTITY_SERVER_CUSTOMIZATION):
	@:

.PHONY: check-style.$(DEPLOYMENT_INIT)
check-style.$(DEPLOYMENT_INIT):
	@:


.PHONY: build.$(PROXY)
build.$(PROXY): clean.$(PROXY) init.$(PROXY)
	@:

.PHONY: build.$(DOCKER_AUTH)
build.$(DOCKER_AUTH): clean.$(DOCKER_AUTH) init.$(DOCKER_AUTH)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./components/$(DOCKER_AUTH)/target/authentication ./components/$(DOCKER_AUTH)/cmd/authn/authentication.go
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ./components/$(DOCKER_AUTH)/target/authorization ./components/$(DOCKER_AUTH)/cmd/authz/authorization.go

.PHONY: build.$(PORTAL)
build.$(PORTAL): clean.$(PORTAL) init.$(PORTAL)
	cd ./components/$(PORTAL); \
	npm run build

.PHONY: build.$(API)
build.$(API): clean.$(API) init.$(API)
	@:

.PHONY: build.$(IDENTITY_SERVER_CUSTOMIZATION)
build.$(IDENTITY_SERVER_CUSTOMIZATION): clean.$(IDENTITY_SERVER_CUSTOMIZATION) init.$(IDENTITY_SERVER_CUSTOMIZATION)
	mvn clean install -f components/$(IDENTITY_SERVER_CUSTOMIZATION)/cellery-identity-customizations/pom.xml

.PHONY: build.$(DEPLOYMENT_INIT)
build.$(DEPLOYMENT_INIT): clean.$(DEPLOYMENT_INIT) init.$(DEPLOYMENT_INIT)
	@:


.PHONY: test.$(PROXY)
test.$(PROXY): build.$(PROXY)
	@:

.PHONY: test.$(DOCKER_AUTH)
test.$(DOCKER_AUTH): build.$(DOCKER_AUTH)
	# TODO : Fix the test cases and enable
	@:
#	cd ../../
#	go test -test.v -race -covermode=atomic -coverprofile=$(PROJECT_ROOT)/coverage.txt ./components/docker-auth...

.PHONY: test.$(PORTAL)
test.$(PORTAL): build.$(PORTAL)
	cd ./components/portal; \
	npm run test

.PHONY: test.$(API)
test.$(API): build.$(API)
	@:

.PHONY: test.$(IDENTITY_SERVER_CUSTOMIZATION)
test.$(IDENTITY_SERVER_CUSTOMIZATION): build.$(IDENTITY_SERVER_CUSTOMIZATION)
	@:

.PHONY: test.$(DEPLOYMENT_INIT)
test.$(DEPLOYMENT_INIT): build.$(DEPLOYMENT_INIT)
	@:


.PHONY: docker.$(PROXY)
docker.$(PROXY): build.$(PROXY)
	rm -rf ./docker/$(PROXY)/target
	cp -r ./components/$(PROXY)/ ./docker/$(PROXY)/target/
	cd ./docker/$(PROXY); \
	docker build -t $(DOCKER_REPO)/cellery-hub-proxy:$(VERSION) .

.PHONY: docker.$(DOCKER_AUTH)
docker.$(DOCKER_AUTH): build.$(DOCKER_AUTH)
	rm -rf ./docker/$(DOCKER_AUTH)/target
	cp -r ./components/$(DOCKER_AUTH)/target/ ./docker/$(DOCKER_AUTH)/target/
	cd ./docker/$(DOCKER_AUTH); \
	docker build -t $(DOCKER_REPO)/cellery-hub-docker-auth:$(VERSION) .

.PHONY: docker.$(PORTAL)
docker.$(PORTAL): build.$(PORTAL)
	rm -rf ./docker/$(PORTAL)/target
	cp -r ./components/portal/node-server ./docker/$(PORTAL)/target/
	cp -r ./components/portal/build ./docker/$(PORTAL)/target/public/
	cd ./docker/$(PORTAL); \
	docker build -t $(DOCKER_REPO)/cellery-hub-portal:$(VERSION) .

.PHONY: docker.$(API)
docker.$(API): build.$(API)
	rm -rf ./docker/$(API)/target
	cp -r ./components/$(API)/ ./docker/$(API)/target/
	cd ./docker/$(API); \
	docker build -t $(DOCKER_REPO)/cellery-hub-api:$(VERSION) .

.PHONY: docker.$(IDENTITY_SERVER_CUSTOMIZATION)
docker.$(IDENTITY_SERVER_CUSTOMIZATION): build.$(IDENTITY_SERVER_CUSTOMIZATION)
	mvn clean install -f docker/identity-server/pom.xml

.PHONY: docker.$(DEPLOYMENT_INIT)
docker.$(DEPLOYMENT_INIT): build.$(DEPLOYMENT_INIT)
	cd ./docker/$(DEPLOYMENT_INIT); \
	docker build -t $(DOCKER_REPO)/cellery-hub-deployment-init:$(VERSION) .


.PHONY: docker-push.$(PROXY)
docker-push.$(PROXY):
	docker push $(DOCKER_REPO)/cellery-hub-proxy:$(VERSION)

.PHONY: docker-push.$(DOCKER_AUTH)
docker-push.$(DOCKER_AUTH):
	docker push $(DOCKER_REPO)/cellery-hub-docker-auth:$(VERSION)

.PHONY: docker-push.$(PORTAL)
docker-push.$(PORTAL):
	docker push $(DOCKER_REPO)/cellery-hub-portal:$(VERSION)

.PHONY: docker-push.$(API)
docker-push.$(API):
	docker push $(DOCKER_REPO)/cellery-hub-api:$(VERSION)

.PHONY: docker-push.$(IDENTITY_SERVER_CUSTOMIZATION)
docker-push.$(IDENTITY_SERVER_CUSTOMIZATION):
	docker push $(DOCKER_REPO)/cellery-hub-idp:$(VERSION)

.PHONY: docker-push.$(DEPLOYMENT_INIT)
docker-push.$(DEPLOYMENT_INIT):
	docker push $(DOCKER_REPO)/cellery-hub-deployment-init:$(VERSION)



.PHONY: deploy
deploy:
	mkdir -p deployment/mysql/mnt
	mkdir -p deployment/docker-registry/mnt
	mkdir -p deployment/docker-auth/extension-logs
	cd deployment; \
	docker-compose up -d

.PHONY: undeploy
undeploy:
	cd deployment; \
	docker-compose down
	sudo rm -rf deployment/mysql/mnt
	sudo rm -rf deployment/docker-registry/mnt
	sudo rm -rf deployment/docker-auth/extension-logs
