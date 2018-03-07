/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Zero to Blockchain */

'use strict';
const express = require('express');
const http = require('http');
const ws = require('websocket').server;
// const https = require('https');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const bodyParser = require('body-parser');
const cfenv = require('cfenv');

const cookieParser = require('cookie-parser');
// const session = require('express-session');

// const vcapServices = require('vcap_services');
// const uuid = require('uuid');
const env = require('./controller/envV2.json');
const sessionSecret = env.sessionSecret;
const appEnv = cfenv.getAppEnv();
const app = express();
const busboy = require('connect-busboy');
app.use(busboy());

// the session secret is a text string of arbitrary length which is
//  used to encode and decode cookies sent between the browser and the server
/**
for information on how to enable https support in osx, go here:
  https://gist.github.com/nrollr/4daba07c67adcb30693e
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
**/

app.use(cookieParser(sessionSecret));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('appName', 'z2b-chapter13');
process.title = 'Z2B-C13';
app.set('port', appEnv.port);

app.set('views', path.join(__dirname + '/HTML'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/HTML'));
app.use(bodyParser.json());

// Define your own router file in controller folder, export the router, add it into the index.js.

app.use('/', require('./controller/restapi/router'));

let server = http.createServer();
let clients = [];
app.locals.index=-1;
/**
 * WebSocket server
 */
app.locals.wsServer = new ws({httpServer: server});
app.locals.wsServer.on('request', function(request)
{
    // create a connection back to the requestor
    app.locals.connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    app.locals.index = clients.push(app.locals.connection) - 1;
    // save the newly created connection. This is so that we can support many connections to many browsers simultaneously
    console.log((new Date()) + ' Connection accepted.');
    app.locals.connection.on('message', function(message)
    {   let obj ={ime: (new Date()).getTime(),text: message.utf8Data};
        // broadcast message to all connected clients
        let json = JSON.stringify({ type:'message', data: obj });
        app.locals.processMessages(json);
    });

    // user disconnected
    app.locals.connection.on('close', function(_conn) {
        console.log((new Date()) + ' Peer '+ app.locals.connection.socket._peername.address+':'+app.locals.connection.socket._peername.port+' disconnected with reason code: "'+_conn+'".');
        // remove user from the list of connected clients
        // each browser connection has a unique address and socket combination
        // When a browser session is disconnected, remove it from the array so we don't waste processing time sending messages to empty queues.
        for (let each in clients)
            {(function(_idx, _arr)
                {if ((_arr[_idx].socket._peername.address === app.locals.connection.socket._peername.address) && (_arr[_idx].socket._peername.port === app.locals.connection.socket._peername.port))
                    {clients.splice(_idx, 1);}
            })(each, clients);}
    });
});

/**
 * callable function to send messages over web socket
 * @param {JSON} _jsonMsg - json formatted content to be sent as message data
 */
function processMessages (_jsonMsg)
{
    for (let i=0; i < clients.length; i++) {clients[i].send(JSON.stringify(_jsonMsg));}
}
// make the processMessages function available to all modules in this app.
app.locals.processMessages = processMessages;
// now set up the http server
server.on( 'request', app );
server.listen(appEnv.port, function() {console.log('Listening locally on port %d', server.address().port);});
/**
 * load any file requested on the server
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @function
 */
function loadSelectedFile(req, res) {
    let uri = req.originalUrl;
    let filename = __dirname + '/HTML' + uri;
    fs.readFile(filename,
        function(err, data) {
            if (err) {
                console.log('Error loading ' + filename + ' error: ' + err);
                return res.status(500).send('Error loading ' + filename);
            }
            let type = mime.lookup(filename);
            res.setHeader('content-type', type);
            res.writeHead(200);
            res.end(data);
        });
}
