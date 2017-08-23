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

// z2c-experiment.js

var creds;

/**
 * get the hyplerledger api data and display it
 */
function loadAPIList ()
{
  toLoad = "experiment.html";
  $.when($.get(toLoad)).done(function (page)
    {$("#body").empty();
    $("#body").append(page);
  });
}

/**
 * get and display blockchain credentials
 */
function getCreds()
{
  $.when($.get('/getCreds')).done(function (page)
    {$("#api-response").empty();
    creds = JSON.parse(page).blockchain;
    var _str = "";
    // list cert URL & cert path
    _str +="<h3>Certificate Info</h3><table><tr><th>Certificate URL</th><th>Certificate Path</th></tr>";
    _str+= "<tr><td>"+creds.cert+"</td><td>"+creds.cert_path+"</td></tr></table>"
    // build ca table
    var _ca = Object.getOwnPropertyNames(creds.ca)
    _str+="<br/>ca: "+_ca[0]+"<table><tr><th>Certificate entity</th><th>CertificateValue</th></tr>";
    var _caList = Object.getOwnPropertyNames(creds.ca[_ca[0]]);
    console.log(_caList);
    for (each in _caList)
    {
    (function(_idx, _arr){
      _str += "<tr><td>"+_arr[_idx]+"</td><td>"+creds.ca[_ca[0]][_arr[_idx]]+"</td></tr>"
      console.log(_arr[_idx])})(each, _caList)
    }
    _str+="</table><h3>Peers</h3>";
    _str += "<table><tr><th>Entry</th><th>Peer Entity</th><th>Value</th></tr>";
    for (each in creds.peers)
    {(function(_idx, _arr){
      var _aPeer = Object.getOwnPropertyNames(_arr[_idx]);
      for (every in _aPeer){(function(_idx2, _arr2){
//        _str += "<tr><td>"+_arr2[_idx2]+"</td><td>"+creds.peers[_arr[_idx]][_arr2[_idx2]]+"</td></tr>"
        _str += "<tr><td>Peer_"+_idx+"</td><td>"+_arr2[_idx2]+"</td><td>"+_arr[_idx][_arr2[_idx2]]+"</td></tr>"
      })(every, _aPeer)}
    })(each, creds.peers)}
    // build peer table
    _str+="</table><h3>Users</h3>";
    _str += "<table><tr><th>User Entity</th><th>Value</th></tr>";
    for (each in creds.users)
    {(function(_idx, _arr){
      var _aPeer = Object.getOwnPropertyNames(_arr[_idx]);
      for (every in _aPeer){(function(_idx2, _arr2){
//        _str += "<tr><td>"+_arr2[_idx2]+"</td><td>"+creds.peers[_arr[_idx]][_arr2[_idx2]]+"</td></tr>"
        _str += "<tr><td>User_"+_idx+"</td><td>"+_arr2[_idx2]+"</td><td>"+_arr[_idx][_arr2[_idx2]]+"</td></tr>"
      })(every, _aPeer)}
    })(each, creds.users)}
    // build user table
    _str+="</table>";

    $("#api-response").empty();
    $("#api-response").append(_str);
  });
}
