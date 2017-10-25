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

// z2c-buyer.js

var orderDiv = "orderDiv";
var itemTable = {};
var newItems = [];
var totalAmount = 0;

/**
 * load the administration User Experience
 */
function loadBuyerUX ()
{
  // get the html page to load
  toLoad = "buyer.html";
  // get the port to use for web socket communications with the server
  getPort();
  // if (buyers.length === 0) then autoLoad() was not successfully run before this web app starts, so the sie of the buyer list is zero
  // assume user has run autoLoad and rebuild member list
  // if autoLoad not yet run, then member list length will still be zero
  if (buyers.length === 0) 
  { $.when($.get(toLoad), $.get('/setup/getPort'), deferredMemberLoad()).done(function (page, port, res)
  {setupBuyer(page[0], port[0]);});
}
  else{
    $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port)
    {setupBuyer(page[0], port[0]);});
  }
}

function setupBuyer(page, port)
{
  // empty the hetml element that will hold this page
  $("#body").empty();
  $("#body").append(page);
  // update the text on the page using the prompt data for the selected language

  // connect to the web socket and tell the web socket where to display messages

  // enable the buttons to process an onClick event

  // build the buer select HTML element

  // display the name of the current buyer

  // create a function to execute when the user selects a different buyer

  
}
/**
 * Displays the create order form for the selected buyer
 */

function displayOrderForm()
{  toLoad = "createOrder.html"; 
totalAmount = 0;
newItems = [];
// get the order creation web page and also get all of the items that a user can select
$.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
  { 
    itemTable = _items[0].items;
    let _orderDiv = $("#"+orderDiv);
    _orderDiv.empty();
    _orderDiv.append(page[0]);
    // update the page with the appropriate text for the selected language

    // populate the seller HTML select object. This string was built during the memberLoad or deferredMemberLoad function call

    // build a select list for the items

    // hide the submit new order function until an item has been selected

    // create a new function to create an order when the order button is clicked

    // function to call when an item has been selected

    // remove the just selected item so that it cannot be added twice. 

    // build a new item detail row in the display window

    // set the initial item count to 1

    // set the initial price to the price of one item

    // add an entry into an array for this newly added item

    // update the order amount with this new item

    // function to update item detail row and total amount if itemm count is changed
  });

  }
/**
 * lists all orders for the selected buyer
 */
function listOrders()
{
  var options = {};
  // get the users email address

  // get their password from the server. This is clearly not something we would do in production, but enables us to demo more easily

  // get their orders

  // if they have no orders, then display a message to that effect

  // if they have orders, format and display the orders. 

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
  let _str = ""; let _date = "";
  for (let each in _orders)
  {(function(_idx, _arr)
    { _action = '<th><select id=b_action'+_idx+'><option value="'+textPrompts.orderProcess.NoAction.select+'">'+textPrompts.orderProcess.NoAction.message+'</option>';
    let r_string;
    r_string = '</th>';
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
        case orderStatus.Delivered.code:

        break;
        case orderStatus.Dispute.code:

        break;
        case orderStatus.Resolve.code:

        break;
        case orderStatus.Created.code:

        break;
        case orderStatus.Backordered.code:

        break;
        case orderStatus.ShipRequest.code:

        break;
        case orderStatus.Authorize.code:

        break;
        case orderStatus.Bought.code:

        break;
        case orderStatus.Delivering.code:

        break;
        case orderStatus.Ordered.code:

        break;
        case orderStatus.Cancelled.code:

        break;
        case orderStatus.Paid.code:

        break;
        default:
        break;
      }
      _button = '<th><button id="b_btn_'+_idx+'">'+textPrompts.orderProcess.ex_button+'</button></th>'
      _action += "</select>";
      if (_idx > 0) {_str += '<div class="spacer"></div>';}
      _str += '<table class="wide"><tr><th>'+textPrompts.orderProcess.orderno+'</th><th>'+textPrompts.orderProcess.status+'</th><th class="right">'+textPrompts.orderProcess.total+'</th><th colspan="3" class="right message">'+textPrompts.orderProcess.seller+findMember(_arr[_idx].seller.split('#')[1],sellers).companyName+'</th></tr>';
      _str += '<tr><th id ="b_order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+r_string+_button+'</tr></table>';
      _str+= '<table class="wide"><tr align="center"><th>'+textPrompts.orderProcess.itemno+'</th><th>'+textPrompts.orderProcess.description+'</th><th>'+textPrompts.orderProcess.qty+'</th><th>'+textPrompts.orderProcess.price+'</th></tr>'
    for (let every in _arr[_idx].items)
    {(function(_idx2, _arr2)
      { let _item = JSON.parse(_arr2[_idx2]);
        _str += '<tr><td align="center" width="20%">'+_item.itemNo+'</td><td width="50%">'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
      })(every, _arr[_idx].items)
    }
    _str += '</table>';
    })(each, _orders)
  }
  // append the newly built order table to the web page
  _target.append(_str);
  //
  // now that the page has been placed into the browser, all of the id tags created in the previous routine can now be referenced. 
  // iterate through the page and make all of the different parts of the page active.
  //
  for (let each in _orders)
    {(function(_idx, _arr)
      { $("#b_btn_"+_idx).on('click', function () 
        {

        });
    })(each, _orders)
  }
}