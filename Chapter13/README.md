# Chapter 13 Docker to Kubernetes. What Had to Change?

[Return to Table of Contents](../README.md)

## (1) network information
 - Docker and the Kubernetes deploy use different names for the CA and for the channel 
   - Docker
     CA: ca.example.org
     channel: composer 
   - Kubernetes
     CA: CA
     channel: channel1

 - The demo when running locally uses localhost:xxxx for all access
   - need to get the address of the kuberenetes cluster
   - and update the PeerAdmin.card with that address

## (2) fabric information: HyperLedger fabric always uses ~/.hfc-key-store to hold keys for direct access to the fabric. 
- This means that this folder must also exist in the IBM Cloud deployment
- And must have keys made just for this deployment. 
- That requires creating the PeerAdmin information and storing it for later load to ~/.hfc-key-store
- and then creating an exec to create that folder during deploy
- the same is required for PeerAdmin.card and admin.card, which have to be stored in appropriate sub-folders in ~/.composer

## (3) Web Sockets
 - the web socket implementation was brute force for Chapters 1-12. In IBM Cloud, this approach does not work, as we cannot specify ports in the app. 
  --> Everything in the app must run through a single port. 
 - This requires that the port creation be done in index.js while setting up http server and then shared with other modules in app.
   - app.locals provides that sharing ability
 - Because multiple browsers can now attach to the app, must manage multiple client connect requests and keep them active until device departs.
 - host_address for web socket connection from browser is no longer 'localhost:xxx', it is the URL for the bluemix app and needs to be dynamically acquired once the web app starts. 

## (4) Bluemix application start-up
 - Up until this point, any application we have loaded into bluemix has been started with a simple 'node index' command. 
  --> When an application starts in Bluemix which will interact with Hyperledger and Composer, we need to set up two folders in the IBM Cloud for our app before it can run. Those folders are: 
  - ~/.hfc-key-store
    - This folder will store the credential information necessary to gather blockchain events
  - ~/.composer/cards
    - This folder initially has the PeerAdmin and admin cards
  - ~/.composer/client-data
    - This folder initially has the credentials for the PeerAdmin and admin cards

## (5) Code Changes
### Server
 - index.js
 The web socket creation and management code is removed from Z2B_Services and implemented in index.js, as it must share the httpserver service. It is also necessary to implement better socket management, since this will now run with access for multiple concurrent browsers. Because we are managing communications with multiple browsers, we need a way to send messages to all of them, which is done through the clients array. We also need to remove clients from that array when the browser session ends. This is done through the on-close process using information provided to the application in the client browser url & port. 
 Because we want to use the message sending ability from any module in our application, we extend the support to use app.locals to share the processMessages function. 
 ```javascript
 let server = http.createServer();
let clients = [];
app.locals.index=-1;
/**
 * WebSocket server
 */
app.locals.wsServer = new ws({httpServer: server});
app.locals.wsServer.on('request', function(request)
{
    console.log((new Date()) + ' Connection from origin '+ request.origin + '.');
    app.locals.connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    app.locals.index = clients.push(app.locals.connection) - 1;
    console.log('app.locals.index: ', app.locals.index);
    console.log((new Date()) + ' Connection accepted.');
    app.locals.connection.on('message', function(message)
    {
        console.log((new Date()) + ' Received Message: ' + message.utf8Data);
        let obj =
            {
                time: (new Date()).getTime(),
                text: message.utf8Data,
                author: app.locals.connection.socket._peername.address+':'+app.locals.connection.socket._peername.port,
                color: 'blue'
            };
        // broadcast message to all connected clients
        let json = JSON.stringify({ type:'message', data: obj });
        app.locals.processMessages(json);
    });

    // user disconnected
    app.locals.connection.on('close', function(_conn) {
        console.log((new Date()) + ' Peer '+ app.locals.connection.socket._peername.address+':'+app.locals.connection.socket._peername.port+' disconnected with reason code: "'+_conn+'".');
        // remove user from the list of connected clients
        for (let each in clients)
            {(function(_idx, _arr)
                {   console.log('['+_idx+'] BEFORE has id: '+_arr[_idx].socket._peername.address+':'+_arr[_idx].socket._peername.port);
                if ((_arr[_idx].socket._peername.address === app.locals.connection.socket._peername.address) && (_arr[_idx].socket._peername.port === app.locals.connection.socket._peername.port))
                    {
                    console.log('Match found!');
                    clients.splice(_idx, 1);
                    let obj =
                        {
                            time: (new Date()).getTime(),
                            text: ' I have left the meeting',
                            author: app.locals.connection.socket._peername.address+':'+app.locals.connection.socket._peername.port,
                            color: 'red'
                        };
                    let json = JSON.stringify({ type:'message', data: obj });
                    app.locals.processMessages(json);
                }
            })(each, clients);}
        for (let each in clients)
        {(function(_idx, _arr)
        {
            console.log('['+_idx+'] AFTER has id: '+_arr[_idx].socket._peername.address+':'+_arr[_idx].socket._peername.port);
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
app.locals.processMessages = processMessages;
```
 - Z2B_admin
 Administrative services are disabled so that the network is not accidentally taken off line. 
 - Z2B_Services
 Routines for creating and managing sockets are removed completely and replaced with a single, very short, function: 
 ```javascript
 /**
 * New code to support sending messages to socket clients
 * @param {Object} _locals - shared variables and functions from index.js
 * @param {String} type - type of event message to put on channel
 * @param {Event} event - event message
 */
    send: function (_locals, type, event)
    {
        _locals.processMessages({'type': type, 'data': event} );
    }
};
```
 - autoLoad.js
    During member creation, profile information needs to be loaded so that the member is able to connect with the correct network. This data is now loaded from a new ```connections.json``` file which is generated during the new kubernetes-deploy.sh script execution. You'll see this in line 126:
    ```javascript
    let tempCard = new hlc_idCard(_meta, admin_connection);
    ```
 - queryBlockchain
    getChainInfo is updated to pull the address of your kubernetes cluster and use that during the connection process. 
```javascript
/**
 * get chain info
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.getChainInfo = function(req, res, next)
{
    let channel = {};
    let client = null;
    let wallet_path = path.join(__dirname, 'creds');
    Promise.resolve().then(() => {
        //
        // As of 9/28/2017 there is a known and unresolved bug in HyperLedger Fabric
        // https://github.com/hyperledger/composer/issues/957
        // this requires that the file location for the wallet for Fabric version 1.0 be in the following location:
        // {HOME}/.hfc-key-store
        // therefore the wallet location will be ignored and any private keys required to enroll a user in this process
        // must be located in {HOME}/.hfc-key-store
        // this is currently managed for you in the installation exec by copying the private key for PeerAdmin to this location
        //
        client = new hfc();
        return hfc.newDefaultKeyValueStore({ path: wallet_path })
        .then((wallet) => {
            client.setStateStore(wallet);
            // change PeerAdmin in following line to adminID
            return client.getUserContext(config.composer.PeerAdmin, true);})
            .then((user) => {
                if (user === null || user === undefined || user.isEnrolled() === false)
                { console.error('User not defined, or not enrolled - error');}
                channel = client.newChannel(hlf1_profile.channel);
                channel.addPeer(client.newPeer(hlf1_profile.peers[0].requestURL));
                channel.addOrderer(client.newOrderer(hlf1_profile.orderers[0].url));
            })
                .then(() => {
                    return channel.queryInfo()
                    .then((blockchainInfo) => {
                        if (blockchainInfo) {
                            res.send({'result': 'success', 'currentHash': blockchainInfo.currentBlockHash.toString('hex'), blockchain: blockchainInfo});
                        } else {
                            console.log('response_payload is null');
                            res.send({'result': 'uncertain', 'message': 'response_payload is null'});
                        }
                    })
                    .catch((_err) => {
                        console.log('queryInfo failed with _err = ', _err);
                        res.send({'result': 'failed', 'message': _err.message});
                    });
                });
    });
};
```
 - hlcClient
    function calls which previously included the web socket to be used now reference ```req.app.locals```, which is how we get to the processMessages function. 

### Browser
 - z2b_events
    Earlier chapters in the tutorial had a web socket connection being created for each of the 6 roles (admin + 5 participant types). In this cloud-compatible version, we only create a single socket and then parse out the content to each participant based on the inbound message type, of which there are three (Message, Alert, BlockChain): 
```javascript
/**
 * connect to web socket
 */
function wsConnect()
{    if (!window.WebSocket) {console.log('this browser does not support web sockets');}
    let content = $('#body');
    let blockchain = $('#blockchain');
    wsSocket = new WebSocket('ws://'+host_address);
    wsSocket.onerror = function (error) {console.log('WebSocket error on wsSocket: ' + error);};
    wsSocket.onopen = function ()
    {console.log ('connect.onOpen initiated to: '+host_address); wsSocket.send('connected to client');};
    wsSocket.onmessage = function (message)
    {
        let incoming
        incoming = message.data;
        while (incoming instanceof Object === false){incoming = JSON.parse(incoming);}
        switch (incoming.type)
        {
        case 'Message':
            content.append(formatMessage(incoming.data));
            break;
        case 'Alert':
            let event = JSON.parse(incoming.data);
            addNotification(event.type, event.ID, event.orderID);
            break;
        case 'BlockChain':
            _blctr ++;
            if (incoming.data !== 'connected')
            {
                $(blockchain).append('<span class="block">block '+incoming.data.header.number+'<br/>Hash: '+incoming.data.header.data_hash+'</span>');
                if (_blctr > 4) {let leftPos = $(blockchain).scrollLeft(); $(blockchain).animate({scrollLeft: leftPos + 300}, 250);}
            }
            break;
        default:
            console.log('Can Not Process message type: ',incoming.type);
        }
    };
}
```
 - z2b_buyer (and other participants)
   - all 'port' information is removed from the code as it is no longer relevant
   - calls to ```wsDisplay``` are removed as that service is now replaced by the ```wscConnect``` function displayed above. 

### Setup 
 - [Install kubectl on your local device: ](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
   - [OSX: ](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-via-curl)
   - [Linux: ](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-via-curl)
 - ```buildAndDeploy``` replaced by ```kuebernetes-deploy.sh```
    kubernetes-deploy uses set up information from the [ibm-container-service](https://github.com/IBM-Blockchain/ibm-container-service) git repo. This chapter includes the scripts from the cs-offerings folder in that repo. 
    There are a number of functions which are used in the kubernetes-deploy.sh script built for the Zero To Blockchain tutorial: 
   - ```./createArchive.sh``` -n $NETWORK_NAME (this is the same version as before)
   - ```getContext``` (discovers your kube cluster ip address and sets the environment info)
   - ```clearOldCards``` (gets rid of now obsolete identity cards)
   - ```setupCluster``` (sets up the kube cluster - this is the code from ibm-containers-service)
   - ```pauseForCard``` (wait for you to access the automatically-loaded playground, launch it and then make a local copy of your PeerAdmin card)
   - ```updateCard``` (update the PeerAdmin card with the correct ip address)
   - ```./getPEM.sh``` (credential management)
   - ```installNetwork``` (using the PeerAdmin card, install your network into your new kube cluster)
 - start-up in package.json (node index) replaced with (./init.sh)