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

var extend = require('extend');
var fs = require('fs');
var path = require('path');
var textPath = "../text/";
var languageFile = "languages.json";
var locationsFile = "text-locations.json";
var promptFile = "prompts.json";
var languages = require('./text/languages.json');
var locations = require('./text/text-locations.json');

/**
 * languages returns a json file which specifies which languages are available to this web app.
 * The JSON file has the following structure: 
 * {
 * "US_English": {"active": "yes", "menu": "US English", "model": "en-US_BroadbandModel", "voice": "en-US_AllisonVoice", "data": "/text/en-US/prompts.json"},
 * "UK_English": {"active": "yes", "menu": "UK English", "model": "en-UK_BroadbandModel", "voice": "en-GB_KateVoice", "data": "/text/en-UK/prompts.json"},
 * "Spanish_ES": {"active": "no", "menu": "Español (España)", "model": "es-ES_BroadbandModel", "voice": "es-ES_LauraVoice", "data": "/text/es-ES/prompts.json"},
 * "Spanish_LA": {"active": "no", "menu": "Español (latinoamericano)", "model": "es-ES_BroadbandModel", "voice": "es-LA_SofiaVoice", "data": "/text/es-LA/prompts.json"},
 * "French":     {"active": "no", "menu": "Le Français", "model": "fr-FR_BroadbandModel", "voice": "fr-FR_ReneeVoice", "data": "/text/fr/prompts.json"},
 * "Japanese":   {"active": "no", "menu": "Japanese", "model": "ja-JP_BroadbandModel", "voice": "ja-JP_EmiVoice", "data": "/text/jp/prompts.json"},
 * "Brazilian_Portuguese": {"active": "no", "menu": "Português do Brasi", "model": "pt-BR_BroadbandModel", "voice": "pt-BR_IsabelaVoice", "data": "/text/pt/prompts.json"}
 * } 
 * model and voice are not use in the Zero To Blockchain series unless you want to use Watson Speech to Text or Text to Speech services. 
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * 
 * @function
 */exports.languages = function(req, res) {res.send(languages);}

/**
 * prompts loads the prompt JSON file from the server, based on the selected language and the information in the languages file
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * 
 * @function
 */exports.prompts = function(req, res)
{res.send(fs.readFileSync(path.resolve(__dirname)+languages[req.body.language].data)); }

/**
 * locations is not used in the ZeroToBlockchain tutorial as this information can be automatically extracted from the prompts file
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * 
 * @function
 */exports.locations = function(req, res){res.send(locations);}
