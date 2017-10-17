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
 * load the administration User Experience
 */
function singleUX ()
{
  var toLoad = 'singleUX.html';
  var options = {};
  options.registry = 'Seller';
  var options2 = {};
  options2.registry = 'Buyer';
  var options3 = {};
  options3.registry = 'Provider';
  var options4 = {};
  options4.registry = 'Shipper';
  $.when($.get(toLoad), $.post('/composer/admin/getMembers', options), $.post('/composer/admin/getMembers', options2),
      $.post('/composer/admin/getMembers', options3), $.post('/composer/admin/getMembers', options4)).done(function (_page, _sellers, _buyers, _providers, _shippers)
    { 
      buyers = _buyers[0].members;
      sellers = _sellers[0].members;
      s_string = _getMembers(sellers);
      providers = _providers[0].members
      p_string = _getMembers(providers);
      shippers = _shippers[0].members
      sh_string = _getMembers(shippers);
      $("#body").empty();
      $("#body").append(_page[0]);
      loadBuyerUX();
      loadSellerUX();
      loadProviderUX();
      loadShipperUX();
    });
}
function deferredSingleUX()
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
function _getMembers(_members)
{
  var _str = '';
  for (each in _members)
  {(function(_idx, _arr){if (_arr[_idx].id != 'noop@dummy')
    {_str +='<option value="'+_arr[_idx].id+'">' +_arr[_idx].companyName+'</option>';}})(each, _members)}
    _str += '</select>';
  return _str;
}