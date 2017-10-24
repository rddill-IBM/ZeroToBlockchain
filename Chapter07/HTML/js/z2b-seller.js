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

// z2c-seller.js
var sellerOrderDiv = "sellerOrderDiv";

/**
 * load the seller User Experience
 */
function loadSellerUX ()
{
  toLoad = "seller.html";
  getPort();
  if (buyers.length === 0) 
  { $.when($.get(toLoad), $.get('/setup/getPort'), deferredSingleUX()).done(function (page, port, res)
  {setupSeller(page[0], port[0]);});
}
  else{
    $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port)
    {setupSeller(page[0], port[0]);});
  }
}

function setupSeller(page, port)
{
  $("#body").empty();
  $("#body").append(page);
  updatePage("seller");
  msgPort = port.port;
  wsDisplay('seller_messages', msgPort);

  //
  // this section changes from the previous chapter, buyer changing to seller
  //

}
/**
 * lists all orders for the selected seller
 */
function listSellerOrders()
{
  var options = {};
  //
  // seller instead of buyer
  //
  options.id = $("#seller").find(":selected").val();
  $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
  {
    options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
      {
        if (_results.orders.length < 1) {$("#sellerOrderDiv").empty(); $("#sellerOrderDiv").append(formatMessage(textPrompts.orderProcess.s_no_order_msg+options.id));}
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
    { _action = '<th><select id=s_action'+_idx+'><option value="'+textPrompts.orderProcess.NoAction.select+'">'+textPrompts.orderProcess.NoAction.message+'</option>';
//
// each order can have different states and the action that a buyer can take is directly dependent on the state of the order. 
// this switch/case table displays selected order information based on its current status and displays selected actions, which
// are limited by the sate of the order.
//
// Throughout this code, you will see many different objects referemced by 'textPrompts.orderProcess.(something)' 
// These are the text strings which will be displayed in the browser and are retrieved from the prompts.json file 
// associated with the language selected by the web user.
//
switch (JSON.parse(_arr[_idx].status).code)
      {
        case orderStatus.PayRequest.code:

        break;
        case orderStatus.Bought.code:

        break;
        case orderStatus.Delivered.code:

        break;
        case orderStatus.ShipRequest.code:

        break;
        case orderStatus.Delivering.code:

        break;
        case orderStatus.Ordered.code:

        break;
        case orderStatus.Backordered.code:

        break;
        case orderStatus.Dispute.code:

        break;
        case orderStatus.Resolve.code:

        break;
        case orderStatus.Cancelled.code:

        break;
        case orderStatus.Paid.code:

        break;
        default:
          break;
      }
      _button = '<th><button id="s_btn_'+_idx+'">'+textPrompts.orderProcess.ex_button+'</button></th>'
      _action += "</select>";
      if (_idx > 0) {_str += '<div class="spacer"></div>';}
      _str += '<table class="wide"><tr><th>'+textPrompts.orderProcess.orderno+'</th><th>'+textPrompts.orderProcess.status+'</th><th class="right">'+textPrompts.orderProcess.total+'</th><th colspan="3" class="right message">'+textPrompts.orderProcess.buyer+findMember(_arr[_idx].buyer.split('#')[1],buyers).companyName+'</th></tr>';
      _str += '<tr><th id ="s_order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+'<br/><select id="providers'+_idx+'">'+p_string+'</th>'+_button+'</tr></table>';
      _str+= '<table class="wide"><tr align="center"><th>'+textPrompts.orderProcess.itemno+'</th><th>'+textPrompts.orderProcess.description+'</th><th>'+textPrompts.orderProcess.qty+'</th><th>'+textPrompts.orderProcess.price+'</th></tr>'
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
      { $("#s_btn_"+_idx).on('click', function () 
        {
          var options = {};
          options.action = $("#s_action"+_idx).find(":selected").text();
          options.orderNo = $("#s_order"+_idx).text();
          options.participant = $("#seller").val();
          options.provider = $("#providers"+_idx).find(":selected").val();
          if ((options.action == 'Resolve') || (options.action == 'Refund')) {options.reason = $("#s_reason"+_idx).val();}
          $("#seller_messages").prepend(formatMessage(options.action+textPrompts.orderProcess.processing_msg.format(options.action, options.orderNo)+options.orderNo));
          $.when($.post('/composer/client/orderAction', options)).done(function (_results)
          { $("#seller_messages").prepend(formatMessage(_results.result)); });
      });
    })(each, _orders)
  }
}