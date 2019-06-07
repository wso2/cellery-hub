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

public const string GET_ORG_QUERY = "SELECT DESCRIPTION, WEBSITE_URL, FIRST_AUTHOR, CREATED_DATE
                                    FROM REGISTRY_ORGANIZATION WHERE ORG_NAME = ?";
public const string ADD_ORG_QUERY = "INSERT INTO REGISTRY_ORGANIZATION ( ORG_NAME, DESCRIPTION, WEBSITE_URL,
                                    DEFAULT_IMAGE_VISIBILITY, FIRST_AUTHOR ) VALUES ( ?,?,?,?,? )";
public const string GET_ORG_COUNT_FOR_USER = "SELECT COUNT(ORG_NAME) FROM REGISTRY_ORG_USER_MAPPING WHERE USER_UUID=?";

public const string GET_IMAGE_FOR_USER_FROM_IMAGE_NAME = "SELECT ARTIFACT_IMAGE_ID,ORG_NAME,IMAGE_NAME,DESCRIPTION,
                                        FIRST_AUTHOR,VISIBILITY FROM REGISTRY_ARTIFACT_IMAGE
                                        WHERE VISIBILITY = \"PUBLIC\" AND ORG_NAME=? AND IMAGE_NAME=? OR ORG_NAME IN (SELECT ORG_NAME FROM
                                        REGISTRY_ORG_USER_MAPPING WHERE USER_UUID = ? AND ORG_NAME = ?) AND IMAGE_NAME=?";

public const string GET_IMAGE_FROM_IMAGE_NAME = "SELECT ARTIFACT_IMAGE_ID,ORG_NAME,IMAGE_NAME,DESCRIPTION,
                                        FIRST_AUTHOR,VISIBILITY FROM REGISTRY_ARTIFACT_IMAGE
                                        WHERE VISIBILITY = \"PUBLIC\" AND ORG_NAME=? AND IMAGE_NAME=?";

public const string GET_IMAGE_VERSIONS = "SELECT VERSION,PUSH_COUNT,PULL_COUNT,UPDATED_DATE FROM REGISTRY_ARTIFACT WHERE ARTIFACT_IMAGE_ID=?
                                        LIMIT ? OFFSET ?";
public const string GET_ARTIFACT_FROM_IMG_NAME_N_VERSION = "SELECT REGISTRY_ARTIFACT.DESCRIPTION, REGISTRY_ARTIFACT.PULL_COUNT,
                                    REGISTRY_ARTIFACT.LAST_AUTHOR, REGISTRY_ARTIFACT.UPDATED_DATE, REGISTRY_ARTIFACT.METADATA
                                    FROM REGISTRY_ARTIFACT INNER JOIN
                                    REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT.ARTIFACT_IMAGE_ID=REGISTRY_ARTIFACT_IMAGE.ARTIFACT_IMAGE_ID
                                    WHERE VISIBILITY = \"PUBLIC\" AND REGISTRY_ARTIFACT_IMAGE.ORG_NAME=? AND REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=? AND REGISTRY_ARTIFACT.VERSION=?";
public const string GET_ARTIFACT_FOR_USER_FROM_IMG_NAME_N_VERSION = "SELECT REGISTRY_ARTIFACT.DESCRIPTION, REGISTRY_ARTIFACT.PULL_COUNT,
                                    REGISTRY_ARTIFACT.LAST_AUTHOR, REGISTRY_ARTIFACT.UPDATED_DATE, REGISTRY_ARTIFACT.METADATA
                                    FROM REGISTRY_ARTIFACT INNER JOIN
                                    REGISTRY_ARTIFACT_IMAGE ON REGISTRY_ARTIFACT.ARTIFACT_IMAGE_ID=REGISTRY_ARTIFACT_IMAGE.ARTIFACT_IMAGE_ID
                                    WHERE VISIBILITY = \"PUBLIC\" AND REGISTRY_ARTIFACT_IMAGE.ORG_NAME=? AND REGISTRY_ARTIFACT_IMAGE.IMAGE_NAME=?
                                    AND REGISTRY_ARTIFACT.VERSION=? OR ORG_NAME IN (SELECT ORG_NAME FROM
                                    REGISTRY_ORG_USER_MAPPING WHERE USER_UUID = ? AND ORG_NAME = ?) AND IMAGE_NAME=? AND REGISTRY_ARTIFACT.VERSION=?";
