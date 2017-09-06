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
* function to recursively display, up to 7 levels, the values of every property in an object. If the type of a property is object or function, then the word 'object' or 'function' is displayed
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
