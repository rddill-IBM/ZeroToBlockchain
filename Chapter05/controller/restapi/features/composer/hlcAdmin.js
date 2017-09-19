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
const fs = require('fs');
const path = require('path');
const composerAdmin = require('composer-admin');
const AdminConnection = require('composer-admin').AdminConnection;
const composerClient = require('composer-client');
const composerCommon = require('composer-common');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const Serializer = require('composer-common').Serializer;
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';
const svc = require('./Z2B_Services');
const util = require('./Z2B_Utilities');
var orderStatus = svc.orderStatus;

/**
 * display the admin and network info
 * @constructor
 */

exports.getCreds = function(req, res, next) {
    res.send(config);
};

/**
 * Create an instance of the AdminConnection class (currently a no-op)
 * @constructor
 */
exports.adminNew = function() {

};

/**
 * connect to the network
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.adminConnect = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();
    console.log('connection profile: ', config.composer.connectionProfile);
    console.log('admin user id: ', config.composer.adminID);
    console.log('admin password: ', config.composer.adminPW);
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
    .then(function(){
        console.log('create connection successful ');
        res.send({connection: 'succeeded'});
    })
    .catch(function(error){
        console.log('create connection failed: ',error);
        res.send(error);
    });
};

/**
 * Stores a connection profile into the profile store being used by this AdminConnection.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.profileName: _string - string name of object - not used in current implementation
 * req.body.data:  _object - the object to be parsed
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.createProfile = function(req, res, next) {

    let adminOptions = {
        type: req.body.type,
        keyValStore: req.body.keyValStore,
        channel: req.body.channel,
        mspID: req.body.mspID,
        timeout: req.body.timeout,
        orderers: [{url: req.body.orderers.url}],
        ca: {url: req.body.ca.url, name: req.body.ca.name},
        peers: [{eventURL: req.body.peers.eventURL, requestURL: req.body.peers.requestRUL}]
    };

};
/**
 * Deletes the specified connection profile from the profile store being used by this AdminConnection.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.connectionProfile: _string - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.deleteProfile = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Deploys a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.myArchive: _string - string name of object
 *  req.body.deployOptions: _object - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.deploy = function(req, res, next) {

    let newFile = path.join(path.dirname(require.main.filename),'network/dist',req.body.myArchive);
    let archiveFile = fs.readFileSync(newFile);

    let adminConnection = new composerAdmin.AdminConnection();


};
/**
 * Installs a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.myArchive: _string - string name of object
 *  req.body.deployOptions: _object - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.networkInstall = function(req, res, next) {
    
    let newFile = path.join(path.dirname(require.main.filename),'network/dist',req.body.myArchive);
    let archiveFile = fs.readFileSync(newFile);

    let adminConnection = new composerAdmin.AdminConnection();

}

/**
 * Starts a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.networkName: _string - string name of network
 *  req.body.deployOptions: _object - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.networkStart = function(req, res, next) {
    
    let adminConnection = new composerAdmin.AdminConnection();

};

/**
 * disconnects this connection
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.disconnect = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Retrieve all connection profiles from the profile store being used by this AdminConnection.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.getAllProfiles = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Retrieve the specified connection profile from the profile store being used by this AdminConnection.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.connectionProfile: _string - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.getProfile = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * List all of the deployed business networks. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.listAsAdmin = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * List all of the deployed business networks. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.listAsPeerAdmin = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Test the connection to the runtime and verify that the version of the runtime is compatible with this level of the node.js module.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.ping = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Undeploys a BusinessNetworkDefinition from the Hyperledger Fabric. The business network will no longer be able to process transactions.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.businessNetwork: _string - name of network to remove
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.undeploy = function(req, res, next) {
    let adminConnection = new composerAdmin.AdminConnection();

};
/**
 * Updates an existing BusinessNetworkDefinition on the Hyperledger Fabric. The BusinessNetworkDefinition must have been previously deployed.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.myArchive: _string - name of archive to deploy
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns composerAdmin.connection - either an error or a connection object
 * @function
 */
exports.update = function(req, res, next) {

    let newFile = path.join(path.dirname(require.main.filename),'network/dist',req.body.myArchive);
    let netName = req.body.myArchive.split('.')[0];
    let archiveFile = fs.readFileSync(newFile);

    let adminConnection = new composerAdmin.AdminConnection();

};

/**
 * retrieve array of member registries
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns array of registries
 * @function
 */
exports.getRegistries = function(req, res, next)
{
    // get the autoload file
    // connect to the network
    let allRegistries = new Array();
    let businessNetworkConnection;
    let factory;
    let adminConnection = new AdminConnection();

}

/**
 * retrieve array of members from specified registry type
 * @param {express.req} req - the inbound request object from the client
 *  req.body.registry: _string - type of registry to search; e.g. 'Buyer', 'Seller', etc.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of members
 * @function
 */
exports.getMembers = function(req, res, next) {
    // connect to the network
    let allMembers = new Array();
    let businessNetworkConnection;
    let factory;
    let adminConnection = new AdminConnection();
   
}

/**
 * gets the assets from the order registry
 * @param {express.req} req - the inbound request object from the client
 *  req.body.type - the type of individual making the request (admin, buyer, seller, etc)
 *  req.body.id - the id of the individual making the request
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns an array of assets
 * @function
 */
exports.getAssets = function(req, res, next) {
        // connect to the network
        let newFile = path.join(path.dirname(require.main.filename),'network','package.json');
        let packageJSON = JSON.parse(fs.readFileSync(newFile));
        let allOrders = new Array();
        let businessNetworkConnection;
        let factory;
        let serializer;
        let adminConnection = new AdminConnection();
}

/**
 * Adds a new member to the specified registry
 * @param {express.req} req - the inbound request object from the client
 *  req.body.companyName: _string - member company name
 *  req.body.type: _string - member type (registry type); e.g. 'Buyer', 'Seller', etc.
 *  req.body.id: _string - id of member to add (email address)
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns JSON object with success or error results
 * @function
 */
exports.addMember = function(req, res, next) {
    let businessNetworkConnection;
    let factory;
    let adminConnection = new AdminConnection();
}

/**
 * Removes a member from a registry.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.registry: _string - type of registry to search
 *  req.body.id: _string - id of member to delete
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * returns JSON object with success or error results
 * @function
 */
exports.removeMember = function(req, res, next) {
    let businessNetworkConnection;
    let factory;
    let adminConnection = new AdminConnection();

}