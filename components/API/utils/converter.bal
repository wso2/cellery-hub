import ballerina/log;
import ballerina/io;

public function convertToInt(string num) returns int{
    int intValue = 0;
    int|error n = int.convert(num);
    if (n is int) {
        intValue = n;
    } else {
        error er = error(<string>n.detail().message);
        log:printError("Conversion error", err = er);
    }
	return intValue;
}
