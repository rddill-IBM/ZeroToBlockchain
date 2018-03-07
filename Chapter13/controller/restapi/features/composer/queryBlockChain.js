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
const hlf1_profile = require('../../../connection.json');
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
                // get the channel name
                channel = client.newChannel(hlf1_profile.channel);
                //get the request URL for the Peer0 container
                channel.addPeer(client.newPeer(hlf1_profile.peers[0].requestURL));
                // get the orderer URL 
                channel.addOrderer(client.newOrderer(hlf1_profile.orderers[0].url));
                // change Admin in following line to admin
                let pemPath = path.join(__dirname,'creds','ca.pem');
                let adminPEM = fs.readFileSync(pemPath);
                let bcEvents = new hfcEH(client);
                bcEvents.setPeerAddr(hlf1_profile.peers[0].eventURL, {pem: adminPEM});
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
