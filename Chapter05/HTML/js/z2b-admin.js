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

var creds;
var connection;
var connectionProfileName = 'z2b-test-profile';
var networkFile = 'zerotoblockchain-network.bna'
var businessNetwork = 'zerotoblockchain-network';
var msgPort = null;
var _blctr = 0;

/**
 * load the administration User Experience
 */
function loadAdminUX ()
{
  toLoad = 'admin.html';
  $.when($.get(toLoad)).done(function (page)
    {$('#body').empty();
    $('#body').append(page);
    listMemRegistries();
  });
}
/**
 * connect to the provided web socket
 * @param {loc} - _target location to post messages
 * @param {port} - web socket port #
 */
function wsDisplay(_target, _port)
{
  console.log('wsDisplay target: '+_target+' port: '+_port);
  var content = $('#'+_target);
  var wsSocket = new WebSocket('ws://localhost:'+_port);
  wsSocket.onopen = function () {wsSocket.send('connected to client');};

  wsSocket.onmessage = function (message) {console.log('wsSocket message: ', message.data); content.append(formatMessage(message.data));};

  wsSocket.onerror = function (error) {console.log('WebSocket error on wsSocket: ' + error);};

}
/**
 * list the available business networks
 */
function adminList()
{
  var _url = '/composer/admin/listAsAdmin';
  $.when($.get(_url)).done(function (_connection)
  {
    
  });
}

/**
 * load the entry form for a connection profile
 */
function displayProfileForm ()
{
  toLoad = 'createConnectionProfile.html';
  $.when($.get(toLoad)).done(function (page)
    {
      
    });
}

/**
 * get the data from the network connection form. 
 */
function getConnectForm ()
{
  var fields = ['fabric_type', 'orderers_url', 'ca_url', 'ca_name', 'peers_eventURL', 'peers_requestURL', 'keyValStore', 'channel', 'mspID', 'timeout'];
  var res = {}
  
  res['profileName'] = $('#profileName').val();
  for (each in fields)
    {(function (_idx, _arr){
      if (_arr[_idx] == 'fabric_type') {res['type'] = $('#'+_arr[_idx]).val();}
      else
        { var parts = _arr[_idx].split('_');
        if (parts.length == 1) {res[_arr[_idx]] = $('#'+_arr[_idx]).val();}
        if (typeof(res[parts[0]]) == 'undefined') {res[parts[0]]={};}
        res[parts[0]][parts[1]] = $('#'+_arr[_idx]).val();
        }
    })(each, fields) }
    console.log(res);
    return res;
}

/**
 * test creating a network connection
 */
function createConnection (_form)
{ 
console.log(_form);
$.when($.post('/composer/admin/createProfile', _form)).done(function(_results)
{
  
});

}

/**
 * get all network connection profiles
 */
function getProfiles()
{
  $.when($.get('/composer/admin/getAllProfiles')).done(function (_profiles)
  {
    
  });
}

/**
 * gather and list all of the current network connection profiles
 */
function listProfiles(_state)
{
  $.when($.get('/composer/admin/getAllProfiles'), $.get('deleteConnectionProfile.html')).done(function (_profiles, page)
  {
    
  });
}

/**
 * deploy a new network
 */
function networkDeploy()
{
  var options = {};
  options.myArchive = networkFile;
  $.when($.post('/composer/admin/deploy', options)).done(function (_results)
  { 
    
  });
}

/**
 * install a new network
 */
function networkInstall()
{
  var options = {};
  options.myArchive = networkFile;
  $.when($.post('/composer/admin/install', options)).done(function (_results)
  {
    
  });
}

/**
 * start an installed network
 */
function networkStart()
{
  var options = {};
  options.myArchive = networkName;
  $.when($.post('/composer/admin/start', options)).done(function (_results)
  {
    
  });
}

/**
 * delete a connection profile
 * @param {String} _name - a string containing the name of the network connection profile to be deleted
 */
function deleteConnectionProfile(_name)
{
  var options = {};
  options.profileName = _name;
  if (confirm('Are you sure you want to delete the '+_name+' profile?') == true) 
  {
    $.when($.post('/composer/admin/deleteProfile', options)).done(function(_results)
    {
      
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
  var options = {}; options.businessNetwork = businessNetwork;
  $.when($.post('/composer/admin/ping', options)).done(function (_results)
  {
    
  });
}

/**
 * take down a business network
 */
function networkUndeploy()
{
  
  var options = {};
  options.businessNetwork = businessNetwork;
  if (confirm('Are you sure you want to undeploy the '+businessNetwork+' business network?') == true) 
  {
    $.when($.post('/composer/admin/undeploy', options)).done(function(_results)
    {
      
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
  var options = {};
  options.myArchive = networkFile;
  $.when($.post('/composer/admin/update', options)).done(function (_results)
  {
    
  });
}

/*
* display a network profile
*/
function displayProfile(_profile, _name)
{
  var _str = '';
  _str += '<h4>'+_name+'</h4>';
   _str +='<table>'; 
   for (item in _profile)
    {(function(_item, _obj){
      switch (_item)
      {
        case 'orderers':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+='<tr><td>'+_item+'</td><td>url</td><td>'+__obj[_subItem].url+'</td></tr>';
              })(subItem, _obj[_item]);
            }
        break;
        case 'peers':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+='<tr><td>'+_item+'</td><td>eventURL</td><td>'+__obj[_subItem].eventURL+'</td></tr>';
              _str+='<tr><td>'+_item+'</td><td>requestURL</td><td>'+__obj[_subItem].requestURL+'</td></tr>';
            })(subItem, _obj[_item]);
            }
        break;
        case 'ca':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+='<tr><td>'+_item+'</td><td>'+_subItem+'</td><td>'+__obj[_subItem]+'</td></tr>';
            })(subItem, _obj[_item]);
            }
        break;
        default:
        _str+='<tr><td>'+_item+'</td><td>'+_obj[_item]+'</td></tr>';
      }
    })(item, _profile)
  }
   _str +='</table>';
   return _str;
}

/*
* pre-load network from startup folder contents
*/
function preLoad()
{
  $('#body').empty();
  var options = {};
  $.when($.post('/setup/autoLoad', options)).done(function (_results)
  { msgPort = _results.port; wsDisplay('body', msgPort); });
}

/*
* get member registries 
*/
function listMemRegistries()
{
  $.when($.get('/composer/admin/getRegistries')).done(function (_results)
  {
    
  });
}
/*
* get member in a registry 
*/
function listRegistry()
{
  var options = {};
  options.registry = $('#registryName').find(':selected').text();
  $.when($.post('/composer/admin/getMembers', options)).done(function (_results)
  {
    
  });
}
/*
* get asset list 
*/
function listAssets()
{
  let options = {};
  options.registry = 'Order';
  options.type='admin';
  $.when($.post('/composer/admin/getAssets', options)).done(function (_results)
  {
    
  });
}
/*
* add a member to a registry
*/
function addMember()
{
  var _fields = ['companyName', 'participant_id', 'member_type'];

  $.when($.get('createMember.html')).done(function (_page)
  {
    
  });
}
/*
* remove a member from a registry
*/
function removeMember()
{
  var options = {};
  var member_list;
  options.registry = $('#registryName2').find(':selected').text();
  $('#admin-forms').empty();
  $('#messages').empty();   
  $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
  $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
  {
    
  });

}

/*
* retrieve member secret
*/
function getSecret()
{
  var options = {};
  var member_list;
  options.registry = $('#registryName3').find(':selected').text();
  $('#admin-forms').empty();
  $('#messages').empty();   
  $('#messages').append('<br/>Getting Member List for '+options.registry+'.');
  $.when($.post('/composer/admin/getMembers', options),$.get('getMemberSecret.html')).done(function (_results, _page)
  {
    
  });

}
/**
 * display member information using the provided id and table
 * @param id - string with member id
 * @param _list - array of JSON member objects
 */

function displayMember(id, _list)
{
  var member = findMember(id, _list);
  $('#companyName').empty();
  $('#companyName').append(member.companyName);
  $('#participant_id').empty();
  $('#participant_id').append(member.id);
}

/**
 * find the member identified by _id in the array of JSON objects identified by _list
 * @param id - string with member id
 * @param _list - array of JSON member objects
 */

function findMember(_id, _list)
{
  console.log(_id, _list);
  _mem = {'id': _id, 'companyName': 'not found'};
  for (each in _list){(function(_idx, _arr)
  {
    if (_arr[_idx].id == _id) 
    {_mem = _arr[_idx]; }
  })(each, _list)}
  return(_mem);
}

/**
 * get blockchain info
 */

function getChainInfo()
{
  $.when($.get('fabric/getChainInfo')).done(function(_res)
  { var _str = '<h2> Get Chain Info: '+_res.result+'</h2>';
  console.log(_res);
  if (_res.result == "success")
    {_str += 'Current Hash: '+formatMessage(_res.currentHash);
    _str+= '<ul><li>High: '+_res.blockchain.height.high+'</li><li>Low: '+_res.blockchain.height.low+'</li></ul>'}
    else
    {_str += formatMessage(_res.message);}
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
  });
}
/**
 * get History
 */

function getHistorian()
{
  $.when($.get('fabric/getHistory')).done(function(_res)
  { var _str = '<h2> Get History Records: '+_res.result+'</h2>';
  console.log(_res);
  if (_res.result == "success")
    {_str += 'Current length: '+formatMessage(_res.history.length);}
    else
    {_str += formatMessage(_res.message);}
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
  });
}

/**
 * display blockchain updates
 */

function getChainEvents()
{
  $.when($.get('fabric/getChainEvents')).done(function(_res)
  { var _str = '<h2> Get Chain events requested. Sending to port: '+_res.port+'</h2>';
  var content = $('#blockchain');
  var csSocket = new WebSocket('ws://localhost:'+_res.port);
  csSocket.onopen = function () {csSocket.send('connected to client');};
  csSocket.onmessage = function (message) {
    _blctr ++;
    console.log('csSocket message.data '+ message.data);
    if (message.data != 'connected')
      {$('#blockchain').append('<span class="block"><br/>block '+JSON.parse(message.data).header.number+'<br/>Hash: '+JSON.parse(message.data).header.data_hash+'</span>');
      if (_blctr > 4) {var leftPos = $('#blockchain').scrollLeft(); $('#blockchain').animate({scrollLeft: leftPos + 300}, 250);}
    }
  };
  csSocket.onerror = function (error) {console.log('WebSocket error: ' + error);};
  $("#admin-forms").empty();
  $("#admin-forms").append(_str);
  });
}