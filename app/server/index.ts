const static = require('node-static');
const http = require('http');

const fileServer = new static.Server('./dist/client');

http.createServer(function (request, response) {
    request.addListener('end', () => {
        fileServer.serve(request, response);
    }).resume();
}).listen(1234);