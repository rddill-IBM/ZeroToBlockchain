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
let fs = require('fs');
let path = require('path');
let composerAdmin = require('composer-admin');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
let config = require('../../../env.json');

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
    let fields = ['fabric_type', 'orderers_url', 'ca_url', 'ca_name', 'peers_eventURL', 'peers_requestURL',
        'keyValStore', 'channel', 'mspID', 'timeout'];

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
    console.log(adminOptions);
    let adminConnection = new composerAdmin.AdminConnection();
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.createProfile(req.body.profileName, adminOptions)
                .then(function(result){
                    console.log('create profile successful: ');
                    res.send({profile: 'succeeded'});
                })
                .catch(function(error){
                    console.log('create profile failed: ',error);
                    res.send({profile: error});
                });
        });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.deleteProfile(req.body.profileName)
                .then(function(result){
                    console.log('delete profile successful: ',result);
                    res.send({profile: 'succeeded'});
                })
                .catch(function(error){
                    console.log('delete profile failed: ',error);
                    res.send({profile: error});
                });
        });
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

    return BusinessNetworkDefinition.fromArchive(archiveFile)
        .then(function(archive) {
            adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
            .then(function(){
                adminConnection.deploy(archive)
                    .then(function(){
                        console.log('business network '+req.body.myArchive+' deployed successful: ');
                        res.send({deploy: req.body.myArchive+' deploy succeeded'});
                    })
                    .catch(function(error){
                        console.log('business network '+req.body.myArchive+' deploy failed: ',error);
                        res.send({deploy: error});
                        });
                });
            });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.disconnect()
                .then(function(result){
                    console.log('network disconnect successful: ');
                    res.send({disconnect: 'succeeded'});
                })
                .catch(function(error){
                    console.log('network disconnect failed: ',error);
                    res.send(error);
                });
        });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.getAllProfiles()
                .then((profiles) => {
                // Retrieved profiles
                    for (let profile in profiles) {
                        console.log(profile, profiles[profile]);
                    }
                    res.send(profiles);
                })
                .catch(function(error){
                    console.log('network disconnect failed: ',error);
                    res.send(error);
                });
        });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.getProfile(req.body.connectionProfile)
                .then((profile) => {
                    console.log('get profile Succeeded: ',profile);
                    res.send(profile);
                })
                .catch(function(error){
                    console.log('get profile failed: ',error);
                    res.send(error);
                });
        });
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
    displayObjectValuesRecursive(adminConnection);
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW)
        .then(function(){
            adminConnection.list()
                .then((businessNetworks) => {
                    // Connection has been tested
                    businessNetworks.forEach((businessNetwork) => {
                        console.log('Deployed business network', businessNetwork);
                    });
                    res.send(businessNetworks);
                })
                .catch(function(_error){
                    let error = _error;
                    console.log('get business networks failed: ',error);
                    res.send(error);
                });
        });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW, req.body.businessNetwork)
        .then(function(){
            adminConnection.ping()
                .then(function(result){
                    console.log('network ping successful: ',result);
                    res.send({ping: result});
                })
                .catch(function(error){
                    let _error = error;
                    console.log('network ping failed: '+_error);
                    res.send({ping: _error.toString()});
                });
        });
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
    adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW, req.body.businessNetwork)
        .then(function(){
            adminConnection.undeploy(req.body.businessNetwork)
            .then(function(result){
                    console.log(req.body.businessNetwork+' network undeploy successful ');
                    res.send({undeploy: req.body.businessNetwork+' network undeploy successful '});
                })
                .catch(function(error){
                    let _error = error;
                    console.log(req.body.businessNetwork+' network undeploy failed: '+_error);
                    res.send({undeploy: _error.toString()});
            });
        });
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

    return BusinessNetworkDefinition.fromArchive(archiveFile)
        .then(function(archive) {
            adminConnection.connect(config.composer.connectionProfile, config.composer.adminID, config.composer.adminPW, netName)
            .then(function(){
                adminConnection.update(archive)
                    .then(function(){
                        console.log(netName+' network update successful: ');
                        res.send({update: req.body.myArchive+' network update successful '});
                    })
                    .catch(function(error){
                        let _error = error;
                        console.log(req.body.myArchive+' network update failed: '+_error);
                        res.send({update: _error.toString()});
                        });
            });
        });
};

/**
* function to display the properties of an object using console.log
* Refer to this by {@link displayObjectProperties}.
* @param {Object} _object - the object whose properties are to be displayed
*/
function displayObjectProperties(_object)
{
    console.log('Inbound is a type of: '+typeof(_object));
    for(let propt in _object){
        console.log('object property: '+propt );
    }
}

/**
* function to display the values of every property in an object. If the type of a property is object or function, then the word 'object' or 'function' is displayed
* Refer to this by {@link displayObjectValues}.
* @param {String} _string - an arbitrary string to preface the printing of the object property name and value. often used to display the name of the object being printed
* @param {Object} _object - the object to be introspected
*/
function  displayObjectValues(_string, _object)
{
    console.log(_string+' is a type of: '+typeof(_object));
    for (let prop in _object){
        console.log(_string+prop);
        console.log(_string+prop+': '+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function'))  ? typeof(_object[prop]) : _object[prop]));
    }
}
/**
* function to recursively display, up to 5 levels, the values of every property in an object. If the type of a property is object or function, then the word 'object' or 'function' is displayed
* Refer to this by {@link displayObjectValues}.
* @param {String} _string - an arbitrary string to preface the printing of the object property name and value. often used to display the name of the object being printed
* @param {Object} _object - the object to be introspected
* @param {Object} _iter - limits number of iterations. max is 5, value is null to 4. # of iterations is 5-_iter
*/
function  displayObjectValuesRecursive(_string, _object, _iter)
{
    let __iter = (typeof(_iter) === 'undefined') ? 0 : _iter;
    if (__iter >= 7) {return;}
//    console.log(_string+' is a type of: '+typeof(_object));
    for (let prop in _object){
        __iter = (typeof(_iter) === 'undefined') ? 0 : _iter;
        console.log(_string+'.'+prop+': \t'+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function') || (prop === 'definitions') )  ? typeof(_object[prop]) : _object[prop]));
        if (typeof(_object[prop]) === 'object') {__iter++;  displayObjectValuesRecursive(_string+'.'+prop, _object[prop], __iter);}
    }
}
