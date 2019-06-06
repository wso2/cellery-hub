USE CELLERY_HUB;
INSERT INTO `REGISTRY_ORGANIZATION` VALUES ('cellery','ABC is my first org','private','2019-05-27 14:58:47');
INSERT INTO `REGISTRY_ORGANIZATION` VALUES ('is','ABC is my first org','private','2019-05-27 14:58:47');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` VALUES ('wso2.com','cellery','push','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` VALUES ('admin.com','cellery','admin','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ORG_USER_MAPPING` VALUES ('other.com','is','pull','2019-04-06 00:00:00');
INSERT INTO `REGISTRY_ARTIFACT_IMAGE` VALUES ('1','cellery','image','Sample','www.dockehub.com','ABC','www.apidoc.com','www.source.com','1','public');
INSERT INTO `REGISTRY_ARTIFACT_IMAGE` VALUES ('2','cellery','newImage','Sample','www.dockehub.com','ABC','www.apidoc.com','www.source.com','1','private');