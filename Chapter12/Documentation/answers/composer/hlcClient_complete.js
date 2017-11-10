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
var fs = require('fs');
var path = require('path');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';
let itemTable = null;
const svc = require('./Z2B_Services');
const util = require('./Z2B_Utilities');
const financeCoID = 'easymoney@easymoneyinc.com';
let bRegistered = false;

/**
 * get orders for buyer with ID =  _id
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user. 
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.getMyOrders = function (req, res, next) {
    // connect to the network
    let packageJSON = JSON.parse(fs.readFileSync(path.join(path.dirname(require.main.filename),'network','package.json')));
    let allOrders = new Array();
    let businessNetworkConnection;
    let factory;
    if (svc.m_connection == null) {svc.createMessageSocket();}
    let ser;
    let archiveFile = fs.readFileSync(path.join(path.dirname(require.main.filename),'network','dist','zerotoblockchain-network.bna'));
    businessNetworkConnection = new BusinessNetworkConnection();
    businessNetworkConnection.setMaxListeners(50);
    return BusinessNetworkDefinition.fromArchive(archiveFile)
    .then((bnd) => {
        ser = bnd.getSerializer();
        return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.userID, req.body.secret)
            .then(() => {    
                return businessNetworkConnection.query('selectOrders')
                .then((orders) => {
                        let jsn;
                        let allOrders = new Array();
                        for (let each in orders)
                            { (function (_idx, _arr)
                                {
                                    let _jsn = ser.toJSON(_arr[_idx]);
                                    _jsn.id = _arr[_idx].orderNumber;
                                    allOrders.push(_jsn);                                
                                })(each, orders)
                            }
                        res.send({'result': 'success', 'orders': allOrders});
                        })
                        .catch((error) => {console.log('selectOrders failed ', error);
                        res.send({'result': 'failed', 'error': 'selectOrders: '+error.message});
                    });
                    })
                .catch((error) => {console.log('businessNetwork connect failed ', error);
                res.send({'result': 'failed', 'error': 'businessNetwork: '+error.message});
            });
        })
        .catch((error) => {console.log('create bnd from archive failed ', error);
        res.send({'result': 'failed', 'error': 'create bnd from archive: '+error.message});
    });
}


/**
 * return a json object built from the item table created by the autoload function
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.getItemTable = function (req, res, next)
{
    if (itemTable == null)
    {
        let options = { flag : 'w' };
        let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
        itemTable = JSON.parse(fs.readFileSync(newFile));
    }
    res.send(itemTable);
}
/**
 * orderAction - act on an order for a buyer
 * @param {express.req} req - the inbound request object from the client
 * req.body.action - string with buyer requested action
 * buyer available actions are: 
 * Pay  - approve payment for an order
 * Dispute - dispute an existing order. requires a reason
 * Purchase - submit created order to seller for execution
 * Cancel - cancel an existing order
 * req.body.participant - string with buyer id
 * req.body.orderNo - string with orderNo to be acted upon
 * req.body.reason - reason for dispute, required for dispute processing to proceed
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.orderAction = function (req, res, next) {
    if ((req.body.action == 'Dispute') && (typeof(req.body.reason) != 'undefined') && (req.body.reason.length > 0) )
    {let reason = req.body.reason;} 
    else {
    if ((req.body.action == 'Dispute') && ((typeof(req.body.reason) == 'undefined') || (req.body.reason.length <1) ))
        res.send({'result': 'failed', 'error': 'no reason provided for dispute'});
    }
    if (svc.m_connection == null) {svc.createMessageSocket();}
    let businessNetworkConnection;
    let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.txt');
    let _table = JSON.parse(fs.readFileSync(newFile));
    let _userID = ''; let _secret = '';
    let bFound = false;
    let updateOrder;
    for (let each in _table.members)
    { if (_table.members[each].id == req.body.participant) {_secret = _table.members[each].secret; _userID=_table.members[each].userID; bFound = true;}}
    if (!bFound) {res.send({'result':req.body.id + 'not found'});}
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.setMaxListeners(50);
        return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, _userID, _secret)
        .then(() => {
            return businessNetworkConnection.getAssetRegistry(NS+'.Order')
            .then((assetRegistry) => {
                return assetRegistry.get(req.body.orderNo)
                .then((order) => {
                    let factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                    order.status = req.body.action;
                    switch (req.body.action)
                    {
                        case 'Pay':
                        console.log('Pay entered');
                        updateOrder = factory.newTransaction(NS, 'Pay');                        
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        break;
                        case 'Dispute':
                        console.log('Dispute entered');
                        updateOrder = factory.newTransaction(NS, 'Dispute');                        
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        updateOrder.buyer = factory.newRelationship(NS, 'Buyer', order.buyer.$identifier);                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        updateOrder.dispute = req.body.reason;
                        break;
                        case 'Purchase':
                        console.log('Purchase entered');
                        updateOrder = factory.newTransaction(NS, 'Buy');                        
                        updateOrder.buyer = factory.newRelationship(NS, 'Buyer', order.buyer.$identifier);                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        break;
                        case 'Order From Supplier':
                        console.log('Order from Supplier entered for '+order.orderNumber+ ' inbound id: '+ _userID+' with order.seller as: '+order.seller.$identifier);
                        updateOrder = factory.newTransaction(NS, 'OrderFromSupplier');                        
                        updateOrder.provider = factory.newRelationship(NS, 'Provider', req.body.provider);                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        break;
                        case 'Request Payment':
                        console.log('Request Payment entered');
                        updateOrder = factory.newTransaction(NS, 'RequestPayment');                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        break;
                        case 'Refund':
                        console.log('Refund Payment entered');
                        updateOrder = factory.newTransaction(NS, 'Refund');                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        updateOrder.refund = req.body.reason;
                        break;
                        case 'Resolve':
                        console.log('Resolve entered');
                        updateOrder = factory.newTransaction(NS, 'Resolve');                        
                        updateOrder.buyer = factory.newRelationship(NS, 'Buyer', order.buyer.$identifier);                        
                        updateOrder.shipper = factory.newRelationship(NS, 'Shipper', order.shipper.$identifier);                        
                        updateOrder.provider = factory.newRelationship(NS, 'Provider', order.provider.$identifier);                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        updateOrder.resolve = req.body.reason;
                        break;
                        case 'Request Shipping':
                        console.log('Request Shipping entered');
                        updateOrder = factory.newTransaction(NS, 'RequestShipping');                        
                        updateOrder.shipper = factory.newRelationship(NS, 'Shipper', req.body.shipper);                        
                        updateOrder.provider = factory.newRelationship(NS, 'Provider', order.provider.$identifier);
                        break;
                        case 'Update Delivery Status':
                        console.log('Update Delivery Status');
                        updateOrder = factory.newTransaction(NS, 'Delivering');                        
                        updateOrder.shipper = factory.newRelationship(NS, 'Shipper', req.body.participant);                        
                        updateOrder.deliveryStatus = req.body.delivery;
                        break;
                        case 'Delivered':
                        console.log('Delivered entered');
                        updateOrder = factory.newTransaction(NS, 'Deliver');                        
                        updateOrder.shipper = factory.newRelationship(NS, 'Shipper', req.body.participant);                        
                        break;
                        case 'BackOrder':
                        console.log('BackOrder entered');
                        updateOrder = factory.newTransaction(NS, 'BackOrder');    
                        updateOrder.backorder = req.body.reason;                    
                        updateOrder.provider = factory.newRelationship(NS, 'Provider', order.provider.$identifier);
                        updateOrder.backorder = req.body.reason;
                        break;
                        case 'Authorize Payment':
                        console.log('Authorize Payment entered');
                        updateOrder = factory.newTransaction(NS, 'AuthorizePayment');                        
                        updateOrder.buyer = factory.newRelationship(NS, 'Buyer', order.buyer.$identifier);                        
                        updateOrder.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                        break;
                        case 'Cancel':
                        console.log('Cancel entered');
                        updateOrder = factory.newTransaction(NS, 'OrderCancel');                        
                        updateOrder.buyer = factory.newRelationship(NS, 'Buyer', order.buyer.$identifier);                        
                        updateOrder.seller = factory.newRelationship(NS, 'Seller', order.seller.$identifier);
                        break;
                        default :
                        console.log('default entered for action: '+req.body.action);
                        res.send({'result': 'failed', 'error':' order '+req.body.orderNo+' unrecognized request: '+req.body.action});
                    }
                    updateOrder.order = factory.newRelationship(NS, 'Order', order.$identifier);
                    return businessNetworkConnection.submitTransaction(updateOrder)
                    .then(() => {
                        console.log(' order '+req.body.orderNo+" successfully updated to "+req.body.action);
                        res.send({'result': ' order '+req.body.orderNo+" successfully updated to "+req.body.action});
                    })
                    .catch((error) => {
                        if (error.message.search('MVCC_READ_CONFLICT') != -1)
                            {console.log(" retrying assetRegistry.update for: "+req.body.orderNo);
                            svc.loadTransaction(svc.m_connection, updateOrder, req.body.orderNo, businessNetworkConnection);
                        }
                        else
                        {console.log(req.body.orderNo+" submitTransaction to update status to "+req.body.action+" failed with text: ",error.message);}
                        });

                })
                .catch((error) => {
                    console.log('Registry Get Order failed: '+error.message);
                    res.send({'result': 'failed', 'error': 'Registry Get Order failed: '+error.message});
                });
            })
            .catch((error) => {console.log('Get Asset Registry failed: '+error.message);
            res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
        });
        })
        .catch((error) => {console.log('Business Network Connect failed: '+error.message);
        res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
    });
}
/**
 * adds an order to the blockchain
 * @param {express.req} req - the inbound request object from the client
 * req.body.seller - string with seller id
 * req.body.buyer - string with buyer id
 * req.body.items - array with items for order
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.addOrder = function (req, res, next) {
    let businessNetworkConnection;
    let factory;
    let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.txt');
    let _table = JSON.parse(fs.readFileSync(newFile));
    let _userID = ''; let _secret = '';
    let bFound = false;
    let ts = Date.now();
    let orderNo = req.body.buyer.replace(/@/, '').replace(/\./, '')+ts; 
    if (svc.m_connection == null) {svc.createMessageSocket();}
    
    for (let each in _table.members)
        { if (_table.members[each].id == req.body.buyer) {_secret = _table.members[each].secret; _userID=_table.members[each].userID; bFound = true;}}
    if (!bFound) {res.send({'result':req.body.id + 'not found'});}
            businessNetworkConnection = new BusinessNetworkConnection();
            businessNetworkConnection.setMaxListeners(50);
            return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, _userID, _secret)
            .then(() => {
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                let order = factory.newResource(NS, 'Order', orderNo);
                order = svc.createOrderTemplate(order);
                order.amount = 0;
                order.orderNumber = orderNo;
                order.buyer = factory.newRelationship(NS, 'Buyer', req.body.buyer);
                order.seller = factory.newRelationship(NS, 'Seller', req.body.seller);
                order.provider = factory.newRelationship(NS, 'Provider', 'noop@dummy');
                order.shipper = factory.newRelationship(NS, 'Shipper', 'noop@dummy');
                order.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                for (let each in req.body.items)
                {(function(_idx, _arr)
                    {   _arr[_idx].description = _arr[_idx].itemDescription;
                        order.items.push(JSON.stringify(_arr[_idx]));
                        order.amount += parseInt(_arr[_idx].extendedPrice);
                    })(each, req.body.items)
                }
                // create the buy transaction
                const createNew = factory.newTransaction(NS, 'CreateOrder');
                
                createNew.order = factory.newRelationship(NS, 'Order', order.$identifier);
                createNew.buyer = factory.newRelationship(NS, 'Buyer', req.body.buyer);
                createNew.seller = factory.newRelationship(NS, 'Seller', req.body.seller);
                createNew.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
                createNew.amount = order.amount;
                // add the order to the asset registry.
                return businessNetworkConnection.getAssetRegistry(NS+'.Order')
                .then((assetRegistry) => {
                    return assetRegistry.add(order)
                        .then(() => { 
                            return businessNetworkConnection.submitTransaction(createNew)
                            .then(() => {console.log(' order '+orderNo+" successfully added");
                            res.send({'result': ' order '+orderNo+' successfully added'});
                            })
                            .catch((error) => {
                                if (error.message.search('MVCC_READ_CONFLICT') != -1)
                                    {console.log(orderNo+" retrying assetRegistry.add for: "+orderNo);
                                    svc.loadTransaction(createNew, orderNo, businessNetworkConnection);
                                    }
                                    else
                                    {console.log(orderNo+" submitTransaction failed with text: ",error.message);}
                                });
                            })
                            .catch((error) => {
                            if (error.message.search('MVCC_READ_CONFLICT') != -1)
                                {console.log(orderNo+" retrying assetRegistry.add for: "+orderNo);
                                svc.loadTransaction(createNew, orderNo, businessNetworkConnection);
                            }
                            else
                            {console.log(orderNo+" assetRegistry.add failed: ",error.message);}
                            });                                        
                        })
                        .catch((error) => {
                        console.log(orderNo+" getAssetRegistry failed: ",error.message);
                        res.send({'result': 'failed', 'error':' order '+orderNo+' getAssetRegistry failed '+error.message});
                    });                                        
                })
            .catch((error) => {
                console.log(orderNo+" business network connection failed: text",error.message);
                res.send({'result': 'failed', 'error':' order '+orderNo+' add failed on on business network connection '+error.message});
                });                                        
        }

/**
 * Register for all of the available Z2BEvents
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
*/
exports.init_z2bEvents = function (req, res, next)
{
    var method = 'init_z2bEvents';
    if (bRegistered) {res.send('Already Registered');}
    else{
        bRegistered = true;
        let _conn = svc.createAlertSocket();
        let businessNetworkConnection;
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.setMaxListeners(50);
        return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, config.composer.adminID, config.composer.adminPW)
        .then(() => {
            businessNetworkConnection.on('event', (event) => {_monitor(svc.al_connection, svc.f_connection, event); });
            res.send('event registration complete');
        }).catch((error) => {
            console.log(method+' business network connection failed'+error.message); 
            res.send(method+' business network connection failed'+error.message);
        });
    }
}
/**
 * _monitor
 * @param {org.acme.z2bNetwork.Event} _event - the event just emitted
 * 
 */
function _monitor(_conn, _f_conn, _event)
{
    var method = '_monitor';
    console.log(method+ ' _event received: '+_event.$type+' for Order: '+_event.orderID);
    var event = {};
    event.type = _event.$type;
    event.orderID = _event.orderID;
    event.ID = _event.buyerID;
    _conn.sendUTF(JSON.stringify(event));
    
    switch (_event.$type)
    {
        case 'Created':
        break;
        case 'Bought':
        case 'PaymentRequested':
            event.ID = _event.sellerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.financeCoID;
            _f_conn.sendUTF(JSON.stringify(event));
        break;
        case 'Ordered':
        case 'Cancelled':
        case 'Backordered':
            event.ID = _event.sellerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.providerID;
            _conn.sendUTF(JSON.stringify(event));
        break;
        case 'ShipRequest':
        case 'DeliveryStarted':
        case 'DeliveryCompleted':
            event.ID = _event.sellerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.providerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.shipperID;
            _conn.sendUTF(JSON.stringify(event));
        break;
        case 'DisputeOpened':
        case 'Resolved':
        case 'Refunded':
        case 'Paid':
            event.ID = _event.sellerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.providerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.shipperID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.financeCoID;
            _f_conn.sendUTF(JSON.stringify(event));
        break;
        case 'PaymentAuthorized':
            event.ID = _event.sellerID;
            _conn.sendUTF(JSON.stringify(event));
            event.ID = _event.financeCoID;
            _f_conn.sendUTF(JSON.stringify(event));
        break;
        default:
        break;
    }

}