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

 /**
 * This file is used to automatically populate the network with Order assets and members
 * The opening section loads node modules required for this set of nodejs services
 * to work. Most of these are from the hyperledger composer SDK. This module also
 * uses services created specifically for this tutorial, in the Z2B_Services.js
 *  and Z2B_Utilities.js modules.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const _home = require('os').homedir();
const hlc_idCard = require('composer-common').IdCard;

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const financeCoID = 'easymoney@easymoneyinc.com';


const svc = require('./Z2B_Services');
const config = require('../../../env.json');
/**
 * itemTable and memberTable are used by the server to reduce load time requests
 * for member secrets and item information
 */
let itemTable = new Array();
let memberTable = new Array();
let socketAddr;





/**
 * getPort is used to return the port number for socket interactions so that
 * the browser can receive asynchronous notifications of work in process.
 * This helps the user understand the current status of the auto load process.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 *
 * @function
 */
exports.getPort = function(req, res, next) {
    let _conn = svc.createMessageSocket();
    res.send({'port': _conn.socket});
};

/**
 * autoLoad reads the memberList.json file from the Startup folder and adds members,
 * executes the identity process, and then loads orders
 *
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * saves a table of members and a table of items
 * @function
 */
exports.autoLoad = function(req, res, next) {
    // get the autoload file
    let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.json');
    let startupFile = JSON.parse(fs.readFileSync(newFile));
    // connect to the network
    let businessNetworkConnection;
    let factory; let participant;
    svc.createMessageSocket();
    socketAddr = svc.m_socketAddr;
    let adminConnection = new AdminConnection();
    // connection prior to V0.15
    //    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
    // connection in v0.15
    adminConnection.connect(config.composer.adminCard)
    .then(() => {
        // a businessNetworkConnection is required to add members
        businessNetworkConnection = new BusinessNetworkConnection();
        // connection prior to V0.15
        // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, config.composer.adminID, config.composer.adminPW)
        // connection in v0.15
        return businessNetworkConnection.connect(config.composer.adminCard)
        .then(() => {
            // a factory is required to build the member object
            factory = businessNetworkConnection.getBusinessNetwork().getFactory();
            //iterate through the list of members in the memberList.json file and
            // first add the member to the network, then create an identity for
            // them. This generates the memberList.txt file later used for
            // retrieving member secrets.
            for (let each in startupFile.members)
                {(function(_idx, _arr)
                    {
                    // the participant registry is where member information is first stored
                    // there are individual registries for each type of participant, or member.
                    // In our case, that is Buyer, Seller, Provider, Shipper, FinanceCo
                    return businessNetworkConnection.getParticipantRegistry(config.composer.NS+'.'+_arr[_idx].type)
                    .then(function(participantRegistry){
                        return participantRegistry.get(_arr[_idx].id)
                        .then((_res) => {
                            console.log('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                            svc.m_connection.sendUTF('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                        })
                        .catch((error) => {
                            participant = factory.newResource(config.composer.NS, _arr[_idx].type, _arr[_idx].id);
                            participant.companyName = _arr[_idx].companyName;
                            participantRegistry.add(participant)
                            .then(() => {
                                console.log('['+_idx+'] '+_arr[_idx].companyName+' successfully added');
                                svc.m_connection.sendUTF('['+_idx+'] '+_arr[_idx].companyName+' successfully added');
                            })
                            .then(() => {
                                // an identity is required before a member can take action in the network.
                                // V0.14
                                // return businessNetworkConnection.issueIdentity(config.composer.NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id, _arr[_idx].pw)
                                // V0.15
                                console.log('issuing identity for: '+config.composer.NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id);
                                return businessNetworkConnection.issueIdentity(config.composer.NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id, _arr[_idx].id)
                                .then((result) => {
                                    console.log('_arr[_idx].id: '+_arr[_idx].id);
                                    console.log('result.userID: '+result.userID);
                                    let _mem = _arr[_idx];
                                    _mem.secret = result.userSecret;
                                    _mem.userID = result.userID;
                                    memberTable.push(_mem);
                                    // svc.saveMemberTable(memberTable);
                                    let _meta = {};
                                    for (each in config.composer.metaData)
                                    {(function(_idx, _obj) {_meta[_idx] = _obj[_idx]; })(each, config.composer.metaData); }
                                    _meta.businessNetwork = config.composer.network;
                                    _meta.userName = result.userID;
                                    _meta.enrollmentSecret = result.userSecret;
                                    config.connectionProfile.keyValStore = _home+config.connectionProfile.keyValStore;
                                    let tempCard = new hlc_idCard(_meta, config.connectionProfile);
                                    return adminConnection.importCard(result.userID, tempCard)
                                        .then ((_res) => { if (_res) {console.log('card updated');} else {console.log('card imported');} })
                                        .catch((error) => {
                                            console.error('adminConnection.importCard failed. ',error.message);
                                        });
                                })
                                .catch((error) => {
                                    console.error('create id for '+_arr[_idx].id+'failed. ',error.message);
                                });
                            })
                        .catch((error) => {console.log(_arr[_idx].companyName+' add failed',error.message);});
                        });
                    })
                .catch((error) => {console.log('error with getParticipantRegistry', error.message);});
                })(each, startupFile.members);
            }
            // iterate through the order objects in the memberList.json file.
            for (let each in startupFile.items){(function(_idx, _arr){itemTable.push(_arr[_idx]);})(each, startupFile.items);}
            svc.saveItemTable(itemTable);
            for (let each in startupFile.assets)
                {(function(_idx, _arr)
                    {
                    // each type of asset, like each member, gets it's own registry. Our application
                    // has only one type of asset: 'Order'
                    return businessNetworkConnection.getAssetRegistry(config.composer.NS+'.'+_arr[_idx].type)
                    .then((assetRegistry) => {
                        return assetRegistry.get(_arr[_idx].id)
                        .then((_res) => {
                            console.log('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                            svc.m_connection.sendUTF('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                        })
                        .catch((error) => {
                            // first, an Order Object is created
                            let order = factory.newResource(config.composer.NS, _arr[_idx].type, _arr[_idx].id);
                            order = svc.createOrderTemplate(order);
                            let _tmp = svc.addItems(_arr[_idx], itemTable);
                            order.items = _tmp.items;
                            order.amount = _tmp.amount;
                            order.orderNumber = _arr[_idx].id;
                            // then the buy transaction is created
                            const createNew = factory.newTransaction(config.composer.NS, 'CreateOrder');
                            order.buyer = factory.newRelationship(config.composer.NS, 'Buyer', _arr[_idx].buyer);
                            order.seller = factory.newRelationship(config.composer.NS, 'Seller', _arr[_idx].seller);
                            order.provider = factory.newRelationship(config.composer.NS, 'Provider', 'noop@dummy');
                            order.shipper = factory.newRelationship(config.composer.NS, 'Shipper', 'noop@dummy');
                            order.financeCo = factory.newRelationship(config.composer.NS, 'FinanceCo', financeCoID);
                            createNew.financeCo = factory.newRelationship(config.composer.NS, 'FinanceCo', financeCoID);
                            createNew.order = factory.newRelationship(config.composer.NS, 'Order', order.$identifier);
                            createNew.buyer = factory.newRelationship(config.composer.NS, 'Buyer', _arr[_idx].buyer);
                            createNew.seller = factory.newRelationship(config.composer.NS, 'Seller', _arr[_idx].seller);
                            createNew.amount = order.amount;
                            // then the order is added to the asset registry.
                            return assetRegistry.add(order)
                            .then(() => {
                                // then a createOrder transaction is processed which uses the chaincode
                                // establish the order with it's initial transaction state.
                                svc.loadTransaction(svc.m_connection, createNew, order.orderNumber, businessNetworkConnection);
                            })
                            .catch((error) => {
                                // in the development environment, because of how timing is set up, it is normal to
                                // encounter the MVCC_READ_CONFLICT error. This is a database timing error, not a
                                // logical transaction error.
                                if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                                {console.log('AL: '+_arr[_idx].id+' retrying assetRegistry.add for: '+_arr[_idx].id);
                                    svc.addOrder(svc.m_connection, order, assetRegistry, createNew, businessNetworkConnection);
                                }
                                else {console.log('error with assetRegistry.add', error.message);}
                            });
                        });
                    })
                    .catch((error) => {console.log('error with getParticipantRegistry', error.message);});
                })(each, startupFile.assets);
            }
        })
    .catch((error) => {console.log('error with business network Connect', error.message);});
    })
    .catch((error) => {console.log('error with adminConnect', error.message);});
    res.send({'port': socketAddr});
};

/**
 * get member secret from member table. In normal production, the use would be responsible
 * for knowing their member secret. Because this is a demo, we're managing that informaiton
 * on the server and this routine gets that information for us so that we can successfully
 * execute transactions.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the member to find
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.getMemberSecret = function(req, res, next)
{
    let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.txt');
    let _table = JSON.parse(fs.readFileSync(newFile));
    let bFound = false;
    for (let each in _table.members)
        { if (_table.members[each].id === req.body.id) {res.send(_table.members[each]); bFound = true;}}
    if (!bFound) {res.send({'id': req.body.id, 'secret': 'not found'});}
};