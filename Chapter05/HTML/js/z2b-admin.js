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

// z2b-admin.js

'use strict';

let creds;
let connection;
let msgPort = null;
let _blctr = 0;

/**
 * load the administration User Experience
 */
function loadAdminUX ()
{
    let toLoad = 'admin.html';
    $.when($.get(toLoad)).done(function (page)
        {$('#body').empty();
        $('#body').append(page);
        updatePage('admin');
        listMemRegistries();
    });
}
/**
 * connect to the provided web socket
 * @param {String} _target - location to post messages
 * @param {Integer} _port - web socket port #
 */
function wsDisplay(_target, _port)
{
    let content = $('#'+_target);
    let wsSocket = new WebSocket('ws://localhost:'+_port);
    wsSocket.onopen = function () {wsSocket.send('connected to client');};
    wsSocket.onmessage = function (message) {content.append(formatMessage(message.data));};
    wsSocket.onerror = function (error) {console.log('WebSocket error on wsSocket: ' + error);};
}
/**
 * list the available business networks
 */
function adminList()
{
    let _url = '/composer/admin/listAsAdmin';
    $.when($.get(_url)).done(function (_connection)
    { let _str = '<h3>Current Active Business Networks</h3><ul>';
        for (let each in _connection)
        {(function(_idx, _arr){_str += '<li>'+_arr[_idx]+'</li>';})(each, _connection);}
        _str+='</ul>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * load the entry form for a connection profile
 */
function displayProfileForm ()
{
    let toLoad = 'createConnectionProfile.html';
    $.when($.get(toLoad)).done(function (page)
        {$('#admin-forms').empty();
        $('#admin-forms').append(page);
        updatePage('createConnectionProfile');
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){let _vals = getConnectForm(); createConnection(_vals);});
    });
}

/**
 * get the data from the network connection form.
 * @returns {JSON} - JSON object with connection data;
 */
function getConnectForm ()
{
    let fields = ['fabric_type', 'orderers_url', 'ca_url', 'ca_name', 'peers_eventURL', 'peers_requestURL', 'keyValStore', 'channel', 'mspID', 'timeout'];
    let res = {};

    res.profileName = $('#profileName').val();
    for (let each in fields)
        {(function (_idx, _arr){
            if (_arr[_idx] === 'fabric_type') {res['type'] = $('#'+_arr[_idx]).val();}
            else
            { let parts = _arr[_idx].split('_');
                if (parts.length === 1) {res[_arr[_idx]] = $('#'+_arr[_idx]).val();}
                if (typeof(res[parts[0]]) === 'undefined') {res[parts[0]]={};}
                res[parts[0]][parts[1]] = $('#'+_arr[_idx]).val();
            }
        })(each, fields); }
    return res;
}

/**
 * test creating a network connection
 * @param {Form} _form - Data from the form used to populate a hyperledger fabric V1 network connection.
 */
function createConnection (_form)
{
    console.log(_form);
    $.when($.post('/composer/admin/createProfile', _form)).done(function(_results)
    {
        let _str = '';
        _str +='<h2>network profile creation request</h2>';
        _str += '<h4>Creation request results: '+_results.profile+'</h4>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * get all network connection profiles
 */
function getProfiles()
{
    $.when($.get('/composer/admin/getAllProfiles')).done(function (_profiles)
    {
        let _str = '';
        // list cert URL & cert path
        _str +='<h3>network connection profile list request</h3>';
        _str += '<ul>';
        for (let each in _profiles) {_str += displayProfile(_profiles[each], each);}
        _str += '</ul>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);

    });
}

/**
 * gather and list all of the current network connection profiles
 * @param {integer} - _state is a switch, if it === 0 (zero) then display the deleteConnection button, else hide that button.
 * This allows the same routine to be used for display or delete processing
 */
function listProfiles(_state)
{
    $.when($.get('/composer/admin/getAllProfiles'), $.get('deleteConnectionProfile.html')).done(function (_profiles, page)
    {
        $('#admin-forms').empty();
        $('#admin-forms').append(page);
        updatePage('deleteConnectionProfile');
        $('#connection_profiles').on('change',function()
        { let name = $('#connection_profiles').find(':selected').text();
            let profile = connection_profiles[name];
            let _str = displayProfile(profile,name);
            $('#selected_profile').empty();
            $('#selected_profile').append(_str);
        });
        let connection_profiles = _profiles[0];
        for (let each in connection_profiles)
        { (function (_idx, _arr)
            { $('#connection_profiles').append('<option value="'+_idx+'">' +_idx+'</option>'); })(each, connection_profiles); }
        let first = $('#connection_profiles').find(':first').text();
        let _str = displayProfile(connection_profiles[first],first);
        $('#selected_profile').empty();
        $('#selected_profile').append(_str);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        if (_state === 0)
        {_submit.on('click', function(){deleteConnectionProfile($('#connection_profiles').find(':selected').text());});}
        else
        {_submit.hide();}
    });
}

/**
 * deploy a new network
 */
function networkDeploy()
{
    let options = {};
    options.myArchive = networkFile;
    $.when($.post('/composer/admin/deploy', options)).done(function (_results)
    { let _str = '';
        _str +='<h2>network deploy request for '+networkFile+'</h2>';
        _str += '<h4>Network deploy results: '+_results.deploy+'</h4>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * install a new network
 */
function networkInstall()
{
    let options = {};
    options.myArchive = networkFile;
    $.when($.post('/composer/admin/install', options)).done(function (_results)
    { let _str = '';
        _str +='<h2>network install request for '+networkFile+'</h2>';
        _str += '<h4>Network install results: '+_results.install+'</h4>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * start an installed network
 */
function networkStart()
{
    let options = {};
    options.myArchive = networkName;
    $.when($.post('/composer/admin/start', options)).done(function (_results)
    { let _str = '';
        _str +='<h2>network start request for '+networkName+'</h2>';
        _str += '<h4>Network start results: '+_results.start+'</h4>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * delete a connection profile
 * @param {String} _name - a string containing the name of the network connection profile to be deleted
 */
function deleteConnectionProfile(_name)
{
    let options = {};
    options.profileName = _name;
    if (confirm('Are you sure you want to delete the '+_name+' profile?') === true)
    {
        $.when($.post('/composer/admin/deleteProfile', options)).done(function(_results)
        {
            let _str = '';
            _str +='<h2>network profile delete request for '+_name+'</h2>';
            _str += '<h4>Profile delete request results: '+_results.profile+'</h4>';
            $('#admin-forms').empty();
            $('#admin-forms').append(_str);
        });
    } else
    {
        $('#message').empty();
        $('#message').append('request cancelled');
    }
}

/**
 * ping a network, check for compatibility
 */
function ping()
{
    let options = {}; options.businessNetwork = businessNetwork;
    $.when($.post('/composer/admin/ping', options)).done(function (_results)
    {
        let _str = '';
        _str +='<h2>network ping request to '+businessNetwork+'</h2>';
        _str += '<h4>Ping request results: '+'</h4><table width="90%"><tr><th>Item</th><th width="65%">Value</th></tr>';
        for (let each in _results.ping){(function(_idx, _arr){_str+='<tr><td>'+_idx+'</td><td>'+_arr[_idx]+'</td></tr>';})(each, _results.ping);}
        _str+='</table>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * take down a business network
 */
function networkUndeploy()
{
    let options = {};
    options.businessNetwork = businessNetwork;
    if (confirm('Are you sure you want to undeploy the '+businessNetwork+' business network?') === true)
    {
        $.when($.post('/composer/admin/undeploy', options)).done(function(_results)
        {
            let _str = '';
            _str +='<h2>Network undeploy request for '+businessNetwork+'</h2>';
            _str += '<h4>Network Undeploy request results: '+_results.undeploy+'</h4>';
            $('#admin-forms').empty();
            $('#admin-forms').append(_str);
        });
    } else
    {
        $('#message').empty();
        $('#message').append('undeploy request cancelled');
    }
}

/**
 * update an existing network
 */
function networkUpdate()
{
    let options = {};
    options.myArchive = networkFile;
    $.when($.post('/composer/admin/update', options)).done(function (_results)
    { let _str = '';
        _str +='<h2>network update request for '+networkFile+'</h2>';
        _str += '<h4>Network update results: '+_results.update+'</h4>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * display a network profile
 * @param {JSON} _profile - profile object
 * @param {String} _name - name of profile to display
 * @returns {String} - html to be appended to current object
 */
function displayProfile(_profile, _name)
{
    let _str = '';
    _str += '<h4>'+_name+'</h4>';
    _str +='<table>';
    for (let item in _profile)
        {(function(_item, _obj){
            switch (_item)
            {
            case 'orderers':
                for (let subItem in _obj[_item])
                    {(function(_subItem, __obj)
                    {_str+='<tr><td>'+_item+'</td><td>url</td><td>'+__obj[_subItem].url+'</td></tr>';
                    })(subItem, _obj[_item]);
                }
                break;
            case 'peers':
                for (let subItem in _obj[_item])
                    {(function(_subItem, __obj)
                    {_str+='<tr><td>'+_item+'</td><td>eventURL</td><td>'+__obj[_subItem].eventURL+'</td></tr>';
                        _str+='<tr><td>'+_item+'</td><td>requestURL</td><td>'+__obj[_subItem].requestURL+'</td></tr>';
                    })(subItem, _obj[_item]);
                }
                break;
            case 'ca':
                for (let subItem in _obj[_item])
                    {(function(_subItem, __obj)
                    {_str+='<tr><td>'+_item+'</td><td>'+_subItem+'</td><td>'+__obj[_subItem]+'</td></tr>';
                    })(subItem, _obj[_item]);
                }
                break;
            default:
                _str+='<tr><td>'+_item+'</td><td>'+_obj[_item]+'</td></tr>';
            }
        })(item, _profile);
    }
    _str +='</table>';
    return _str;
}

/**
 * pre-load network from startup folder contents
 */
function preLoad()
{
    $('#body').empty();
    let options = {};
    $.when($.post('/setup/autoLoad', options)).done(function (_results)
    { msgPort = _results.port; wsDisplay('body', msgPort); });
}

/**
 * get member registries
 */
function listMemRegistries()
{
    $.when($.get('/composer/admin/getRegistries')).done(function (_results)
    {
        $('#registryName').empty();
        let _str = '';
        _str +='<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        _str += '<ul>';
        for (let each in _results.registries)
        {(function(_idx, _arr){
            _str += '<li>'+_arr[_idx]+'</li>';
            $('#registryName').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
            $('#registryName2').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
            $('#registryName3').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
            $('#registryName4').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
            $('#registryName5').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
        })(each, _results.registries);}
        _str += '</ul>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}
/**
 * get member in a registry
 */
function listRegistry()
{
    let options = {};
    options.registry = $('#registryName').find(':selected').text();
    $.when($.post('/composer/admin/getMembers', options)).done(function (_results)
    {
        let _str = '';
        _str +='<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        _str += '<table width="100%"><tr><th>Type</th><th>Company</th><th>email</th></tr>';
        for (let each in _results.members)
        {(function(_idx, _arr){
            _str += '<tr><td>'+_arr[_idx].type+'</td><td>'+_arr[_idx].companyName+'</td><td>'+_arr[_idx].id+'</td></tr>';
        })(each, _results.members);}
        _str += '</ul>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}
/**
 * check if member already has a card
 */
function checkCard()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName3').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members);
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            $('#messages').append(formatMessage('starting check member id request.'));
            $.when($.post('/composer/admin/checkCard', options)).done(function (_results)
                { let _msg = ((_results.result === 'success') ? _results.card : _results.message);
                $('#messages').append(formatMessage(_msg));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });
}
/**
 * issue Identity for a member
 */
function issueIdentity()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName4').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members);
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            options.type = $('#member_type').text();
            console.log(options);
            $('#messages').append(formatMessage('starting issue identity request.'));
            $.when($.post('/composer/admin/issueIdentity', options)).done(function (_results)
                { let _msg = ((_results.result === 'success') ? 'user id: '+_results.userID+'<br/>secret: '+_results.secret : _results.message);
                $('#messages').append(formatMessage(_msg));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });
}
/**
 * create an access card for a member
 */
function createCard()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName5').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members);
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.secret = $('#secret').val();            
            options.id = $('#member_list').find(':selected').text();
            console.log(options);
            $('#messages').append(formatMessage('starting member card creation request.'));
            $.when($.post('/composer/admin/createCard', options)).done(function (_results)
                { let _msg = ((_results.result === 'success') ? _results.card : _results.message);
                $('#messages').append(formatMessage(_msg));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });
}
/**
 * get asset list
 */
function listAssets()
{
    let options = {};
    options.registry = 'Order';
    options.type='admin';
    $.when($.post('/composer/admin/getAssets', options)).done(function (_results)
    {
        let _str = '';
        _str +='<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        if (_results.result === 'success')
        {
            _str += '<table width="100%"><tr><th>Order Number</th><th>Created</th><th>Status</th><th>Buyer/Seller</th><th>Amount</th></tr>';
            for (let each in _results.orders)
            {(function(_idx, _arr){
                _str += '<tr><td align="center">'+_arr[_idx].id+'</td><td>'+_arr[_idx].created+'</td><td>'+JSON.parse(_arr[_idx].status).text+'</td><td>'+_arr[_idx].buyer+'<br/>'+_arr[_idx].seller+'</td><td align="right">$'+_arr[_idx].amount+'.00</td></tr>';
            })(each, _results.orders);}
            _str += '</ul>';
        } else {_str += '<br/>'+_results.error;}
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}
/**
 * add a member to a registry
 */
function addMember()
{
    $.when($.get('createMember.html')).done(function (_page)
    {
        $('#admin-forms').empty();
        $('#admin-forms').append(_page);
        updatePage('createMember');
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        $('#messages').empty();
        $('#messages').append('<br/>Please fill in add member form.');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            $('#messages').append('<br/>starting add member request.');
            let options = {};
            options.companyName = $('#companyName').val();
            options.id = $('#participant_id').val();
            options.type = $('#member_type').find(':selected').text();
            $.when($.post('/composer/admin/addMember', options)).done(function(_res)
            { $('#messages').append(formatMessage(_res)); });
        });
    });
}
/**
 * remove a member from a registry
 */
function removeMember()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName2').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members)
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            $('#member_list').find(':selected').remove();
            $('#messages').append(formatMessage('starting delete member request.'));
            $.when($.post('/composer/admin/removeMember', options)).done(function (_results)
                { $('#messages').append(formatMessage(_results));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });

}

/**
 * retrieve member secret
 */
function getSecret()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName3').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append('<br/>Getting Member List for '+options.registry+'.');
    $.when($.post('/composer/admin/getMembers', options),$.get('getMemberSecret.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        updatePage('getMemberSecret');
        $('#member_type').append(options.registry);
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members)
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            $('#messages').append(formatMessage('getting member secret.'));
            $.when($.post('/composer/admin/getSecret', options)).done(function (_results)
                {
                $('#secret').empty(); $('#secret').append(_results.secret);
                $('#userID').empty(); $('#userID').append(_results.userID);
                $('#messages').append(formatMessage(_results));
            });
        });
        $('#member_list').on('change',function()
        { let id = $('#member_list').find(':selected').text();
        displayMember(id, member_list);
        });
    });

}

/**
 * display member information using the provided id and table
 * @param {String} id - string with member id
 * @param {JSON} _list - array of JSON member objects
 */
function displayMember(id, _list)
{
    let member = findMember(id, _list);
    $('#companyName').empty();
    $('#companyName').append(member.companyName);
    $('#participant_id').empty();
    $('#participant_id').append(member.id);
}

/**
 * find the member identified by _id in the array of JSON objects identified by _list
 * @param {String} _id - string with member id
 * @param {JSON} _list - array of JSON member objects
 * @returns {JSON} - {'id': Member ID, 'companyName': 'not found ... or company name if found'}
 */
function findMember(_id, _list)
{
    let _mem = {'id': _id, 'companyName': 'not found'};
    for (let each in _list){(function(_idx, _arr)
    {
        if (_arr[_idx].id === _id)
        {_mem = _arr[_idx]; }
    })(each, _list);}
    return(_mem);
}

/**
 * get blockchain info
 */
function getChainInfo()
{
    $.when($.get('fabric/getChainInfo')).done(function(_res)
    { let _str = '<h2> Get Chain Info: '+_res.result+'</h2>';
        if (_res.result === 'success')
            {_str += 'Current Hash: '+formatMessage(_res.currentHash);
            _str+= '<ul><li>High: '+_res.blockchain.height.high+'</li><li>Low: '+_res.blockchain.height.low+'</li></ul>';}
        else
            {_str += formatMessage(_res.message);}
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * get History
 */
function getHistorian()
{
    $.when($.get('fabric/getHistory')).done(function(_res)
    { let _str = '<h2> Get History Records: '+_res.result+'</h2>';
        if (_res.result === 'success')
            {_str += 'Current length: '+formatMessage(_res.history.length);
            _str += '<table><tr><th>Transaction ID</th><th>Transaction Type</th><th>TimeStamp</th></tr>';
            _res.history.sort(function(a,b){return (b.transactionTimestamp > a.transactionTimestamp) ? -1 : 1;});
            for (let each in _res.history)
            {(function(_idx, _arr){
                let _row = _arr[_idx];
                _str += '<tr><td>'+_row.transactionId+'</td><td>'+_row.transactionType+'</td><td>'+_row.transactionTimestamp+'</td></tr>';
            })(each, _res.history);
            }
            _str +='</table>';
        }
        else
            {_str += formatMessage(_res.message);}
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * display blockchain updates
 */
function getChainEvents()
{
    $.when($.get('fabric/getChainEvents')).done(function(_res)
    { let _str = '<h2> Get Chain events requested. Sending to port: '+_res.port+'</h2>';
        let content = $('#blockchain');
        let csSocket = new WebSocket('ws://localhost:'+_res.port);
        csSocket.onopen = function () {csSocket.send('connected to client');};
        csSocket.onmessage = function (message) {
            _blctr ++;
            if (message.data !== 'connected')
            {$(content).append('<span class="block">block '+JSON.parse(message.data).header.number+'<br/>Hash: '+JSON.parse(message.data).header.data_hash+'</span>');
                if (_blctr > 4) {let leftPos = $(content).scrollLeft(); $(content).animate({scrollLeft: leftPos + 300}, 250);}
            }
        };
        csSocket.onerror = function (error) {console.log('WebSocket error: ' + error);};
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}
/**
 * display blockchain updates
 */
function displayAdminUpdate()
{
    let toLoad = 'adminHelp.html';
    $.when($.get(toLoad)).done(function(_page){$('#admin-forms').empty(); $('#admin-forms').append(_page);});
}