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

// z2c-financeCo.js

var creds;
var connection;
var connectionProfileName = "z2b-test-profile";
var networkFile = "zerotoblockchain-network.bna"
var businessNetwork = "zerotoblockchain-network";
var buyers; var sellers; var providers; var p_string;
var financeCOorderDiv = "financeCOorderDiv";
var itemTable = {};
var sellerTable = {};
var newItems = [];
var totalAmount = 0;
var orders = [];
const financeCoID = 'easymoney@easymoneyinc.com';
const financeCoName = 'The Global Financier';

var orderStatus = {
  Created: {code: 1, text: 'Order Created'},
  Bought: {code: 2, text: 'Order Purchased'},
  Cancelled: {code: 3, text: 'Order Cancelled'},
  Ordered: {code: 4, text: 'Order Submitted to Provider'},
  ShipRequest: {code: 5, text: 'Shipping Requested'},
  Delivered: {code: 6, text: 'Order Delivered'},
  Delivering: {code: 15, text: 'Order being Delivered'},
  Backordered: {code: 7, text: 'Order Backordered'},
  Dispute: {code: 8, text: 'Order Disputed'},
  Resolve: {code: 9, text: 'Order Dispute Resolved'},
  PayRequest: {code: 10, text: 'Payment Requested'},
  Authorize: {code: 11, text: 'Payment Approved'},
  Paid: {code: 14, text: 'Payment Processed'},
  Refund: {code: 12, text: 'Order Refund Requested'},
  Refunded: {code: 13, text: 'Order Refunded'}
};

/**
 * load the administration User Experience
 */
function loadFinanceCoUX ()
{
  toLoad = "financeCo.html";
  getPort();
  $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port)
    {$("#body").empty();
    $("#body").append(page[0]);
    console.log('port is: '+port[0].port);
    msgPort = port[0].port;
    wsDisplay('finance_messages', msgPort);
    var _clear = $("#financeCOclear");
    var _list = $("#financeCOorderStatus");
    var _orderDiv = $("#"+financeCOorderDiv);
    _clear.on('click', function(){_orderDiv.empty();});
    _list.on('click', function(){listFinanceOrders()});
    var options = {};
    options.registry = 'Seller';
    var options2 = {};
    options2.registry = 'Buyer';
    var options3 = {};
    options3.registry = 'Provider';
    $.when($.post('/composer/admin/getMembers', options), $.post('/composer/admin/getMembers', options2), $.post('/composer/admin/getMembers', options3)).done(function (_sellers, _buyers, _providers)
      { console.log(_sellers);
        sellers = _sellers[0].members;
        buyers = _buyers[0].members;
        providers = _providers[0].members
        p_string = '';
        });
    });
}
/**
 * lists all orders for the selected seller
 */
function listFinanceOrders()
{
  var options = {};
  options.id = financeCoID;
  $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
  {
    console.log(_mem);
    options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
      {
        console.log(_results.result);
        console.log(_results.orders);
        if (_results.orders.length < 1) {$("#"+financeCOorderDiv).empty(); $("#"+financeCOorderDiv).append(formatMessage('No orders for the financeCo: '+options.id));}
        else{orders = _results.orders; formatFinanceOrders($("#"+financeCOorderDiv), orders)}
      });
  });
}
/**
 * used by the listOrders() function
 * formats the orders for a buyer. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param _target - string with div id prefaced by #
 * @param _orders - array with order objects
 */
function formatFinanceOrders(_target, _orders)
{
  _target.empty();
  let _str = ""; let _date = ""; let p_string;
  for (let each in _orders)
  {(function(_idx, _arr)
    { _action = '<th><select id=action'+_idx+'><option value="NoAction">No Action</option>';
    p_string = '';
      switch (JSON.parse(_arr[_idx].status).code)
      {
        default:
        break;
      }
      _button = '<th><button id="btn_'+_idx+'">Execute</button></th>'
      _action += "</select>";
      if (_idx > 0) {_str += '<div class="spacer"></div>';}
      _str += '<div class="acc_header off" id="order'+_idx+'_h" target="order'+_idx+'_b"><table class="wide"><tr><th>Order #</th><th>Status</th><th class="right">Total</th><th colspan="3" class="right message">Buyer: '+findMember(_arr[_idx].buyer,buyers).companyName+'</th></tr>';
      _str += '<tr><th id ="order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+'</th>'+_button+'</tr></table></div>';
      _str+= formatDetail(_idx, _arr[_idx]);
    })(each, _orders)
  }
  _target.append(_str);
  for (let each in _orders)
    {(function(_idx, _arr)
      { 
        // please note, these next two lines are new and reference functions added to the z2b-utilities.js file
        // these toggle the accordian action in the browser by clicking on the header line ("_h") to expand and collapse the accordian
        // and also by clicking on the body line ("_b") to collapse the accordian
        $("#order"+_idx+"_h").on('click', function(){accToggle('financeCOorderDiv','order'+_idx+'_b', 'order'+_idx+'_h');});
        $("#order"+_idx+"_b").on('click', function(){accToggle('financeCOorderDiv','order'+_idx+'_b', 'order'+_idx+'_h');});
        $("#btn_"+_idx).on('click', function () 
        {
          var options = {};
          options.action = $("#action"+_idx).find(":selected").text();
          options.orderNo = $("#order"+_idx).text();
          options.participant = financeCoID;
          console.log(options);
          $("#finance_messages").prepend(formatMessage('Processing '+options.action+' request for order number: '+options.orderNo));
          $.when($.post('/composer/client/orderAction', options)).done(function (_results)
          { console.log(_results);
            $("#finance_messages").prepend(formatMessage(_results.result));
          });
      });
    })(each, _orders)
  }
}
/**
 * format the accordian with the details for this order
 */
function formatDetail(_cur, _order)
{
  var _out = '<div class="acc_body off" id="order'+_cur+'_b">';
  _out += '<h3>Current Status: \t'+JSON.parse(_order.status).text+'</h3>';
  _out += '<table class="wide"><tr><th>Action</th><th>By</th><th>Date</th><th>Comments</th></tr>';
// the rest of the detail body goes here
  return _out;
}
