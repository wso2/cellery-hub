import ballerina/io;
import ballerina/log;
import cellery/model;
import ballerina/system;
import ballerina/filepath;

function closeRc(io:ReadableCharacterChannel rc) {
    var result = rc.close();
    if (result is error) {
        log:printError("Error occurred while closing character stream",
                        err = result);
    }
}

public function loadConfig() returns (model:Auth) {
    string path = checkpanic filepath:build(system:getUserHome(), ".cellery", "config.json");
    io:ReadableByteChannel rbc = io:openReadableFile(path);
    io:ReadableCharacterChannel rch = new(rbc, "UTF8");
    var result = rch.readJson();
    json auth = null;

    model:Auth config = {
        idpHost:"",
        idpPort:0,
        username:"",
        password:""
    };
    
    if result is json {
        auth = result.auth;
        var idpHost = auth.idpHost;
        var idpPort = auth.idpPort;
        var username = auth.username;
        var password = auth.password;
        if (idpHost is string) && (idpPort is int) && (username is string) && (password is string) {
            config.idpHost = idpHost;
            config.idpPort = idpPort;
            config.username = username;
            config.password = password;
        }
    }
    // io:println(config.idpHost + " " + config.idpPort + " " + config.username + " " + config.password);
    if (result is error) {
        closeRc(rch);
    } else {
        closeRc(rch);
    }
    return config;
}
