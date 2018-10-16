/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// cloudant support
var cloudantAuth;
var cloudant_credentials;
var request = require('request');
var cfenv = require('cfenv');
var fs = require('fs');
var jsonObjects = "jsonObjects.json";
var metaData = {};
var protocolToUse = "http";

function displayObjectProperties(_obj){  for(var property in _obj){ console.log("object property: "+property ); }}
function displayObjectPropertyValues(_obj){  for(var property in _obj){ console.log("object property: "+property+" with value: "+_obj[property] ); }}

exports.w_authenticate=w_authenticate;
exports.w_create=w_create;
exports.w_drop=w_drop;
exports.w_insert=w_insert;
exports.w_update=w_update;
exports.w_delete=w_deleteItem;
exports.w_listAllDatabases=w_listAllDatabases;
exports.w_listAllDocuments=w_listAllDocuments;
exports.w_capabilities=w_capabilities;
exports.w_getMetadata=w_getMetadata;
exports.w_buildEntryPage=w_buildEntryPage;
exports.w_getDocs=w_getDocs;
exports.w_getOne=w_getOne;
exports.w_select=w_select;
exports.w_select2=w_select2;
exports.w_selectMulti=w_selectMulti;
exports.w_createBackup=w_createBackup;
exports.w_restoreTable=w_restoreTable;
exports.w_getBackups=w_getBackups;

function getDBPath()
{
  if (cfenv.getAppEnv().isLocal)
    { console.log("using local database");
      cloudant_credentials = require('../../env.json').couchdb;
    protocolToUse = "http";
    var url = "http://"+cloudant_credentials.username+":"+cloudant_credentials.password+"@"+cloudant_credentials.urlBase; }
  else
    {console.log("using host database");
    cloudant_credentials = require('../../env.json').cloudant;
    protocolToUse = "https";
    // var url = cloudant_credentials.url+"/_session";
    var url = cloudant_credentials.url+"/"; }
   // console.log("getDBPath url is: "+url);
 return url;
}

function w_authenticate(req, res, next)
{
  var params = "name="+cloudant_credentials.username+"&password="+cloudant_credentials.password;
  var method = "POST";
  var url = getDBPath()+"/_session";
  request({ url: url, method: method, headers: { "content-type": "application/x-www-form-urlencoded" }, form: params },
  function(error, response, body) {
        if (error) { console.log("authenticate error: "+error); res.send({"error": error});}
        else { cloudantAuth=response["headers"]["set-cookie"]; console.log("authentication succeeded: "+response); res.send(response);}
    });

}
function w_create(req, res, next)
{
  // create a new database
  var _name = req.body.name;
  var method = "PUT";
  var url = getDBPath()+_name;
  console.log("w_create: db=",_name);
  request({
        url: url,
        headers: {"set-cookie": cloudantAuth, 'Accept': '/'},
        method: method,
    }, function(error, response, body) {
      var _body = JSON.parse(body);
        if ((error) || ((typeof(_body.error) != 'undefined') && (_body.error != null)))
          { if ((typeof(_body.error) != 'undefined') && (_body.error != null)) { res.send({"error": _body.error});}
            else {res.send({"error": error}); }
          } else { res.send({"success": _body})}
    });
}
function w_drop(req, res, next)
{
  // drop a database
  var _name = req.body.name;
  var method = "DELETE";
  var url = getDBPath()+_name;
  var _res = res;
  request( { url: url, method: method },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}

function w_insert(req, res, next)
{
  // iCloudant automatically creates a unique index for each entry.
    var _name = req.body.name;
    var _object = req.body.content;
    delete _object._rev;
    var _res = res;
    var method = "POST";
    var url = getDBPath()+_name;
    delete _object._rev;
    // console.log("w_insert url is "+url);
    console.log ("w_insert for: "+ _name+ " with content: "+JSON.stringify(_object));
    request( { url: url, json: _object, method: method },
      function(error, response, body) {
        if (error){console.log("error: "+ error);
          _res.send({"error": error});}
        else { console.log("success: "+ JSON.stringify(body));
               _res.send({"success": body});
      }
    });
}
function w_update(req, res, next)
{
  // insert JSON _object into database _name
  var updateContent = req.body.content;
  var _name = req.body.name;
  var method = "POST";
  var object = {}; object.name = req.body.name; object.oid = req.body.oid;
  var _res = res;
  var url = protocolToUse+'://'+req.headers.host+'/db/getOne';
  request( { url: url, json: object, method: method },
    function(error, response, body)
    { if (error){console.log("error: "+ error); _res.send({"error": error});}
      else
      {var orig = JSON.parse(body.success);
      for(prop in updateContent){(function(_idx, _array){orig[_idx]=_array[_idx]; })(prop, updateContent)}
      var method = "PUT";
      var url = getDBPath()+_name+"/"+object.oid;
      console.log("update path is: "+_name+"/"+object.oid);
      request( { url: url, json: orig, method: method },
        function(error, response, body) { if (error){console.log("error: "+ error); _res.send({"error": error});}
        else { console.log("success: "+ JSON.stringify(body)); _res.send({"success": body});}
      });
    }
  });
}

function w_getOne(req, res, next)
{
  // select objects from database _name specified by selection criteria _selector
  var _name = req.body.name;
  var _oid = req.body.oid;
  var method = "GET";
  var _res = res;
  var url = getDBPath()+_name+"/"+_oid;
  console.log("w_getOne: "+_name+"/"+_oid);
  request( { url: url, method: method },
    function(error, response, body) {
      if (error){
        _res.send({"error": body});}
      else {
         _res.send({"success": body});}
  });
}

function w_select(req, res, next)
{
  // select objects from database _name specified by selection criteria _selector
  console.log("w_select entered");
  var _name = req.body.name;
  var key = req.body.key;
  var view = req.body.view;
  var method = "GET";
  var object = {"selector" : {"idRubric" : key}};
  var _res = res;
  console.log("name: "+_name+" key: "+key+" view: "+view);
  var select = ((typeof(key) == "undefined") || (key == "")) ? '/_design/views/_view/'+view : '/_design/views/_view/'+view+'?key="'+key+'"';
  console.log("select is ", select);
  var url = getDBPath()+_name+ select;
  //console.log(url);
  request( { url: url, method: method, json: object, headers: {"Content-Type": "application/json"} },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}

function w_select2(req, res, next)
{
  // select objects from database _name specified by selection criteria _selector
  console.log("w_select2 entered");
  var _name = req.body.name;
  var key = req.body.key;
  var view = req.body.view;
  var method = "POST";
  var object = {"selector" : {"_id" : { "$gt" : 0}, "type":{"$in":key}}};
  var _res = res;
  console.log("name: "+_name+" key: "+key+" view: "+view);
  console.log("object: "+JSON.stringify(object));
  // var select = ((typeof(key) == "undefined") || (key == "")) ? '/_design/views/_view/'+view : '/_design/views/_view/'+view+'?key="'+key+'"';
  var select = "";
  select = "/_find";
  console.log("select is ", select);
  var url = getDBPath()+_name+ select;
   console.log(url);
  request( { url: url, method: method, json: object, headers: {"Content-Type": "application/json"} },
    function(error, response, body) {
      if (error){ _res.send({"error": body});}
        else { _res.send({"success": body } );}
  });
}

function w_selectMulti(req, res, next)
{
  // select objects from database _name specified by selection criteria _selector
  console.log("w_selectMulti entered");
  var _name = req.body.name;
  var keyArray = req.body.key;
  var keys = "";
  for (each in keyArray){(function(_idx, _array){keys += (_idx==0)?'["'+_array[_idx]+'"': ', "'+_array[_idx]+'"'})(each, keyArray);}
  keys +="]";
  var view = req.body.view;
  var method = "GET";
  var object = {"keys": keyArray};
  var _res = res;
  var select =  '/_design/views/_view/'+view+"?key="+keys ;
  console.log("object is ", object);
  console.log("select is ", select);
  var url = getDBPath()+_name+ select;
  // console.log(url);
  request( { url: url, method: method, json: object, headers: {"Content-Type": "application/json"} },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}
function w_deleteItem(req, res, next)
{
  // delete object specified by _oid in database _name /$DATABASE/$DOCUMENT_ID?rev=$REV
  //_name, _oid, _rev, cbfn
  var _name = req.body.name;
  var _oid = req.body.oid;
  var _rev = req.body.rev;
  var _res = res;
  var method = "DELETE";
  var url = getDBPath()+_name+"/"+oid+"?rev="+_rev;
  request( { url: url, method: method },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}
function w_getDocs(req, res, next)
{
  var method = "GET";
  var url = getDBPath()+req.body.name+"/_all_docs?include_docs=true";
  console.log("w_getDocs path: ", url);
  var _res = res;
  request( { url: url, method: method },
    function(error, response, body) { if (error){console.log("w_getDocs error: ", body); _res.send({"error": body});} else { _res.send({"success": body});}
  });
}
function w_listAllDocuments(req, res, next)
{
  // list all documents in database _name
  var method = "GET";
  var url = getDBPath()+"/_all_docs";
  var _res = res;
  request( { url: url, method: method },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}

function w_listAllDatabases(req, res, next)
{
  // list all databases
  var method = "GET";
  var url = getDBPath()+"/_all_dbs";
  var _res = res;
  request( { url: url, method: method },
    function(error, response, body) { if (error){ _res.send({"error": body});} else { _res.send({"success": body});}
  });
}

function w_capabilities(req, res, next)
{
  var _c = {};
  _c.authenticate = "function (): uses credentials in env.json file to authenticate to cloudant server";
  _c.create = "function (_name): create a new database";
  _c.drop = "function (_name): drop a database";
  _c.insert = "function (_name, _object): insert JSON _object into database _name";
  _c.update = "function (_name, _oid, _object): update JSON object specified by object _oid in database _name with new object _object";
  _c.select = "function (_name, _selector): select objects from database _name specified by selection criteria _selector";
  _c.delete = "function (_name, _oid): delete object specified by _oid in database _name";
  _c.listAllDatabases = "function (): list all databases I can access";
  _c.listAllDocuments = "function (_name): list all documents in database _name";
  _c.capabilities = "return this object with descriptors.";
  _c.getMetadata = "return the jsonObjectsPretty.json file.";
  res.send(_c);
}
function w_getMetadata(req, res, next)
{
  var file = jsonObjects;
  var toSave = process.cwd()+"/"+file;
  var contents = fs.readFileSync(toSave, 'utf8');
  metaData = JSON.parse(contents);
  res.send(contents);
}
function retrieveMetaData(_name)
{
  for (each in metaData.dataModel)
  {if (metaData.dataModel[each].name == _name){return(metaData.dataModel[each]);}}
  return({"failed": _name+" not found"});
}
function w_buildEntryPage(req, res, next)
{
  var pageMeta = retrieveMetaData(req.body.name);
  if (typeof(pageMeta.failed) != "undefined"){return(pageMeta)}
  else
  { console.log(pageMeta);
    var _str = "<h2>"+pageMeta.name+"</h2>"+pageMeta.description+"<div class='container'><table>";
    var _type = req.body.type;
    var _fields = "";
    for (each in pageMeta.elements)
    {(function(_idx, _array){_str+="<tr><td width='25%'><span class='glyphicon glyphicon-question-sign' title='"+_array[_idx].comment+"'></span>"+_array[_idx].name+"</td><td width='75%'>";
    if (_idx > 0){_fields +=",";}
      switch (_array[_idx].type)
      {
        case 'int':
        _str += "<input id='"+_array[_idx].name+"', type='number', width=100%, class='showfocus'></input>";
        _fields += _array[_idx].name;
        break;
        case 'string':
        _str += "<input id='"+_array[_idx].name+"', type='text', width=100%, class='showfocus'></input>";
        _fields += _array[_idx].name;
        break;
        case 'boolean':
        _str += "<input id='"+_array[_idx].name+"_true', type='radio', width=50%, class='showfocus'>True</input>";
        _str += "<input id='"+_array[_idx].name+"_false', type='radio', width=50%, class='showfocus'>False</input>";
        _fields += _array[_idx].name+"_true,"; _fields += _array[_idx].name+"_false";
        break;
        case 'email':
        _str += "<input id='"+_array[_idx].name+"', type='email', width=100%, class='showfocus'></input>";
        _fields += _array[_idx].name;
        break;
        case 'timestamp':
        // needs routine to get timestamp
        var _tStamp = new Date(Date.now());
        _str += "<div id='"+_array[_idx].name+"', type='readonly', width=100%, class='showfocus'>"+_tStamp.toISOString()+"</div>";
        _fields += _array[_idx].name;
        break;
        case 'JSON':
        _str += "<input id='"+_array[_idx].name+"', type='text', width=100%, class='showfocus'></input>";
        _fields += _array[_idx].name;
        break;
        case 'index':
        _str += "<div id='"+_array[_idx].name+"', type='readonly', width=100%, class='showfocus'>Defined when inserted</div>";
        _fields += _array[_idx].name;
        break;
        default:
        _str += "<div id='"+_array[_idx].name+"', type='readonly', width=100%, class='showfocus'>"+_array[_idx].type+" is not a recognized type</div>";
        _fields += _array[_idx].name;
        break;
      }
      _str +="</td></tr>";
    })(each, pageMeta.elements)}
    _str += "<tr><td width='25%'><span class='glyphicon glyphicon-question-sign' title='revision number'></span>_rev</td><td width='75%'>"+"<div id='_rev', type='readonly', width=100%, class='showfocus'>Defined when inserted</div></td></tr></table>";
    _fields += ",_rev";
    console.log(_fields);
    _str += "<tr><td colspan='2'><a id='autoSubmit' class='btn btn-primary' style='padding-left: 0.3em'>Insert New Document</a></td></tr></table></div> \n";
    _str += "<script>  \n";
    _str += "$('#autoSubmit').on('click',function(){  \n";
    _str += "  var _input = '"+_fields+"';  \n";
    _str += "  var fields = _input.split(',');  \n";
    _str += "  var _type = 'insert';  \n";
    _str += "  var data = {};  \n";
    _str += "  switch (_type)  \n";
    _str += "  {  \n";
    _str += "    case 'insert' :  \n";
    _str += "     for (each in fields)  \n";
    _str += "     {(function(_idx,_array){if ((_array[_idx] != 'id_idx') && (_array[_idx] != '_rev')) {data[_array[_idx]] = $('#'+_array[_idx]).val();}})(each, fields)}  \n";
    _str += "     console.log('data is: ',data); \n";
    _str += "     var object = {}; object.name = '"+pageMeta.name+"'; \n";
    _str += "     object.content = data; \n";
    _str += "     $.when($.post('/db/insert', object)).done(function(_res){console.log(JSON.stringify(_res));}); \n";
    _str += "    break;  \n";
    _str += "    case 'update' :  \n";
    _str += "      \n";
    _str += "    break;  \n";
    _str += "    default:  \n";
    _str += "    console.log('default entered on '+_type);  \n";
    _str += "  }  \n";
    _str += "});  \n";
  _str += "</script> \n";
  console.log(_str);
    res.send(_str);
  }
}
function w_createBackup(req, res, next)
{
  var _object = {};
    _object.name = (typeof(req.body.name)=="undefined") ? "" : req.body.name;
    var _res = res;
  var method = "POST";
  var url = protocolToUse+'://'+req.headers.host+'/db/getDocs';
  console.log("w_createBackup object: ", _object);
  // console.log("w_createBackup path: ", url);
  request( { url: url, json: _object, method: method },
    function(error, response, body)
    { console.log("request completed for table: "+_object.name);
      if (error)
      {console.log("error: "+ error); _res.send({"error": error});}
      else
      {
//       console.log("success: response ", response);
     console.log("success: body ",  body.success);
      var fileName = process.cwd()+"/HTML/backups/"+'Backup_';
      fileName += (_object.name == "") ? "allFiles" : _object.name;
      fileName +="_"+getTimeStamp()+".json";
      console.log("creating backup at: ", fileName);
      var rows = JSON.parse(body.success).rows;
      var _views = '"views": ['; var viewNum = 0;
      var _str = "[";
      for (each in rows)
      {(function(_idx, _array)
        {if(_array[_idx].doc._id != '_design/views')
          { if(_idx>0){_str+=", ";}
            _str+=JSON.stringify(_array[_idx].doc); console.log(JSON.stringify(_array[_idx].doc));
          }
          else {
            if(viewNum>0){_views+=", ";} _views += '{ "_id": "_design/views", "views":' +JSON.stringify(_array[_idx].doc.views)+'}';
          }
        })(each, rows)}
      _str+="]"; _views += "]";
      fs.writeFileSync(fileName, '{"table" : "'+_object.name+'", "date": "'+getTimeStamp()+'", "rows": '+_str+', '+_views+'}', 'utf8');
      _res.send(JSON.parse(body.success).rows);}
  });
}
function w_restoreTable(req, res, next)
{
  console.log("w_restoreTable entered for "+req.body.name);
  var fileName = process.cwd()+"/HTML/backups/"+req.body.name;
  var restoreObject =JSON.parse(fs.readFileSync(fileName));
  console.log("starting restore for table: "+restoreObject.table+" created on: "+restoreObject.date);
  console.log("restore data: "+JSON.stringify(restoreObject.rows));
  // drop existing table
  var object = {}; object.name = restoreObject.table  ;
  var _res = res;
  var method = "POST";
  var url = protocolToUse+'://'+req.headers.host+'/db/dropTable';
  request( { url: url, json: object, method: method },
    function(error, response, body)
    { console.log("request to drop table: "+object.name+" completed");
      if (error){console.log("error: "+ error); _res.send({"error": error});}
      else
      {console.log("drop table: result: "+response);
        // create new table
        var url = protocolToUse+'://'+req.headers.host+'/db/createTable';
        request( { url: url, json: object, method: method },
          function(error, response, body)
          { console.log("request to create table: "+object.name+" completed");
            if (error){console.log("error: "+ error); _res.send({"error": error});}
            else
            {console.log("create table: result: "+response);
              var url = protocolToUse+'://'+req.headers.host+'/db/insert';
              for (each in restoreObject.rows)
              { console.log("["+each+"] restoring row: "+JSON.stringify(restoreObject.rows[each]));
                var _object = object; _object.content = restoreObject.rows[each];
                  if(process.env.SNDEMAIL && process.env.SNDEMAIL!== '') {
                      _object.content.email = process.env.SNDEMAIL;
                  }
                  console.log("Restoring with : ", JSON.stringify(_object, null , 4));
                request( { url: url, json: _object, method: method },
                  function(error, response, body) { console.log("row restored: "+response);});
              }
              for (each in restoreObject.views)
              { console.log("["+each+"] restoring row: "+JSON.stringify(restoreObject.views[each]));
                var _object = {}; _object.name = object.name; _object.content = restoreObject.views[each];
                  if(process.env.SNDEMAIL && process.env.SNDEMAIL!== '') {
                      _object.content.email = process.env.SNDEMAIL;
                  }

                  console.log("Restoring with : ", JSON.stringify(_object, null , 4));
                request( { url: url, json: _object, method: method },
                  function(error, response, body) { console.log("view restored: "+response);});
              }
            }
          });
        }
      });
}
function w_getBackups(req, res, next)
{
  var loc = process.cwd()+"/HTML/backups/";
  var files = fs.readdirSync(loc);
  console.log(files);
  res.send(files);
}
function getTimeStamp() {return(new Date(Date.now()).toISOString().replace(/:/g, '.'));}
