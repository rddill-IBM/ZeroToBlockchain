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

'use strict';
let path = require('path');
let fs = require('fs');
const express = require('express');
const app = express();
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
app.set('port', appEnv.port);

const hfc = require('fabric-client');
const hfcEH = require('fabric-client/lib/EventHub');

const svc = require('./Z2B_Services');
// const util = require('./Z2B_Utilities');
// const financeCoID = 'easymoney@easymoneyinc.com';
const config = require('../../../env.json');
let chainEvents = false;



/**
 * get chain info
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.getChainInfo = function(req, res, next) 
{
    let method='getChainInfo';
    let HOST_NAME = req.headers.host;
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
        console.log("Create a client and set the wallet location");
        client = new hfc();
        return hfc.newDefaultKeyValueStore({ path: wallet_path })
        .then((wallet) => {
            client.setStateStore(wallet);
            // change PeerAdmin in following line to adminID
            return client.getUserContext(config.composer.PeerAdmin, true);})
            .then((user) => {
                // This routine as written will only work with the kubernetes deployed blockchain. It will not work with the docker image. 
                // adding a check for localhost only tells you that the nodejs portion is running on your local system. This does not 
                // also tell you that the blockchain is/is not running in your local docker environment. 
                // To support switching between local docker and remote kubernetes on cluster, an extra config element would be required. 
                // The logical place for this is in the env.json file. If you do that, then the code in this routine will need to be updated so that each
                // place where the remote addresseses are loaded (from hlf1_profile) will need to be replaced with the local profiles. 
                // You will find the local profile definitions in the env.json file and use of these definitions can be found in Chapter 12 of this tutorial
                if (user === null || user === undefined || user.isEnrolled() === false)
                { console.error('User not defined, or not enrolled - error');}
                if (HOST_NAME.slice(0,9) === 'localhost')
                {
                    console.log(method+" running locally");
                    channel = client.newChannel(config.fabric.channelName);
                    channel.addPeer(client.newPeer(config.fabric.peerRequestURL));
                    channel.addOrderer(client.newOrderer(config.fabric.ordererURL)); 
                }else
                {
                    console.log(method+" running remotely, not supported in Chapter 12");
                }
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

/**
 * get chain events
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.getChainEvents = function(req, res, next)
{
    let method = 'getChainEvents';
    let HOST_NAME = req.headers.host;
    if (chainEvents) {res.send({'port': svc.cs_socketAddr});}
    else
    {
        let channel = {};
        let client = null;
        let wallet_path = path.join(__dirname, 'creds');

        Promise.resolve().then(() => {
            client = new hfc();
            return hfc.newDefaultKeyValueStore({ path: wallet_path })
            .then((wallet) => {
                client.setStateStore(wallet);
                // change PeerAdmin in following line to adminID
                return client.getUserContext(config.composer.PeerAdmin, true);
            })
            .then((user) => {
                if (user === null || user === undefined || user.isEnrolled() === false)
                    {console.error(method+': User not defined, or not enrolled - error');}
                // This routine as written will only work with the kubernetes deployed blockchain. It will not work with the docker image. 
                // adding a check for localhost only tells you that the nodejs portion is running on your local system. This does not 
                // also tell you that the blockchain is/is not running in your local docker environment. 
                // To support switching between local docker and remote kubernetes on cluster, an extra config element would be required. 
                // The logical place for this is in the env.json file. If you do that, then the code in this routine will need to be updated so that each
                // place where the remote addresseses are loaded (from hlf1_profile) will need to be replaced with the local profiles. 
                // You will find the local profile definitions in the env.json file and use of these definitions can be found in Chapter 12 of this tutorial
                // get the channel name
                channel = client.newChannel(config.fabric.channelName);
                //get the request URL for the Peer0 container
                channel.addPeer(client.newPeer(config.fabric.peerRequestURL));
                // get the orderer URL 
                channel.addOrderer(client.newOrderer(config.fabric.ordererURL)); 
                // change Admin in following line to admin
                var pemPath = path.join(__dirname,'creds','admin@org.hyperledger.composer.system-cert.pem');
                var adminPEM = fs.readFileSync(pemPath).toString();
                var bcEvents = new hfcEH(client);
                bcEvents.setPeerAddr(config.fabric.peerEventURL, {pem: adminPEM});
                bcEvents.registerBlockEvent(
                    function(event){svc.send(req.app.locals, 'BlockChain', event);},
                    function(error){console.log(method+': registerBlockEvent error: ', error);}
                );
                        bcEvents.connect();
                chainEvents = true;
                res.send({'port': svc.cs_socketAddr});                    
            })
            .catch((err) => { console.log(method+': getUserContext failed: ',err);});
        });
    }
};
