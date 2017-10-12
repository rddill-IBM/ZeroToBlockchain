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
        case orderStatus.PayRequest.code:
        _date = _arr[_idx].paymentRequested;
        break;
        case orderStatus.Delivered.code:
          _date = _arr[_idx].delivered;
        break;
        case orderStatus.Dispute.code:
          _date = _arr[_idx].disputeOpened + '<br/>'+_arr[_idx].dispute;
        break;
        case orderStatus.Resolve.code:
          _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
        break;
        case orderStatus.Created.code:
          _date = _arr[_idx].created;
        break;
        case orderStatus.Cancelled.code:
          _date = _arr[_idx].cancelled;
        break;
        case orderStatus.Backordered.code:
          _date = _arr[_idx].dateBackordered + '<br/>'+_arr[_idx].backorder;
        break;
        case orderStatus.ShipRequest.code:
          _date = _arr[_idx].requestShipment;
        break;
        case orderStatus.Authorize.code:
          _date = _arr[_idx].approved;
          _action += '<option value="Pay">Pay</option>'
        break;
        case orderStatus.Bought.code:
          _date = _arr[_idx].bought;
        break;
        case orderStatus.Delivering.code:
          _date = _arr[_idx].delivering;
        break;
        case orderStatus.Ordered.code:
          _date = _arr[_idx].ordered;
        break;
        case orderStatus.Refund.code:
          _date = _arr[_idx].orderRefunded + '<br/>'+_arr[_idx].refund;
        break;
        case orderStatus.Paid.code:
        _date = _arr[_idx].paid;
        break;
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
  console.log('['+_cur+'] is ',_order);
  var _out = '<div class="acc_body off" id="order'+_cur+'_b">';
  _out += '<h3>Current Status: \t'+JSON.parse(_order.status).text+'</h3>';
  _out += '<table class="wide"><tr><th>Action</th><th>By</th><th>Date</th><th>Comments</th></tr>';
  _out += '<tr><td>Created</td><td>'+_order.buyer+'</td><td>'+_order.created+'</td><td></td></tr>';
  _out += (_order.cancelled === "") ?  '<tr><td>Cancelled?</td><td></td><td>(not Cancelled)</td><td></td></tr>' : '<tr><td>Cancelled?</td><td>'+_order.buyer+'</td><td>'+_order.cancelled+'</td><td></td></tr>';
  _out += (_order.bought === "") ?  '<tr><td>Purchased</td><td></td><td>(no Purchase Request)</td><td></td></tr>' : '<tr><td>Purchased</td><td>'+_order.buyer+'</td><td>'+_order.bought+'</td><td></td></tr>';
  _out += (_order.ordered === "") ?  '<tr><td>3rd Party Order</td><td></td><td>(not yet sent to 3rd Party)</td><td></td></tr>' : '<tr><td>3rd Party Order</td><td>'+_order.seller+'</td><td>'+_order.ordered+'</td><td></td></tr>';
  _out += (_order.dateBackordered === "") ?  '<tr><td>Backordered?</td><td></td><td>(not Backordered)</td><td></td></tr>' : '<tr><td>Backordered?</td><td>'+_order.provider+'</td><td>'+_order.dateBackordered+'</td><td>'+_order.backorder+'</td></tr>';
  _out += (_order.requestShipment === "") ?  '<tr><td>Shipping Requested</td><td></td><td>(No Request to Shipper)</td><td></td></tr>' : '<tr><td>Shipping Requested</td><td>'+_order.provider+'</td><td>'+_order.requestShipment+'</td><td></td></tr>';
  _out += (_order.delivering === "") ?  '<tr><td>Shipping Started</td><td></td><td>(Delivery not Started)</td><td></td></tr>' : '<tr><td>Shipping Started</td><td>'+_order.shipper+'</td><td>'+_order.delivering+'</td><td></td></tr>';
  _out += (_order.delivered === "") ?  '<tr><td>Delivered</td><td></td><td>(not yet Delivered)</td><td></td></tr>' : '<tr><td>Delivered</td><td>'+_order.shipper+'</td><td>'+_order.delivered+'</td><td></td></tr>';
  _out += (_order.paymentRequested === "") ?  '<tr><td>Payment Requested</td><td></td><td>(no request for payment)</td><td></td></tr>' : '<tr><td>Payment Requested</td><td></td><td>'+_order.paymentRequested+'</td><td></td></tr>';
  _out += (_order.disputeOpened === "") ?  '<tr><td>Dispute Raised</td><td></td><td>(not in Dispute)</td><td></td></tr>' : '<tr><td>Dispute Raised</td><td>'+_order.buyer+'</td><td>'+_order.disputeOpened+'</td><td>'+_order.dispute+'</td></tr>';
  if (_order.disputeResolved === "")
  {
    if (_order.disputeOpened === "")
    {_out += '<tr><td>Dispute Resolved</td><td></td><td>not in dispute</td><td></td></tr>';}
    else
    {_out += '<tr><td>Dispute Resolved</td><td></td><td>Dispute is Unresolved</td><td></td></tr>';}
  }
  else
  {_out +='<tr><td>Dispute Resolved</td><td></td><td>'+_order.disputeResolved+'</td><td>'+_order.resolve+'</td></tr>';}
  _out += (_order.orderRefunded === "") ?  '<tr><td>Refund?</td><td></td><td>(No Refund in Process)</td><td></td></tr>' : '<tr><td>Refund?</td><td></td><td>'+_order.orderRefunded+'</td><td>'+_order.refund+'</td></tr>';
  _out += (_order.approved === "") ?  '<tr><td>Payment Approved</td><td></td><td>(No Approval from Buyer)</td><td></td></tr>' : '<tr><td>Payment Approved</td><td>'+_order.buyer+'</td><td>'+_order.approved+'</td><td></td></tr>';
  _out += (_order.paid === "") ?  '<tr><td>Paid</td><td></td><td>(UnPaid)</td><td></td></tr></table></div>' : '<tr><td>Paid</td><td>'+_order.financeCo+'</td><td>'+_order.paid+'</td><td></td></tr></table></div>';
  return _out;
}
