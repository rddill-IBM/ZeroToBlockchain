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
const BrowserFS = require('browserfs/dist/node/index');

const network = 'zerotoblockchain-network';
const adminID = 'admin';
const adminPW = 'adminpw';

var fs = require('fs');
var path = require('path');

const composerAdmin = require('composer-admin');
const AdminConnection = require('composer-admin').AdminConnection;
const composerClient = require('composer-client');
const composerCommon = require('composer-common');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const financeCoID = 'easymoney@easymoneyinc.com';


const svc = require('./Z2B_Services');
const util = require('./Z2B_Utilities');
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';
let itemTable = new Array();
let memberTable = new Array();
let orderStatus = svc.orderStatus;

let connection; let socketAddr;


/**
 * get the connection port
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * 
 * @function
 */
exports.getPort = function(req, res, next) {
    let _conn = svc.createMessageSocket();
    res.send({'port': _conn.socket});
} 

/**
 * load up the network based on the data in the startup folder
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
    connection = svc.m_connection; 
    socketAddr = svc.m_socketAddr;
    let adminConnection = new AdminConnection();
        adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(() => {
            businessNetworkConnection = new BusinessNetworkConnection();
            return businessNetworkConnection.connect(config.composer.connectionProfile, network, adminID, adminPW)
            .then(() => {
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                for (let each in startupFile.members)
                    {(function(_idx, _arr)
                        {
                            return businessNetworkConnection.getParticipantRegistry(NS+'.'+_arr[_idx].type)
                            .then(function(participantRegistry){
                                return participantRegistry.get(_arr[_idx].id)
                                .then((_res) => {
                                    console.log('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+NS+'.'+_arr[_idx].type);
                                    svc.m_connection.sendUTF('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+NS+'.'+_arr[_idx].type);
                                })
                                .catch((error) => {
                                    participant = factory.newResource(NS, _arr[_idx].type, _arr[_idx].id);
                                    participant.companyName = _arr[_idx].companyName;
                                    participantRegistry.add(participant)
                                    .then(() => {
                                        console.log('['+_idx+'] '+_arr[_idx].companyName+" successfully added");
                                        svc.m_connection.sendUTF('['+_idx+'] '+_arr[_idx].companyName+" successfully added");
                                    })
                                    .then(() => {
                                        return businessNetworkConnection.issueIdentity(NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id, _arr[_idx].pw)
                                            .then((result) => {
                                                let _mem = _arr[_idx];
                                                _mem.secret = result.userSecret;
                                                _mem.userID = result.userID;
                                                memberTable.push(_mem);
                                                svc.saveMemberTable(memberTable);
                                            })
                                            .catch((error) => {
                                                console.error('create id for '+_arr[_idx].id+'failed.',error.message);
                                            });
                                        })
                                    .catch((error) => {console.log(_arr[_idx].companyName+" add failed",error.message);});
                                    });
                                })
                            .catch((error) => {console.log('error with getParticipantRegistry', error.message)});
                        })(each, startupFile.members)
                    }
                    for (let each in startupFile.items){(function(_idx, _arr){itemTable.push(_arr[_idx]);})(each, startupFile.items)}
                    svc.saveItemTable(itemTable);
                    for (let each in startupFile.assets)
                        {(function(_idx, _arr)
                            {
                                return businessNetworkConnection.getAssetRegistry(NS+'.'+_arr[_idx].type)
                                .then((assetRegistry) => {
                                    return assetRegistry.get(_arr[_idx].id)
                                    .then((_res) => {
                                        console.log('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+NS+'.'+_arr[_idx].type);
                                        svc.m_connection.sendUTF('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+NS+'.'+_arr[_idx].type);
                                    })
                                    .catch((error) => {
                                        let order = factory.newResource(NS, _arr[_idx].type, _arr[_idx].id);
                                        order = svc.createOrderTemplate(order);
                                        let _tmp = svc.addItems(_arr[_idx], itemTable);
                                        order.items = _tmp.items;
                                        order.amount = _tmp.amount;
                                        order.orderNumber = _arr[_idx].id;
                                        // create the buy transaction
                                        const createNew = factory.newTransaction(NS, 'CreateOrder');
                                        order.buyer = factory.newRelationship(NS, 'Buyer', _arr[_idx].buyer);
                                        order.seller = factory.newRelationship(NS, 'Seller', _arr[_idx].seller);
                                        order.provider = factory.newRelationship(NS, 'Provider', 'noop@dummy');
                                        order.shipper = factory.newRelationship(NS, 'Shipper', 'noop@dummy');
                                        order.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                                        createNew.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                                        createNew.order = factory.newRelationship(NS, 'Order', order.$identifier);
                                        createNew.buyer = factory.newRelationship(NS, 'Buyer', _arr[_idx].buyer);
                                        createNew.seller = factory.newRelationship(NS, 'Seller', _arr[_idx].seller);
                                        createNew.amount = order.amount;
                                        // add the order to the asset registry.
                                        return assetRegistry.add(order)
                                        .then(() => {
                                            svc.loadTransaction(svc.m_connection, createNew, order.orderNumber, businessNetworkConnection);
                                        })
                                        .catch((error) => {
                                        if (error.message.search('MVCC_READ_CONFLICT') != -1)
                                            {console.log(_arr[_idx].id+" retrying assetRegistry.add for: "+_arr[_idx].id);
                                            svc.addOrder(svc.m_connection, order, assetRegistry, createNew, businessNetworkConnection);
                                            }
                                            else {console.log('error with assetRegistry.add', error.message)}
                                        });
                                     });
                                    })
                                .catch((error) => {console.log('error with getParticipantRegistry', error.message)});
                            })(each, startupFile.assets)
                        }
                    })
                .catch((error) => {console.log('error with business network Connect', error.message)});
        })
        .catch((error) => {console.log('error with adminConnect', error.message)});
        res.send({'port': socketAddr});
}

/**
 * get member secret from member table
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
        { if (_table.members[each].id == req.body.id) {res.send(_table.members[each]); bFound = true;}}
    if (!bFound) {res.send({"id": req.body.id, "secret": "not found"});}
}