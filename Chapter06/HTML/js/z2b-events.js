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

// z2c-events.js

/**
 * load all of the members in the network for use in the different user experiences. This is a synchronous routine and is executed autormatically on web app start. 
 * However, if this is a newly created network, then there are no members to retrieve and this will create four empty arrays
 */
function memberLoad ()
{
  var options = {};
  options.registry = 'Seller';
  var options2 = {};
  options2.registry = 'Buyer';
  var options3 = {};
  options3.registry = 'Provider';
  var options4 = {};
  options4.registry = 'Shipper';
  $.when($.post('/composer/admin/getMembers', options), $.post('/composer/admin/getMembers', options2),
      $.post('/composer/admin/getMembers', options3), $.post('/composer/admin/getMembers', options4)).done(function (_sellers, _buyers, _providers, _shippers)
    { 
      buyers = _buyers[0].members;
      sellers = _sellers[0].members;
      s_string = _getMembers(sellers);
      providers = _providers[0].members
      p_string = _getMembers(providers);
      shippers = _shippers[0].members
      sh_string = _getMembers(shippers);
    });
}
/**
 * load all of the members in the network for use in the different user experiences. This routine is designed for use if the network has been newly deployed and the web app was
 * started before the autoLoad function was run on the newly deployed network (which, by default, is empty).
 */
function deferredMemberLoad()
{
  var d_prompts = $.Deferred();
  var options = {};
  options.registry = 'Seller';
  var options2 = {};
  options2.registry = 'Buyer';
  var options3 = {};
  options3.registry = 'Provider';
  var options4 = {};
  options4.registry = 'Shipper';
  $.when($.post('/composer/admin/getMembers', options), $.post('/composer/admin/getMembers', options2),
      $.post('/composer/admin/getMembers', options3), $.post('/composer/admin/getMembers', options4)).done(function (_sellers, _buyers, _providers, _shippers)
    { 
      buyers = _buyers[0].members;
      sellers = _sellers[0].members;
      s_string = _getMembers(sellers);
      providers = _providers[0].members
      p_string = _getMembers(providers);
      shippers = _shippers[0].members
      sh_string = _getMembers(shippers);
      d_prompts.resolve();
    }).fail(d_prompts.reject);
      return d_prompts.promise();      
}
/**
 * return an option list for use in an HTML <select> element from the provided member array.
 * @param {Array} _members - array of members
 */
function _getMembers(_members)
{
  var _str = '';
  for (each in _members)
  {(function(_idx, _arr){if (_arr[_idx].id != 'noop@dummy')
    {_str +='<option value="'+_arr[_idx].id+'">' +_arr[_idx].companyName+'</option>';}})(each, _members)}
    _str += '</select>';
  return _str;
}