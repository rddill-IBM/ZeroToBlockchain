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

module.exports = router;
var count = 0;
router.use(function(req, res, next) {
  count++;
  console.log('['+count+'] at: '+format.asString('hh:mm:ss.SSS', new Date())+' Url is: ' + req.url);
  next(); // make sure we go to the next routes and don't stop here
});

router.get('/api/getSupportedLanguages*',multi_lingual.languages);
router.get('/api/getTextLocations*',multi_lingual.locations);
router.post('/api/selectedPrompts*',multi_lingual.prompts);

router.get('/resources/getDocs*',resources.getDocs);
router.get('/resources/getEducation*',resources.getEducation);

router.get('/getCreds*', getCreds.getServiceCreds);
