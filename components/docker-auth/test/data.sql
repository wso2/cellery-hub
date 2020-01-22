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

USE CELLERY_HUB;
INSERT INTO `REGISTRY_ORGANIZATION` (ORG_NAME, DESCRIPTION, WEBSITE_URL, DEFAULT_IMAGE_VISIBILITY, FIRST_AUTHOR, CREATED_DATE) VALUES ('cellery','ABC is my first org','abc.com','private','unknown','2019-05-27 14:58:47');
INSERT INTO `REGISTRY_ORGANIZATION` (ORG_NAME, DESCRIPTION, WEBSITE_URL, DEFAULT_IMAGE_VISIBILITY, FIRST_AUTHOR, CREATED_DATE) VALUES ('is','ABC is my first org','pqr.com','private','unknown','2019-05-27 14:58:47');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` (USER_UUID, ORG_NAME, USER_ROLE, CREATED_DATE) VALUES ('wso2.com','cellery','push','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` (USER_UUID, ORG_NAME, USER_ROLE, CREATED_DATE) VALUES ('admin.com','cellery','admin','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` (USER_UUID, ORG_NAME, USER_ROLE, CREATED_DATE) VALUES ('other.com','is','pull','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ARTIFACT_IMAGE` (ARTIFACT_IMAGE_ID, ORG_NAME, IMAGE_NAME, DESCRIPTION, FIRST_AUTHOR, VISIBILITY) VALUES ('1','cellery','image','Sample','unkown','PUBLIC');
INSERT INTO `REGISTRY_ARTIFACT_IMAGE` (ARTIFACT_IMAGE_ID, ORG_NAME, IMAGE_NAME, DESCRIPTION, FIRST_AUTHOR, VISIBILITY) VALUES ('2','cellery','newImage','Sample','www.dockehub.com','PRIVATE');
INSERT INTO `REGISTRY_ARTIFACT_IMAGE` (ARTIFACT_IMAGE_ID, ORG_NAME, IMAGE_NAME, DESCRIPTION, FIRST_AUTHOR, VISIBILITY) VALUES ('3','is','pqr','Sample','www.dockehub.com','PRIVATE');
