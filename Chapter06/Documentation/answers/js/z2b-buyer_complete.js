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
var members;
var orderDiv = "orderDiv";
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
  Authorize: {code: 11, text: 'Payment Apporoved'},
  Paid: {code: 14, text: 'Payment Processed'},
  Refund: {code: 12, text: 'Order Refund Requested'},
  Refunded: {code: 13, text: 'Order Refunded'}
};

/**
 * load the administration User Experience
 */
function loadBuyerUX ()
{
  toLoad = "buyer.html";
  $.when($.get(toLoad)).done(function (page)
    {$("#body").empty();
    $("#body").append(page);
    var _create = $("#newOrder");
    var _list = $("#orderStatus");
    var _orderDiv = $("#"+orderDiv);
    _create.on('click', function(){displayOrderForm();});
    _list.on('click', function(){listOrders()});
    var options = {};
    options.registry = 'Buyer';
    $.when($.post('/composer/admin/getMembers', options)).done(function (_results)
      { console.log(_results);
        members = _results.members;
        $("#buyer").empty();
        for (each in members)
          {(function(_idx, _arr){
            $("#buyer").append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');;
          })(each, members)}
        $("#company")[0].innerText = members[0].companyName;
        $("#buyer").on('change', function() { $("#company")[0].innerText = findMember($("#buyer").find(":selected").text(),members).companyName; });
      });
    });
}
/**
 * Displays the create order form for the selected buyer
 */

function displayOrderForm()
{  toLoad = "createOrder.html"; var options={}; options.registry="Seller";
totalAmount = 0;
newItems = [];
$.when($.get(toLoad), $.get('/composer/client/getItemTable'), $.post('/composer/admin/getMembers', options)).done(function (page, _items, _sellers)
  {  sellerTable = _sellers[0].members;
    itemTable = _items[0].items;
    let _orderDiv = $("#"+orderDiv);
    _orderDiv.empty();
    _orderDiv.append(page[0]);
    let _str = "";
    for (let each in sellerTable){(function(_idx, _arr){_str+='<option value="'+_arr[_idx].id+'">'+_arr[_idx].companyName+'</option>'})(each, sellerTable)}
    $('#seller').empty();
    $('#seller').append(_str);
    $('#seller').val($("#seller option:first").val());
    $('#orderNo').append('xxx');
    $('#status').append('New Order');
    $('#today').append(new Date().toISOString());
    $('#amount').append('$'+totalAmount+'.00');
    _str = "";
    for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].itemDescription+'</option>'})(each, itemTable)}
    $('#items').empty();
    $('#items').append(_str);
    $('#cancelNewOrder').on('click', function (){_orderDiv.empty();});
    $('#submitNewOrder').hide();
    $('#submitNewOrder').on('click', function ()
      { let options = {};
        options.buyer = $("#buyer").find(":selected").val();
        options.seller = $("#seller").find(":selected").val();
        console.log('options.seller', options.seller);
        options.items = newItems;
        _orderDiv.empty(); _orderDiv.append('Processing Create Order request');
        $.when($.post('/composer/client/addOrder', options)).done(function(_res)
        {    _orderDiv.empty(); _orderDiv.append(_res.results); console.log(_res);});
      });
    $('#addItem').on('click', function ()
    { let _ptr = $("#items").find(":selected").val();
      let _item = itemTable[_ptr];
      let len = newItems.length;
      _str = '<tr><td>'+_item.itemNo+'</td><td>'+_item.itemDescription+'</td><td><input type="number" id="count'+len+'"</td><td id="price'+len+'"></td></tr>'
      $('#itemTable').append(_str);
      console.log(_str);
      $('#count'+len).val(1);
      $('#price'+len).append("$"+_item.unitPrice+".00");
      let _newItem = _item;
      _newItem.extendedPrice = _item.unitPrice;
      newItems[len] = _newItem;
      newItems[len].quantity=1;
      totalAmount += _newItem.extendedPrice;
      $('#amount').empty();
      $('#amount').append('$'+totalAmount+'.00');
      $('#count'+len).on('change', function ()
      {let len = this.id.substring(5);
        let qty = $('#count'+len).val();
        let price = newItems[len].unitPrice*qty; 
        let delta = price - newItems[len].extendedPrice;
        totalAmount += delta;
        $('#amount').empty();
        $('#amount').append('$'+totalAmount+'.00');
        newItems[len].extendedPrice = price; 
        newItems[len].quantity=qty;
        $('#price'+len).empty(); $('#price'+len).append("$"+price+".00");
      });
      $('#submitNewOrder').show();
      });
      console.log(_items[0]); console.log(_sellers[0]);
  });
}
/**
 * lists all orders for the selected buyer
 */
function listOrders()
{
  var options = {};
  options.id = $("#buyer").find(":selected").text();
  $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
  {
    options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
      {
        console.log(_results.result);
        console.log(_results.orders);
        if (_results.orders.length < 1) {$("#orderDiv").empty(); $("#orderDiv").append('No orders for this buyer: '+options.id);}
        else{formatOrders($("#orderDiv"), _results.orders)}
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
function formatOrders(_target, _orders)
{
  _target.empty();
  _str = '<table><tr><th>Order #</th><th>Items</th><th>Total</th></tr>';
  for (let each in _orders)
  {(function(_idx, _arr)
    { _action = '<th><select id=action'+_idx+'><option value="NoAction">No Action</option>';
      switch (JSON.parse(_arr[_idx].status).text)
      {
        case orderStatus.PayRequest.text:
        _action += '<option value="Pay">Pay</option>';
        case orderStatus.Delivered.text:
        _action += '<option value="Dispute">Dispute</option>';
        break;
        case orderStatus.Created.text:
        _action += '<option value="Purchase">Purchase</option>'
        case orderStatus.Bought.text:
        case orderStatus.Ordered.text:
        _action += '<option value="Cancel">Cancel</option>'
        break;
        default:
        break;
      }
      _button = '<th><button id="btn_'+_idx+'">Execute</button></th>'
      _action += "</select></th>";
      _str += '<tr><th id ="order'+_idx+'">'+_arr[_idx].id+'</th><th>Status: '+JSON.parse(_arr[_idx].status).text+'</th><th>$'+_arr[_idx].amount+'.00</th>'+_action+_button+'</tr><tr><td><tbody>';
      _str+= '<tr align="center"><td>Item Number</td><td>Description</td><td>Quantity</td><td>Price</td></tr>'
    for (let every in _arr[_idx].items)
    {(function(_idx2, _arr2)
      { let _item = JSON.parse(_arr2[_idx2]);
        _str += '<tr><td align="center">'+_item.itemNo+'</td><td>'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
      })(every, _arr[_idx].items)
    }
    _str += '</tbody></td></tr>';
    })(each, _orders)
  }
  _str += '</table>';
  _target.append(_str);
  for (let each in _orders)
    {(function(_idx, _arr)
      { $("#btn_"+_idx).on('click', function () 
        {
          var options = {};
          options.action = $("#action"+_idx).find(":selected").text();
          options.orderNo = $("#order"+_idx).text();
          options.buyer = $("#buyer").val();
          console.log(options);
          $.when($.post('/composer/client/orderAction', options)).done(function (_results)
          { console.log(_results);
            $("#messages").append(_results.result);
          });
      });
    })(each, _orders)
  }
}