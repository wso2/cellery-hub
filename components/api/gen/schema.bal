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
    string firstAuthor;
    string createdTimestamp;
};

public type ArtifactResponse record {
    string summary;
    int pullCount;
    string lastAuthor;
    string updatedTimestamp;
    byte[] metadata;
};


public type Count record {
    int count;
};

public type ArtifactListResponse record {
    string artifactImageId;
    string artifactId;
    string summary;
    int pullCount;
    string lastAuthor;
    string updatedTimestamp;
    string artifactVersion;
};

public type ArtifactListArrayResponse record {
    int count;
    ArtifactListResponse[] data;
};

public type Image record {
    string imageId;
    string orgName;
    string imageName;
    string summary;
    string firstAuthor;
    string visibility;
    decimal pushCount;
    decimal pullCount;
};

public type ImageResponse record {
    string imageId;
    string orgName;
    string imageName;
    string summary;
    string firstAuthor;
    string visibility;
    decimal pushCount;
    decimal pullCount;
    string[] keywords;
};

public type StringRecord record {
    string value;
};

public type OrgListResponse record {
    int count;
    OrgListResponseAtom[] data;
};

public type OrgListResponseAtom record {
    string orgName;
    string description;
    int membersCount;
};

public type OrgListResponseImageCount record {
    string orgName;
    int imageCount;
};

public type ErrorResponse record {
    int code;
    string message;
    string description;
};

public type User record {
    string userId;
    string roles;
};

public type UserResponse record {
    string userId;
    string displayName;
    string firstName;
    string lastName;
    string email;
    string roles;
};

public type UserListResponse record {
    int count;
    UserResponse[] users;
};

public type ImagesListResponse record {
    int count;
    ImagesListResponseAtom[] data;
};

public type OrgImagesListResponse record {
    int count;
    OrgImagesListResponseAtom[] data;
};

public type ImagesListResponseAtom record {
    string orgName;
    string imageName;
    string summary;
    decimal pullCount;
    string updatedTimestamp;
    string visibility;
};

public type OrgImagesListResponseAtom record {
    string imageName;
    string summary;
    decimal pullCount;
    string updatedTimestamp;
    string visibility;
};

public type ImageUpdateRequest record {
    string description;
    string summary;
    string[] keywords;
};

public type OrgUpdateRequest record {
    string description;
    string summary;
};

public type ArtifactUpdateRequest record { 
    string description;
};
