import {Opts} from "./main";

export class RequestBuilder {
    static buildRequest(opts : Opts){
        return 'GET /api/banner HTTP/1.1\r\n' +
            'Connection: keep-alive\r\n' +
            'Host: 127.0.0.1:5000\r\n\r\n'
    } 
    
}