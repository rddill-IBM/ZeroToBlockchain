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

'use strict';

let orderDiv = 'orderDiv';
let itemTable = {};
let newItems = [];
let totalAmount = 0;

/**
 * load the Buyer User Experience
 */
function loadBuyerUX ()
{
    // get the html page to load
    let toLoad = 'buyer.html';
    // get the port to use for web socket communications with the server
    getPort();
    // if (buyers.length === 0) then autoLoad() was not successfully run before this web app starts, so the sie of the buyer list is zero
    // assume user has run autoLoad and rebuild member list
    // if autoLoad not yet run, then member list length will still be zero
    if ((typeof(buyers) === 'undefined') || (buyers === null) || (buyers.length === 0))
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
    $('#body').empty();
    $('#body').append(page);
    // update the text on the page using the prompt data for the selected language
    updatePage('buyer');
    msgPort = port.port;
    // connect to the web socket and tell the web socket where to display messages
    wsDisplay('buyer_messages', msgPort);
    // enable the buttons to process an onClick event
    let _create = $('#newOrder');
    let _list = $('#orderStatus');
    let _orderDiv = $('#'+orderDiv);
    _create.on('click', function(){displayOrderForm();});
    _list.on('click', function(){listOrders();});
    $('#buyer').empty();
    // build the buer select HTML element
    for (let each in buyers)
    {(function(_idx, _arr)
        {$('#buyer').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');})(each, buyers);
    }
    // display the name of the current buyer
    $('#company')[0].innerText = buyers[0].companyName;
    // create a function to execute when the user selects a different buyer
    $('#buyer').on('change', function() { _orderDiv.empty(); $('#buyer_messages').empty(); $('#company')[0].innerText = findMember($('#buyer').find(':selected').text(),buyers).companyName; });

}
/**
 * Displays the create order form for the selected buyer
 */
function displayOrderForm()
{  let toLoad = 'createOrder.html';
    totalAmount = 0;
    newItems = [];
    // get the order creation web page and also get all of the items that a user can select
    $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
    {
        itemTable = _items[0].items;
        let _orderDiv = $('#'+orderDiv);
        _orderDiv.empty();
        _orderDiv.append(page[0]);
        // update the page with the appropriate text for the selected language
        updatePage('createOrder');
        $('#seller').empty();
        // populate the seller HTML select object. This string was built during the memberLoad or deferredMemberLoad function call
        $('#seller').append(s_string);
        $('#seller').val($('#seller option:first').val());
        $('#orderNo').append('xxx');
        $('#status').append('New Order');
        $('#today').append(new Date().toISOString());
        $('#amount').append('$'+totalAmount+'.00');
        // build a select list for the items
        let _str = '';
        for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].itemDescription+'</option>'})(each, itemTable)}
        $('#items').empty();
        $('#items').append(_str);
        $('#cancelNewOrder').on('click', function (){_orderDiv.empty();});
        // hide the submit new order function until an item has been selected
        $('#submitNewOrder').hide();
        $('#submitNewOrder').on('click', function ()
            { let options = {};
            options.buyer = $('#buyer').find(':selected').val();
            options.seller = $('#seller').find(':selected').val();
            options.items = newItems;
            console.log(options);
            _orderDiv.empty(); _orderDiv.append(formatMessage(textPrompts.orderProcess.create_msg));
            $.when($.post('/composer/client/addOrder', options)).done(function(_res)
            {    _orderDiv.empty(); _orderDiv.append(formatMessage(_res.result)); console.log(_res);});
        });
        // function to call when an item has been selected
        $('#addItem').on('click', function ()
        { let _ptr = $('#items').find(':selected').val();
            // remove the just selected item so that it cannot be added twice.
            $('#items').find(':selected').remove();
            // build a new item detail row in the display window
            let _item = itemTable[_ptr];
            let len = newItems.length;
            _str = '<tr><td>'+_item.itemNo+'</td><td>'+_item.itemDescription+'</td><td><input type="number" id="count'+len+'"</td><td id="price'+len+'"></td></tr>';
            $('#itemTable').append(_str);
            // set the initial item count to 1
            $('#count'+len).val(1);
            // set the initial price to the price of one item
            $('#price'+len).append('$'+_item.unitPrice+'.00');
            // add an entry into an array for this newly added item
            let _newItem = _item;
            _newItem.extendedPrice = _item.unitPrice;
            newItems[len] = _newItem;
            newItems[len].quantity=1;
            totalAmount += _newItem.extendedPrice;
            // update the order amount with this new item
            $('#amount').empty();
            $('#amount').append('$'+totalAmount+'.00');
            // function to update item detail row and total amount if itemm count is changed
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
                $('#price'+len).empty(); $('#price'+len).append('$'+price+'.00');
            });
            $('#submitNewOrder').show();
        });
    });
}
/**
 * lists all orders for the selected buyer
 */
function listOrders()
{
    let options = {};
    // get the users email address
    options.id = $('#buyer').find(':selected').text();
    // get their password from the server. This is clearly not something we would do in production, but enables us to demo more easily
    // $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
    // {
    // get their orders
    options.userID = options.id;
    // options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
    {
        if ((typeof(_results.orders) === 'undefined') || (_results.orders === null))
        {console.log('error getting orders: ', _results);}
        else
        {// if they have no orders, then display a message to that effect
            if (_results.orders.length < 1) {$('#orderDiv').empty(); $('#orderDiv').append(formatMessage(textPrompts.orderProcess.b_no_order_msg+options.id));}
        // if they have orders, format and display the orders.
            else{formatOrders($('#orderDiv'), _results.orders);}
        }
    });
    // });
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
    let _str = ''; let _date = '';
    for (let each in _orders)
    {(function(_idx, _arr)
      {let _action = '<th><select id=b_action'+_idx+'><option value="'+textPrompts.orderProcess.NoAction.select+'">'+textPrompts.orderProcess.NoAction.message+'</option>';
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
            _date = _arr[_idx].paymentRequested;
            _action += '<option value="'+textPrompts.orderProcess.AuthorizePayment.select+'">'+textPrompts.orderProcess.AuthorizePayment.message+'</option>';
            _action += '<option value="'+textPrompts.orderProcess.Dispute.select+'">'+textPrompts.orderProcess.Dispute.message+'</option>';
            r_string = '<br/>'+textPrompts.orderProcess.Dispute.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th>';
            break;
        case orderStatus.Delivered.code:
            _date = _arr[_idx].delivered;
            _action += '<option value="'+textPrompts.orderProcess.Dispute.select+'">'+textPrompts.orderProcess.Dispute.message+'</option>';
            r_string = '<br/>'+textPrompts.orderProcess.Dispute.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th>';
            break;
        case orderStatus.Dispute.code:
            _date = _arr[_idx].disputeOpened + '<br/>'+_arr[_idx].dispute;
            _action += '<option value="'+textPrompts.orderProcess.Resolve.select+'">'+textPrompts.orderProcess.Resolve.message+'</option>';
            r_string = '<br/>'+textPrompts.orderProcess.Resolve.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th>';
            break;
        case orderStatus.Resolve.code:
            _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
            _action += '<option value="'+textPrompts.orderProcess.AuthorizePayment.select+'">'+textPrompts.orderProcess.AuthorizePayment.message+'</option>';
            break;
        case orderStatus.Created.code:
            _date = _arr[_idx].created;
            _action += '<option value="'+textPrompts.orderProcess.Purchase.select+'">'+textPrompts.orderProcess.Purchase.message+'</option>'
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>'
            break;
        case orderStatus.Backordered.code:
            _date = _arr[_idx].dateBackordered + '<br/>'+_arr[_idx].backorder;
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>'
            break;
        case orderStatus.ShipRequest.code:
            _date = _arr[_idx].requestShipment;
            break;
        case orderStatus.Authorize.code:
            _date = _arr[_idx].approved;
            break;
        case orderStatus.Bought.code:
            _date = _arr[_idx].bought;
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>'
            break;
        case orderStatus.Delivering.code:
            _date = _arr[_idx].delivering;
            break;
        case orderStatus.Ordered.code:
            _date = _arr[_idx].ordered;
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>'
            break;
        case orderStatus.Cancelled.code:
            _date = _arr[_idx].cancelled;
            break;
        case orderStatus.Paid.code:
            _date = _arr[_idx].paid;
            break;
        default:
            break;
        }
        let _button = '<th><button id="b_btn_'+_idx+'">'+textPrompts.orderProcess.ex_button+'</button></th>';
        _action += '</select>';
        if (_idx > 0) {_str += '<div class="spacer"></div>';}
        _str += '<table class="wide"><tr><th>'+textPrompts.orderProcess.orderno+'</th><th>'+textPrompts.orderProcess.status+'</th><th class="right">'+textPrompts.orderProcess.total+'</th><th colspan="3" class="right message">'+textPrompts.orderProcess.seller+findMember(_arr[_idx].seller.split('#')[1],sellers).companyName+'</th></tr>';
        _str += '<tr><th id ="b_order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+r_string+_button+'</tr></table>';
        _str+= '<table class="wide"><tr align="center"><th>'+textPrompts.orderProcess.itemno+'</th><th>'+textPrompts.orderProcess.description+'</th><th>'+textPrompts.orderProcess.qty+'</th><th>'+textPrompts.orderProcess.price+'</th></tr>'
        for (let every in _arr[_idx].items)
        {
            (function(_idx2, _arr2)
                { let _item = JSON.parse(_arr2[_idx2]);
                _str += '<tr><td align="center" width="20%">'+_item.itemNo+'</td><td width="50%">'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
            })(every, _arr[_idx].items);
        }
        _str += '</table>';
    })(each, _orders);
    }
    // append the newly built order table to the web page
    _target.append(_str);
    //
    // now that the page has been placed into the browser, all of the id tags created in the previous routine can now be referenced.
    // iterate through the page and make all of the different parts of the page active.
    //
    for (let each in _orders)
      {(function(_idx, _arr)
        { $('#b_btn_'+_idx).on('click', function ()
          {
            let options = {};
            options.action = $('#b_action'+_idx).find(':selected').text();
            options.orderNo = $('#b_order'+_idx).text();
            options.participant = $('#buyer').val();
            if ((options.action === 'Dispute') || (options.action === 'Resolve'))  {options.reason = $('#b_reason'+_idx).val();}
            $('#buyer_messages').prepend(formatMessage(options.action+textPrompts.orderProcess.processing_msg.format(options.action, options.orderNo)+options.orderNo));
            $.when($.post('/composer/client/orderAction', options)).done(function (_results)
            { $('#buyer_messages').prepend(formatMessage(_results.result)); });
        });
      })(each, _orders)
    }
}