import ballerina/http;

public function errorResponse(int code, string message, string description) returns http:Response {
    http:Response res = new;
    Error errPassed = {
        code: code,
        message: message,
        description: description
    };

    var errJson = json.convert(errPassed);
    if(errJson is json){
        res.setJsonPayload(errJson);
        res.statusCode = errPassed.code;
    }
    else{
        res = conversionErrorResponse("Error occured when converting Error struct to Json");
    }
    return res; 
}

public function conversionErrorResponse(string msg) returns http:Response {
    http:Response res = new;

    json errDefault = {
        code: INTERNAL_ERROR_STATUSCODE,
        message: msg,
        description: ""
    };

    res.setPayload(errDefault);
    res.statusCode = INTERNAL_ERROR_STATUSCODE;

    return res; 
}