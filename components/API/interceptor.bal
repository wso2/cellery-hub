import ballerina/config;
import ballerina/http;
import ballerina/log;
import ballerina/io;
import ballerina/time;
import cellery/reader;
import cellery/model;
import cellery/validator;

final string filter_name_header = "isValidToken";

public type RequestFilter object {
    public function filterRequest(http:Caller caller, http:Request request,
                        http:FilterContext context)
                        returns boolean {
        log:printInfo("Request Interceptor......");
        var params = request.getQueryParams();
        var token = <string>params.token;
        var username = <string>params.username;
        var isValid = validator:validateAccessToken(username, token);
        string|error validStr = string.convert(isValid);
        if (validStr is string){
            request.setHeader(filter_name_header, validStr);
        }
        else{
            request.setHeader(filter_name_header, "false");
        }
        // http:Response resp = new;
        if isValid{

            request.setJsonPayload("{ \"active\": \"true\"}", contentType = "application/json");
        }else{
            request.setJsonPayload("{ \"active\": \"false\"}", contentType = "application/json");
        }
        return true;
    }

    public function filterResponse(http:Response response,
                                   http:FilterContext context)
                                    returns boolean {
        log:printInfo("Interceptor Response......");
        return true;
    }
};

RequestFilter filter = new;

listener http:Listener echoListener = new http:Listener(9091,
                                            config = { filters: [filter]});

@http:ServiceConfig {
    basePath: "/hello"
}
service echo on echoListener {
    @http:ResourceConfig {
        methods: ["GET"],
        path: "/sayHello"
    }
    resource function echo(http:Caller caller, http:Request req) {
        http:Response res = new;
        log:printInfo("Service reached......");
        var active = req.getJsonPayload();
        if active is string {
            log:printInfo("log" +active);
        }
        res.setHeader(filter_name_header, req.getHeader(filter_name_header));
        log:printInfo("Token " + req.getHeader(filter_name_header));
        res.setPayload("Hello, World!");
        var result = caller->respond(res);
        if (result is error) {
           log:printError("Error sending response", err = result);
        }
    }
}
