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

// z2c-shipper.js

'use strict';

let shipperOrderDiv = 'shipperOrderDiv';

/**
 * load the shipper User Experience
 */
function loadShipperUX ()
{
    let toLoad = 'shipper.html';
    getPort();
    if (buyers.length === 0)
    { $.when($.get(toLoad), $.get('/setup/getPort'), deferredMemberLoad()).done(function (page, port, res)
    {setupShipper(page[0], port[0]);});
    }
    else{
        $.when($.get(toLoad), $.get('/setup/getPort')).done(function (page, port)
        {setupShipper(page[0], port[0]);});
    }
}
/**
 * 
 * @param {String} page - the page to load
 * @param {Integer} port - the web socket to use
 */
function setupShipper(page, port)
{
    $('#body').empty();
    $('#body').append(page);
    updatePage('shipper');
    console.log('port is: '+port.port);
    msgPort = port.port;
    wsDisplay('shipper_messages', msgPort);
    let _clear = $('#shipper_clear');
    let _list = $('#shipperOrderStatus');
    let _orderDiv = $('#'+shipperOrderDiv);
    _clear.on('click', function(){_orderDiv.empty();});
    _list.on('click', function(){listShipperOrders();});
    $('#shipper').empty();
    $('#shipper').append(sh_string);
    $('#shipperCompany').empty();
    $('#shipperCompany').append(providers[0].companyName);
    $('#shipper').on('change', function() {
        $('#shipperCompany').empty(); _orderDiv.empty(); $('#shipper_messages').empty();
        $('#shipperCompany').append(findMember($('#shipper').find(':selected').val(),shippers).companyName);
    });
}
/**
 * lists all orders for the selected shipper
 */
function listShipperOrders()
{
    let options = {};
    options.id = $('#shipper').find(':selected').val();
    options.userID = options.id;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
    {
        console.log(_results.result);
        console.log(_results.orders);
        if (_results.orders.length < 1) {$('#shipperOrderDiv').empty(); $('#shipperOrderDiv').append(formatMessage(textPrompts.orderProcess.sh_no_order_msg+options.id));}
        else{formatShipperOrders($('#shipperOrderDiv'), _results.orders)}
    });
}
/**
 * used by the listOrders() function
 * formats the orders for a shipper. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param _target - string with div id prefaced by #
 * @param _orders - array with order objects
 */
function formatShipperOrders(_target, _orders)
{
    _target.empty();
    let _str = ''; let _date = ''; let _statusText;  
    for (let each in _orders)
    {(function(_idx, _arr)
        { let _action = '<th><select id=sh_action'+_idx+'><option value="'+textPrompts.orderProcess.NoAction.select+'">'+textPrompts.orderProcess.NoAction.message+'</option>';
        _statusText = '';
        //
        // each order can have different states and the action that a shipper can take is directly dependent on the state of the order. 
        // this switch/case table displays selected order information based on its current status and displays selected actions, which
        // are limited by the sate of the order.
        //
        // Throughout this code, you will see many different objects referemced by 'textPrompts.orderProcess.(something)' 
        // These are the text strings which will be displayed in the browser and are retrieved from the prompts.json file 
        // associated with the language selected by the web user.
        //
        switch (JSON.parse(_arr[_idx].status).code)
            {
        case orderStatus.ShipRequest.code:
            _date = _arr[_idx].requestShipment;
            _action += '<option value="'+textPrompts.orderProcess.Delivering.select+'">'+textPrompts.orderProcess.Delivering.message+'</option>';
            _statusText = '<br/>'+textPrompts.orderProcess.Delivering.prompt+'<input id="delivery'+_idx+'" type="text"></input>';
            break;
        case orderStatus.Delivering.code:
            _date = _arr[_idx].delivering;
            _action += '<option value="'+textPrompts.orderProcess.Delivering.select+'">'+textPrompts.orderProcess.Delivering.message+'</option>';
            _action += '<option value="'+textPrompts.orderProcess.Delivered.select+'">'+textPrompts.orderProcess.Delivered.message+'</option>';
            _statusText = '<br/>'+textPrompts.orderProcess.Delivering.prompt+'<input id="delivery'+_idx+'" type="text"></input>';
            break;
        case orderStatus.Delivered.code:
            _date = _arr[_idx].delivered;
            _statusText = '<br/>'+textPrompts.orderProcess.Delivering.prompt+'<input id="delivery'+_idx+'" type="text"></input>';
            break;
        case orderStatus.Dispute.code:
            _date = _arr[_idx].disputeOpened+ '<br/>'+_arr[_idx].dispute;
            _action += '<option value="'+textPrompts.orderProcess.Resolve.select+'">'+textPrompts.orderProcess.Resolve.message+'</option>';
            _action += '<option value="'+textPrompts.orderProcess.Refund.select+'">'+textPrompts.orderProcess.Refund.message+'</option>';
            _statusText = '<br/>'+textPrompts.orderProcess.Delivering.prompt+'<input id="delivery'+_idx+'" type="text"></input>';
            _statusText += '<br/>'+textPrompts.orderProcess.Refund.prompt+'<input id="sh_reason'+_idx+'" type="text"></input>';
            break;
        case orderStatus.Resolve.code:
            _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
            break;
        case orderStatus.Cancelled.code:
            _date = _arr[_idx].cancelled;
            break;
        case orderStatus.Paid.code:
            _date = _arr[_idx].paid;
            break;
        default:
            console.log('OrderStatus not processed for: '+_arr[_idx].status);
            break;
        }
        let _button = '<th><button id="sh_btn_'+_idx+'">'+textPrompts.orderProcess.ex_button+'</button></th>';
        _action += '</select>';
        console.log('shipper _action: '+_action);
        if (_idx > 0) {_str += '<div class="spacer"></div>';}
        _str += '<table class="wide"><tr><th>'+textPrompts.orderProcess.orderno+'</th><th>'+textPrompts.orderProcess.status+'</th><th class="right">'+textPrompts.orderProcess.total+'</th><th colspan="3" class="right message">Buyer: '+findMember(_arr[_idx].buyer.split('#')[1],buyers).companyName+'</th></tr>';
        _str += '<tr><th id ="sh_order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+_statusText+'</th>'+_button+'</tr></table>';
        _str+= '<table class="wide"><tr align="center"><th>'+textPrompts.orderProcess.itemno+'</th><th>'+textPrompts.orderProcess.description+'</th><th>'+textPrompts.orderProcess.qty+'</th><th>'+textPrompts.orderProcess.price+'</th></tr>'
        for (let every in _arr[_idx].items)
        {(function(_idx2, _arr2)
        { let _item = JSON.parse(_arr2[_idx2]);
            _str += '<tr><td align="center">'+_item.itemNo+'</td><td>'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
        })(every, _arr[_idx].items);
        }
        console.log(_str);
        _str += '</table>';
    })(each, _orders);
    }
    _target.append(_str);
    for (let each in _orders)
        {(function(_idx, _arr)
        { $('#sh_btn_'+_idx).on('click', function ()
            {
            let options = {};
            options.action = $('#sh_action'+_idx).find(':selected').text();
            options.orderNo = $('#sh_order'+_idx).text();
            options.participant = $('#shipper').val();
            options.delivery = $('#delivery'+_idx).val();
            if ((options.action === 'Resolve') || (options.action === 'Refund')) {options.reason = $('#sh_reason'+_idx).val();}
            console.log(options);
            $('#shipper_messages').prepend(formatMessage(textPrompts.orderProcess.processing_msg.format(options.action, options.orderNo)));
            $.when($.post('/composer/client/orderAction', options)).done(function (_results)
            { console.log(_results);
                $('#shipper_messages').prepend(formatMessage(_results.result));
            });
        });
        })(each, _orders);
    }
}