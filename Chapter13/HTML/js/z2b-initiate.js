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

// z2c-initiate.js

'use strict';

let connectionProfileName = 'z2b-test-profile';
let networkFile = 'zerotoblockchain-network.bna';
let businessNetwork = 'zerotoblockchain-network';
let kube_address = '0.0.0.0';
let host_address = window.location.host;

let buyers = new Array();
let sellers= new Array();
let providers= new Array();
let shippers= new Array();

let s_string, p_string, sh_string;

let orderStatus = {
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
* standard home page initialization routine
* Refer to this by {@link initPage()}.
*/
function initPage ()
{
    $.when($.get('/composer/admin/getKubeAddress')).done(function(_addr)
    {
        kube_address = _addr;
        console.log('looking for kubernetes at: '+_addr);
        // goMultiLingual() establishes what languages are available for this web app, populates the header with available languages and sets the default language to US_English
        goMultiLingual('US_English', 'index');
        // singleUX loads the members already present in the network
        memberLoad();
        // goChainEvents creates a web socket connection with the server and initiates blockchain event monitoring
        getChainEvents();
        // get the asynch port
        wsConnect();
    });
}
