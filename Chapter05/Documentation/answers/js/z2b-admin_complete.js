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

/**
 * load the administration User Experience
 */
function loadAdminUX ()
{
  toLoad = "admin.html";
  $.when($.get(toLoad)).done(function (page)
    {$("#body").empty();
    $("#body").append(page);
  });
}

/**
 * list the available business networks
 */
function adminList()
{
  var _url = '/composer/admin/listAsAdmin';
  $.when($.get(_url)).done(function (_connection)
  { var _str = "<h3>Current Active Business Networks</h3><ul>";
    for (each in _connection)
      {(function(_idx, _arr){_str += "<li>"+_arr[_idx]+"</li>";})(each, _connection)}
    _str+="</ul>";
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
  });
}

/**
 * load the entry form for a connection profile
 */
function displayProfileForm ()
{
  toLoad = "createConnectionProfile.html";
  $.when($.get(toLoad)).done(function (page)
    {$("#admin-forms").empty();
    $("#admin-forms").append(page);
    var _cancel = $("#cancel");
    var _submit = $("#submit");
    _cancel.on('click', function (){$("#admin-forms").empty();});
    _submit.on('click', function(){var _vals = getConnectForm(); createConnection(_vals);});
  });
}

/**
 * get the data from the network connection form. 
 */
function getConnectForm ()
{
  var fields = ["fabric_type", "orderers_url", "ca_url", "ca_name", "peers_eventURL", "peers_requestURL", "keyValStore", "channel", "mspID", "timeout"];
  var res = {}
  
  res["profileName"] = $("#profileName").val();
  for (each in fields)
    {(function (_idx, _arr){
      if (_arr[_idx] == "fabric_type") {res["type"] = $("#"+_arr[_idx]).val();}
      else
        { var parts = _arr[_idx].split("_");
        if (parts.length == 1) {res[_arr[_idx]] = $("#"+_arr[_idx]).val();}
        if (typeof(res[parts[0]]) == "undefined") {res[parts[0]]={};}
        res[parts[0]][parts[1]] = $("#"+_arr[_idx]).val();
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
$.when($.post("/composer/admin/createProfile", _form)).done(function(_results)
{
  var _str = "";
  console.log(_results);
  _str +="<h2>network profile creation request</h2>";
  _str += "<h4>Creation request results: "+_results.profile+"</h4>";
  $("#admin-forms").empty();
  $("#admin-forms").append(_str);

});

}

/**
 * get all network connection profiles
 */
function getProfiles()
{
  $.when($.get('/composer/admin/getAllProfiles')).done(function (_profiles)
  {
    console.log("connection results: ", _profiles);
    var _str = "";
    // list cert URL & cert path
    _str +="<h3>network connection profile list request</h3>";
    _str += "<ul>";
    for (each in _profiles) {_str += displayProfile(_profiles[each], each)}
    _str += "</ul>";
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
  
  });
}

/**
 * gather and list all of the current network connection profiles
 */
function listProfiles(_state)
{
  $.when($.get('/composer/admin/getAllProfiles'), $.get('deleteConnectionProfile.html')).done(function (_profiles, page)
  {
    $("#admin-forms").empty();
    $("#admin-forms").append(page);
    $("#connection_profiles").on('change',function()
    { var name = $("#connection_profiles").find(":selected").text();
      var profile = connection_profiles[name];
      var _str = displayProfile(profile,name);
      $("#selected_profile").empty();
      $("#selected_profile").append(_str);
    });
    var connection_profiles = _profiles[0];
    for (each in connection_profiles)
      { (function (_idx, _arr)
        { $("#connection_profiles").append('<option value="'+_idx+'">' +_idx+'</option>'); })(each, connection_profiles); }
    var first = $("#connection_profiles").find(":first").text();
    var _str = displayProfile(connection_profiles[first],first);
    $("#selected_profile").empty();
    $("#selected_profile").append(_str);
    var _cancel = $("#cancel");
    var _submit = $("#submit");
    _cancel.on('click', function (){$("#admin-forms").empty();});
    if (_state == 0)
      {_submit.on('click', function(){deleteConnectionProfile($("#connection_profiles").find(":selected").text());});}
    else
      {_submit.hide();}
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
  { var _str = "";
    console.log(_results)
    _str +="<h2>network deploy request for "+networkFile+"</h2>";
    _str += "<h4>Network deploy results: "+_results.deploy+"</h4>";
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
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
  if (confirm("Are you sure you want to delete the "+_name+" profile?") == true) 
  {
    $.when($.post('/composer/admin/deleteProfile', options)).done(function(_results)
    {
      var _str = "";
      console.log(_results);
      _str +="<h2>network profile delete request for "+_name+"</h2>";
      _str += "<h4>Profile delete request results: "+_results.profile+"</h4>";
      $("#admin-forms").empty();
      $("#admin-forms").append(_str);
    });
  } else 
  {
    $("#message").empty();
    $("#message").append("request cancelled");
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
    console.log(_results)
    var _str = "";
    _str +="<h2>network ping request to "+businessNetwork+"</h2>";
    _str += "<h4>Ping request results: "+"</h4><table width='90%'><tr><th>Item</th><th width='65%'>Value</th></tr>";
    for (each in _results.ping){(function(_idx, _arr){_str+="<tr><td>"+_idx+"</td><td>"+_arr[_idx]+"</td></tr>"})(each, _results.ping)}
    _str+="</table>";
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
    });
}

/**
 * take down a business network
 */
function networkUndeploy()
{
  
  var options = {};
  options.businessNetwork = businessNetwork;
  if (confirm("Are you sure you want to undeploy the "+businessNetwork+" business network?") == true) 
  {
    $.when($.post('/composer/admin/undeploy', options)).done(function(_results)
    {
      var _str = "";
      console.log(_results);
      _str +="<h2>Network undeploy request for "+businessNetwork+"</h2>";
      _str += "<h4>Network Undeploy request results: "+_results.undeploy+"</h4>";
      $("#admin-forms").empty();
      $("#admin-forms").append(_str);
    });
  } else 
  {
    $("#message").empty();
    $("#message").append("undeploy request cancelled");
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
  { var _str = "";
    console.log(_results)
    _str +="<h2>network update request for "+networkFile+"</h2>";
    _str += "<h4>Network update results: "+_results.update+"</h4>";
    $("#admin-forms").empty();
    $("#admin-forms").append(_str);
});
}

/*
* display a network profile
*/
function displayProfile(_profile, _name)
{
  var _str = "";
  _str += "<h4>"+_name+"</h4>";
   _str +="<table>"; 
   for (item in _profile)
    {(function(_item, _obj){
      switch (_item)
      {
        case 'orderers':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+="<tr><td>"+_item+"</td><td>url</td><td>"+__obj[_subItem].url+"</td></tr>";
              })(subItem, _obj[_item]);
            }
        break;
        case 'peers':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+="<tr><td>"+_item+"</td><td>eventURL</td><td>"+__obj[_subItem].eventURL+"</td></tr>";
              _str+="<tr><td>"+_item+"</td><td>requestURL</td><td>"+__obj[_subItem].requestURL+"</td></tr>";
            })(subItem, _obj[_item]);
            }
        break;
        case 'ca':
          for (subItem in _obj[_item])
            {(function(_subItem, __obj)
              {_str+="<tr><td>"+_item+"</td><td>"+_subItem+"</td><td>"+__obj[_subItem]+"</td></tr>";
            })(subItem, _obj[_item]);
            }
        break;
        default:
        _str+="<tr><td>"+_item+"</td><td>"+_obj[_item]+"</td></tr>";
      }
    })(item, _profile)
  }
   _str +="</table>";
   return _str;
}
