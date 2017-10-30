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
var alertPort = null;
var financeAlertPort = null;

/**
 * load the four initial user roles into a single page.
 */
function singleUX ()
{
  var toLoad = 'singleUX.html'
  if (buyers.length === 0) 
  { $.when($.get(toLoad), $.get('/setup/getPort'), deferredMemberLoad()).done(function (_page, _port, _res)
    {  msgPort = _port.port;
      $('#body').empty();
      $('#body').append(_page);
      loadBuyerUX();
      loadSellerUX();
      loadProviderUX();
      loadShipperUX();
      // Initialize Registration for all Z2B Business Events
      goEventInitialize();
});
  }
  else{
    $.when($.get(toLoad)).done(function(_page)
    {
      $('#body').empty();
      $('#body').append(_page);
      loadBuyerUX();
      loadSellerUX();
      loadProviderUX();
      loadShipperUX();
      // Initialize Registration for all Z2B Business Events
      goEventInitialize();
    });
  }
}
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
      buyers = dropDummy(_buyers[0].members);
      sellers = dropDummy(_sellers[0].members);
      providers = dropDummy(_providers[0].members);
      shippers = dropDummy(_shippers[0].members);
      s_string = _getMembers(sellers);
      p_string = _getMembers(providers);
      sh_string = _getMembers(shippers);

    });
}
/**
 * dropDummy() removes 'noop@dummy' from memberlist
 */
function dropDummy(_in)
{
  var _a = new Array()
  for (each in _in){(function(_idx, _arr){console.log('_arr['+_idx+'].id is: '+_arr[_idx].id); if (_arr[_idx].id !== 'noop@dummy')_a.push(_arr[_idx]);})(each, _in)}
  return _a;
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
      buyers = dropDummy(_buyers[0].members);
      sellers = dropDummy(_sellers[0].members);
      providers = dropDummy(_providers[0].members);
      shippers = dropDummy(_shippers[0].members);
      s_string = _getMembers(sellers);
      p_string = _getMembers(providers);
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
  {(function(_idx, _arr){_str +='<option value="'+_arr[_idx].id+'">' +_arr[_idx].companyName+'</option>';})(each, _members)}
    _str += '</select>';
  return _str;
}
/**
 * set up the server to listen for all events
 */
function goEventInitialize()
{
  $.when($.get('/composer/client/initEventRegistry')).done(function(_res){console.log(_res);})
}

/**
 * get the alert web socket port
 */
function getAlertPort ()
{
  if (alertPort == null)
  { 
    $.when($.get('/setup/getAlertPort')).done(function (port)
    {
      console.log('alert port is: '+port.port); alertPort = port.port;
      var wsSocket = new WebSocket('ws://localhost:'+alertPort);
      wsSocket.onopen = function () {wsSocket.send('connected to alerts');};
      wsSocket.onmessage = function (message) {
        console.log(message.data);
        var event = JSON.parse(message.data);
        // use the addNotification routine in this file to update the alert status for the relevant subscriber
  /*
  *   YOUR CODE HERE
  *
  */
};
    
      wsSocket.onerror = function (error) {console.log('Alert Socket error on wsSocket: ' + error);};
        });
  }
}
/**
 * get the finance alert web socket port
 */
function getFinanceAlertPort ()
{
  if (financeAlertPort == null)
  { 
    $.when($.get('/setup/getFinanceAlertPort')).done(function (port)
    {
      console.log('finance alert port is: '+port.port); financeAlertPort = port.port;
      var wsSocket = new WebSocket('ws://localhost:'+financeAlertPort);
      wsSocket.onopen = function () {wsSocket.send('connected to finance alerts');};
      wsSocket.onmessage = function (message) {
        console.log(message.data);
        var event = JSON.parse(message.data);
        // use the addNotification routine in this file to update the alert status for the relevant subscriber
  /*
  *   YOUR CODE HERE
  *
  */
};
    
      wsSocket.onerror = function (error) {console.log('Finance Alert Socket error on wsSocket: ' + error);};
        });
  }
}
/**
 * alert processing
 */
function addNotification(_event, _id, _orderID)
{
  // let's display each received event
  var method = 'showNotification';
  console.log(method+' _event'+_event+' id: '+_id+' orderID: '+_orderID);
  // using the getSubscriber routine, find the class of this event
  /*
  *   YOUR CODE HERE
  *
  */
  // if no one of the specified type is listening, just return with a value of 'none'
  if (type == 'none') {return}
  // create a switch/case statement for each type of member
  // update the x_alerts array with the new alert
  // call the toggleAlert routine to update the alert icon
  switch(type)
  {
    case 'Buyer':
  /*
  *   YOUR CODE HERE
  *
  */
  break;
    case 'Seller':
  /*
  *   YOUR CODE HERE
  *
  */
  break;
    case 'Provider':
  /*
  *   YOUR CODE HERE
  *
  */
  break;
    case 'Shipper':
  /*
  *   YOUR CODE HERE
  *
  */
  break;
    case 'FinanceCo':
  /*
  *   YOUR CODE HERE
  *
  */
  break;
    default:
    console.log(method+' default entered for: '+type);
    break;   
  }
}
/**
 * alert toggle
 */
function toggleAlert(_target, _array, _count)
{
  // if there aren't any elements in the array, then hide the alert icon
  if (_array.length < 1) 
  /*
  *   YOUR CODE HERE
  *
  */
  // if the alert array has anything in it, then show the alert icon and update the count with the number of items in the alert array
  /*
  *   YOUR CODE HERE
  *
  */
}
/**
 * check to see if _id is subscribing
 */
function getSubscriber(_id)
{
  var type = 'none';
  // get the member type from the subscriber array. if the member is not not found, return 'none'
  /*
  *   YOUR CODE HERE
  *
  */
  return(type);
}
/**
 * subscribe to events
 * 
 * 
 */
function z2bSubscribe(_type, _id)
{
  // update the subscriber array with the provided id and type. 
  subscribers.push({'type': _type, 'id': _id});
}
/**
 * unsubscribe to events
 * 
 * 
 */
function z2bUnSubscribe(_id)
{
  // remove the provided id from the member array. If the id is not found, the subscriber array is returned in the original state.
  var _s1 = subscribers;
  var _s2 = [];
  /*
  *   YOUR CODE HERE
  *
  */
  subscribers = _s2;
}
/**
 * notifyMe
 * @param {String} _id - orderID
 */
function notifyMe (_alerts, _id)
{
  // check to see if the provided orderID is in the provided alert array. If so, return true, else return false. 
  var b_h = false;
  /*
  *   YOUR CODE HERE
  *
  */
  return b_h;
}