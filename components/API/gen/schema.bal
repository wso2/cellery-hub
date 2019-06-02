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

public type Error record { 
    int code;
    string message;
    string description;
};

public type organizationRequest record { 
    string name;
    string description;
    string defaultImageVisibility;
};

public type organizationListResponse record {
    organizationResponse[] organizationresponseList;
};

public type organizationResponse record { 
    string name;
    string createdDate;
};

public type createArtifactRequest record { 
    string org;
    string imageName;
    string _version;
    string metadata;
};

public type updateArtifactRequest record { 
    string id;
    string description;
};

public type artifactLabels record { 
    string name;
    string value;
};

public type listArtifactResponse record { 
    artifactListResponse[] artifactlistresponseList;
};

public type artifactListResponse record { 
    string id;
    string imageName;
    string _version;
    // string orgName;
    // string ingressType?;
    // boolean varified?;
    // boolean stateful?;
    // string labelKey;
    // string labelValue;
};

public type artifactResponse record { 
    string id;
    string imageName;
    string _version;
    string description;
    int pullCount;
    int pushCount;
    string visibility;
    string licenseIdentifier;
    string metadata;
    string owner;
    string lastAuthor;
    string createdDate;
    string updatedDate;
    boolean stateful;
    boolean verified;
    string[] ingresses;
    artifactLabels[] labels;
};

public type imageListResponse record { 
    imageResponse[] imageresponseList;
};

public type imageResponse record { 
    string id;
    string org;
    string imageName;
};


type RegistryArtifact record {|
    string ARTIFACT_ID;
|};