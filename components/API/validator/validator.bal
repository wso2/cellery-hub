import ballerina/config;
import ballerina/http;
import ballerina/log;
import ballerina/io;
import ballerina/time;
import cellery/reader;
import cellery/model;

# Description
#
# + token - access token to be validated
# + return - returns whether the access token is valid or not
public function validateAccessToken(string username, string token) returns (boolean) {
    model:Auth auth = reader:loadConfig();
    http:Client httpEndpoint = new("https://"+auth.idpHost+":"+auth.idpPort+"/", config = {
        auth: {
            scheme: http:BASIC_AUTH,
            config: {
                username: auth.username,
                password: auth.password
            }
        }
    });
    http:Request req = new;
    req.setPayload("token=" + token);
    // req.addHeader("Content-Type", "application/x-www-form-urlencoded");
    error ? x = req.setContentType("application/x-www-form-urlencoded");
    var response = httpEndpoint->post("/oauth2/introspect", req);
    var isValid = false;
    if (response is http:Response) {
        var result = response.getJsonPayload();
        if result is error {
            log:printError("Payload Error ", err = result);
        }
        // json|error j = json.convert(result);
        if (result is json) {
            boolean|error resActive = boolean.convert(result.active);
            if (resActive is boolean) {
                isValid = resActive;
            }
            if (isValid) {
                int|error resExp = int.convert(result.exp);
                if (resExp is int) {
                    var exp = isExpired(resExp);
                    string|error resUsername = string.convert(result.username);
                    if (resUsername is string) {
                        return !exp && isValidUser(username, resUsername);
                    }
                }
            }
        }
        return isValid;
    } else {
        log:printError("Failed to call the introspection endpoint.", err = response);
        return isValid;
    }
}

function isExpired(int timeVal) returns boolean {
    time:Time time = time:currentTime();
    int timeNow = time.time;
    if (timeNow/1000 < timeVal) {
        return false;
    }else{
        io:println("Token is expired");
        return true;
    }
}

function isValidUser(string tokenUsername, string givenUsername) returns boolean {
    return tokenUsername == givenUsername;
}
