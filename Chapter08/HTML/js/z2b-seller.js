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

// z2c-admin.js

var creds;
var connection;
var connectionProfileName = "z2b-test-profile";
var networkFile = "zerotoblockchain-network.bna"
var businessNetwork = "zerotoblockchain-network";
var buyers; var sellers; var providers; var p_string;
var sellerOrderDiv = "sellerOrderDiv";
var itemTable = {};
var sellerTable = {};
var newItems = [];
var totalAmount = 0;

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
function loadSellerUX ()
{
  toLoad = "seller.html";
  getPort();
  $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port)
    {$("#body").empty();
    $("#body").append(page[0]);
    console.log('port is: '+port[0].port);
    msgPort = port[0].port;
    wsDisplay('seller_messages', msgPort);
    var _clear = $("#clear");
    var _list = $("#sellerOrderStatus");
    var _orderDiv = $("#"+sellerOrderDiv);
    _clear.on('click', function(){_orderDiv.empty();});
    _list.on('click', function(){listSellerOrders()});
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
        $("#seller").empty();
        for (each in sellers)
        {(function(_idx, _arr){
          $("#seller").append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].companyName+'</option>');;
        })(each, sellers)}
        p_string = '';
        for (each in providers)
        {(function(_idx, _arr){if (_arr[_idx].id != 'noop@dummy')
          {p_string +='<option value="'+_arr[_idx].id+'">' +_arr[_idx].companyName+'</option>';}
        })(each, providers)}
        p_string += '</select>';
        $("#sellerCompany").empty();
        $("#sellerCompany").append(sellers[0].companyName);
        $("#seller").on('change', function() { 
          $("#sellerCompany").empty(); _orderDiv.empty(); $("#seller_messages").empty();
          $("#sellerCompany").append(findMember($("#seller").find(":selected").val(),sellers).companyName);
        });
        });
    });
}
/**
 * lists all orders for the selected seller
 */
function listSellerOrders()
{
  var options = {};
  options.id = $("#seller").find(":selected").val();
  $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
  {
    console.log(_mem);
    options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
      {
        console.log(_results.result);
        console.log(_results.orders);
        if (_results.orders.length < 1) {$("#sellerOrderDiv").empty(); $("#sellerOrderDiv").append(formatMessage('No orders for this seller: '+options.id));}
        else{formatSellerOrders($("#sellerOrderDiv"), _results.orders)}
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
function formatSellerOrders(_target, _orders)
{
  _target.empty();
  let _str = ""; let _date = "";
  for (let each in _orders)
  {(function(_idx, _arr)
    { _action = '<th><select id=action'+_idx+'><option value="NoAction">No Action</option>';
      switch (JSON.parse(_arr[_idx].status).code)
      {
        case orderStatus.PayRequest.code:
        _date = _arr[_idx].paymentRequested;
        break;
        case orderStatus.Bought.code:
        _date = _arr[_idx].bought;
        _action += '<option value="Order">Order From Supplier</option>';
        break;
        case orderStatus.Delivered.code:
        _date = _arr[_idx].delivered;
        _action += '<option value="PayRequest">Request Payment</option>';
        break;
        case orderStatus.ShipRequest.code:
        _date = _arr[_idx].requestShipment;
        break;
        case orderStatus.Delivering.code:
        _date = _arr[_idx].delivering;
        break;
        case orderStatus.Ordered.code:
        _date = _arr[_idx].ordered;
        break;
        case orderStatus.Backordered.code:
        _date = _arr[_idx].dateBackordered + '<br/>'+_arr[_idx].backorder;
        break;
        case orderStatus.Dispute.code:
        _date = _arr[_idx].disputeOpened + '<br/>'+_arr[_idx].dispute;
        _action += '<option value="Resolve">Resolve</option>'
        _action += '<option value="Refund">Refund</option>'
        p_string += '<br/>Reason to Resolve or Refund: <input id="reason'+_idx+'" type="text"></input>';
        break;
        case orderStatus.Resolve.code:
        _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
        _action += '<option value="PayRequest">Request Payment</option>';
        break;
        default:
        break;
      }
      _button = '<th><button id="btn_'+_idx+'">Execute</button></th>'
      _action += "</select>";
      if (_idx > 0) {_str += '<div class="spacer"></div>';}
      _str += '<table class="wide"><tr><th>Order #</th><th>Status</th><th class="right">Total</th><th colspan="3" class="right message">Buyer: '+findMember(_arr[_idx].buyer,buyers).companyName+'</th></tr>';
      _str += '<tr><th id ="order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+'<br/><select id="providers'+_idx+'">'+p_string+'</th>'+_button+'</tr></table>';
      _str+= '<table class="wide"><tr align="center"><th>Item Number</th><th>Description</th><th>Quantity</th><th>Price</th></tr>'
    for (let every in _arr[_idx].items)
    {(function(_idx2, _arr2)
      { let _item = JSON.parse(_arr2[_idx2]);
        _str += '<tr><td align="center">'+_item.itemNo+'</td><td>'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
      })(every, _arr[_idx].items)
    }
    _str += '</table>';
  })(each, _orders)
  }
  _target.append(_str);
  for (let each in _orders)
    {(function(_idx, _arr)
      { $("#btn_"+_idx).on('click', function () 
        {
          var options = {};
          options.action = $("#action"+_idx).find(":selected").text();
          options.orderNo = $("#order"+_idx).text();
          options.participant = $("#seller").val();
          options.provider = $("#providers"+_idx).find(":selected").val();
          if ((options.action == 'Resolve') || (options.action == 'Refund')) {options.reason = $("#reason"+_idx).val();}
          console.log(options);
          $("#seller_messages").prepend(formatMessage('Processing '+options.action+' request for order number: '+options.orderNo));
          $.when($.post('/composer/client/orderAction', options)).done(function (_results)
          { console.log(_results);
            $("#seller_messages").prepend(formatMessage(_results.result));
          });
      });
    })(each, _orders)
  }
}