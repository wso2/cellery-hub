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

public type TokensResponse record {
    string accessToken;
    string idToken;
};

public type OrgCreateRequest record {
    string orgName;
    string description;
    string websiteUrl;
    string defaultVisibility;
};

public type OrgResponse record {
    string description;
    string websiteUrl;
    string author;
    string createdTimestamp;
};

public type ArtifactResponse record {
    string description;
    int pullCount;
    string lastAuthor;
    string updatedTimestamp;
    byte[] metadata;
};

public type Image record {
    string artifactImageId;
    string orgName;
    string imageName;
    string description;
    string firstAuthor;
    string visibility;
};

public type ImageResponse record {
    string artifactImageId;
    string orgName;
    string imageName;
    string description;
    string firstAuthor;
    string visibility;
    ImageVersion[] versions;
};

public type ImageVersion record {
    string imageVersion;
    int pushCount;
    int pullCount;
    string lastUpdated;
};

public type ErrorResponse record {
    int code;
    string message;
    string description;
};
