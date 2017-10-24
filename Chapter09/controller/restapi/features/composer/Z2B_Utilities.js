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

'use strict';

/**
 * This class creates an administration connection to a Hyperledger Composer runtime. The
 * connection can then be used to:
 * <ul>
 * <li></li>
 * </ul>
 *
 * @class
 * @memberof module:Z2B_Utility
 */
var Z2B_Utility = {

/**
* function to recursively display, up to 5 levels, the values of every property in an object. If the type of a property is object or function, then the word 'object' or 'function' is displayed
* Refer to this by {@link displayObjectValuesRecursive}.
* @param {String} _string - an arbitrary string to preface the printing of the object property name and value. often used to display the name of the object being printed
* @param {Object} _object - the object to be introspected
* @param {Object} _iter - limits number of iterations. max is 5, value is null to 4. # of iterations is 5-_iter
*/
    displayObjectValuesRecursive: function (_string, _object, _iter)
    {
        let __iter = (typeof(_iter) === 'undefined') ? 0 : _iter;
        if (__iter >= 7) {return;}
    //    console.log(_string+' is a type of: '+typeof(_object));
        for (let prop in _object){
            __iter = (typeof(_iter) === 'undefined') ? 0 : _iter;
            console.log(_string+'.'+prop+': \t'+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function') || (prop === 'definitions') )  ? typeof(_object[prop]) : _object[prop]));
            if (typeof(_object[prop]) === 'object') {__iter++;  displayObjectValuesRecursive(_string+'.'+prop, _object[prop], __iter);}
        }
    },
/**
 * display using console.log the properties of the inbound object
 * @param {displayObjectProperties} _name - string name of object
 * @param {displayObjectProperties}  _obj - the object to be parsed
 * @utility
 */
    displayObjectProperties: function (_name, _obj)
    {
        console.log(_name+' is type of: '+typeof(_obj));
        for(let propt in _obj){ console.log(_name+' object property: '+propt ); }
    },
/**
 * display using console.log the properties of each property in the inbound object
 * @param {displayObjectProperties} _string - string name of object
 * @param {displayObjectProperties}  _object - the object to be parsed
 * @utility
 */
    displayObjectValues: function (_string, _object)
    {
        for (let prop in _object){
            console.log(_string+'-->'+prop+':\t '+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function'))  ? typeof(_object[prop]) : _object[prop]));
        }
    }
}

module.exports = Z2B_Utility;