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


var express = require('express');
var router = express.Router();
var format = require('date-format');

var multi_lingual = require('./features/multi_lingual');
var resources = require('./features/resources');
var getCreds = require('./features/getCredentials');
var hlcAdmin = require('./features/composer/hlcAdmin');
var hlcClient = require('./features/composer/hlcClient');
var setup = require('./features/composer/autoLoad');
var hlcFabric = require('./features/composer/queryBlockChain');
router.post('/setup/autoLoad*', setup.autoLoad);
router.get('/setup/getPort*', setup.getPort);

router.get('/fabric/getChainInfo', hlcFabric.getChainInfo);
router.get('/fabric/getChainEvents', hlcFabric.getChainEvents);
router.get('/fabric/getHistory', hlcAdmin.getHistory);

module.exports = router;
var count = 0;
/**
 * This is a request tracking function which logs to the terminal window each request coming in to the web serve and 
 * increments a counter to allow the requests to be sequenced.
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * 
 * @function
 */
router.use(function(req, res, next) {
  count++;
  console.log('['+count+'] at: '+format.asString('hh:mm:ss.SSS', new Date())+' Url is: ' + req.url);
  next(); // make sure we go to the next routes and don't stop here
});

// the following get and post statements tell nodeJS what to do when a request comes in
// The request is the single quoted phrase following the get( or post( statement. 
// the text at the end identifies which function in which require(d) module to implement
// These are searched in order by get/post request. 
// The asterisk (*) means 'ignore anything following this point'
// which means we have to be careful about ordering these statements. 
//
router.get('/api/getSupportedLanguages*',multi_lingual.languages);
router.get('/api/getTextLocations*',multi_lingual.locations);
router.post('/api/selectedPrompts*',multi_lingual.prompts);

router.get('/resources/getDocs*',resources.getDocs);
router.get('/resources/getEducation*',resources.getEducation);

router.get('/getCreds*', getCreds.getServiceCreds);

router.get('/composer/admin/connect*', hlcAdmin.adminConnect);
router.get('/composer/admin/getCreds*', hlcAdmin.getCreds);
router.get('/composer/admin/getAllProfiles*', hlcAdmin.getAllProfiles);
router.get('/composer/admin/listAsAdmin*', hlcAdmin.listAsAdmin);
router.get('/composer/admin/getRegistries*', hlcAdmin.getRegistries);

router.post('/composer/admin/createProfile*', hlcAdmin.createProfile);
router.post('/composer/admin/deleteProfile*', hlcAdmin.deleteProfile);
router.post('/composer/admin/deploy*', hlcAdmin.deploy);
router.post('/composer/admin/install*', hlcAdmin.networkInstall);
router.post('/composer/admin/start*', hlcAdmin.networkStart);
router.post('/composer/admin/disconnect*', hlcAdmin.disconnect);
router.post('/composer/admin/getProfile*', hlcAdmin.getProfile);
router.post('/composer/admin/ping*', hlcAdmin.ping);
router.post('/composer/admin/undeploy*', hlcAdmin.undeploy);
router.post('/composer/admin/update*', hlcAdmin.update);
router.post('/composer/admin/getMembers*', hlcAdmin.getMembers);
router.post('/composer/admin/getAssets*', hlcAdmin.getAssets);
router.post('/composer/admin/addMember*', hlcAdmin.addMember);
router.post('/composer/admin/removeMember*', hlcAdmin.removeMember);
router.post('/composer/admin/getSecret*', setup.getMemberSecret);
router.post('/composer/admin/checkCard*', hlcAdmin.checkCard);
router.post('/composer/admin/createCard*', hlcAdmin.createCard);
router.post('/composer/admin/issueIdentity*', hlcAdmin.issueIdentity);

