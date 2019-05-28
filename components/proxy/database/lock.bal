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

import ballerina/log;

# Acquire the write lock from the MySQL DB.
#
# Lock this path by acquiring the MySQL write lock. Since this is in a transaction auto commit will be switched off.
# This allows the proxy to run in HA mode and lock the image pushing across replicas.
#
# + imageFQN - imageFQN Fully qualified Cell Image name
# + return - error if an error occurred
public function acquireWriteLockForImage(string imageFQN) returns error? {
    var lockResult = check celleryHubDB->update("INSERT INTO REGISTRY_ARTIFACT_LOCK(ARTIFACT_NAME, LOCK_COUNT) VALUES (?, 1) " +
        "ON DUPLICATE KEY UPDATE LOCK_COUNT = LOCK_COUNT + 1", imageFQN);
}

# Cleanup any data usd in acquiring the write lock.
#
# + imageFQN - imageFQN Parameter Description
public function cleanUpAfterLockForImage(string imageFQN) {
    var lockCleanupResult = celleryHubDB->update("DELETE FROM REGISTRY_ARTIFACT_LOCK WHERE ARTIFACT_NAME = ?", imageFQN);
    if (lockCleanupResult is error) {
        log:printError("Failed to cleanup lock rows created for image " + imageFQN, err = lockCleanupResult);
    } else {
        log:printDebug("Removed DB row used for locking image " + imageFQN);
    }
}
