(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],2:[function(require,module,exports){
(function (process){(function (){
/* @flow */
/*::

type DotenvParseOptions = {
  debug?: boolean
}

// keys and values from src
type DotenvParseOutput = { [string]: string }

type DotenvConfigOptions = {
  path?: string, // path to .env file
  encoding?: string, // encoding of .env file
  debug?: string // turn on logging for debugging purposes
}

type DotenvConfigOutput = {
  parsed?: DotenvParseOutput,
  error?: Error
}

*/

const fs = require('fs')
const path = require('path')
const os = require('os')

function log (message /*: string */) {
  console.log(`[dotenv][DEBUG] ${message}`)
}

const NEWLINE = '\n'
const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
const RE_NEWLINES = /\\n/g
const NEWLINES_MATCH = /\r\n|\n|\r/

// Parses src into an Object
function parse (src /*: string | Buffer */, options /*: ?DotenvParseOptions */) /*: DotenvParseOutput */ {
  const debug = Boolean(options && options.debug)
  const obj = {}

  // convert Buffers before splitting into lines and processing
  src.toString().split(NEWLINES_MATCH).forEach(function (line, idx) {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    const keyValueArr = line.match(RE_INI_KEY_VAL)
    // matched?
    if (keyValueArr != null) {
      const key = keyValueArr[1]
      // default undefined or missing values to empty string
      let val = (keyValueArr[2] || '')
      const end = val.length - 1
      const isDoubleQuoted = val[0] === '"' && val[end] === '"'
      const isSingleQuoted = val[0] === "'" && val[end] === "'"

      // if single or double quoted, remove quotes
      if (isSingleQuoted || isDoubleQuoted) {
        val = val.substring(1, end)

        // if double quoted, expand newlines
        if (isDoubleQuoted) {
          val = val.replace(RE_NEWLINES, NEWLINE)
        }
      } else {
        // remove surrounding whitespace
        val = val.trim()
      }

      obj[key] = val
    } else if (debug) {
      log(`did not match key and value when parsing line ${idx + 1}: ${line}`)
    }
  })

  return obj
}

function resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

// Populates process.env from .env file
function config (options /*: ?DotenvConfigOptions */) /*: DotenvConfigOutput */ {
  let dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding /*: string */ = 'utf8'
  let debug = false

  if (options) {
    if (options.path != null) {
      dotenvPath = resolveHome(options.path)
    }
    if (options.encoding != null) {
      encoding = options.encoding
    }
    if (options.debug != null) {
      debug = true
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug })

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key]
      } else if (debug) {
        log(`"${key}" is already defined in \`process.env\` and will not be overwritten`)
      }
    })

    return { parsed }
  } catch (e) {
    return { error: e }
  }
}

module.exports.config = config
module.exports.parse = parse

}).call(this)}).call(this,require('_process'))
},{"_process":92,"fs":85,"os":90,"path":91}],3:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _superagent = _interopRequireDefault(require("superagent"));

var _querystring = _interopRequireDefault(require("querystring"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* @module ApiClient
* @version 0.5.0
*/

/**
* Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
* application to use this class directly - the *Api and model classes provide the public API for the service. The
* contents of this file should be regarded as internal but are documented for completeness.
* @alias module:ApiClient
* @class
*/
var ApiClient = /*#__PURE__*/function () {
  function ApiClient() {
    _classCallCheck(this, ApiClient);

    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://lilt.com/2
     */
    this.basePath = 'https://lilt.com/2'.replace(/\/+$/, '');
    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */

    this.authentications = {
      'ApiKeyAuth': {
        type: 'apiKey',
        'in': 'query',
        name: 'key'
      },
      'BasicAuth': {
        type: 'basic'
      }
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */

    this.defaultHeaders = {};
    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */

    this.timeout = 60000;
    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */

    this.cache = true;
    /**
     * If set to true, the client will save the cookies from each server
     * response, and return them in the next request.
     * @default false
     */

    this.enableCookies = false;
    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */

    if (typeof window === 'undefined') {
      this.agent = new _superagent["default"].agent();
    }
    /*
     * Allow user to override superagent agent
     */


    this.requestAgent = null;
    /*
     * Allow user to add superagent plugins
     */

    this.plugins = null;
  }
  /**
  * Returns a string representation for an actual parameter.
  * @param param The actual parameter.
  * @returns {String} The string representation of <code>param</code>.
  */


  _createClass(ApiClient, [{
    key: "paramToString",
    value: function paramToString(param) {
      if (param == undefined || param == null) {
        return '';
      }

      if (param instanceof Date) {
        return param.toJSON();
      }

      return param.toString();
    }
    /**
     * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
     * NOTE: query parameters are not handled here.
     * @param {String} path The path to append to the base URL.
     * @param {Object} pathParams The parameter values to append.
     * @param {String} apiBasePath Base path defined in the path, operation level to override the default one
     * @returns {String} The encoded path with parameter values substituted.
     */

  }, {
    key: "buildUrl",
    value: function buildUrl(path, pathParams, apiBasePath) {
      var _this = this;

      if (!path.match(/^\//)) {
        path = '/' + path;
      }

      var url = this.basePath + path; // use API (operation, path) base path if defined

      if (apiBasePath !== null && apiBasePath !== undefined) {
        url = apiBasePath + path;
      }

      url = url.replace(/\{([\w-]+)\}/g, function (fullMatch, key) {
        var value;

        if (pathParams.hasOwnProperty(key)) {
          value = _this.paramToString(pathParams[key]);
        } else {
          value = fullMatch;
        }

        return encodeURIComponent(value);
      });
      return url;
    }
    /**
    * Checks whether the given content type represents JSON.<br>
    * JSON content type examples:<br>
    * <ul>
    * <li>application/json</li>
    * <li>application/json; charset=UTF8</li>
    * <li>APPLICATION/JSON</li>
    * </ul>
    * @param {String} contentType The MIME content type to check.
    * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
    */

  }, {
    key: "isJsonMime",
    value: function isJsonMime(contentType) {
      return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
    }
    /**
    * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
    * @param {Array.<String>} contentTypes
    * @returns {String} The chosen content type, preferring JSON.
    */

  }, {
    key: "jsonPreferredMime",
    value: function jsonPreferredMime(contentTypes) {
      for (var i = 0; i < contentTypes.length; i++) {
        if (this.isJsonMime(contentTypes[i])) {
          return contentTypes[i];
        }
      }

      return contentTypes[0];
    }
    /**
    * Checks whether the given parameter value represents file-like content.
    * @param param The parameter to check.
    * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
    */

  }, {
    key: "isFileParam",
    value: function isFileParam(param) {
      // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
      if (typeof require === 'function') {
        var fs;

        try {
          fs = require('fs');
        } catch (err) {}

        if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
          return true;
        }
      } // Buffer in Node.js


      if (typeof Buffer === 'function' && param instanceof Buffer) {
        return true;
      } // Blob in browser


      if (typeof Blob === 'function' && param instanceof Blob) {
        return true;
      } // File in browser (it seems File object is also instance of Blob, but keep this for safe)


      if (typeof File === 'function' && param instanceof File) {
        return true;
      }

      return false;
    }
    /**
    * Normalizes parameter values:
    * <ul>
    * <li>remove nils</li>
    * <li>keep files and arrays</li>
    * <li>format to string with `paramToString` for other cases</li>
    * </ul>
    * @param {Object.<String, Object>} params The parameters as object properties.
    * @returns {Object.<String, Object>} normalized parameters.
    */

  }, {
    key: "normalizeParams",
    value: function normalizeParams(params) {
      var newParams = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
          var value = params[key];

          if (this.isFileParam(value) || Array.isArray(value)) {
            newParams[key] = value;
          } else {
            newParams[key] = this.paramToString(value);
          }
        }
      }

      return newParams;
    }
    /**
    * Builds a string representation of an array-type actual parameter, according to the given collection format.
    * @param {Array} param An array parameter.
    * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
    * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
    * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
    */

  }, {
    key: "buildCollectionParam",
    value: function buildCollectionParam(param, collectionFormat) {
      if (param == null) {
        return null;
      }

      switch (collectionFormat) {
        case 'csv':
          return param.map(this.paramToString).join(',');

        case 'ssv':
          return param.map(this.paramToString).join(' ');

        case 'tsv':
          return param.map(this.paramToString).join('\t');

        case 'pipes':
          return param.map(this.paramToString).join('|');

        case 'multi':
          //return the array directly as SuperAgent will handle it as expected
          return param.map(this.paramToString);

        default:
          throw new Error('Unknown collection format: ' + collectionFormat);
      }
    }
    /**
    * Applies authentication headers to the request.
    * @param {Object} request The request object created by a <code>superagent()</code> call.
    * @param {Array.<String>} authNames An array of authentication method names.
    */

  }, {
    key: "applyAuthToRequest",
    value: function applyAuthToRequest(request, authNames) {
      var _this2 = this;

      authNames.forEach(function (authName) {
        var auth = _this2.authentications[authName];

        switch (auth.type) {
          case 'basic':
            if (auth.username || auth.password) {
              request.auth(auth.username || '', auth.password || '');
            }

            break;

          case 'bearer':
            if (auth.accessToken) {
              request.set({
                'Authorization': 'Bearer ' + auth.accessToken
              });
            }

            break;

          case 'apiKey':
            if (auth.apiKey) {
              var data = {};

              if (auth.apiKeyPrefix) {
                data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
              } else {
                data[auth.name] = auth.apiKey;
              }

              if (auth['in'] === 'header') {
                request.set(data);
              } else {
                request.query(data);
              }
            }

            break;

          case 'oauth2':
            if (auth.accessToken) {
              request.set({
                'Authorization': 'Bearer ' + auth.accessToken
              });
            }

            break;

          default:
            throw new Error('Unknown authentication type: ' + auth.type);
        }
      });
    }
    /**
     * Deserializes an HTTP response body into a value of the specified type.
     * @param {Object} response A SuperAgent response object.
     * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
     * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
     * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
     * all properties on <code>data<code> will be converted to this type.
     * @returns A value of the specified type.
     */

  }, {
    key: "deserialize",
    value: function deserialize(response, returnType) {
      if (response == null || returnType == null || response.status == 204) {
        return null;
      } // Rely on SuperAgent for parsing response body.
      // See http://visionmedia.github.io/superagent/#parsing-response-bodies


      var data = response.body;

      if (data == null || _typeof(data) === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
      }

      return ApiClient.convertToType(data, returnType);
    }
    /**
     * Invokes the REST service using the supplied settings and parameters.
     * @param {String} path The base URL to invoke.
     * @param {String} httpMethod The HTTP method to use.
     * @param {Object.<String, String>} pathParams A map of path parameters and their values.
     * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
     * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
     * @param {Object.<String, Object>} formParams A map of form parameters and their values.
     * @param {Object} bodyParam The value to pass as the request body.
     * @param {Array.<String>} authNames An array of authentication type names.
     * @param {Array.<String>} contentTypes An array of request MIME types.
     * @param {Array.<String>} accepts An array of acceptable response MIME types.
     * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
     * constructor for a complex type.
     * @param {String} apiBasePath base path defined in the operation/path level to override the default one
     * @returns {Promise} A {@link https://www.promisejs.org/|Promise} object.
     */

  }, {
    key: "callApi",
    value: function callApi(path, httpMethod, pathParams, queryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts, returnType, apiBasePath) {
      var _this3 = this;

      var url = this.buildUrl(path, pathParams, apiBasePath);
      var request = (0, _superagent["default"])(httpMethod, url);

      if (this.plugins !== null) {
        for (var index in this.plugins) {
          if (this.plugins.hasOwnProperty(index)) {
            request.use(this.plugins[index]);
          }
        }
      } // apply authentications


      this.applyAuthToRequest(request, authNames); // set query parameters

      if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
      }

      request.query(this.normalizeParams(queryParams)); // set header parameters

      request.set(this.defaultHeaders).set(this.normalizeParams(headerParams)); // set requestAgent if it is set by user

      if (this.requestAgent) {
        request.agent(this.requestAgent);
      } // set request timeout


      request.timeout(this.timeout);
      var contentType = this.jsonPreferredMime(contentTypes);

      if (contentType) {
        // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
        if (contentType != 'multipart/form-data') {
          request.type(contentType);
        }
      } else if (!request.header['Content-Type']) {
        request.type('application/json');
      }

      if (contentType === 'application/x-www-form-urlencoded') {
        request.send(_querystring["default"].stringify(this.normalizeParams(formParams)));
      } else if (contentType == 'multipart/form-data') {
        var _formParams = this.normalizeParams(formParams);

        for (var key in _formParams) {
          if (_formParams.hasOwnProperty(key)) {
            if (this.isFileParam(_formParams[key])) {
              // file field
              request.attach(key, _formParams[key]);
            } else {
              request.field(key, _formParams[key]);
            }
          }
        }
      } else if (bodyParam !== null && bodyParam !== undefined) {
        request.send(bodyParam);
      }

      var accept = this.jsonPreferredMime(accepts);

      if (accept) {
        request.accept(accept);
      }

      if (returnType === 'Blob') {
        request.responseType('blob');
      } else if (returnType === 'String') {
        request.responseType('string');
      } // Attach previously saved cookies, if enabled


      if (this.enableCookies) {
        if (typeof window === 'undefined') {
          this.agent._attachCookies(request);
        } else {
          request.withCredentials();
        }
      }

      return new Promise(function (resolve, reject) {
        request.end(function (error, response) {
          if (error) {
            var err = {};

            if (response) {
              err.status = response.status;
              err.statusText = response.statusText;
              err.body = response.body;
              err.response = response;
            }

            err.error = error;
            reject(err);
          } else {
            try {
              var data = _this3.deserialize(response, returnType);

              if (_this3.enableCookies && typeof window === 'undefined') {
                _this3.agent._saveCookies(response);
              }

              resolve({
                data: data,
                response: response
              });
            } catch (err) {
              reject(err);
            }
          }
        });
      });
    }
    /**
    * Parses an ISO-8601 string representation of a date value.
    * @param {String} str The date value as a string.
    * @returns {Date} The parsed date object.
    */

  }, {
    key: "hostSettings",

    /**
      * Gets an array of host settings
      * @returns An array of host settings
      */
    value: function hostSettings() {
      return [{
        'url': "https://lilt.com/2",
        'description': "No description provided"
      }];
    }
  }, {
    key: "getBasePathFromSettings",
    value: function getBasePathFromSettings(index) {
      var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var servers = this.hostSettings(); // check array index out of bound

      if (index < 0 || index >= servers.length) {
        throw new Error("Invalid index " + index + " when selecting the host settings. Must be less than " + servers.length);
      }

      var server = servers[index];
      var url = server['url']; // go through variable and assign a value

      for (var variable_name in server['variables']) {
        if (variable_name in variables) {
          var variable = server['variables'][variable_name];

          if (!('enum_values' in variable) || variable['enum_values'].includes(variables[variable_name])) {
            url = url.replace("{" + variable_name + "}", variables[variable_name]);
          } else {
            throw new Error("The variable `" + variable_name + "` in the host URL has invalid value " + variables[variable_name] + ". Must be " + server['variables'][variable_name]['enum_values'] + ".");
          }
        } else {
          // use default value
          url = url.replace("{" + variable_name + "}", server['variables'][variable_name]['default_value']);
        }
      }

      return url;
    }
    /**
    * Constructs a new map or array model from REST data.
    * @param data {Object|Array} The REST data.
    * @param obj {Object|Array} The target object or array.
    */

  }], [{
    key: "parseDate",
    value: function parseDate(str) {
      return new Date(str);
    }
    /**
    * Converts a value to the specified type.
    * @param {(String|Object)} data The data to convert, as a string or object.
    * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
    * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
    * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
    * all properties on <code>data<code> will be converted to this type.
    * @returns An instance of the specified type or null or undefined if data is null or undefined.
    */

  }, {
    key: "convertToType",
    value: function convertToType(data, type) {
      if (data === null || data === undefined) return data;

      switch (type) {
        case 'Boolean':
          return Boolean(data);

        case 'Integer':
          return parseInt(data, 10);

        case 'Number':
          return parseFloat(data);

        case 'String':
          return String(data);

        case 'Date':
          return ApiClient.parseDate(String(data));

        case 'Blob':
          return data;

        default:
          if (type === Object) {
            // generic object, return directly
            return data;
          } else if (typeof type.constructFromObject === 'function') {
            // for model type like User and enum class
            return type.constructFromObject(data);
          } else if (Array.isArray(type)) {
            // for array type like: ['String']
            var itemType = type[0];
            return data.map(function (item) {
              return ApiClient.convertToType(item, itemType);
            });
          } else if (_typeof(type) === 'object') {
            // for plain object type like: {'String': 'Integer'}
            var keyType, valueType;

            for (var k in type) {
              if (type.hasOwnProperty(k)) {
                keyType = k;
                valueType = type[k];
                break;
              }
            }

            var result = {};

            for (var k in data) {
              if (data.hasOwnProperty(k)) {
                var key = ApiClient.convertToType(k, keyType);
                var value = ApiClient.convertToType(data[k], valueType);
                result[key] = value;
              }
            }

            return result;
          } else {
            // for unknown type, return the data directly
            return data;
          }

      }
    }
  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj, itemType) {
      if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          if (data.hasOwnProperty(i)) obj[i] = ApiClient.convertToType(data[i], itemType);
        }
      } else {
        for (var k in data) {
          if (data.hasOwnProperty(k)) obj[k] = ApiClient.convertToType(data[k], itemType);
        }
      }
    }
  }]);

  return ApiClient;
}();
/**
 * Enumeration of collection format separator strategies.
 * @enum {String}
 * @readonly
 */


ApiClient.CollectionFormatEnum = {
  /**
   * Comma-separated values. Value: <code>csv</code>
   * @const
   */
  CSV: ',',

  /**
   * Space-separated values. Value: <code>ssv</code>
   * @const
   */
  SSV: ' ',

  /**
   * Tab-separated values. Value: <code>tsv</code>
   * @const
   */
  TSV: '\t',

  /**
   * Pipe(|)-separated values. Value: <code>pipes</code>
   * @const
   */
  PIPES: '|',

  /**
   * Native array. Value: <code>multi</code>
   * @const
   */
  MULTI: 'multi'
};
/**
* The default API client implementation.
* @type {module:ApiClient}
*/

ApiClient.instance = new ApiClient();
var _default = ApiClient;
exports["default"] = _default;
}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":88,"fs":87,"querystring":95,"superagent":78}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Connector = _interopRequireDefault(require("../model/Connector"));

var _ConnectorArguments = _interopRequireDefault(require("../model/ConnectorArguments"));

var _ConnectorDeleteResponse = _interopRequireDefault(require("../model/ConnectorDeleteResponse"));

var _Error = _interopRequireDefault(require("../model/Error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Connectors service.
* @module api/ConnectorsApi
* @version 0.5.0
*/
var ConnectorsApi = /*#__PURE__*/function () {
  /**
  * Constructs a new ConnectorsApi. 
  * @alias module:api/ConnectorsApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function ConnectorsApi(apiClient) {
    _classCallCheck(this, ConnectorsApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Upload a Connector
   * Create a new connector linked to a supported external cms. 
   * @param {module:model/Connector} body 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Connector} and HTTP response
   */


  _createClass(ConnectorsApi, [{
    key: "createConnectorWithHttpInfo",
    value: function createConnectorWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling createConnector");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Connector["default"];
      return this.apiClient.callApi('/connectors', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Upload a Connector
     * Create a new connector linked to a supported external cms. 
     * @param {module:model/Connector} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Connector}
     */

  }, {
    key: "createConnector",
    value: function createConnector(body) {
      return this.createConnectorWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete a Connector
     * Delete a Connector.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/connectors?key=API_KEY&id=123 ```  
     * @param {Number} id A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ConnectorDeleteResponse} and HTTP response
     */

  }, {
    key: "deleteConnectorWithHttpInfo",
    value: function deleteConnectorWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling deleteConnector");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _ConnectorDeleteResponse["default"];
      return this.apiClient.callApi('/connectors', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a Connector
     * Delete a Connector.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/connectors?key=API_KEY&id=123 ```  
     * @param {Number} id A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ConnectorDeleteResponse}
     */

  }, {
    key: "deleteConnector",
    value: function deleteConnector(id) {
      return this.deleteConnectorWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a Connector
     * Retrieves one or more connectors available to your user. Connectors are not associated with a project or a memory.  To retrieve a specific connector, specify the <strong>id</strong> request parameter. To retrieve all connectors, omit the <strong>id</strong> request parameter.  Example cURL command: ```  curl -X GET https://lilt.com/2/connectors?key=API_KEY&id=274```
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<module:model/Connector>} and HTTP response
     */

  }, {
    key: "getConnectorsWithHttpInfo",
    value: function getConnectorsWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = null;
      var pathParams = {};
      var queryParams = {
        'id': opts['id']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [_Connector["default"]];
      return this.apiClient.callApi('/connectors', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a Connector
     * Retrieves one or more connectors available to your user. Connectors are not associated with a project or a memory.  To retrieve a specific connector, specify the <strong>id</strong> request parameter. To retrieve all connectors, omit the <strong>id</strong> request parameter.  Example cURL command: ```  curl -X GET https://lilt.com/2/connectors?key=API_KEY&id=274```
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:model/Connector>}
     */

  }, {
    key: "getConnectors",
    value: function getConnectors(opts) {
      return this.getConnectorsWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Upload a Connector
     * Create a new connector linked to a supported external content source. 
     * @param {module:model/ConnectorArguments} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Connector} and HTTP response
     */

  }, {
    key: "updateConnectorWithHttpInfo",
    value: function updateConnectorWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateConnector");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Connector["default"];
      return this.apiClient.callApi('/connectors', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Upload a Connector
     * Create a new connector linked to a supported external content source. 
     * @param {module:model/ConnectorArguments} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Connector}
     */

  }, {
    key: "updateConnector",
    value: function updateConnector(body) {
      return this.updateConnectorWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return ConnectorsApi;
}();

exports["default"] = ConnectorsApi;
},{"../ApiClient":3,"../model/Connector":19,"../model/ConnectorArguments":20,"../model/ConnectorDeleteResponse":21,"../model/Error":35}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentAssignmentParameters = _interopRequireDefault(require("../model/DocumentAssignmentParameters"));

var _DocumentAssignmentResponse = _interopRequireDefault(require("../model/DocumentAssignmentResponse"));

var _DocumentDeleteResponse = _interopRequireDefault(require("../model/DocumentDeleteResponse"));

var _DocumentParameters = _interopRequireDefault(require("../model/DocumentParameters"));

var _DocumentPretranslateParameters = _interopRequireDefault(require("../model/DocumentPretranslateParameters"));

var _DocumentPretranslateResponse = _interopRequireDefault(require("../model/DocumentPretranslateResponse"));

var _DocumentUpdateParameters = _interopRequireDefault(require("../model/DocumentUpdateParameters"));

var _DocumentWithSegments = _interopRequireDefault(require("../model/DocumentWithSegments"));

var _Error = _interopRequireDefault(require("../model/Error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Documents service.
* @module api/DocumentsApi
* @version 0.5.0
*/
var DocumentsApi = /*#__PURE__*/function () {
  /**
  * Constructs a new DocumentsApi. 
  * @alias module:api/DocumentsApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function DocumentsApi(apiClient) {
    _classCallCheck(this, DocumentsApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Assign a Document
   * Assign and unassign a Document for translation and/or review.  
   * @param {module:model/DocumentAssignmentParameters} body 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentAssignmentResponse} and HTTP response
   */


  _createClass(DocumentsApi, [{
    key: "assignDocumentWithHttpInfo",
    value: function assignDocumentWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling assignDocument");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _DocumentAssignmentResponse["default"];
      return this.apiClient.callApi('/documents/share', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Assign a Document
     * Assign and unassign a Document for translation and/or review.  
     * @param {module:model/DocumentAssignmentParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentAssignmentResponse}
     */

  }, {
    key: "assignDocument",
    value: function assignDocument(body) {
      return this.assignDocumentWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Create a Document
     * Create a new Document. A Document is a collection of one or more Segments. Documents are nested inside of Projects, and appear in the Project details view in the web app. Document-level relationships between Segments are considered by the machine translation system during adaptation. If there is no inherent document structure in your data, you still might consider grouping related Segments into Documents to improve translation quality. 
     * @param {Object} opts Optional parameters
     * @param {module:model/DocumentParameters} opts.body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentWithSegments} and HTTP response
     */

  }, {
    key: "createDocumentWithHttpInfo",
    value: function createDocumentWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = opts['body'];
      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _DocumentWithSegments["default"];
      return this.apiClient.callApi('/documents', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Create a Document
     * Create a new Document. A Document is a collection of one or more Segments. Documents are nested inside of Projects, and appear in the Project details view in the web app. Document-level relationships between Segments are considered by the machine translation system during adaptation. If there is no inherent document structure in your data, you still might consider grouping related Segments into Documents to improve translation quality. 
     * @param {Object} opts Optional parameters
     * @param {module:model/DocumentParameters} opts.body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentWithSegments}
     */

  }, {
    key: "createDocument",
    value: function createDocument(opts) {
      return this.createDocumentWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete a Document
     * Delete a Document. 
     * @param {Number} id A unique Document identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentDeleteResponse} and HTTP response
     */

  }, {
    key: "deleteDocumentWithHttpInfo",
    value: function deleteDocumentWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling deleteDocument");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _DocumentDeleteResponse["default"];
      return this.apiClient.callApi('/documents', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a Document
     * Delete a Document. 
     * @param {Number} id A unique Document identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentDeleteResponse}
     */

  }, {
    key: "deleteDocument",
    value: function deleteDocument(id) {
      return this.deleteDocumentWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Download a Document
     * Export a Document that has been translated in the Lilt web application. Any Document can be downloaded in XLIFF 1.2 format, or can be retrieved in its original uploaded format by setting `is_xliff=false`. This endpoint will fail if either (a) export or (b) pre-translation operations are in-progress. The status of those operations can be determined by retrieving the Document resource. Example CURL command: ```   curl -X GET https://lilt.com/2/documents/files?key=API_KEY&id=274 -o from_lilt.xliff ```  
     * @param {Number} id An unique Document identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.isXliff Download the document in XLIFF 1.2 format. (default to true)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Blob} and HTTP response
     */

  }, {
    key: "downloadDocumentWithHttpInfo",
    value: function downloadDocumentWithHttpInfo(id, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling downloadDocument");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'is_xliff': opts['isXliff']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/octet-stream'];
      var returnType = 'Blob';
      return this.apiClient.callApi('/documents/files', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Download a Document
     * Export a Document that has been translated in the Lilt web application. Any Document can be downloaded in XLIFF 1.2 format, or can be retrieved in its original uploaded format by setting `is_xliff=false`. This endpoint will fail if either (a) export or (b) pre-translation operations are in-progress. The status of those operations can be determined by retrieving the Document resource. Example CURL command: ```   curl -X GET https://lilt.com/2/documents/files?key=API_KEY&id=274 -o from_lilt.xliff ```  
     * @param {Number} id An unique Document identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.isXliff Download the document in XLIFF 1.2 format. (default to true)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Blob}
     */

  }, {
    key: "downloadDocument",
    value: function downloadDocument(id, opts) {
      return this.downloadDocumentWithHttpInfo(id, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a Document
     * List a Document.  The listing will include the pretranslation status for the document. When pretranslation is in progress for a document, the `GET /documents` endpoint's response will include `is_pretranslating = true` as well as a more detailed status property `status.pretranslation` one of `idle`, `pending`, or `running`.
     * @param {Number} id A unique Document identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.withSegments Flag indicating whether full segment information should be returned.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentWithSegments} and HTTP response
     */

  }, {
    key: "getDocumentWithHttpInfo",
    value: function getDocumentWithHttpInfo(id, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling getDocument");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'with_segments': opts['withSegments']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _DocumentWithSegments["default"];
      return this.apiClient.callApi('/documents', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a Document
     * List a Document.  The listing will include the pretranslation status for the document. When pretranslation is in progress for a document, the `GET /documents` endpoint's response will include `is_pretranslating = true` as well as a more detailed status property `status.pretranslation` one of `idle`, `pending`, or `running`.
     * @param {Number} id A unique Document identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.withSegments Flag indicating whether full segment information should be returned.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentWithSegments}
     */

  }, {
    key: "getDocument",
    value: function getDocument(id, opts) {
      return this.getDocumentWithHttpInfo(id, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Pretranslate a Document
     * Initiate pretranslation of a list of Documents. This request will mark document(s) as being pretranslated. Pretranslation in this context is: - Applying and confirming exact TM matches based on the Memory of the Project; - Translating all other segments via MT without confirming them.  Example cURL command: ``` curl -X POST https://lilt.com/2/documents/pretranslate?key=API_KEY -d {\"id\": [123]} -H \"Content-Type: application/json\" ```  Document translation is an asynchronous process that, in effect, is performed in the background.  To check the status of pretranslation for a document, use the `GET /documents` endpoint. When pretranslation is in progress for a document, the `GET /documents` endpoint's response will include `is_pretranslating = true` as well as a more detailed status property `status.pretranslation` one of `idle`, `pending`, or `running`.  Once pretranslation is finished, the document can be downloaded via `GET /documents/files`. 
     * @param {module:model/DocumentPretranslateParameters} body 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.autoAccept Optional parameter for auto-accepting 100% TM hits.
     * @param {Boolean} opts.caseSensitive Optional for using case matching against TM hits.
     * @param {Boolean} opts.attributeToCreator Optional parameter for attributing translation authorship of exact matches to document creator.
     * @param {String} opts.mode An optional parameter indicating how the document will be pretranslated.  The accepted values are `tm`, or `tm+mt`. Default is `tm+mt`. 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentPretranslateResponse} and HTTP response
     */

  }, {
    key: "pretranslateDocumentsWithHttpInfo",
    value: function pretranslateDocumentsWithHttpInfo(body, opts) {
      opts = opts || {};
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling pretranslateDocuments");
      }

      var pathParams = {};
      var queryParams = {
        'auto_accept': opts['autoAccept'],
        'case_sensitive': opts['caseSensitive'],
        'attribute_to_creator': opts['attributeToCreator'],
        'mode': opts['mode']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _DocumentPretranslateResponse["default"];
      return this.apiClient.callApi('/documents/pretranslate', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Pretranslate a Document
     * Initiate pretranslation of a list of Documents. This request will mark document(s) as being pretranslated. Pretranslation in this context is: - Applying and confirming exact TM matches based on the Memory of the Project; - Translating all other segments via MT without confirming them.  Example cURL command: ``` curl -X POST https://lilt.com/2/documents/pretranslate?key=API_KEY -d {\"id\": [123]} -H \"Content-Type: application/json\" ```  Document translation is an asynchronous process that, in effect, is performed in the background.  To check the status of pretranslation for a document, use the `GET /documents` endpoint. When pretranslation is in progress for a document, the `GET /documents` endpoint's response will include `is_pretranslating = true` as well as a more detailed status property `status.pretranslation` one of `idle`, `pending`, or `running`.  Once pretranslation is finished, the document can be downloaded via `GET /documents/files`. 
     * @param {module:model/DocumentPretranslateParameters} body 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.autoAccept Optional parameter for auto-accepting 100% TM hits.
     * @param {Boolean} opts.caseSensitive Optional for using case matching against TM hits.
     * @param {Boolean} opts.attributeToCreator Optional parameter for attributing translation authorship of exact matches to document creator.
     * @param {String} opts.mode An optional parameter indicating how the document will be pretranslated.  The accepted values are `tm`, or `tm+mt`. Default is `tm+mt`. 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentPretranslateResponse}
     */

  }, {
    key: "pretranslateDocuments",
    value: function pretranslateDocuments(body, opts) {
      return this.pretranslateDocumentsWithHttpInfo(body, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update a Document
     * Update a Document. 
     * @param {module:model/DocumentUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentWithSegments} and HTTP response
     */

  }, {
    key: "updateDocumentWithHttpInfo",
    value: function updateDocumentWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateDocument");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _DocumentWithSegments["default"];
      return this.apiClient.callApi('/documents', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update a Document
     * Update a Document. 
     * @param {module:model/DocumentUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentWithSegments}
     */

  }, {
    key: "updateDocument",
    value: function updateDocument(body) {
      return this.updateDocumentWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Upload a File
     * Create a Document from a file in any of the formats [documented in our knowledge base](https://support.lilt.com/hc/en-us/articles/360020816253-File-Formats). Request parameters should be passed as JSON object with the header  field `LILT-API`. Example CURL command: ```   curl -X POST https://lilt.com/2/documents/files?key=API_KEY \\   --header \"LILT-API: {\\\"name\\\": \\\"introduction.xliff\\\",\\\"pretranslate\\\": \\\"tm+mt\\\",\\\"project_id\\\": 9}\" \\   --header \"Content-Type: application/octet-stream\" \\   --data-binary @Introduction.xliff ```  
     * @param {String} name A file name.
     * @param {Number} projectId A unique Project identifier.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file. 
     * @param {Object} opts Optional parameters
     * @param {String} opts.pretranslate An optional parameter indicating if and how the document will be pretranslated upon being uploaded.  The accepted values are `null`, `tm`, or `tm+mt` 
     * @param {Boolean} opts.autoAccept An optional parameter to auto-accept segments with 100% translation memory matches when the `pretranslate` option is also set, or to auto-accept any target data that is present when the uploaded file is XLIFF. If omitted or set to `false`, no segments will be auto-accepted. 
     * @param {Number} opts.configId An optional pararameter to specify an import configuration to be applied when extracting translatable content from this file. 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/DocumentWithSegments} and HTTP response
     */

  }, {
    key: "uploadDocumentWithHttpInfo",
    value: function uploadDocumentWithHttpInfo(name, projectId, body, opts) {
      opts = opts || {};
      var postBody = body; // verify the required parameter 'name' is set

      if (name === undefined || name === null) {
        throw new _Error["default"]("Missing the required parameter 'name' when calling uploadDocument");
      } // verify the required parameter 'projectId' is set


      if (projectId === undefined || projectId === null) {
        throw new _Error["default"]("Missing the required parameter 'projectId' when calling uploadDocument");
      } // verify the required parameter 'body' is set


      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling uploadDocument");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {
        'name': name,
        'project_id': projectId,
        'pretranslate': opts['pretranslate'],
        'auto_accept': opts['autoAccept'],
        'config_id': opts['configId']
      };
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/octet-stream'];
      var accepts = ['application/json'];
      var returnType = _DocumentWithSegments["default"];
      return this.apiClient.callApi('/documents/files', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Upload a File
     * Create a Document from a file in any of the formats [documented in our knowledge base](https://support.lilt.com/hc/en-us/articles/360020816253-File-Formats). Request parameters should be passed as JSON object with the header  field `LILT-API`. Example CURL command: ```   curl -X POST https://lilt.com/2/documents/files?key=API_KEY \\   --header \"LILT-API: {\\\"name\\\": \\\"introduction.xliff\\\",\\\"pretranslate\\\": \\\"tm+mt\\\",\\\"project_id\\\": 9}\" \\   --header \"Content-Type: application/octet-stream\" \\   --data-binary @Introduction.xliff ```  
     * @param {String} name A file name.
     * @param {Number} projectId A unique Project identifier.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file. 
     * @param {Object} opts Optional parameters
     * @param {String} opts.pretranslate An optional parameter indicating if and how the document will be pretranslated upon being uploaded.  The accepted values are `null`, `tm`, or `tm+mt` 
     * @param {Boolean} opts.autoAccept An optional parameter to auto-accept segments with 100% translation memory matches when the `pretranslate` option is also set, or to auto-accept any target data that is present when the uploaded file is XLIFF. If omitted or set to `false`, no segments will be auto-accepted. 
     * @param {Number} opts.configId An optional pararameter to specify an import configuration to be applied when extracting translatable content from this file. 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/DocumentWithSegments}
     */

  }, {
    key: "uploadDocument",
    value: function uploadDocument(name, projectId, body, opts) {
      return this.uploadDocumentWithHttpInfo(name, projectId, body, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return DocumentsApi;
}();

exports["default"] = DocumentsApi;
},{"../ApiClient":3,"../model/DocumentAssignmentParameters":22,"../model/DocumentAssignmentResponse":23,"../model/DocumentDeleteResponse":24,"../model/DocumentParameters":25,"../model/DocumentPretranslateParameters":26,"../model/DocumentPretranslateResponse":27,"../model/DocumentUpdateParameters":31,"../model/DocumentWithSegments":32,"../model/Error":35}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _FileDeleteResponse = _interopRequireDefault(require("../model/FileDeleteResponse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Files service.
* @module api/FilesApi
* @version 0.5.0
*/
var FilesApi = /*#__PURE__*/function () {
  /**
  * Constructs a new FilesApi. 
  * @alias module:api/FilesApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function FilesApi(apiClient) {
    _classCallCheck(this, FilesApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Delete a File
   * Delete a File.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/files?key=API_KEY&id=123 ```  
   * @param {Number} id A unique File identifier.
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/FileDeleteResponse} and HTTP response
   */


  _createClass(FilesApi, [{
    key: "deleteFileWithHttpInfo",
    value: function deleteFileWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling deleteFile");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _FileDeleteResponse["default"];
      return this.apiClient.callApi('/files', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a File
     * Delete a File.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/files?key=API_KEY&id=123 ```  
     * @param {Number} id A unique File identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/FileDeleteResponse}
     */

  }, {
    key: "deleteFile",
    value: function deleteFile(id) {
      return this.deleteFileWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a File
     * Retrieves one or more files available to your user. Files are not associated with a project or a memory. They are unprocessed and can be used later in the project/document creation workflow step.  To retrieve a specific file, specify the <strong>id</strong> request parameter. To retrieve all files, omit the <strong>id</strong> request parameter.  Example cURL command: ```  curl -X GET https://lilt.com/2/files?key=API_KEY&id=274```
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique File identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<File>} and HTTP response
     */

  }, {
    key: "getFilesWithHttpInfo",
    value: function getFilesWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = null;
      var pathParams = {};
      var queryParams = {
        'id': opts['id']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [File];
      return this.apiClient.callApi('/files', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a File
     * Retrieves one or more files available to your user. Files are not associated with a project or a memory. They are unprocessed and can be used later in the project/document creation workflow step.  To retrieve a specific file, specify the <strong>id</strong> request parameter. To retrieve all files, omit the <strong>id</strong> request parameter.  Example cURL command: ```  curl -X GET https://lilt.com/2/files?key=API_KEY&id=274```
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique File identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<File>}
     */

  }, {
    key: "getFiles",
    value: function getFiles(opts) {
      return this.getFilesWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Upload a File
     * Upload a File in any of the formats [documented in our knowledge base](https://support.lilt.com/hc/en-us/articles/360020816253-File-Formats). Request parameters should be passed in as query string parameters.  When uploading a file, any parameters needed to issue a request to the specified export_uri can be encoded in the export_uri itself as query parameters. Typical examples of parameters that may be required are an access token to authorize requests to a third-party HTTP API and the unique identifier of a resource available via the third-party HTTP API that corresponds to the file. An example export_uri that encodes a target resource identifier (i.e., source_id) of an associated resource behind a third party HTTP API is given in the cURL command below.  Example cURL command: ```   curl -X POST https://lilt.com/2/files?key=API_KEY&name=en_US.json&export_uri=https://example.com/export?source_id=12345 \\   --header \"Content-Type: application/octet-stream\" \\   --data-binary @en_US.json ``` Calls to GET /files are used to monitor the language detection results. The API response will be augmented to include detected language and confidence score.  The language detection will complete asynchronously. Prior to completion, the `detected_lang` value will be `zxx`, the reserved ISO 639-2 code for \"No linguistic content/not applicable\".  If the language can not be determined, or the detection process fails, the `detected_lang` field will return `und`, the reserved ISO 639-2 code for undetermined language, and the `detected_lang_confidence` score will be `0`.  
     * @param {String} name A file name.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {String} opts.exportUri A webhook endpoint that will export the translated document back to the source repository.
     * @param {String} opts.fileHash A hash value to associate with the file. The MD5 hash of the body contents will be used by default if a value isn't provided.
     * @param {Boolean} opts.langId Flag indicating whether to perform language detection on the uploaded file. Default is false.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link File} and HTTP response
     */

  }, {
    key: "uploadFileWithHttpInfo",
    value: function uploadFileWithHttpInfo(name, body, opts) {
      opts = opts || {};
      var postBody = body; // verify the required parameter 'name' is set

      if (name === undefined || name === null) {
        throw new _Error["default"]("Missing the required parameter 'name' when calling uploadFile");
      } // verify the required parameter 'body' is set


      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling uploadFile");
      }

      var pathParams = {};
      var queryParams = {
        'name': name,
        'export_uri': opts['exportUri'],
        'file_hash': opts['fileHash'],
        'langId': opts['langId']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/octet-stream'];
      var accepts = ['application/json'];
      var returnType = File;
      return this.apiClient.callApi('/files', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Upload a File
     * Upload a File in any of the formats [documented in our knowledge base](https://support.lilt.com/hc/en-us/articles/360020816253-File-Formats). Request parameters should be passed in as query string parameters.  When uploading a file, any parameters needed to issue a request to the specified export_uri can be encoded in the export_uri itself as query parameters. Typical examples of parameters that may be required are an access token to authorize requests to a third-party HTTP API and the unique identifier of a resource available via the third-party HTTP API that corresponds to the file. An example export_uri that encodes a target resource identifier (i.e., source_id) of an associated resource behind a third party HTTP API is given in the cURL command below.  Example cURL command: ```   curl -X POST https://lilt.com/2/files?key=API_KEY&name=en_US.json&export_uri=https://example.com/export?source_id=12345 \\   --header \"Content-Type: application/octet-stream\" \\   --data-binary @en_US.json ``` Calls to GET /files are used to monitor the language detection results. The API response will be augmented to include detected language and confidence score.  The language detection will complete asynchronously. Prior to completion, the `detected_lang` value will be `zxx`, the reserved ISO 639-2 code for \"No linguistic content/not applicable\".  If the language can not be determined, or the detection process fails, the `detected_lang` field will return `und`, the reserved ISO 639-2 code for undetermined language, and the `detected_lang_confidence` score will be `0`.  
     * @param {String} name A file name.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {String} opts.exportUri A webhook endpoint that will export the translated document back to the source repository.
     * @param {String} opts.fileHash A hash value to associate with the file. The MD5 hash of the body contents will be used by default if a value isn't provided.
     * @param {Boolean} opts.langId Flag indicating whether to perform language detection on the uploaded file. Default is false.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link File}
     */

  }, {
    key: "uploadFile",
    value: function uploadFile(name, body, opts) {
      return this.uploadFileWithHttpInfo(name, body, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return FilesApi;
}();

exports["default"] = FilesApi;
},{"../ApiClient":3,"../model/Error":35,"../model/FileDeleteResponse":37}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _LanguagesResponse = _interopRequireDefault(require("../model/LanguagesResponse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Languages service.
* @module api/LanguagesApi
* @version 0.5.0
*/
var LanguagesApi = /*#__PURE__*/function () {
  /**
  * Constructs a new LanguagesApi. 
  * @alias module:api/LanguagesApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function LanguagesApi(apiClient) {
    _classCallCheck(this, LanguagesApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Retrieve supported languages
   * Get a list of supported languages.  
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/LanguagesResponse} and HTTP response
   */


  _createClass(LanguagesApi, [{
    key: "getLanguagesWithHttpInfo",
    value: function getLanguagesWithHttpInfo() {
      var postBody = null;
      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _LanguagesResponse["default"];
      return this.apiClient.callApi('/languages', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve supported languages
     * Get a list of supported languages.  
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/LanguagesResponse}
     */

  }, {
    key: "getLanguages",
    value: function getLanguages() {
      return this.getLanguagesWithHttpInfo().then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return LanguagesApi;
}();

exports["default"] = LanguagesApi;
},{"../ApiClient":3,"../model/Error":35,"../model/LanguagesResponse":38}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _LexiconEntry = _interopRequireDefault(require("../model/LexiconEntry"));

var _LexiconUpdateParameters = _interopRequireDefault(require("../model/LexiconUpdateParameters"));

var _LexiconUpdateResponse = _interopRequireDefault(require("../model/LexiconUpdateResponse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Lexicon service.
* @module api/LexiconApi
* @version 0.5.0
*/
var LexiconApi = /*#__PURE__*/function () {
  /**
  * Constructs a new LexiconApi. 
  * @alias module:api/LexiconApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function LexiconApi(apiClient) {
    _classCallCheck(this, LexiconApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Query a Lexicon
   * Query the Lexicon. The Lexicon is an editable termbase / concordance that is integrated with the Memory.  
   * @param {Number} memoryId A unique Memory identifier.
   * @param {String} srclang An ISO 639-1 language code.
   * @param {String} trglang An ISO 639-1 language code.
   * @param {String} query The query term.
   * @param {Object} opts Optional parameters
   * @param {Number} opts.n The maximum number of results to return. (default to 1)
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<module:model/LexiconEntry>} and HTTP response
   */


  _createClass(LexiconApi, [{
    key: "queryLexiconWithHttpInfo",
    value: function queryLexiconWithHttpInfo(memoryId, srclang, trglang, query, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'memoryId' is set

      if (memoryId === undefined || memoryId === null) {
        throw new _Error["default"]("Missing the required parameter 'memoryId' when calling queryLexicon");
      } // verify the required parameter 'srclang' is set


      if (srclang === undefined || srclang === null) {
        throw new _Error["default"]("Missing the required parameter 'srclang' when calling queryLexicon");
      } // verify the required parameter 'trglang' is set


      if (trglang === undefined || trglang === null) {
        throw new _Error["default"]("Missing the required parameter 'trglang' when calling queryLexicon");
      } // verify the required parameter 'query' is set


      if (query === undefined || query === null) {
        throw new _Error["default"]("Missing the required parameter 'query' when calling queryLexicon");
      }

      var pathParams = {};
      var queryParams = {
        'memory_id': memoryId,
        'srclang': srclang,
        'trglang': trglang,
        'query': query,
        'n': opts['n']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [_LexiconEntry["default"]];
      return this.apiClient.callApi('/lexicon', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Query a Lexicon
     * Query the Lexicon. The Lexicon is an editable termbase / concordance that is integrated with the Memory.  
     * @param {Number} memoryId A unique Memory identifier.
     * @param {String} srclang An ISO 639-1 language code.
     * @param {String} trglang An ISO 639-1 language code.
     * @param {String} query The query term.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.n The maximum number of results to return. (default to 1)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:model/LexiconEntry>}
     */

  }, {
    key: "queryLexicon",
    value: function queryLexicon(memoryId, srclang, trglang, query, opts) {
      return this.queryLexiconWithHttpInfo(memoryId, srclang, trglang, query, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update a Lexicon
     * Update the Lexicon (Termbase as displayed in the ui) with a new term. The maximum source length is 250 characters.  
     * @param {module:model/LexiconUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/LexiconUpdateResponse} and HTTP response
     */

  }, {
    key: "updateLexiconWithHttpInfo",
    value: function updateLexiconWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateLexicon");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _LexiconUpdateResponse["default"];
      return this.apiClient.callApi('/lexicon', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update a Lexicon
     * Update the Lexicon (Termbase as displayed in the ui) with a new term. The maximum source length is 250 characters.  
     * @param {module:model/LexiconUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/LexiconUpdateResponse}
     */

  }, {
    key: "updateLexicon",
    value: function updateLexicon(body) {
      return this.updateLexiconWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return LexiconApi;
}();

exports["default"] = LexiconApi;
},{"../ApiClient":3,"../model/Error":35,"../model/LexiconEntry":39,"../model/LexiconUpdateParameters":44,"../model/LexiconUpdateResponse":45}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _Memory = _interopRequireDefault(require("../model/Memory"));

var _MemoryCreateParameters = _interopRequireDefault(require("../model/MemoryCreateParameters"));

var _MemoryDeleteResponse = _interopRequireDefault(require("../model/MemoryDeleteResponse"));

var _MemoryImportResponse = _interopRequireDefault(require("../model/MemoryImportResponse"));

var _MemoryInsertResponse = _interopRequireDefault(require("../model/MemoryInsertResponse"));

var _MemoryUpdateParameters = _interopRequireDefault(require("../model/MemoryUpdateParameters"));

var _MemoryUpdateResponse = _interopRequireDefault(require("../model/MemoryUpdateResponse"));

var _TranslationMemoryEntry = _interopRequireDefault(require("../model/TranslationMemoryEntry"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Memories service.
* @module api/MemoriesApi
* @version 0.5.0
*/
var MemoriesApi = /*#__PURE__*/function () {
  /**
  * Constructs a new MemoriesApi. 
  * @alias module:api/MemoriesApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function MemoriesApi(apiClient) {
    _classCallCheck(this, MemoriesApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Create a Memory
   * Create a new Memory. A Memory is a container that collects source/target sentences for a specific language pair (e.g., English>French). The data in the Memory is used to train the MT system, populate the TM, and update the lexicon. Memories are private to your account - the data is not shared across users - unless you explicitly share a Memory with your team (via web app only).  <a href=\"https://lilt.com/kb/memory/memories\" target=_blank>Refer to our KB</a> for a more detailed description.  
   * @param {module:model/MemoryCreateParameters} body 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Memory} and HTTP response
   */


  _createClass(MemoriesApi, [{
    key: "createMemoryWithHttpInfo",
    value: function createMemoryWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling createMemory");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Memory["default"];
      return this.apiClient.callApi('/memories', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Create a Memory
     * Create a new Memory. A Memory is a container that collects source/target sentences for a specific language pair (e.g., English>French). The data in the Memory is used to train the MT system, populate the TM, and update the lexicon. Memories are private to your account - the data is not shared across users - unless you explicitly share a Memory with your team (via web app only).  <a href=\"https://lilt.com/kb/memory/memories\" target=_blank>Refer to our KB</a> for a more detailed description.  
     * @param {module:model/MemoryCreateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Memory}
     */

  }, {
    key: "createMemory",
    value: function createMemory(body) {
      return this.createMemoryWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete a Memory
     * Delete a Memory. 
     * @param {Number} id A unique Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MemoryDeleteResponse} and HTTP response
     */

  }, {
    key: "deleteMemoryWithHttpInfo",
    value: function deleteMemoryWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling deleteMemory");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _MemoryDeleteResponse["default"];
      return this.apiClient.callApi('/memories', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a Memory
     * Delete a Memory. 
     * @param {Number} id A unique Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MemoryDeleteResponse}
     */

  }, {
    key: "deleteMemory",
    value: function deleteMemory(id) {
      return this.deleteMemoryWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a Memory
     * Retrieve a Memory. If you cannot access the Memory (401 error) please check permissions (e.g. in case you created the Memory via the web app with a different account you may have to explicitly share that Memory).  
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id An optional Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<module:model/Memory>} and HTTP response
     */

  }, {
    key: "getMemoryWithHttpInfo",
    value: function getMemoryWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = null;
      var pathParams = {};
      var queryParams = {
        'id': opts['id']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [_Memory["default"]];
      return this.apiClient.callApi('/memories', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a Memory
     * Retrieve a Memory. If you cannot access the Memory (401 error) please check permissions (e.g. in case you created the Memory via the web app with a different account you may have to explicitly share that Memory).  
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id An optional Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:model/Memory>}
     */

  }, {
    key: "getMemory",
    value: function getMemory(opts) {
      return this.getMemoryWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * File import for a Memory
     * Imports common translation memory or termbase file formats to a specific Lilt memory. Currently supported file formats are `*.tmx`, `*.sdltm` and `*.tmq` for TM data; `*.csv` and `*.tbx` for termbase data. Request parameters should be passed as JSON object with the header field `LILT-API`.  Example cURL command to upload a translation memory file named `my_memory.sdltm` in the current working directory: ```   curl -X POST https://lilt.com/2/memories/import?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.sdltm\\\",\\\"memory_id\\\": 42}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.sdltm ```  
     * @param {Number} memoryId A unique Memory identifier.
     * @param {String} name Name of the TM or termbase file.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MemoryImportResponse} and HTTP response
     */

  }, {
    key: "importMemoryFileWithHttpInfo",
    value: function importMemoryFileWithHttpInfo(memoryId, name, body) {
      var postBody = body; // verify the required parameter 'memoryId' is set

      if (memoryId === undefined || memoryId === null) {
        throw new _Error["default"]("Missing the required parameter 'memoryId' when calling importMemoryFile");
      } // verify the required parameter 'name' is set


      if (name === undefined || name === null) {
        throw new _Error["default"]("Missing the required parameter 'name' when calling importMemoryFile");
      } // verify the required parameter 'body' is set


      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling importMemoryFile");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {
        'memory_id': memoryId,
        'name': name
      };
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/octet-stream'];
      var accepts = ['application/json'];
      var returnType = _MemoryImportResponse["default"];
      return this.apiClient.callApi('/memories/import', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * File import for a Memory
     * Imports common translation memory or termbase file formats to a specific Lilt memory. Currently supported file formats are `*.tmx`, `*.sdltm` and `*.tmq` for TM data; `*.csv` and `*.tbx` for termbase data. Request parameters should be passed as JSON object with the header field `LILT-API`.  Example cURL command to upload a translation memory file named `my_memory.sdltm` in the current working directory: ```   curl -X POST https://lilt.com/2/memories/import?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.sdltm\\\",\\\"memory_id\\\": 42}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.sdltm ```  
     * @param {Number} memoryId A unique Memory identifier.
     * @param {String} name Name of the TM or termbase file.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MemoryImportResponse}
     */

  }, {
    key: "importMemoryFile",
    value: function importMemoryFile(memoryId, name, body) {
      return this.importMemoryFileWithHttpInfo(memoryId, name, body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Query a Memory
     * Perform a translation memory query.  
     * @param {Number} id A unique Memory identifier.
     * @param {String} query A source query.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.n Maximum number of results to return. (default to 10)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<module:model/TranslationMemoryEntry>} and HTTP response
     */

  }, {
    key: "queryMemoryWithHttpInfo",
    value: function queryMemoryWithHttpInfo(id, query, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling queryMemory");
      } // verify the required parameter 'query' is set


      if (query === undefined || query === null) {
        throw new _Error["default"]("Missing the required parameter 'query' when calling queryMemory");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'query': query,
        'n': opts['n']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [_TranslationMemoryEntry["default"]];
      return this.apiClient.callApi('/memories/query', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Query a Memory
     * Perform a translation memory query.  
     * @param {Number} id A unique Memory identifier.
     * @param {String} query A source query.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.n Maximum number of results to return. (default to 10)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:model/TranslationMemoryEntry>}
     */

  }, {
    key: "queryMemory",
    value: function queryMemory(id, query, opts) {
      return this.queryMemoryWithHttpInfo(id, query, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete-sync for a Memory
     * Deletes segments in the Memory matching the `from_time`, `to_time` and `when` parameters.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/memories/sync?key=API_KEY&id=42&from_time=1491048000&to_time=1491049800&when=created ```  
     * @param {Number} id A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MemoryInsertResponse} and HTTP response
     */

  }, {
    key: "syncDeleteMemoryWithHttpInfo",
    value: function syncDeleteMemoryWithHttpInfo(id, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling syncDeleteMemory");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'from_time': opts['fromTime'],
        'to_time': opts['toTime'],
        'when': opts['when']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _MemoryInsertResponse["default"];
      return this.apiClient.callApi('/memories/sync', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete-sync for a Memory
     * Deletes segments in the Memory matching the `from_time`, `to_time` and `when` parameters.  Example CURL command: ```   curl -X DELETE https://lilt.com/2/memories/sync?key=API_KEY&id=42&from_time=1491048000&to_time=1491049800&when=created ```  
     * @param {Number} id A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MemoryInsertResponse}
     */

  }, {
    key: "syncDeleteMemory",
    value: function syncDeleteMemory(id, opts) {
      return this.syncDeleteMemoryWithHttpInfo(id, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Get-sync for a Memory
     * Get all or part of a memory in TMX 1.4b format. If the `from_time` and/or `to_time` are omitted, then all segments are returned. The parameter `when` specifies on which date field `from_time` and `to_time` are matched. Possible values are `created` (when the segment was originally created in the memory), `updated` (when the segment was lastly updated), and `deleted` (when the segment was deleted).  Example CURL command: ```   curl -X GET https://lilt.com/2/memories/sync?key=API_KEY&id=42 -o from_lilt.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`. If this parameter is omitted, then the whole Memory is returned.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Blob} and HTTP response
     */

  }, {
    key: "syncDownMemoryWithHttpInfo",
    value: function syncDownMemoryWithHttpInfo(id, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling syncDownMemory");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'from_time': opts['fromTime'],
        'to_time': opts['toTime'],
        'when': opts['when']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/x-tmx'];
      var returnType = 'Blob';
      return this.apiClient.callApi('/memories/sync', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Get-sync for a Memory
     * Get all or part of a memory in TMX 1.4b format. If the `from_time` and/or `to_time` are omitted, then all segments are returned. The parameter `when` specifies on which date field `from_time` and `to_time` are matched. Possible values are `created` (when the segment was originally created in the memory), `updated` (when the segment was lastly updated), and `deleted` (when the segment was deleted).  Example CURL command: ```   curl -X GET https://lilt.com/2/memories/sync?key=API_KEY&id=42 -o from_lilt.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`. If this parameter is omitted, then the whole Memory is returned.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Blob}
     */

  }, {
    key: "syncDownMemory",
    value: function syncDownMemory(id, opts) {
      return this.syncDownMemoryWithHttpInfo(id, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Insert-sync for a Memory
     * Inserts a TM in TMX 1.4b format into the Memory. Request parameters should be passed as JSON object with the header field `LILT-API`.  Example CURL command: ```   curl -X POST https://lilt.com/2/memories/sync?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.tmx\\\",\\\"id\\\": 42}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {String} opts.name Name of the TMX file.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MemoryInsertResponse} and HTTP response
     */

  }, {
    key: "syncInsertMemoryWithHttpInfo",
    value: function syncInsertMemoryWithHttpInfo(id, body, opts) {
      opts = opts || {};
      var postBody = body; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling syncInsertMemory");
      } // verify the required parameter 'body' is set


      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling syncInsertMemory");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {
        'id': id,
        'name': opts['name']
      };
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/octet-stream'];
      var accepts = ['application/json'];
      var returnType = _MemoryInsertResponse["default"];
      return this.apiClient.callApi('/memories/sync', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Insert-sync for a Memory
     * Inserts a TM in TMX 1.4b format into the Memory. Request parameters should be passed as JSON object with the header field `LILT-API`.  Example CURL command: ```   curl -X POST https://lilt.com/2/memories/sync?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.tmx\\\",\\\"id\\\": 42}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {String} body The file contents to be uploaded. The entire POST body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {String} opts.name Name of the TMX file.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MemoryInsertResponse}
     */

  }, {
    key: "syncInsertMemory",
    value: function syncInsertMemory(id, body, opts) {
      return this.syncInsertMemoryWithHttpInfo(id, body, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update-sync for a Memory
     * Updates the Memory with given TMX file. Request parameters should be passed as JSON object with the header field `LILT-API`. The number of segments returned by the `from_time`, `to_time`, `when` parameters and the number of segments in the TMX file need to be identical.  Example CURL command: ```   curl -X PUT https://lilt.com/2/memories/sync?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.tmx\\\", \\\"id\\\": 42, \\\"from_time\\\": 1491048000, \\\"to_time\\\": 1491049800, \"when\": \"Updated\"}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {String} body The file contents to be uploaded. The entire PUT body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/MemoryUpdateResponse} and HTTP response
     */

  }, {
    key: "syncUpdateMemoryWithHttpInfo",
    value: function syncUpdateMemoryWithHttpInfo(id, body, opts) {
      opts = opts || {};
      var postBody = body; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling syncUpdateMemory");
      } // verify the required parameter 'body' is set


      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling syncUpdateMemory");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {
        'id': id,
        'from_time': opts['fromTime'],
        'to_time': opts['toTime'],
        'when': opts['when']
      };
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _MemoryUpdateResponse["default"];
      return this.apiClient.callApi('/memories/sync', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update-sync for a Memory
     * Updates the Memory with given TMX file. Request parameters should be passed as JSON object with the header field `LILT-API`. The number of segments returned by the `from_time`, `to_time`, `when` parameters and the number of segments in the TMX file need to be identical.  Example CURL command: ```   curl -X PUT https://lilt.com/2/memories/sync?key=API_KEY \\     --header \"LILT-API: {\\\"name\\\": \\\"my_memory.tmx\\\", \\\"id\\\": 42, \\\"from_time\\\": 1491048000, \\\"to_time\\\": 1491049800, \"when\": \"Updated\"}\" \\     --header \"Content-Type: application/octet-stream\" \\     --data-binary @my_memory.tmx ```  
     * @param {Number} id A unique Memory identifier.
     * @param {String} body The file contents to be uploaded. The entire PUT body will be treated as the file.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of the start of the Memory section.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of the end of the Memory section.
     * @param {String} opts.when The date field on which retrieved segments match from/to time stamps: `created`, `updated`, `deleted`.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/MemoryUpdateResponse}
     */

  }, {
    key: "syncUpdateMemory",
    value: function syncUpdateMemory(id, body, opts) {
      return this.syncUpdateMemoryWithHttpInfo(id, body, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update the name of a Memory
     * Update a Memory. 
     * @param {module:model/MemoryUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Memory} and HTTP response
     */

  }, {
    key: "updateMemoryWithHttpInfo",
    value: function updateMemoryWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateMemory");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Memory["default"];
      return this.apiClient.callApi('/memories', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update the name of a Memory
     * Update a Memory. 
     * @param {module:model/MemoryUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Memory}
     */

  }, {
    key: "updateMemory",
    value: function updateMemory(body) {
      return this.updateMemoryWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return MemoriesApi;
}();

exports["default"] = MemoriesApi;
},{"../ApiClient":3,"../model/Error":35,"../model/Memory":47,"../model/MemoryCreateParameters":48,"../model/MemoryDeleteResponse":49,"../model/MemoryImportResponse":50,"../model/MemoryInsertResponse":51,"../model/MemoryUpdateParameters":52,"../model/MemoryUpdateResponse":53,"../model/TranslationMemoryEntry":77}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _Project = _interopRequireDefault(require("../model/Project"));

var _ProjectCreateParameters = _interopRequireDefault(require("../model/ProjectCreateParameters"));

var _ProjectDeleteResponse = _interopRequireDefault(require("../model/ProjectDeleteResponse"));

var _ProjectQuote = _interopRequireDefault(require("../model/ProjectQuote"));

var _ProjectStatus = _interopRequireDefault(require("../model/ProjectStatus"));

var _ProjectUpdateResponse = _interopRequireDefault(require("../model/ProjectUpdateResponse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Projects service.
* @module api/ProjectsApi
* @version 0.5.0
*/
var ProjectsApi = /*#__PURE__*/function () {
  /**
  * Constructs a new ProjectsApi. 
  * @alias module:api/ProjectsApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function ProjectsApi(apiClient) {
    _classCallCheck(this, ProjectsApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Create a Project
   * Create a Project. A Project is a collection of Documents.  A Project is associated with exactly one Memory.  Projects appear in the dashboard of the web app.  
   * @param {module:model/ProjectCreateParameters} body 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Project} and HTTP response
   */


  _createClass(ProjectsApi, [{
    key: "createProjectWithHttpInfo",
    value: function createProjectWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling createProject");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Project["default"];
      return this.apiClient.callApi('/projects', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Create a Project
     * Create a Project. A Project is a collection of Documents.  A Project is associated with exactly one Memory.  Projects appear in the dashboard of the web app.  
     * @param {module:model/ProjectCreateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Project}
     */

  }, {
    key: "createProject",
    value: function createProject(body) {
      return this.createProjectWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete a Project
     * Delete a Project. 
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ProjectDeleteResponse} and HTTP response
     */

  }, {
    key: "deleteProjectWithHttpInfo",
    value: function deleteProjectWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = null;
      var pathParams = {};
      var queryParams = {
        'id': opts['id']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _ProjectDeleteResponse["default"];
      return this.apiClient.callApi('/projects', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a Project
     * Delete a Project. 
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ProjectDeleteResponse}
     */

  }, {
    key: "deleteProject",
    value: function deleteProject(opts) {
      return this.deleteProjectWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve Project report
     * Get information about a project that can be used for quoting. This includes: * A translation memory leverage report * Word count * Segment count  
     * @param {Number} id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ProjectQuote} and HTTP response
     */

  }, {
    key: "getProjectReportWithHttpInfo",
    value: function getProjectReportWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling getProjectReport");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _ProjectQuote["default"];
      return this.apiClient.callApi('/projects/quote', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve Project report
     * Get information about a project that can be used for quoting. This includes: * A translation memory leverage report * Word count * Segment count  
     * @param {Number} id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ProjectQuote}
     */

  }, {
    key: "getProjectReport",
    value: function getProjectReport(id) {
      return this.getProjectReportWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve Project status
     * Retrieve the status of a Project.  
     * @param {Number} id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ProjectStatus} and HTTP response
     */

  }, {
    key: "getProjectStatusWithHttpInfo",
    value: function getProjectStatusWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling getProjectStatus");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _ProjectStatus["default"];
      return this.apiClient.callApi('/projects/status', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve Project status
     * Retrieve the status of a Project.  
     * @param {Number} id A unique Project identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ProjectStatus}
     */

  }, {
    key: "getProjectStatus",
    value: function getProjectStatus(id) {
      return this.getProjectStatusWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a Project
     * Retrieves one or more projects, including the documents associated with each project. Retrieving a project is the most efficient way to retrieve a single project or a list of all available projects.  To retrieve a specific project, specify the `id` request parameter. To retrieve all projects, omit the `id` request parameter. To limit the retrieved projects to those with a particular source language or target language, specify the corresponding ISO 639-1 language codes in the `srclang` and `trglang` request parameters, respectively.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Project identifier.
     * @param {String} opts.srclang An ISO 639-1 language code.
     * @param {String} opts.trglang An ISO 639-1 language code.
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of Projects with `created_at` greater than or equal to the value.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of Projects with `created_at` less than the value.
     * @param {String} opts.state A project state (backlog, inProgress, inReview, inQA, done).
     * @param {Boolean} opts.archived A flag that toggles whether to include archived projects in the response (the default is `true`).
     * @param {Number} opts.connectorId A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link Array.<module:model/Project>} and HTTP response
     */

  }, {
    key: "getProjectsWithHttpInfo",
    value: function getProjectsWithHttpInfo(opts) {
      opts = opts || {};
      var postBody = null;
      var pathParams = {};
      var queryParams = {
        'id': opts['id'],
        'srclang': opts['srclang'],
        'trglang': opts['trglang'],
        'from_time': opts['fromTime'],
        'to_time': opts['toTime'],
        'state': opts['state'],
        'archived': opts['archived'],
        'connector_id': opts['connectorId']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = [_Project["default"]];
      return this.apiClient.callApi('/projects', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a Project
     * Retrieves one or more projects, including the documents associated with each project. Retrieving a project is the most efficient way to retrieve a single project or a list of all available projects.  To retrieve a specific project, specify the `id` request parameter. To retrieve all projects, omit the `id` request parameter. To limit the retrieved projects to those with a particular source language or target language, specify the corresponding ISO 639-1 language codes in the `srclang` and `trglang` request parameters, respectively.
     * @param {Object} opts Optional parameters
     * @param {Number} opts.id A unique Project identifier.
     * @param {String} opts.srclang An ISO 639-1 language code.
     * @param {String} opts.trglang An ISO 639-1 language code.
     * @param {Number} opts.fromTime Unix time stamp (epoch, in seconds) of Projects with `created_at` greater than or equal to the value.
     * @param {Number} opts.toTime Unix time stamp (epoch, in seconds) of Projects with `created_at` less than the value.
     * @param {String} opts.state A project state (backlog, inProgress, inReview, inQA, done).
     * @param {Boolean} opts.archived A flag that toggles whether to include archived projects in the response (the default is `true`).
     * @param {Number} opts.connectorId A unique Connector identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link Array.<module:model/Project>}
     */

  }, {
    key: "getProjects",
    value: function getProjects(opts) {
      return this.getProjectsWithHttpInfo(opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update a Project
     * Update a Project. 
     * @param {module:model/ProjectUpdateResponse} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Project} and HTTP response
     */

  }, {
    key: "updateProjectWithHttpInfo",
    value: function updateProjectWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateProject");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Project["default"];
      return this.apiClient.callApi('/projects', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update a Project
     * Update a Project. 
     * @param {module:model/ProjectUpdateResponse} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Project}
     */

  }, {
    key: "updateProject",
    value: function updateProject(body) {
      return this.updateProjectWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return ProjectsApi;
}();

exports["default"] = ProjectsApi;
},{"../ApiClient":3,"../model/Error":35,"../model/Project":54,"../model/ProjectCreateParameters":55,"../model/ProjectDeleteResponse":56,"../model/ProjectQuote":57,"../model/ProjectStatus":58,"../model/ProjectUpdateResponse":59}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _QARuleMatches = _interopRequireDefault(require("../model/QARuleMatches"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* QA service.
* @module api/QAApi
* @version 0.5.0
*/
var QAApi = /*#__PURE__*/function () {
  /**
  * Constructs a new QAApi. 
  * @alias module:api/QAApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function QAApi(apiClient) {
    _classCallCheck(this, QAApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Perform QA check
   * Perform QA checks on a target string. Optionally, you can specify a source string for additional bilingual checks, e.g. number consistency. 
   * @param {String} target A target string to be checked.
   * @param {String} trglang An ISO 639-1 language code.
   * @param {Object} opts Optional parameters
   * @param {String} opts.source An optional source string.
   * @param {String} opts.srclang An ISO 639-1 language code.
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/QARuleMatches} and HTTP response
   */


  _createClass(QAApi, [{
    key: "qaCheckWithHttpInfo",
    value: function qaCheckWithHttpInfo(target, trglang, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'target' is set

      if (target === undefined || target === null) {
        throw new _Error["default"]("Missing the required parameter 'target' when calling qaCheck");
      } // verify the required parameter 'trglang' is set


      if (trglang === undefined || trglang === null) {
        throw new _Error["default"]("Missing the required parameter 'trglang' when calling qaCheck");
      }

      var pathParams = {};
      var queryParams = {
        'target': target,
        'trglang': trglang,
        'source': opts['source'],
        'srclang': opts['srclang']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _QARuleMatches["default"];
      return this.apiClient.callApi('/qa', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Perform QA check
     * Perform QA checks on a target string. Optionally, you can specify a source string for additional bilingual checks, e.g. number consistency. 
     * @param {String} target A target string to be checked.
     * @param {String} trglang An ISO 639-1 language code.
     * @param {Object} opts Optional parameters
     * @param {String} opts.source An optional source string.
     * @param {String} opts.srclang An ISO 639-1 language code.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/QARuleMatches}
     */

  }, {
    key: "qaCheck",
    value: function qaCheck(target, trglang, opts) {
      return this.qaCheckWithHttpInfo(target, trglang, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return QAApi;
}();

exports["default"] = QAApi;
},{"../ApiClient":3,"../model/Error":35,"../model/QARuleMatches":60}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _ApiRoot = _interopRequireDefault(require("../model/ApiRoot"));

var _Error = _interopRequireDefault(require("../model/Error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Root service.
* @module api/RootApi
* @version 0.5.0
*/
var RootApi = /*#__PURE__*/function () {
  /**
  * Constructs a new RootApi. 
  * @alias module:api/RootApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function RootApi(apiClient) {
    _classCallCheck(this, RootApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Retrieve the REST API root
   * This resource does not have any attributes. It lists the name of the REST API.  This endpoint can be used to verify REST API keys and to check the availability of the REST API.  
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/ApiRoot} and HTTP response
   */


  _createClass(RootApi, [{
    key: "rootWithHttpInfo",
    value: function rootWithHttpInfo() {
      var postBody = null;
      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _ApiRoot["default"];
      return this.apiClient.callApi('/', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve the REST API root
     * This resource does not have any attributes. It lists the name of the REST API.  This endpoint can be used to verify REST API keys and to check the availability of the REST API.  
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/ApiRoot}
     */

  }, {
    key: "root",
    value: function root() {
      return this.rootWithHttpInfo().then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return RootApi;
}();

exports["default"] = RootApi;
},{"../ApiClient":3,"../model/ApiRoot":17,"../model/Error":35}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _Segment = _interopRequireDefault(require("../model/Segment"));

var _SegmentCreateParameters = _interopRequireDefault(require("../model/SegmentCreateParameters"));

var _SegmentDeleteResponse = _interopRequireDefault(require("../model/SegmentDeleteResponse"));

var _SegmentUpdateParameters = _interopRequireDefault(require("../model/SegmentUpdateParameters"));

var _SegmentWithComments = _interopRequireDefault(require("../model/SegmentWithComments"));

var _TaggedSegment = _interopRequireDefault(require("../model/TaggedSegment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Segments service.
* @module api/SegmentsApi
* @version 0.5.0
*/
var SegmentsApi = /*#__PURE__*/function () {
  /**
  * Constructs a new SegmentsApi. 
  * @alias module:api/SegmentsApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function SegmentsApi(apiClient) {
    _classCallCheck(this, SegmentsApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Create a Segment
   * Create a Segment and add it to a Memory. A Segment is a source/target pair that is used to train the machine translation system and populate the translation memory. This is not intended to be used on documents and will throw an error.  The maximum source length is 5,000 characters.  
   * @param {module:model/SegmentCreateParameters} body 
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Segment} and HTTP response
   */


  _createClass(SegmentsApi, [{
    key: "createSegmentWithHttpInfo",
    value: function createSegmentWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling createSegment");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Segment["default"];
      return this.apiClient.callApi('/segments', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Create a Segment
     * Create a Segment and add it to a Memory. A Segment is a source/target pair that is used to train the machine translation system and populate the translation memory. This is not intended to be used on documents and will throw an error.  The maximum source length is 5,000 characters.  
     * @param {module:model/SegmentCreateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Segment}
     */

  }, {
    key: "createSegment",
    value: function createSegment(body) {
      return this.createSegmentWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Delete a Segment
     * Delete a Segment from memory. This will not delete a segment from a document. 
     * @param {Number} id A unique Segment identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SegmentDeleteResponse} and HTTP response
     */

  }, {
    key: "deleteSegmentWithHttpInfo",
    value: function deleteSegmentWithHttpInfo(id) {
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling deleteSegment");
      }

      var pathParams = {};
      var queryParams = {
        'id': id
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _SegmentDeleteResponse["default"];
      return this.apiClient.callApi('/segments', 'DELETE', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Delete a Segment
     * Delete a Segment from memory. This will not delete a segment from a document. 
     * @param {Number} id A unique Segment identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SegmentDeleteResponse}
     */

  }, {
    key: "deleteSegment",
    value: function deleteSegment(id) {
      return this.deleteSegmentWithHttpInfo(id).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Retrieve a Segment
     * Retrieve a Segment.  
     * @param {Number} id A unique Segment identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.includeComments Include comments in the response. (default to false)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/SegmentWithComments} and HTTP response
     */

  }, {
    key: "getSegmentWithHttpInfo",
    value: function getSegmentWithHttpInfo(id, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'id' is set

      if (id === undefined || id === null) {
        throw new _Error["default"]("Missing the required parameter 'id' when calling getSegment");
      }

      var pathParams = {};
      var queryParams = {
        'id': id,
        'include_comments': opts['includeComments']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _SegmentWithComments["default"];
      return this.apiClient.callApi('/segments', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Retrieve a Segment
     * Retrieve a Segment.  
     * @param {Number} id A unique Segment identifier.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.includeComments Include comments in the response. (default to false)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/SegmentWithComments}
     */

  }, {
    key: "getSegment",
    value: function getSegment(id, opts) {
      return this.getSegmentWithHttpInfo(id, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Tag a Segment
     * Project tags for a segment. The `source_tagged` string contains one or more SGML tags. The `target` string is untagged. This endpoint will automatically place the source tags in the target.  Usage charges apply to this endpoint for production REST API keys.  
     * @param {String} sourceTagged The tagged source string.
     * @param {String} target The target string.
     * @param {Number} memoryId A unique Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/TaggedSegment} and HTTP response
     */

  }, {
    key: "tagSegmentWithHttpInfo",
    value: function tagSegmentWithHttpInfo(sourceTagged, target, memoryId) {
      var postBody = null; // verify the required parameter 'sourceTagged' is set

      if (sourceTagged === undefined || sourceTagged === null) {
        throw new _Error["default"]("Missing the required parameter 'sourceTagged' when calling tagSegment");
      } // verify the required parameter 'target' is set


      if (target === undefined || target === null) {
        throw new _Error["default"]("Missing the required parameter 'target' when calling tagSegment");
      } // verify the required parameter 'memoryId' is set


      if (memoryId === undefined || memoryId === null) {
        throw new _Error["default"]("Missing the required parameter 'memoryId' when calling tagSegment");
      }

      var pathParams = {};
      var queryParams = {
        'source_tagged': sourceTagged,
        'target': target,
        'memory_id': memoryId
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _TaggedSegment["default"];
      return this.apiClient.callApi('/segments/tag', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Tag a Segment
     * Project tags for a segment. The `source_tagged` string contains one or more SGML tags. The `target` string is untagged. This endpoint will automatically place the source tags in the target.  Usage charges apply to this endpoint for production REST API keys.  
     * @param {String} sourceTagged The tagged source string.
     * @param {String} target The target string.
     * @param {Number} memoryId A unique Memory identifier.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/TaggedSegment}
     */

  }, {
    key: "tagSegment",
    value: function tagSegment(sourceTagged, target, memoryId) {
      return this.tagSegmentWithHttpInfo(sourceTagged, target, memoryId).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Update a Segment
     * Update a Segment in memory. The Memory will be updated with the new target string.  
     * @param {module:model/SegmentUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/Segment} and HTTP response
     */

  }, {
    key: "updateSegmentWithHttpInfo",
    value: function updateSegmentWithHttpInfo(body) {
      var postBody = body; // verify the required parameter 'body' is set

      if (body === undefined || body === null) {
        throw new _Error["default"]("Missing the required parameter 'body' when calling updateSegment");
      }

      var pathParams = {};
      var queryParams = {};
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = _Segment["default"];
      return this.apiClient.callApi('/segments', 'PUT', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Update a Segment
     * Update a Segment in memory. The Memory will be updated with the new target string.  
     * @param {module:model/SegmentUpdateParameters} body 
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/Segment}
     */

  }, {
    key: "updateSegment",
    value: function updateSegment(body) {
      return this.updateSegmentWithHttpInfo(body).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return SegmentsApi;
}();

exports["default"] = SegmentsApi;
},{"../ApiClient":3,"../model/Error":35,"../model/Segment":68,"../model/SegmentCreateParameters":69,"../model/SegmentDeleteResponse":70,"../model/SegmentUpdateParameters":71,"../model/SegmentWithComments":72,"../model/TaggedSegment":73}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Error = _interopRequireDefault(require("../model/Error"));

var _TranslateRegisterResponse = _interopRequireDefault(require("../model/TranslateRegisterResponse"));

var _TranslationList = _interopRequireDefault(require("../model/TranslationList"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
* Translate service.
* @module api/TranslateApi
* @version 0.5.0
*/
var TranslateApi = /*#__PURE__*/function () {
  /**
  * Constructs a new TranslateApi. 
  * @alias module:api/TranslateApi
  * @class
  * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
  * default to {@link module:ApiClient#instance} if unspecified.
  */
  function TranslateApi(apiClient) {
    _classCallCheck(this, TranslateApi);

    this.apiClient = apiClient || _ApiClient["default"].instance;
  }
  /**
   * Register a segment
   * Register a source string for interactive translation. The `source_hash` value that is returned by this request is required by the `prefix` parameter for the translation endpoint. The maximum source length is 5,000 characters. Usage charges apply to this endpoint for production REST API keys.  
   * @param {String} source A source string to be registered.
   * @param {String} srclang An ISO 639-1 language code.
   * @param {String} trglang An ISO 639-1 language code.
   * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/TranslateRegisterResponse} and HTTP response
   */


  _createClass(TranslateApi, [{
    key: "registerSegmentWithHttpInfo",
    value: function registerSegmentWithHttpInfo(source, srclang, trglang) {
      var postBody = null; // verify the required parameter 'source' is set

      if (source === undefined || source === null) {
        throw new _Error["default"]("Missing the required parameter 'source' when calling registerSegment");
      } // verify the required parameter 'srclang' is set


      if (srclang === undefined || srclang === null) {
        throw new _Error["default"]("Missing the required parameter 'srclang' when calling registerSegment");
      } // verify the required parameter 'trglang' is set


      if (trglang === undefined || trglang === null) {
        throw new _Error["default"]("Missing the required parameter 'trglang' when calling registerSegment");
      }

      var pathParams = {};
      var queryParams = {
        'source': source,
        'srclang': srclang,
        'trglang': trglang
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _TranslateRegisterResponse["default"];
      return this.apiClient.callApi('/translate/register', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Register a segment
     * Register a source string for interactive translation. The `source_hash` value that is returned by this request is required by the `prefix` parameter for the translation endpoint. The maximum source length is 5,000 characters. Usage charges apply to this endpoint for production REST API keys.  
     * @param {String} source A source string to be registered.
     * @param {String} srclang An ISO 639-1 language code.
     * @param {String} trglang An ISO 639-1 language code.
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/TranslateRegisterResponse}
     */

  }, {
    key: "registerSegment",
    value: function registerSegment(source, srclang, trglang) {
      return this.registerSegmentWithHttpInfo(source, srclang, trglang).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
    /**
     * Translate a segment
     * Translate a source string.  Setting the `rich` parameter to `true` will change the response format to include additional information about each translation including a model score, word alignments,  and formatting information. The rich format can be seen in the example response on this page.  By default, this endpoint also returns translation memory (TM) fuzzy matches, along with associated scores. Fuzzy matches always appear ahead of machine translation output in the response.  The maximum source length is 5,000 characters.  Usage charges apply to this endpoint for production REST API keys.  
     * @param {Number} memoryId A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {String} opts.source The source text to be translated.
     * @param {Number} opts.sourceHash A source hash code.
     * @param {String} opts.prefix A target prefix.
     * @param {Number} opts.n Return top n translations (deprecated). (default to 1)
     * @param {Boolean} opts.rich Returns rich translation information (e.g., with word alignments). (default to false)
     * @param {Boolean} opts.tmMatches Include translation memory fuzzy matches. (default to true)
     * @param {Boolean} opts.projectTags Project tags. Projects tags in source to target if set to true. (default to false)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with an object containing data of type {@link module:model/TranslationList} and HTTP response
     */

  }, {
    key: "translateSegmentWithHttpInfo",
    value: function translateSegmentWithHttpInfo(memoryId, opts) {
      opts = opts || {};
      var postBody = null; // verify the required parameter 'memoryId' is set

      if (memoryId === undefined || memoryId === null) {
        throw new _Error["default"]("Missing the required parameter 'memoryId' when calling translateSegment");
      }

      var pathParams = {};
      var queryParams = {
        'memory_id': memoryId,
        'source': opts['source'],
        'source_hash': opts['sourceHash'],
        'prefix': opts['prefix'],
        'n': opts['n'],
        'rich': opts['rich'],
        'tm_matches': opts['tmMatches'],
        'project_tags': opts['projectTags']
      };
      var headerParams = {};
      var formParams = {};
      var authNames = ['ApiKeyAuth', 'BasicAuth'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = _TranslationList["default"];
      return this.apiClient.callApi('/translate', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, null);
    }
    /**
     * Translate a segment
     * Translate a source string.  Setting the `rich` parameter to `true` will change the response format to include additional information about each translation including a model score, word alignments,  and formatting information. The rich format can be seen in the example response on this page.  By default, this endpoint also returns translation memory (TM) fuzzy matches, along with associated scores. Fuzzy matches always appear ahead of machine translation output in the response.  The maximum source length is 5,000 characters.  Usage charges apply to this endpoint for production REST API keys.  
     * @param {Number} memoryId A unique Memory identifier.
     * @param {Object} opts Optional parameters
     * @param {String} opts.source The source text to be translated.
     * @param {Number} opts.sourceHash A source hash code.
     * @param {String} opts.prefix A target prefix.
     * @param {Number} opts.n Return top n translations (deprecated). (default to 1)
     * @param {Boolean} opts.rich Returns rich translation information (e.g., with word alignments). (default to false)
     * @param {Boolean} opts.tmMatches Include translation memory fuzzy matches. (default to true)
     * @param {Boolean} opts.projectTags Project tags. Projects tags in source to target if set to true. (default to false)
     * @return {Promise} a {@link https://www.promisejs.org/|Promise}, with data of type {@link module:model/TranslationList}
     */

  }, {
    key: "translateSegment",
    value: function translateSegment(memoryId, opts) {
      return this.translateSegmentWithHttpInfo(memoryId, opts).then(function (response_and_data) {
        return response_and_data.data;
      });
    }
  }]);

  return TranslateApi;
}();

exports["default"] = TranslateApi;
},{"../ApiClient":3,"../model/Error":35,"../model/TranslateRegisterResponse":74,"../model/TranslationList":76}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ApiClient", {
  enumerable: true,
  get: function get() {
    return _ApiClient["default"];
  }
});
Object.defineProperty(exports, "Annotation", {
  enumerable: true,
  get: function get() {
    return _Annotation["default"];
  }
});
Object.defineProperty(exports, "ApiRoot", {
  enumerable: true,
  get: function get() {
    return _ApiRoot["default"];
  }
});
Object.defineProperty(exports, "Comment", {
  enumerable: true,
  get: function get() {
    return _Comment["default"];
  }
});
Object.defineProperty(exports, "Connector", {
  enumerable: true,
  get: function get() {
    return _Connector["default"];
  }
});
Object.defineProperty(exports, "ConnectorArguments", {
  enumerable: true,
  get: function get() {
    return _ConnectorArguments["default"];
  }
});
Object.defineProperty(exports, "ConnectorDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _ConnectorDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "DocumentAssignmentParameters", {
  enumerable: true,
  get: function get() {
    return _DocumentAssignmentParameters["default"];
  }
});
Object.defineProperty(exports, "DocumentAssignmentResponse", {
  enumerable: true,
  get: function get() {
    return _DocumentAssignmentResponse["default"];
  }
});
Object.defineProperty(exports, "DocumentDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _DocumentDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "DocumentParameters", {
  enumerable: true,
  get: function get() {
    return _DocumentParameters["default"];
  }
});
Object.defineProperty(exports, "DocumentPretranslateParameters", {
  enumerable: true,
  get: function get() {
    return _DocumentPretranslateParameters["default"];
  }
});
Object.defineProperty(exports, "DocumentPretranslateResponse", {
  enumerable: true,
  get: function get() {
    return _DocumentPretranslateResponse["default"];
  }
});
Object.defineProperty(exports, "DocumentPretranslating", {
  enumerable: true,
  get: function get() {
    return _DocumentPretranslating["default"];
  }
});
Object.defineProperty(exports, "DocumentPretranslatingStatus", {
  enumerable: true,
  get: function get() {
    return _DocumentPretranslatingStatus["default"];
  }
});
Object.defineProperty(exports, "DocumentQuote", {
  enumerable: true,
  get: function get() {
    return _DocumentQuote["default"];
  }
});
Object.defineProperty(exports, "DocumentUpdateParameters", {
  enumerable: true,
  get: function get() {
    return _DocumentUpdateParameters["default"];
  }
});
Object.defineProperty(exports, "DocumentWithSegments", {
  enumerable: true,
  get: function get() {
    return _DocumentWithSegments["default"];
  }
});
Object.defineProperty(exports, "DocumentWithoutSegments", {
  enumerable: true,
  get: function get() {
    return _DocumentWithoutSegments["default"];
  }
});
Object.defineProperty(exports, "DocumentWithoutSegmentsStatus", {
  enumerable: true,
  get: function get() {
    return _DocumentWithoutSegmentsStatus["default"];
  }
});
Object.defineProperty(exports, "Error", {
  enumerable: true,
  get: function get() {
    return _Error["default"];
  }
});
Object.defineProperty(exports, "File", {
  enumerable: true,
  get: function get() {
    return _File["default"];
  }
});
Object.defineProperty(exports, "FileDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _FileDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "LanguagesResponse", {
  enumerable: true,
  get: function get() {
    return _LanguagesResponse["default"];
  }
});
Object.defineProperty(exports, "LexiconEntry", {
  enumerable: true,
  get: function get() {
    return _LexiconEntry["default"];
  }
});
Object.defineProperty(exports, "LexiconEntryExamples", {
  enumerable: true,
  get: function get() {
    return _LexiconEntryExamples["default"];
  }
});
Object.defineProperty(exports, "LexiconEntrySourceSpan", {
  enumerable: true,
  get: function get() {
    return _LexiconEntrySourceSpan["default"];
  }
});
Object.defineProperty(exports, "LexiconEntryTargetSpan", {
  enumerable: true,
  get: function get() {
    return _LexiconEntryTargetSpan["default"];
  }
});
Object.defineProperty(exports, "LexiconEntryTranslations", {
  enumerable: true,
  get: function get() {
    return _LexiconEntryTranslations["default"];
  }
});
Object.defineProperty(exports, "LexiconUpdateParameters", {
  enumerable: true,
  get: function get() {
    return _LexiconUpdateParameters["default"];
  }
});
Object.defineProperty(exports, "LexiconUpdateResponse", {
  enumerable: true,
  get: function get() {
    return _LexiconUpdateResponse["default"];
  }
});
Object.defineProperty(exports, "MatchBand", {
  enumerable: true,
  get: function get() {
    return _MatchBand["default"];
  }
});
Object.defineProperty(exports, "Memory", {
  enumerable: true,
  get: function get() {
    return _Memory["default"];
  }
});
Object.defineProperty(exports, "MemoryCreateParameters", {
  enumerable: true,
  get: function get() {
    return _MemoryCreateParameters["default"];
  }
});
Object.defineProperty(exports, "MemoryDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _MemoryDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "MemoryImportResponse", {
  enumerable: true,
  get: function get() {
    return _MemoryImportResponse["default"];
  }
});
Object.defineProperty(exports, "MemoryInsertResponse", {
  enumerable: true,
  get: function get() {
    return _MemoryInsertResponse["default"];
  }
});
Object.defineProperty(exports, "MemoryUpdateParameters", {
  enumerable: true,
  get: function get() {
    return _MemoryUpdateParameters["default"];
  }
});
Object.defineProperty(exports, "MemoryUpdateResponse", {
  enumerable: true,
  get: function get() {
    return _MemoryUpdateResponse["default"];
  }
});
Object.defineProperty(exports, "Project", {
  enumerable: true,
  get: function get() {
    return _Project["default"];
  }
});
Object.defineProperty(exports, "ProjectCreateParameters", {
  enumerable: true,
  get: function get() {
    return _ProjectCreateParameters["default"];
  }
});
Object.defineProperty(exports, "ProjectDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _ProjectDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "ProjectQuote", {
  enumerable: true,
  get: function get() {
    return _ProjectQuote["default"];
  }
});
Object.defineProperty(exports, "ProjectStatus", {
  enumerable: true,
  get: function get() {
    return _ProjectStatus["default"];
  }
});
Object.defineProperty(exports, "ProjectUpdateResponse", {
  enumerable: true,
  get: function get() {
    return _ProjectUpdateResponse["default"];
  }
});
Object.defineProperty(exports, "QARuleMatches", {
  enumerable: true,
  get: function get() {
    return _QARuleMatches["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesContext", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesContext["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesMatches", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesMatches["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesReplacements", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesReplacements["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesRule", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesRule["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesRuleCategory", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesRuleCategory["default"];
  }
});
Object.defineProperty(exports, "QARuleMatchesRuleUrls", {
  enumerable: true,
  get: function get() {
    return _QARuleMatchesRuleUrls["default"];
  }
});
Object.defineProperty(exports, "ResourceStatus", {
  enumerable: true,
  get: function get() {
    return _ResourceStatus["default"];
  }
});
Object.defineProperty(exports, "Segment", {
  enumerable: true,
  get: function get() {
    return _Segment["default"];
  }
});
Object.defineProperty(exports, "SegmentCreateParameters", {
  enumerable: true,
  get: function get() {
    return _SegmentCreateParameters["default"];
  }
});
Object.defineProperty(exports, "SegmentDeleteResponse", {
  enumerable: true,
  get: function get() {
    return _SegmentDeleteResponse["default"];
  }
});
Object.defineProperty(exports, "SegmentUpdateParameters", {
  enumerable: true,
  get: function get() {
    return _SegmentUpdateParameters["default"];
  }
});
Object.defineProperty(exports, "SegmentWithComments", {
  enumerable: true,
  get: function get() {
    return _SegmentWithComments["default"];
  }
});
Object.defineProperty(exports, "TaggedSegment", {
  enumerable: true,
  get: function get() {
    return _TaggedSegment["default"];
  }
});
Object.defineProperty(exports, "TranslateRegisterResponse", {
  enumerable: true,
  get: function get() {
    return _TranslateRegisterResponse["default"];
  }
});
Object.defineProperty(exports, "Translation", {
  enumerable: true,
  get: function get() {
    return _Translation["default"];
  }
});
Object.defineProperty(exports, "TranslationList", {
  enumerable: true,
  get: function get() {
    return _TranslationList["default"];
  }
});
Object.defineProperty(exports, "TranslationMemoryEntry", {
  enumerable: true,
  get: function get() {
    return _TranslationMemoryEntry["default"];
  }
});
Object.defineProperty(exports, "ConnectorsApi", {
  enumerable: true,
  get: function get() {
    return _ConnectorsApi["default"];
  }
});
Object.defineProperty(exports, "DocumentsApi", {
  enumerable: true,
  get: function get() {
    return _DocumentsApi["default"];
  }
});
Object.defineProperty(exports, "FilesApi", {
  enumerable: true,
  get: function get() {
    return _FilesApi["default"];
  }
});
Object.defineProperty(exports, "LanguagesApi", {
  enumerable: true,
  get: function get() {
    return _LanguagesApi["default"];
  }
});
Object.defineProperty(exports, "LexiconApi", {
  enumerable: true,
  get: function get() {
    return _LexiconApi["default"];
  }
});
Object.defineProperty(exports, "MemoriesApi", {
  enumerable: true,
  get: function get() {
    return _MemoriesApi["default"];
  }
});
Object.defineProperty(exports, "ProjectsApi", {
  enumerable: true,
  get: function get() {
    return _ProjectsApi["default"];
  }
});
Object.defineProperty(exports, "QAApi", {
  enumerable: true,
  get: function get() {
    return _QAApi["default"];
  }
});
Object.defineProperty(exports, "RootApi", {
  enumerable: true,
  get: function get() {
    return _RootApi["default"];
  }
});
Object.defineProperty(exports, "SegmentsApi", {
  enumerable: true,
  get: function get() {
    return _SegmentsApi["default"];
  }
});
Object.defineProperty(exports, "TranslateApi", {
  enumerable: true,
  get: function get() {
    return _TranslateApi["default"];
  }
});

var _ApiClient = _interopRequireDefault(require("./ApiClient"));

var _Annotation = _interopRequireDefault(require("./model/Annotation"));

var _ApiRoot = _interopRequireDefault(require("./model/ApiRoot"));

var _Comment = _interopRequireDefault(require("./model/Comment"));

var _Connector = _interopRequireDefault(require("./model/Connector"));

var _ConnectorArguments = _interopRequireDefault(require("./model/ConnectorArguments"));

var _ConnectorDeleteResponse = _interopRequireDefault(require("./model/ConnectorDeleteResponse"));

var _DocumentAssignmentParameters = _interopRequireDefault(require("./model/DocumentAssignmentParameters"));

var _DocumentAssignmentResponse = _interopRequireDefault(require("./model/DocumentAssignmentResponse"));

var _DocumentDeleteResponse = _interopRequireDefault(require("./model/DocumentDeleteResponse"));

var _DocumentParameters = _interopRequireDefault(require("./model/DocumentParameters"));

var _DocumentPretranslateParameters = _interopRequireDefault(require("./model/DocumentPretranslateParameters"));

var _DocumentPretranslateResponse = _interopRequireDefault(require("./model/DocumentPretranslateResponse"));

var _DocumentPretranslating = _interopRequireDefault(require("./model/DocumentPretranslating"));

var _DocumentPretranslatingStatus = _interopRequireDefault(require("./model/DocumentPretranslatingStatus"));

var _DocumentQuote = _interopRequireDefault(require("./model/DocumentQuote"));

var _DocumentUpdateParameters = _interopRequireDefault(require("./model/DocumentUpdateParameters"));

var _DocumentWithSegments = _interopRequireDefault(require("./model/DocumentWithSegments"));

var _DocumentWithoutSegments = _interopRequireDefault(require("./model/DocumentWithoutSegments"));

var _DocumentWithoutSegmentsStatus = _interopRequireDefault(require("./model/DocumentWithoutSegmentsStatus"));

var _Error = _interopRequireDefault(require("./model/Error"));

var _File = _interopRequireDefault(require("./model/File"));

var _FileDeleteResponse = _interopRequireDefault(require("./model/FileDeleteResponse"));

var _LanguagesResponse = _interopRequireDefault(require("./model/LanguagesResponse"));

var _LexiconEntry = _interopRequireDefault(require("./model/LexiconEntry"));

var _LexiconEntryExamples = _interopRequireDefault(require("./model/LexiconEntryExamples"));

var _LexiconEntrySourceSpan = _interopRequireDefault(require("./model/LexiconEntrySourceSpan"));

var _LexiconEntryTargetSpan = _interopRequireDefault(require("./model/LexiconEntryTargetSpan"));

var _LexiconEntryTranslations = _interopRequireDefault(require("./model/LexiconEntryTranslations"));

var _LexiconUpdateParameters = _interopRequireDefault(require("./model/LexiconUpdateParameters"));

var _LexiconUpdateResponse = _interopRequireDefault(require("./model/LexiconUpdateResponse"));

var _MatchBand = _interopRequireDefault(require("./model/MatchBand"));

var _Memory = _interopRequireDefault(require("./model/Memory"));

var _MemoryCreateParameters = _interopRequireDefault(require("./model/MemoryCreateParameters"));

var _MemoryDeleteResponse = _interopRequireDefault(require("./model/MemoryDeleteResponse"));

var _MemoryImportResponse = _interopRequireDefault(require("./model/MemoryImportResponse"));

var _MemoryInsertResponse = _interopRequireDefault(require("./model/MemoryInsertResponse"));

var _MemoryUpdateParameters = _interopRequireDefault(require("./model/MemoryUpdateParameters"));

var _MemoryUpdateResponse = _interopRequireDefault(require("./model/MemoryUpdateResponse"));

var _Project = _interopRequireDefault(require("./model/Project"));

var _ProjectCreateParameters = _interopRequireDefault(require("./model/ProjectCreateParameters"));

var _ProjectDeleteResponse = _interopRequireDefault(require("./model/ProjectDeleteResponse"));

var _ProjectQuote = _interopRequireDefault(require("./model/ProjectQuote"));

var _ProjectStatus = _interopRequireDefault(require("./model/ProjectStatus"));

var _ProjectUpdateResponse = _interopRequireDefault(require("./model/ProjectUpdateResponse"));

var _QARuleMatches = _interopRequireDefault(require("./model/QARuleMatches"));

var _QARuleMatchesContext = _interopRequireDefault(require("./model/QARuleMatchesContext"));

var _QARuleMatchesMatches = _interopRequireDefault(require("./model/QARuleMatchesMatches"));

var _QARuleMatchesReplacements = _interopRequireDefault(require("./model/QARuleMatchesReplacements"));

var _QARuleMatchesRule = _interopRequireDefault(require("./model/QARuleMatchesRule"));

var _QARuleMatchesRuleCategory = _interopRequireDefault(require("./model/QARuleMatchesRuleCategory"));

var _QARuleMatchesRuleUrls = _interopRequireDefault(require("./model/QARuleMatchesRuleUrls"));

var _ResourceStatus = _interopRequireDefault(require("./model/ResourceStatus"));

var _Segment = _interopRequireDefault(require("./model/Segment"));

var _SegmentCreateParameters = _interopRequireDefault(require("./model/SegmentCreateParameters"));

var _SegmentDeleteResponse = _interopRequireDefault(require("./model/SegmentDeleteResponse"));

var _SegmentUpdateParameters = _interopRequireDefault(require("./model/SegmentUpdateParameters"));

var _SegmentWithComments = _interopRequireDefault(require("./model/SegmentWithComments"));

var _TaggedSegment = _interopRequireDefault(require("./model/TaggedSegment"));

var _TranslateRegisterResponse = _interopRequireDefault(require("./model/TranslateRegisterResponse"));

var _Translation = _interopRequireDefault(require("./model/Translation"));

var _TranslationList = _interopRequireDefault(require("./model/TranslationList"));

var _TranslationMemoryEntry = _interopRequireDefault(require("./model/TranslationMemoryEntry"));

var _ConnectorsApi = _interopRequireDefault(require("./api/ConnectorsApi"));

var _DocumentsApi = _interopRequireDefault(require("./api/DocumentsApi"));

var _FilesApi = _interopRequireDefault(require("./api/FilesApi"));

var _LanguagesApi = _interopRequireDefault(require("./api/LanguagesApi"));

var _LexiconApi = _interopRequireDefault(require("./api/LexiconApi"));

var _MemoriesApi = _interopRequireDefault(require("./api/MemoriesApi"));

var _ProjectsApi = _interopRequireDefault(require("./api/ProjectsApi"));

var _QAApi = _interopRequireDefault(require("./api/QAApi"));

var _RootApi = _interopRequireDefault(require("./api/RootApi"));

var _SegmentsApi = _interopRequireDefault(require("./api/SegmentsApi"));

var _TranslateApi = _interopRequireDefault(require("./api/TranslateApi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
},{"./ApiClient":3,"./api/ConnectorsApi":4,"./api/DocumentsApi":5,"./api/FilesApi":6,"./api/LanguagesApi":7,"./api/LexiconApi":8,"./api/MemoriesApi":9,"./api/ProjectsApi":10,"./api/QAApi":11,"./api/RootApi":12,"./api/SegmentsApi":13,"./api/TranslateApi":14,"./model/Annotation":16,"./model/ApiRoot":17,"./model/Comment":18,"./model/Connector":19,"./model/ConnectorArguments":20,"./model/ConnectorDeleteResponse":21,"./model/DocumentAssignmentParameters":22,"./model/DocumentAssignmentResponse":23,"./model/DocumentDeleteResponse":24,"./model/DocumentParameters":25,"./model/DocumentPretranslateParameters":26,"./model/DocumentPretranslateResponse":27,"./model/DocumentPretranslating":28,"./model/DocumentPretranslatingStatus":29,"./model/DocumentQuote":30,"./model/DocumentUpdateParameters":31,"./model/DocumentWithSegments":32,"./model/DocumentWithoutSegments":33,"./model/DocumentWithoutSegmentsStatus":34,"./model/Error":35,"./model/File":36,"./model/FileDeleteResponse":37,"./model/LanguagesResponse":38,"./model/LexiconEntry":39,"./model/LexiconEntryExamples":40,"./model/LexiconEntrySourceSpan":41,"./model/LexiconEntryTargetSpan":42,"./model/LexiconEntryTranslations":43,"./model/LexiconUpdateParameters":44,"./model/LexiconUpdateResponse":45,"./model/MatchBand":46,"./model/Memory":47,"./model/MemoryCreateParameters":48,"./model/MemoryDeleteResponse":49,"./model/MemoryImportResponse":50,"./model/MemoryInsertResponse":51,"./model/MemoryUpdateParameters":52,"./model/MemoryUpdateResponse":53,"./model/Project":54,"./model/ProjectCreateParameters":55,"./model/ProjectDeleteResponse":56,"./model/ProjectQuote":57,"./model/ProjectStatus":58,"./model/ProjectUpdateResponse":59,"./model/QARuleMatches":60,"./model/QARuleMatchesContext":61,"./model/QARuleMatchesMatches":62,"./model/QARuleMatchesReplacements":63,"./model/QARuleMatchesRule":64,"./model/QARuleMatchesRuleCategory":65,"./model/QARuleMatchesRuleUrls":66,"./model/ResourceStatus":67,"./model/Segment":68,"./model/SegmentCreateParameters":69,"./model/SegmentDeleteResponse":70,"./model/SegmentUpdateParameters":71,"./model/SegmentWithComments":72,"./model/TaggedSegment":73,"./model/TranslateRegisterResponse":74,"./model/Translation":75,"./model/TranslationList":76,"./model/TranslationMemoryEntry":77}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Annotation model module.
 * @module model/Annotation
 * @version 0.5.0
 */
var Annotation = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Annotation</code>.
   * A Comment&#39;s annotation. 
   * @alias module:model/Annotation
   */
  function Annotation() {
    _classCallCheck(this, Annotation);

    Annotation.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Annotation, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Annotation</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Annotation} obj Optional instance to populate.
     * @return {module:model/Annotation} The populated <code>Annotation</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Annotation();

        if (data.hasOwnProperty('text')) {
          obj['text'] = _ApiClient["default"].convertToType(data['text'], 'String');
        }
      }

      return obj;
    }
  }]);

  return Annotation;
}();
/**
 * The Comment's annotation text.
 * @member {String} text
 */


Annotation.prototype['text'] = undefined;
var _default = Annotation;
exports["default"] = _default;
},{"../ApiClient":3}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ApiRoot model module.
 * @module model/ApiRoot
 * @version 0.5.0
 */
var ApiRoot = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ApiRoot</code>.
   * @alias module:model/ApiRoot
   */
  function ApiRoot() {
    _classCallCheck(this, ApiRoot);

    ApiRoot.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ApiRoot, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ApiRoot</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ApiRoot} obj Optional instance to populate.
     * @return {module:model/ApiRoot} The populated <code>ApiRoot</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ApiRoot();

        if (data.hasOwnProperty('api_name')) {
          obj['api_name'] = _ApiClient["default"].convertToType(data['api_name'], 'String');
        }

        if (data.hasOwnProperty('api_root')) {
          obj['api_root'] = _ApiClient["default"].convertToType(data['api_root'], 'String');
        }
      }

      return obj;
    }
  }]);

  return ApiRoot;
}();
/**
 * @member {String} api_name
 */


ApiRoot.prototype['api_name'] = undefined;
/**
 * @member {String} api_root
 */

ApiRoot.prototype['api_root'] = undefined;
var _default = ApiRoot;
exports["default"] = _default;
},{"../ApiClient":3}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Annotation = _interopRequireDefault(require("./Annotation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Comment model module.
 * @module model/Comment
 * @version 0.5.0
 */
var Comment = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Comment</code>.
   * A Comment is a translator&#39;s or a reviewer&#39;s comment on a segment. 
   * @alias module:model/Comment
   */
  function Comment() {
    _classCallCheck(this, Comment);

    Comment.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Comment, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Comment</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Comment} obj Optional instance to populate.
     * @return {module:model/Comment} The populated <code>Comment</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Comment();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('text')) {
          obj['text'] = _ApiClient["default"].convertToType(data['text'], 'String');
        }

        if (data.hasOwnProperty('user_id')) {
          obj['user_id'] = _ApiClient["default"].convertToType(data['user_id'], 'Number');
        }

        if (data.hasOwnProperty('is_resolved')) {
          obj['is_resolved'] = _ApiClient["default"].convertToType(data['is_resolved'], 'Boolean');
        }

        if (data.hasOwnProperty('annotations')) {
          obj['annotations'] = _ApiClient["default"].convertToType(data['annotations'], [_Annotation["default"]]);
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return Comment;
}();
/**
 * A unique number identifying the Comment.
 * @member {Number} id
 */


Comment.prototype['id'] = undefined;
/**
 * The comment text.
 * @member {String} text
 */

Comment.prototype['text'] = undefined;
/**
 * The User who created this Comment.
 * @member {Number} user_id
 */

Comment.prototype['user_id'] = undefined;
/**
 * Whether the Comment is resolved.
 * @member {Boolean} is_resolved
 */

Comment.prototype['is_resolved'] = undefined;
/**
 * A list of optional Annotations.
 * @member {Array.<module:model/Annotation>} annotations
 */

Comment.prototype['annotations'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

Comment.prototype['created_at'] = undefined;
var _default = Comment;
exports["default"] = _default;
},{"../ApiClient":3,"./Annotation":16}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Connector model module.
 * @module model/Connector
 * @version 0.5.0
 */
var Connector = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Connector</code>.
   * @alias module:model/Connector
   */
  function Connector() {
    _classCallCheck(this, Connector);

    Connector.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Connector, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Connector</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Connector} obj Optional instance to populate.
     * @return {module:model/Connector} The populated <code>Connector</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Connector();

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('args')) {
          obj['args'] = _ApiClient["default"].convertToType(data['args'], Object);
        }

        if (data.hasOwnProperty('schedule')) {
          obj['schedule'] = _ApiClient["default"].convertToType(data['schedule'], 'String');
        }
      }

      return obj;
    }
  }]);

  return Connector;
}();
/**
 * Name of connector.
 * @member {String} name
 */


Connector.prototype['name'] = undefined;
/**
 * Connector parameters.
 * @member {Object} args
 */

Connector.prototype['args'] = undefined;
/**
 * Cron string
 * @member {String} schedule
 */

Connector.prototype['schedule'] = undefined;
var _default = Connector;
exports["default"] = _default;
},{"../ApiClient":3}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ConnectorArguments model module.
 * @module model/ConnectorArguments
 * @version 0.5.0
 */
var ConnectorArguments = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ConnectorArguments</code>.
   * @alias module:model/ConnectorArguments
   */
  function ConnectorArguments() {
    _classCallCheck(this, ConnectorArguments);

    ConnectorArguments.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ConnectorArguments, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ConnectorArguments</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ConnectorArguments} obj Optional instance to populate.
     * @return {module:model/ConnectorArguments} The populated <code>ConnectorArguments</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ConnectorArguments();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('args')) {
          obj['args'] = _ApiClient["default"].convertToType(data['args'], Object);
        }

        if (data.hasOwnProperty('schedule')) {
          obj['schedule'] = _ApiClient["default"].convertToType(data['schedule'], 'String');
        }
      }

      return obj;
    }
  }]);

  return ConnectorArguments;
}();
/**
 * A unique Connector identifier.
 * @member {Number} id
 */


ConnectorArguments.prototype['id'] = undefined;
/**
 * Name of connector.
 * @member {String} name
 */

ConnectorArguments.prototype['name'] = undefined;
/**
 * Connector parameters.
 * @member {Object} args
 */

ConnectorArguments.prototype['args'] = undefined;
/**
 * Cron string
 * @member {String} schedule
 */

ConnectorArguments.prototype['schedule'] = undefined;
var _default = ConnectorArguments;
exports["default"] = _default;
},{"../ApiClient":3}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ConnectorDeleteResponse model module.
 * @module model/ConnectorDeleteResponse
 * @version 0.5.0
 */
var ConnectorDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ConnectorDeleteResponse</code>.
   * @alias module:model/ConnectorDeleteResponse
   */
  function ConnectorDeleteResponse() {
    _classCallCheck(this, ConnectorDeleteResponse);

    ConnectorDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ConnectorDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ConnectorDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ConnectorDeleteResponse} obj Optional instance to populate.
     * @return {module:model/ConnectorDeleteResponse} The populated <code>ConnectorDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ConnectorDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return ConnectorDeleteResponse;
}();
/**
 * A unique Connector identifier.
 * @member {Number} id
 */


ConnectorDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

ConnectorDeleteResponse.prototype['deleted'] = undefined;
var _default = ConnectorDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentAssignmentParameters model module.
 * @module model/DocumentAssignmentParameters
 * @version 0.5.0
 */
var DocumentAssignmentParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentAssignmentParameters</code>.
   * @alias module:model/DocumentAssignmentParameters
   * @param id {Number} A unique Document identifier.
   * @param email {String} An email address.
   */
  function DocumentAssignmentParameters(id, email) {
    _classCallCheck(this, DocumentAssignmentParameters);

    DocumentAssignmentParameters.initialize(this, id, email);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentAssignmentParameters, null, [{
    key: "initialize",
    value: function initialize(obj, id, email) {
      obj['id'] = id;
      obj['email'] = email;
    }
    /**
     * Constructs a <code>DocumentAssignmentParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentAssignmentParameters} obj Optional instance to populate.
     * @return {module:model/DocumentAssignmentParameters} The populated <code>DocumentAssignmentParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentAssignmentParameters();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('email')) {
          obj['email'] = _ApiClient["default"].convertToType(data['email'], 'String');
        }

        if (data.hasOwnProperty('is_translator')) {
          obj['is_translator'] = _ApiClient["default"].convertToType(data['is_translator'], 'Boolean');
        }

        if (data.hasOwnProperty('is_reviewer')) {
          obj['is_reviewer'] = _ApiClient["default"].convertToType(data['is_reviewer'], 'Boolean');
        }

        if (data.hasOwnProperty('due_date')) {
          obj['due_date'] = _ApiClient["default"].convertToType(data['due_date'], 'Date');
        }
      }

      return obj;
    }
  }]);

  return DocumentAssignmentParameters;
}();
/**
 * A unique Document identifier.
 * @member {Number} id
 */


DocumentAssignmentParameters.prototype['id'] = undefined;
/**
 * An email address.
 * @member {String} email
 */

DocumentAssignmentParameters.prototype['email'] = undefined;
/**
 * If true, assign for translating. If false, then unassign.
 * @member {Boolean} is_translator
 */

DocumentAssignmentParameters.prototype['is_translator'] = undefined;
/**
 * If true, assign for reviewing. If false, then unassign.
 * @member {Boolean} is_reviewer
 */

DocumentAssignmentParameters.prototype['is_reviewer'] = undefined;
/**
 * Due date for translation or review (set based on `is_translator` and `is_reviewer` flags).
 * @member {Date} due_date
 */

DocumentAssignmentParameters.prototype['due_date'] = undefined;
var _default = DocumentAssignmentParameters;
exports["default"] = _default;
},{"../ApiClient":3}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentAssignmentResponse model module.
 * @module model/DocumentAssignmentResponse
 * @version 0.5.0
 */
var DocumentAssignmentResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentAssignmentResponse</code>.
   * @alias module:model/DocumentAssignmentResponse
   */
  function DocumentAssignmentResponse() {
    _classCallCheck(this, DocumentAssignmentResponse);

    DocumentAssignmentResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentAssignmentResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentAssignmentResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentAssignmentResponse} obj Optional instance to populate.
     * @return {module:model/DocumentAssignmentResponse} The populated <code>DocumentAssignmentResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentAssignmentResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return DocumentAssignmentResponse;
}();
/**
 * A unique Document identifier.
 * @member {Number} id
 */


DocumentAssignmentResponse.prototype['id'] = undefined;
var _default = DocumentAssignmentResponse;
exports["default"] = _default;
},{"../ApiClient":3}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentDeleteResponse model module.
 * @module model/DocumentDeleteResponse
 * @version 0.5.0
 */
var DocumentDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentDeleteResponse</code>.
   * @alias module:model/DocumentDeleteResponse
   */
  function DocumentDeleteResponse() {
    _classCallCheck(this, DocumentDeleteResponse);

    DocumentDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentDeleteResponse} obj Optional instance to populate.
     * @return {module:model/DocumentDeleteResponse} The populated <code>DocumentDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return DocumentDeleteResponse;
}();
/**
 * A unique Document identifier.
 * @member {Number} id
 */


DocumentDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

DocumentDeleteResponse.prototype['deleted'] = undefined;
var _default = DocumentDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentParameters model module.
 * @module model/DocumentParameters
 * @version 0.5.0
 */
var DocumentParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentParameters</code>.
   * @alias module:model/DocumentParameters
   * @param name {String} The document name.
   * @param projectId {Number} A unique Project identifier.
   */
  function DocumentParameters(name, projectId) {
    _classCallCheck(this, DocumentParameters);

    DocumentParameters.initialize(this, name, projectId);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentParameters, null, [{
    key: "initialize",
    value: function initialize(obj, name, projectId) {
      obj['name'] = name;
      obj['project_id'] = projectId;
    }
    /**
     * Constructs a <code>DocumentParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentParameters} obj Optional instance to populate.
     * @return {module:model/DocumentParameters} The populated <code>DocumentParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentParameters();

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('project_id')) {
          obj['project_id'] = _ApiClient["default"].convertToType(data['project_id'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return DocumentParameters;
}();
/**
 * The document name.
 * @member {String} name
 */


DocumentParameters.prototype['name'] = undefined;
/**
 * A unique Project identifier.
 * @member {Number} project_id
 */

DocumentParameters.prototype['project_id'] = undefined;
var _default = DocumentParameters;
exports["default"] = _default;
},{"../ApiClient":3}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentPretranslateParameters model module.
 * @module model/DocumentPretranslateParameters
 * @version 0.5.0
 */
var DocumentPretranslateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentPretranslateParameters</code>.
   * @alias module:model/DocumentPretranslateParameters
   */
  function DocumentPretranslateParameters() {
    _classCallCheck(this, DocumentPretranslateParameters);

    DocumentPretranslateParameters.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentPretranslateParameters, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentPretranslateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentPretranslateParameters} obj Optional instance to populate.
     * @return {module:model/DocumentPretranslateParameters} The populated <code>DocumentPretranslateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentPretranslateParameters();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], ['Number']);
        }
      }

      return obj;
    }
  }]);

  return DocumentPretranslateParameters;
}();
/**
 * A list of unique Document identifiers.
 * @member {Array.<Number>} id
 */


DocumentPretranslateParameters.prototype['id'] = undefined;
var _default = DocumentPretranslateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentPretranslating = _interopRequireDefault(require("./DocumentPretranslating"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentPretranslateResponse model module.
 * @module model/DocumentPretranslateResponse
 * @version 0.5.0
 */
var DocumentPretranslateResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentPretranslateResponse</code>.
   * @alias module:model/DocumentPretranslateResponse
   */
  function DocumentPretranslateResponse() {
    _classCallCheck(this, DocumentPretranslateResponse);

    DocumentPretranslateResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentPretranslateResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentPretranslateResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentPretranslateResponse} obj Optional instance to populate.
     * @return {module:model/DocumentPretranslateResponse} The populated <code>DocumentPretranslateResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentPretranslateResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], ['Number']);
        }

        if (data.hasOwnProperty('is_pretranslating')) {
          obj['is_pretranslating'] = _ApiClient["default"].convertToType(data['is_pretranslating'], 'Boolean');
        }

        if (data.hasOwnProperty('documents')) {
          obj['documents'] = _ApiClient["default"].convertToType(data['documents'], [_DocumentPretranslating["default"]]);
        }
      }

      return obj;
    }
  }]);

  return DocumentPretranslateResponse;
}();
/**
 * A list of documents being pretranslated.
 * @member {Array.<Number>} id
 */


DocumentPretranslateResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} is_pretranslating
 */

DocumentPretranslateResponse.prototype['is_pretranslating'] = undefined;
/**
 * Document pretranslation status.
 * @member {Array.<module:model/DocumentPretranslating>} documents
 */

DocumentPretranslateResponse.prototype['documents'] = undefined;
var _default = DocumentPretranslateResponse;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentPretranslating":28}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentPretranslatingStatus = _interopRequireDefault(require("./DocumentPretranslatingStatus"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentPretranslating model module.
 * @module model/DocumentPretranslating
 * @version 0.5.0
 */
var DocumentPretranslating = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentPretranslating</code>.
   * Document object for which pretranslation was requested. 
   * @alias module:model/DocumentPretranslating
   */
  function DocumentPretranslating() {
    _classCallCheck(this, DocumentPretranslating);

    DocumentPretranslating.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentPretranslating, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentPretranslating</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentPretranslating} obj Optional instance to populate.
     * @return {module:model/DocumentPretranslating} The populated <code>DocumentPretranslating</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentPretranslating();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('import_in_progress')) {
          obj['import_in_progress'] = _ApiClient["default"].convertToType(data['import_in_progress'], 'Boolean');
        }

        if (data.hasOwnProperty('import_succeeded')) {
          obj['import_succeeded'] = _ApiClient["default"].convertToType(data['import_succeeded'], 'Boolean');
        }

        if (data.hasOwnProperty('import_error_message')) {
          obj['import_error_message'] = _ApiClient["default"].convertToType(data['import_error_message'], 'String');
        }

        if (data.hasOwnProperty('is_processing')) {
          obj['is_processing'] = _ApiClient["default"].convertToType(data['is_processing'], 'Boolean');
        }

        if (data.hasOwnProperty('is_pretranslating')) {
          obj['is_pretranslating'] = _ApiClient["default"].convertToType(data['is_pretranslating'], 'Boolean');
        }

        if (data.hasOwnProperty('status')) {
          obj['status'] = _DocumentPretranslatingStatus["default"].constructFromObject(data['status']);
        }
      }

      return obj;
    }
  }]);

  return DocumentPretranslating;
}();
/**
 * A status object indicating the pretranslation status.
 * @member {Number} id
 */


DocumentPretranslating.prototype['id'] = undefined;
/**
 * Indicates that the document is being imported.
 * @member {Boolean} import_in_progress
 */

DocumentPretranslating.prototype['import_in_progress'] = undefined;
/**
 * Indicates that the document was successfully imported.
 * @member {Boolean} import_succeeded
 */

DocumentPretranslating.prototype['import_succeeded'] = undefined;
/**
 * Indicates there was an error importing the document.
 * @member {String} import_error_message
 */

DocumentPretranslating.prototype['import_error_message'] = undefined;
/**
 * Indicates the document is being processed.
 * @member {Boolean} is_processing
 */

DocumentPretranslating.prototype['is_processing'] = undefined;
/**
 * Indicates the document is being pretranslated.
 * @member {Boolean} is_pretranslating
 */

DocumentPretranslating.prototype['is_pretranslating'] = undefined;
/**
 * @member {module:model/DocumentPretranslatingStatus} status
 */

DocumentPretranslating.prototype['status'] = undefined;
var _default = DocumentPretranslating;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentPretranslatingStatus":29}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentPretranslatingStatus model module.
 * @module model/DocumentPretranslatingStatus
 * @version 0.5.0
 */
var DocumentPretranslatingStatus = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentPretranslatingStatus</code>.
   * A status object indicating the pretranslation status.
   * @alias module:model/DocumentPretranslatingStatus
   */
  function DocumentPretranslatingStatus() {
    _classCallCheck(this, DocumentPretranslatingStatus);

    DocumentPretranslatingStatus.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentPretranslatingStatus, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentPretranslatingStatus</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentPretranslatingStatus} obj Optional instance to populate.
     * @return {module:model/DocumentPretranslatingStatus} The populated <code>DocumentPretranslatingStatus</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentPretranslatingStatus();

        if (data.hasOwnProperty('pretranslation')) {
          obj['pretranslation'] = _ApiClient["default"].convertToType(data['pretranslation'], 'String');
        }
      }

      return obj;
    }
  }]);

  return DocumentPretranslatingStatus;
}();
/**
 * 
 * @member {String} pretranslation
 */


DocumentPretranslatingStatus.prototype['pretranslation'] = undefined;
var _default = DocumentPretranslatingStatus;
exports["default"] = _default;
},{"../ApiClient":3}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _MatchBand = _interopRequireDefault(require("./MatchBand"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentQuote model module.
 * @module model/DocumentQuote
 * @version 0.5.0
 */
var DocumentQuote = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentQuote</code>.
   * Quoting information for a Document. 
   * @alias module:model/DocumentQuote
   */
  function DocumentQuote() {
    _classCallCheck(this, DocumentQuote);

    DocumentQuote.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentQuote, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentQuote</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentQuote} obj Optional instance to populate.
     * @return {module:model/DocumentQuote} The populated <code>DocumentQuote</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentQuote();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('num_source_words')) {
          obj['num_source_words'] = _ApiClient["default"].convertToType(data['num_source_words'], 'Number');
        }

        if (data.hasOwnProperty('num_words_new')) {
          obj['num_words_new'] = _ApiClient["default"].convertToType(data['num_words_new'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_new')) {
          obj['num_segments_new'] = _ApiClient["default"].convertToType(data['num_segments_new'], 'Number');
        }

        if (data.hasOwnProperty('num_words_repetition')) {
          obj['num_words_repetition'] = _ApiClient["default"].convertToType(data['num_words_repetition'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_repetition')) {
          obj['num_segments_repetition'] = _ApiClient["default"].convertToType(data['num_segments_repetition'], 'Number');
        }

        if (data.hasOwnProperty('bands')) {
          obj['bands'] = _ApiClient["default"].convertToType(data['bands'], [_MatchBand["default"]]);
        }
      }

      return obj;
    }
  }]);

  return DocumentQuote;
}();
/**
 * A unique Document identifier.
 * @member {Number} id
 */


DocumentQuote.prototype['id'] = undefined;
/**
 * The number of source words in the Document.
 * @member {Number} num_source_words
 */

DocumentQuote.prototype['num_source_words'] = undefined;
/**
 * The number of new source words in the Document.
 * @member {Number} num_words_new
 */

DocumentQuote.prototype['num_words_new'] = undefined;
/**
 * The number of new segments in the Document.
 * @member {Number} num_segments_new
 */

DocumentQuote.prototype['num_segments_new'] = undefined;
/**
 * The number of repetition source words in the Document.
 * @member {Number} num_words_repetition
 */

DocumentQuote.prototype['num_words_repetition'] = undefined;
/**
 * The number of repetition segments in the Document.
 * @member {Number} num_segments_repetition
 */

DocumentQuote.prototype['num_segments_repetition'] = undefined;
/**
 * A list of MatchBand objects that represent translation memory leverage statistics.
 * @member {Array.<module:model/MatchBand>} bands
 */

DocumentQuote.prototype['bands'] = undefined;
var _default = DocumentQuote;
exports["default"] = _default;
},{"../ApiClient":3,"./MatchBand":46}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentUpdateParameters model module.
 * @module model/DocumentUpdateParameters
 * @version 0.5.0
 */
var DocumentUpdateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentUpdateParameters</code>.
   * @alias module:model/DocumentUpdateParameters
   * @param id {Number} A unique Document identifier.
   * @param name {String} The Document name.
   */
  function DocumentUpdateParameters(id, name) {
    _classCallCheck(this, DocumentUpdateParameters);

    DocumentUpdateParameters.initialize(this, id, name);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentUpdateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, id, name) {
      obj['id'] = id;
      obj['name'] = name;
    }
    /**
     * Constructs a <code>DocumentUpdateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentUpdateParameters} obj Optional instance to populate.
     * @return {module:model/DocumentUpdateParameters} The populated <code>DocumentUpdateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentUpdateParameters();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }
      }

      return obj;
    }
  }]);

  return DocumentUpdateParameters;
}();
/**
 * A unique Document identifier.
 * @member {Number} id
 */


DocumentUpdateParameters.prototype['id'] = undefined;
/**
 * The Document name.
 * @member {String} name
 */

DocumentUpdateParameters.prototype['name'] = undefined;
var _default = DocumentUpdateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentWithoutSegmentsStatus = _interopRequireDefault(require("./DocumentWithoutSegmentsStatus"));

var _Segment = _interopRequireDefault(require("./Segment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentWithSegments model module.
 * @module model/DocumentWithSegments
 * @version 0.5.0
 */
var DocumentWithSegments = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentWithSegments</code>.
   * A Document is a collection of zero or more Segments. 
   * @alias module:model/DocumentWithSegments
   */
  function DocumentWithSegments() {
    _classCallCheck(this, DocumentWithSegments);

    DocumentWithSegments.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentWithSegments, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentWithSegments</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentWithSegments} obj Optional instance to populate.
     * @return {module:model/DocumentWithSegments} The populated <code>DocumentWithSegments</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentWithSegments();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('project_id')) {
          obj['project_id'] = _ApiClient["default"].convertToType(data['project_id'], 'Number');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('import_in_progress')) {
          obj['import_in_progress'] = _ApiClient["default"].convertToType(data['import_in_progress'], 'Boolean');
        }

        if (data.hasOwnProperty('import_succeeded')) {
          obj['import_succeeded'] = _ApiClient["default"].convertToType(data['import_succeeded'], 'Boolean');
        }

        if (data.hasOwnProperty('import_error_message')) {
          obj['import_error_message'] = _ApiClient["default"].convertToType(data['import_error_message'], 'String');
        }

        if (data.hasOwnProperty('export_in_progress')) {
          obj['export_in_progress'] = _ApiClient["default"].convertToType(data['export_in_progress'], 'Boolean');
        }

        if (data.hasOwnProperty('export_succeeded')) {
          obj['export_succeeded'] = _ApiClient["default"].convertToType(data['export_succeeded'], 'Boolean');
        }

        if (data.hasOwnProperty('export_error_message')) {
          obj['export_error_message'] = _ApiClient["default"].convertToType(data['export_error_message'], 'String');
        }

        if (data.hasOwnProperty('is_pretranslating')) {
          obj['is_pretranslating'] = _ApiClient["default"].convertToType(data['is_pretranslating'], 'Boolean');
        }

        if (data.hasOwnProperty('status')) {
          obj['status'] = _DocumentWithoutSegmentsStatus["default"].constructFromObject(data['status']);
        }

        if (data.hasOwnProperty('translator_email')) {
          obj['translator_email'] = _ApiClient["default"].convertToType(data['translator_email'], 'String');
        }

        if (data.hasOwnProperty('reviewer_email')) {
          obj['reviewer_email'] = _ApiClient["default"].convertToType(data['reviewer_email'], 'String');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }

        if (data.hasOwnProperty('segments')) {
          obj['segments'] = _ApiClient["default"].convertToType(data['segments'], [_Segment["default"]]);
        }
      }

      return obj;
    }
  }]);

  return DocumentWithSegments;
}();
/**
 * A unique number identifying the Document.
 * @member {Number} id
 */


DocumentWithSegments.prototype['id'] = undefined;
/**
 * A unique number identifying the Project.
 * @member {Number} project_id
 */

DocumentWithSegments.prototype['project_id'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclang
 */

DocumentWithSegments.prototype['srclang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglang
 */

DocumentWithSegments.prototype['trglang'] = undefined;
/**
 * The document name.
 * @member {String} name
 */

DocumentWithSegments.prototype['name'] = undefined;
/**
 * True if the document is currently being imported
 * @member {Boolean} import_in_progress
 */

DocumentWithSegments.prototype['import_in_progress'] = undefined;
/**
 * True if the import process succeeded.
 * @member {Boolean} import_succeeded
 */

DocumentWithSegments.prototype['import_succeeded'] = undefined;
/**
 * Error message if `import_succeeded=false`
 * @member {String} import_error_message
 */

DocumentWithSegments.prototype['import_error_message'] = undefined;
/**
 * True if the document is currently being exported for download
 * @member {Boolean} export_in_progress
 */

DocumentWithSegments.prototype['export_in_progress'] = undefined;
/**
 * True if the export process succeeded.
 * @member {Boolean} export_succeeded
 */

DocumentWithSegments.prototype['export_succeeded'] = undefined;
/**
 * Error message if `export_succeeded=false`
 * @member {String} export_error_message
 */

DocumentWithSegments.prototype['export_error_message'] = undefined;
/**
 * True if the document is currently being pretranslated.
 * @member {Boolean} is_pretranslating
 */

DocumentWithSegments.prototype['is_pretranslating'] = undefined;
/**
 * @member {module:model/DocumentWithoutSegmentsStatus} status
 */

DocumentWithSegments.prototype['status'] = undefined;
/**
 * The email of the assigned translator.
 * @member {String} translator_email
 */

DocumentWithSegments.prototype['translator_email'] = undefined;
/**
 * The email of the assigned reviewer.
 * @member {String} reviewer_email
 */

DocumentWithSegments.prototype['reviewer_email'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

DocumentWithSegments.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

DocumentWithSegments.prototype['updated_at'] = undefined;
/**
 * A list of Segments.
 * @member {Array.<module:model/Segment>} segments
 */

DocumentWithSegments.prototype['segments'] = undefined;
var _default = DocumentWithSegments;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentWithoutSegmentsStatus":34,"./Segment":68}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentWithoutSegmentsStatus = _interopRequireDefault(require("./DocumentWithoutSegmentsStatus"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentWithoutSegments model module.
 * @module model/DocumentWithoutSegments
 * @version 0.5.0
 */
var DocumentWithoutSegments = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentWithoutSegments</code>.
   * A Document is a collection of zero or more Segments. 
   * @alias module:model/DocumentWithoutSegments
   */
  function DocumentWithoutSegments() {
    _classCallCheck(this, DocumentWithoutSegments);

    DocumentWithoutSegments.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentWithoutSegments, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentWithoutSegments</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentWithoutSegments} obj Optional instance to populate.
     * @return {module:model/DocumentWithoutSegments} The populated <code>DocumentWithoutSegments</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentWithoutSegments();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('project_id')) {
          obj['project_id'] = _ApiClient["default"].convertToType(data['project_id'], 'Number');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('import_in_progress')) {
          obj['import_in_progress'] = _ApiClient["default"].convertToType(data['import_in_progress'], 'Boolean');
        }

        if (data.hasOwnProperty('import_succeeded')) {
          obj['import_succeeded'] = _ApiClient["default"].convertToType(data['import_succeeded'], 'Boolean');
        }

        if (data.hasOwnProperty('import_error_message')) {
          obj['import_error_message'] = _ApiClient["default"].convertToType(data['import_error_message'], 'String');
        }

        if (data.hasOwnProperty('export_in_progress')) {
          obj['export_in_progress'] = _ApiClient["default"].convertToType(data['export_in_progress'], 'Boolean');
        }

        if (data.hasOwnProperty('export_succeeded')) {
          obj['export_succeeded'] = _ApiClient["default"].convertToType(data['export_succeeded'], 'Boolean');
        }

        if (data.hasOwnProperty('export_error_message')) {
          obj['export_error_message'] = _ApiClient["default"].convertToType(data['export_error_message'], 'String');
        }

        if (data.hasOwnProperty('is_pretranslating')) {
          obj['is_pretranslating'] = _ApiClient["default"].convertToType(data['is_pretranslating'], 'Boolean');
        }

        if (data.hasOwnProperty('status')) {
          obj['status'] = _DocumentWithoutSegmentsStatus["default"].constructFromObject(data['status']);
        }

        if (data.hasOwnProperty('translator_email')) {
          obj['translator_email'] = _ApiClient["default"].convertToType(data['translator_email'], 'String');
        }

        if (data.hasOwnProperty('reviewer_email')) {
          obj['reviewer_email'] = _ApiClient["default"].convertToType(data['reviewer_email'], 'String');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return DocumentWithoutSegments;
}();
/**
 * A unique number identifying the Document.
 * @member {Number} id
 */


DocumentWithoutSegments.prototype['id'] = undefined;
/**
 * A unique number identifying the Project.
 * @member {Number} project_id
 */

DocumentWithoutSegments.prototype['project_id'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclang
 */

DocumentWithoutSegments.prototype['srclang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglang
 */

DocumentWithoutSegments.prototype['trglang'] = undefined;
/**
 * The document name.
 * @member {String} name
 */

DocumentWithoutSegments.prototype['name'] = undefined;
/**
 * True if the document is currently being imported
 * @member {Boolean} import_in_progress
 */

DocumentWithoutSegments.prototype['import_in_progress'] = undefined;
/**
 * True if the import process succeeded.
 * @member {Boolean} import_succeeded
 */

DocumentWithoutSegments.prototype['import_succeeded'] = undefined;
/**
 * Error message if `import_succeeded=false`
 * @member {String} import_error_message
 */

DocumentWithoutSegments.prototype['import_error_message'] = undefined;
/**
 * True if the document is currently being exported for download
 * @member {Boolean} export_in_progress
 */

DocumentWithoutSegments.prototype['export_in_progress'] = undefined;
/**
 * True if the export process succeeded.
 * @member {Boolean} export_succeeded
 */

DocumentWithoutSegments.prototype['export_succeeded'] = undefined;
/**
 * Error message if `export_succeeded=false`
 * @member {String} export_error_message
 */

DocumentWithoutSegments.prototype['export_error_message'] = undefined;
/**
 * True if the document is currently being pretranslated.
 * @member {Boolean} is_pretranslating
 */

DocumentWithoutSegments.prototype['is_pretranslating'] = undefined;
/**
 * @member {module:model/DocumentWithoutSegmentsStatus} status
 */

DocumentWithoutSegments.prototype['status'] = undefined;
/**
 * The email of the assigned translator.
 * @member {String} translator_email
 */

DocumentWithoutSegments.prototype['translator_email'] = undefined;
/**
 * The email of the assigned reviewer.
 * @member {String} reviewer_email
 */

DocumentWithoutSegments.prototype['reviewer_email'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

DocumentWithoutSegments.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

DocumentWithoutSegments.prototype['updated_at'] = undefined;
var _default = DocumentWithoutSegments;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentWithoutSegmentsStatus":34}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The DocumentWithoutSegmentsStatus model module.
 * @module model/DocumentWithoutSegmentsStatus
 * @version 0.5.0
 */
var DocumentWithoutSegmentsStatus = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>DocumentWithoutSegmentsStatus</code>.
   * A list of translations for the query term.
   * @alias module:model/DocumentWithoutSegmentsStatus
   */
  function DocumentWithoutSegmentsStatus() {
    _classCallCheck(this, DocumentWithoutSegmentsStatus);

    DocumentWithoutSegmentsStatus.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(DocumentWithoutSegmentsStatus, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>DocumentWithoutSegmentsStatus</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/DocumentWithoutSegmentsStatus} obj Optional instance to populate.
     * @return {module:model/DocumentWithoutSegmentsStatus} The populated <code>DocumentWithoutSegmentsStatus</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new DocumentWithoutSegmentsStatus();

        if (data.hasOwnProperty('pretranslation')) {
          obj['pretranslation'] = _ApiClient["default"].convertToType(data['pretranslation'], 'String');
        }
      }

      return obj;
    }
  }]);

  return DocumentWithoutSegmentsStatus;
}();
/**
 * 
 * @member {module:model/DocumentWithoutSegmentsStatus.PretranslationEnum} pretranslation
 */


DocumentWithoutSegmentsStatus.prototype['pretranslation'] = undefined;
/**
 * Allowed values for the <code>pretranslation</code> property.
 * @enum {String}
 * @readonly
 */

DocumentWithoutSegmentsStatus['PretranslationEnum'] = {
  /**
   * value: "idle"
   * @const
   */
  "idle": "idle",

  /**
   * value: "pending"
   * @const
   */
  "pending": "pending",

  /**
   * value: "running"
   * @const
   */
  "running": "running"
};
var _default = DocumentWithoutSegmentsStatus;
exports["default"] = _default;
},{"../ApiClient":3}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Error model module.
 * @module model/Error
 * @version 0.5.0
 */
var Error = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Error</code>.
   * Response in the event of an unexpected error. 
   * @alias module:model/Error
   */
  function Error() {
    _classCallCheck(this, Error);

    Error.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Error, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Error</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Error} obj Optional instance to populate.
     * @return {module:model/Error} The populated <code>Error</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Error();

        if (data.hasOwnProperty('message')) {
          obj['message'] = _ApiClient["default"].convertToType(data['message'], Object);
        }
      }

      return obj;
    }
  }]);

  return Error;
}();
/**
 * A human-readable message describing the error.
 * @member {Object} message
 */


Error.prototype['message'] = undefined;
var _default = Error;
exports["default"] = _default;
},{"../ApiClient":3}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The File model module.
 * @module model/File
 * @version 0.5.0
 */
var File = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>File</code>.
   * A File is an unprocessed source file that can later be added to a project.
   * @alias module:model/File
   */
  function File() {
    _classCallCheck(this, File);

    File.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(File, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>File</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/File} obj Optional instance to populate.
     * @return {module:model/File} The populated <code>File</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new File();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('file_hash')) {
          obj['file_hash'] = _ApiClient["default"].convertToType(data['file_hash'], 'String');
        }

        if (data.hasOwnProperty('export_uri')) {
          obj['export_uri'] = _ApiClient["default"].convertToType(data['export_uri'], 'String');
        }

        if (data.hasOwnProperty('detected_lang')) {
          obj['detected_lang'] = _ApiClient["default"].convertToType(data['detected_lang'], 'String');
        }

        if (data.hasOwnProperty('detected_lang_confidence')) {
          obj['detected_lang_confidence'] = _ApiClient["default"].convertToType(data['detected_lang_confidence'], 'Number');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return File;
}();
/**
 * A unique number identifying the File.
 * @member {Number} id
 */


File.prototype['id'] = undefined;
/**
 * The file name.
 * @member {String} name
 */

File.prototype['name'] = undefined;
/**
 * A unique hash value associated with the file. An MD5 hash of the file content will be used by default.
 * @member {String} file_hash
 */

File.prototype['file_hash'] = undefined;
/**
 * A webhook endpoint that will export the translated document back to the source repository.
 * @member {String} export_uri
 */

File.prototype['export_uri'] = undefined;
/**
 * Language associated with the file.
 * @member {String} detected_lang
 */

File.prototype['detected_lang'] = undefined;
/**
 * Confidence score for the language associated with the file.
 * @member {Number} detected_lang_confidence
 */

File.prototype['detected_lang_confidence'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

File.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

File.prototype['updated_at'] = undefined;
var _default = File;
exports["default"] = _default;
},{"../ApiClient":3}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The FileDeleteResponse model module.
 * @module model/FileDeleteResponse
 * @version 0.5.0
 */
var FileDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>FileDeleteResponse</code>.
   * @alias module:model/FileDeleteResponse
   */
  function FileDeleteResponse() {
    _classCallCheck(this, FileDeleteResponse);

    FileDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(FileDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>FileDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/FileDeleteResponse} obj Optional instance to populate.
     * @return {module:model/FileDeleteResponse} The populated <code>FileDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new FileDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return FileDeleteResponse;
}();
/**
 * A unique File identifier.
 * @member {Number} id
 */


FileDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

FileDeleteResponse.prototype['deleted'] = undefined;
var _default = FileDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LanguagesResponse model module.
 * @module model/LanguagesResponse
 * @version 0.5.0
 */
var LanguagesResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LanguagesResponse</code>.
   * @alias module:model/LanguagesResponse
   */
  function LanguagesResponse() {
    _classCallCheck(this, LanguagesResponse);

    LanguagesResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LanguagesResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LanguagesResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LanguagesResponse} obj Optional instance to populate.
     * @return {module:model/LanguagesResponse} The populated <code>LanguagesResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LanguagesResponse();

        if (data.hasOwnProperty('source_to_target')) {
          obj['source_to_target'] = _ApiClient["default"].convertToType(data['source_to_target'], Object);
        }

        if (data.hasOwnProperty('code_to_name')) {
          obj['code_to_name'] = _ApiClient["default"].convertToType(data['code_to_name'], Object);
        }
      }

      return obj;
    }
  }]);

  return LanguagesResponse;
}();
/**
 * A two-dimensional object in which the first key is an ISO 639-1 language code indicating the source, and the second key is an ISO 639-1 language code indicating the target.
 * @member {Object} source_to_target
 */


LanguagesResponse.prototype['source_to_target'] = undefined;
/**
 * An object in which the key is an ISO 639-1 language code, and the value is the language name.
 * @member {Object} code_to_name
 */

LanguagesResponse.prototype['code_to_name'] = undefined;
var _default = LanguagesResponse;
exports["default"] = _default;
},{"../ApiClient":3}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _LexiconEntryExamples = _interopRequireDefault(require("./LexiconEntryExamples"));

var _LexiconEntryTranslations = _interopRequireDefault(require("./LexiconEntryTranslations"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconEntry model module.
 * @module model/LexiconEntry
 * @version 0.5.0
 */
var LexiconEntry = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconEntry</code>.
   * An Lexicon entry for a source term or phrase. 
   * @alias module:model/LexiconEntry
   */
  function LexiconEntry() {
    _classCallCheck(this, LexiconEntry);

    LexiconEntry.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconEntry, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconEntry</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconEntry} obj Optional instance to populate.
     * @return {module:model/LexiconEntry} The populated <code>LexiconEntry</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconEntry();

        if (data.hasOwnProperty('translations')) {
          obj['translations'] = _ApiClient["default"].convertToType(data['translations'], [_LexiconEntryTranslations["default"]]);
        }

        if (data.hasOwnProperty('examples')) {
          obj['examples'] = _ApiClient["default"].convertToType(data['examples'], [_LexiconEntryExamples["default"]]);
        }
      }

      return obj;
    }
  }]);

  return LexiconEntry;
}();
/**
 * A list of translations for the query term.
 * @member {Array.<module:model/LexiconEntryTranslations>} translations
 */


LexiconEntry.prototype['translations'] = undefined;
/**
 * A list of concordance examples for the query term.
 * @member {Array.<module:model/LexiconEntryExamples>} examples
 */

LexiconEntry.prototype['examples'] = undefined;
var _default = LexiconEntry;
exports["default"] = _default;
},{"../ApiClient":3,"./LexiconEntryExamples":40,"./LexiconEntryTranslations":43}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _LexiconEntrySourceSpan = _interopRequireDefault(require("./LexiconEntrySourceSpan"));

var _LexiconEntryTargetSpan = _interopRequireDefault(require("./LexiconEntryTargetSpan"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconEntryExamples model module.
 * @module model/LexiconEntryExamples
 * @version 0.5.0
 */
var LexiconEntryExamples = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconEntryExamples</code>.
   * @alias module:model/LexiconEntryExamples
   */
  function LexiconEntryExamples() {
    _classCallCheck(this, LexiconEntryExamples);

    LexiconEntryExamples.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconEntryExamples, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconEntryExamples</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconEntryExamples} obj Optional instance to populate.
     * @return {module:model/LexiconEntryExamples} The populated <code>LexiconEntryExamples</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconEntryExamples();

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('sourceDelimiters')) {
          obj['sourceDelimiters'] = _ApiClient["default"].convertToType(data['sourceDelimiters'], ['String']);
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('targetDelimiters')) {
          obj['targetDelimiters'] = _ApiClient["default"].convertToType(data['targetDelimiters'], ['String']);
        }

        if (data.hasOwnProperty('sourceSpan')) {
          obj['sourceSpan'] = _LexiconEntrySourceSpan["default"].constructFromObject(data['sourceSpan']);
        }

        if (data.hasOwnProperty('targetSpan')) {
          obj['targetSpan'] = _LexiconEntryTargetSpan["default"].constructFromObject(data['targetSpan']);
        }

        if (data.hasOwnProperty('similarity')) {
          obj['similarity'] = _ApiClient["default"].convertToType(data['similarity'], 'Number');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return LexiconEntryExamples;
}();
/**
 * The source string.
 * @member {String} source
 */


LexiconEntryExamples.prototype['source'] = undefined;
/**
 * A format string that indicates, for each word, if the source word should be preceded by a space. 
 * @member {Array.<String>} sourceDelimiters
 */

LexiconEntryExamples.prototype['sourceDelimiters'] = undefined;
/**
 * The target string
 * @member {String} target
 */

LexiconEntryExamples.prototype['target'] = undefined;
/**
 * A format string that indicates, for each word, if the target word should be preceded by a space. 
 * @member {Array.<String>} targetDelimiters
 */

LexiconEntryExamples.prototype['targetDelimiters'] = undefined;
/**
 * @member {module:model/LexiconEntrySourceSpan} sourceSpan
 */

LexiconEntryExamples.prototype['sourceSpan'] = undefined;
/**
 * @member {module:model/LexiconEntryTargetSpan} targetSpan
 */

LexiconEntryExamples.prototype['targetSpan'] = undefined;
/**
 * @member {Number} similarity
 */

LexiconEntryExamples.prototype['similarity'] = undefined;
/**
 * A unique Memory identifier. If this identifier is missing, then the term comes from the generic concordance. 
 * @member {Number} memory_id
 */

LexiconEntryExamples.prototype['memory_id'] = undefined;
var _default = LexiconEntryExamples;
exports["default"] = _default;
},{"../ApiClient":3,"./LexiconEntrySourceSpan":41,"./LexiconEntryTargetSpan":42}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconEntrySourceSpan model module.
 * @module model/LexiconEntrySourceSpan
 * @version 0.5.0
 */
var LexiconEntrySourceSpan = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconEntrySourceSpan</code>.
   * An object that indicates where the query term appears in the source.
   * @alias module:model/LexiconEntrySourceSpan
   */
  function LexiconEntrySourceSpan() {
    _classCallCheck(this, LexiconEntrySourceSpan);

    LexiconEntrySourceSpan.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconEntrySourceSpan, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconEntrySourceSpan</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconEntrySourceSpan} obj Optional instance to populate.
     * @return {module:model/LexiconEntrySourceSpan} The populated <code>LexiconEntrySourceSpan</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconEntrySourceSpan();

        if (data.hasOwnProperty('start')) {
          obj['start'] = _ApiClient["default"].convertToType(data['start'], 'Number');
        }

        if (data.hasOwnProperty('length')) {
          obj['length'] = _ApiClient["default"].convertToType(data['length'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return LexiconEntrySourceSpan;
}();
/**
 * The zero-indexed start index when `source` is split on whitespace. 
 * @member {Number} start
 */


LexiconEntrySourceSpan.prototype['start'] = undefined;
/**
 * The length in words after `start` of the source query term. 
 * @member {Number} length
 */

LexiconEntrySourceSpan.prototype['length'] = undefined;
var _default = LexiconEntrySourceSpan;
exports["default"] = _default;
},{"../ApiClient":3}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconEntryTargetSpan model module.
 * @module model/LexiconEntryTargetSpan
 * @version 0.5.0
 */
var LexiconEntryTargetSpan = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconEntryTargetSpan</code>.
   * An object that indicates the location in the target of contiguous words that align with the source query. 
   * @alias module:model/LexiconEntryTargetSpan
   */
  function LexiconEntryTargetSpan() {
    _classCallCheck(this, LexiconEntryTargetSpan);

    LexiconEntryTargetSpan.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconEntryTargetSpan, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconEntryTargetSpan</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconEntryTargetSpan} obj Optional instance to populate.
     * @return {module:model/LexiconEntryTargetSpan} The populated <code>LexiconEntryTargetSpan</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconEntryTargetSpan();

        if (data.hasOwnProperty('start')) {
          obj['start'] = _ApiClient["default"].convertToType(data['start'], 'Number');
        }

        if (data.hasOwnProperty('length')) {
          obj['length'] = _ApiClient["default"].convertToType(data['length'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return LexiconEntryTargetSpan;
}();
/**
 * The zero-indexed start index when `target` is split on whitespace. 
 * @member {Number} start
 */


LexiconEntryTargetSpan.prototype['start'] = undefined;
/**
 * The length in words after `start` of the target aligned phrase. 
 * @member {Number} length
 */

LexiconEntryTargetSpan.prototype['length'] = undefined;
var _default = LexiconEntryTargetSpan;
exports["default"] = _default;
},{"../ApiClient":3}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconEntryTranslations model module.
 * @module model/LexiconEntryTranslations
 * @version 0.5.0
 */
var LexiconEntryTranslations = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconEntryTranslations</code>.
   * @alias module:model/LexiconEntryTranslations
   */
  function LexiconEntryTranslations() {
    _classCallCheck(this, LexiconEntryTranslations);

    LexiconEntryTranslations.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconEntryTranslations, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconEntryTranslations</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconEntryTranslations} obj Optional instance to populate.
     * @return {module:model/LexiconEntryTranslations} The populated <code>LexiconEntryTranslations</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconEntryTranslations();

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('frequency')) {
          obj['frequency'] = _ApiClient["default"].convertToType(data['frequency'], 'Number');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return LexiconEntryTranslations;
}();
/**
 * The source string.
 * @member {String} source
 */


LexiconEntryTranslations.prototype['source'] = undefined;
/**
 * The target string.
 * @member {String} target
 */

LexiconEntryTranslations.prototype['target'] = undefined;
/**
 * The frequency of the term in the Lexicon.
 * @member {Number} frequency
 */

LexiconEntryTranslations.prototype['frequency'] = undefined;
/**
 * A unique Memory identifier. If this identifier is missing, then the term comes from the generic termbase. 
 * @member {Number} memory_id
 */

LexiconEntryTranslations.prototype['memory_id'] = undefined;
var _default = LexiconEntryTranslations;
exports["default"] = _default;
},{"../ApiClient":3}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconUpdateParameters model module.
 * @module model/LexiconUpdateParameters
 * @version 0.5.0
 */
var LexiconUpdateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconUpdateParameters</code>.
   * @alias module:model/LexiconUpdateParameters
   * @param memoryId {Number} A unique Memory identifier.
   * @param source {String} The source side of the lexicon entry.
   * @param target {String} The target side of the lexicon entry.
   */
  function LexiconUpdateParameters(memoryId, source, target) {
    _classCallCheck(this, LexiconUpdateParameters);

    LexiconUpdateParameters.initialize(this, memoryId, source, target);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconUpdateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, memoryId, source, target) {
      obj['memory_id'] = memoryId;
      obj['source'] = source;
      obj['target'] = target;
    }
    /**
     * Constructs a <code>LexiconUpdateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconUpdateParameters} obj Optional instance to populate.
     * @return {module:model/LexiconUpdateParameters} The populated <code>LexiconUpdateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconUpdateParameters();

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }
      }

      return obj;
    }
  }]);

  return LexiconUpdateParameters;
}();
/**
 * A unique Memory identifier.
 * @member {Number} memory_id
 */


LexiconUpdateParameters.prototype['memory_id'] = undefined;
/**
 * The source side of the lexicon entry.
 * @member {String} source
 */

LexiconUpdateParameters.prototype['source'] = undefined;
/**
 * The target side of the lexicon entry.
 * @member {String} target
 */

LexiconUpdateParameters.prototype['target'] = undefined;
var _default = LexiconUpdateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The LexiconUpdateResponse model module.
 * @module model/LexiconUpdateResponse
 * @version 0.5.0
 */
var LexiconUpdateResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>LexiconUpdateResponse</code>.
   * @alias module:model/LexiconUpdateResponse
   */
  function LexiconUpdateResponse() {
    _classCallCheck(this, LexiconUpdateResponse);

    LexiconUpdateResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(LexiconUpdateResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>LexiconUpdateResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/LexiconUpdateResponse} obj Optional instance to populate.
     * @return {module:model/LexiconUpdateResponse} The populated <code>LexiconUpdateResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new LexiconUpdateResponse();

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('success')) {
          obj['success'] = _ApiClient["default"].convertToType(data['success'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return LexiconUpdateResponse;
}();
/**
 * A unique Memory identifier.
 * @member {Number} memory_id
 */


LexiconUpdateResponse.prototype['memory_id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} success
 */

LexiconUpdateResponse.prototype['success'] = undefined;
var _default = LexiconUpdateResponse;
exports["default"] = _default;
},{"../ApiClient":3}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MatchBand model module.
 * @module model/MatchBand
 * @version 0.5.0
 */
var MatchBand = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MatchBand</code>.
   * A translation memory match band. 
   * @alias module:model/MatchBand
   */
  function MatchBand() {
    _classCallCheck(this, MatchBand);

    MatchBand.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MatchBand, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>MatchBand</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MatchBand} obj Optional instance to populate.
     * @return {module:model/MatchBand} The populated <code>MatchBand</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MatchBand();

        if (data.hasOwnProperty('minimum_score')) {
          obj['minimum_score'] = _ApiClient["default"].convertToType(data['minimum_score'], 'Number');
        }

        if (data.hasOwnProperty('maximum_score')) {
          obj['maximum_score'] = _ApiClient["default"].convertToType(data['maximum_score'], 'Number');
        }

        if (data.hasOwnProperty('num_source_words')) {
          obj['num_source_words'] = _ApiClient["default"].convertToType(data['num_source_words'], 'Number');
        }

        if (data.hasOwnProperty('num_segments')) {
          obj['num_segments'] = _ApiClient["default"].convertToType(data['num_segments'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return MatchBand;
}();
/**
 * The minimum fuzzy match score.
 * @member {Number} minimum_score
 */


MatchBand.prototype['minimum_score'] = undefined;
/**
 * The maximum fuzzy match score.
 * @member {Number} maximum_score
 */

MatchBand.prototype['maximum_score'] = undefined;
/**
 * The number of source words in the band.
 * @member {Number} num_source_words
 */

MatchBand.prototype['num_source_words'] = undefined;
/**
 * The number of source segments in the band.
 * @member {Number} num_segments
 */

MatchBand.prototype['num_segments'] = undefined;
var _default = MatchBand;
exports["default"] = _default;
},{"../ApiClient":3}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Memory model module.
 * @module model/Memory
 * @version 0.5.0
 */
var Memory = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Memory</code>.
   * A Memory is a collection of parallel (source/target) segments from which a MT/TM model is trained. When a translator confirms a segment in the Interface, a parallel segment is added to the Memory. Parallel segments from existing translation memories and bitexts can also be added to the Memory via the REST API. 
   * @alias module:model/Memory
   */
  function Memory() {
    _classCallCheck(this, Memory);

    Memory.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Memory, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Memory</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Memory} obj Optional instance to populate.
     * @return {module:model/Memory} The populated <code>Memory</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Memory();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('srclocale')) {
          obj['srclocale'] = _ApiClient["default"].convertToType(data['srclocale'], 'String');
        }

        if (data.hasOwnProperty('trglocale')) {
          obj['trglocale'] = _ApiClient["default"].convertToType(data['trglocale'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('version')) {
          obj['version'] = _ApiClient["default"].convertToType(data['version'], 'Number');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }

        if (data.hasOwnProperty('num_segments')) {
          obj['num_segments'] = _ApiClient["default"].convertToType(data['num_segments'], 'Number');
        }

        if (data.hasOwnProperty('resources')) {
          obj['resources'] = _ApiClient["default"].convertToType(data['resources'], ['String']);
        }
      }

      return obj;
    }
  }]);

  return Memory;
}();
/**
 * A unique number identifying the Memory.
 * @member {Number} id
 */


Memory.prototype['id'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclang
 */

Memory.prototype['srclang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglang
 */

Memory.prototype['trglang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclocale
 */

Memory.prototype['srclocale'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglocale
 */

Memory.prototype['trglocale'] = undefined;
/**
 * A name for the Memory.
 * @member {String} name
 */

Memory.prototype['name'] = undefined;
/**
 * The current version of the Memory, which is the number of updates since the memory was created.
 * @member {Number} version
 */

Memory.prototype['version'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

Memory.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

Memory.prototype['updated_at'] = undefined;
/**
 * The number of confirmed Segments incorporated into this Memory.
 * @member {Number} num_segments
 */

Memory.prototype['num_segments'] = undefined;
/**
 * The resource files (translation memories and termbases) associated with this Memory.
 * @member {Array.<String>} resources
 */

Memory.prototype['resources'] = undefined;
var _default = Memory;
exports["default"] = _default;
},{"../ApiClient":3}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryCreateParameters model module.
 * @module model/MemoryCreateParameters
 * @version 0.5.0
 */
var MemoryCreateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryCreateParameters</code>.
   * @alias module:model/MemoryCreateParameters
   * @param name {String} A name for the Memory.
   * @param srclang {String} An ISO 639-1 language identifier.
   * @param trglang {String} An ISO 639-1 language identifier.
   */
  function MemoryCreateParameters(name, srclang, trglang) {
    _classCallCheck(this, MemoryCreateParameters);

    MemoryCreateParameters.initialize(this, name, srclang, trglang);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryCreateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, name, srclang, trglang) {
      obj['name'] = name;
      obj['srclang'] = srclang;
      obj['trglang'] = trglang;
    }
    /**
     * Constructs a <code>MemoryCreateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryCreateParameters} obj Optional instance to populate.
     * @return {module:model/MemoryCreateParameters} The populated <code>MemoryCreateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryCreateParameters();

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('srclocale')) {
          obj['srclocale'] = _ApiClient["default"].convertToType(data['srclocale'], 'String');
        }

        if (data.hasOwnProperty('trglocale')) {
          obj['trglocale'] = _ApiClient["default"].convertToType(data['trglocale'], 'String');
        }
      }

      return obj;
    }
  }]);

  return MemoryCreateParameters;
}();
/**
 * A name for the Memory.
 * @member {String} name
 */


MemoryCreateParameters.prototype['name'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclang
 */

MemoryCreateParameters.prototype['srclang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglang
 */

MemoryCreateParameters.prototype['trglang'] = undefined;
/**
 * An ISO 3166-1 region name for language locales
 * @member {String} srclocale
 */

MemoryCreateParameters.prototype['srclocale'] = undefined;
/**
 * An ISO 3166-1 region name for language locales
 * @member {String} trglocale
 */

MemoryCreateParameters.prototype['trglocale'] = undefined;
var _default = MemoryCreateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryDeleteResponse model module.
 * @module model/MemoryDeleteResponse
 * @version 0.5.0
 */
var MemoryDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryDeleteResponse</code>.
   * @alias module:model/MemoryDeleteResponse
   */
  function MemoryDeleteResponse() {
    _classCallCheck(this, MemoryDeleteResponse);

    MemoryDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>MemoryDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryDeleteResponse} obj Optional instance to populate.
     * @return {module:model/MemoryDeleteResponse} The populated <code>MemoryDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return MemoryDeleteResponse;
}();
/**
 * A unique Memory identifier.
 * @member {Number} id
 */


MemoryDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

MemoryDeleteResponse.prototype['deleted'] = undefined;
var _default = MemoryDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryImportResponse model module.
 * @module model/MemoryImportResponse
 * @version 0.5.0
 */
var MemoryImportResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryImportResponse</code>.
   * @alias module:model/MemoryImportResponse
   */
  function MemoryImportResponse() {
    _classCallCheck(this, MemoryImportResponse);

    MemoryImportResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryImportResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>MemoryImportResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryImportResponse} obj Optional instance to populate.
     * @return {module:model/MemoryImportResponse} The populated <code>MemoryImportResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryImportResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('isProcessing')) {
          obj['isProcessing'] = _ApiClient["default"].convertToType(data['isProcessing'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return MemoryImportResponse;
}();
/**
 * A unique Memory identifier.
 * @member {Number} id
 */


MemoryImportResponse.prototype['id'] = undefined;
/**
 * The current state of the import.
 * @member {Number} isProcessing
 */

MemoryImportResponse.prototype['isProcessing'] = undefined;
var _default = MemoryImportResponse;
exports["default"] = _default;
},{"../ApiClient":3}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryInsertResponse model module.
 * @module model/MemoryInsertResponse
 * @version 0.5.0
 */
var MemoryInsertResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryInsertResponse</code>.
   * @alias module:model/MemoryInsertResponse
   */
  function MemoryInsertResponse() {
    _classCallCheck(this, MemoryInsertResponse);

    MemoryInsertResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryInsertResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>MemoryInsertResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryInsertResponse} obj Optional instance to populate.
     * @return {module:model/MemoryInsertResponse} The populated <code>MemoryInsertResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryInsertResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('num_updates')) {
          obj['num_updates'] = _ApiClient["default"].convertToType(data['num_updates'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return MemoryInsertResponse;
}();
/**
 * A unique Memory identifier.
 * @member {Number} id
 */


MemoryInsertResponse.prototype['id'] = undefined;
/**
 * The number of updates to the Memory.
 * @member {Number} num_updates
 */

MemoryInsertResponse.prototype['num_updates'] = undefined;
var _default = MemoryInsertResponse;
exports["default"] = _default;
},{"../ApiClient":3}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryUpdateParameters model module.
 * @module model/MemoryUpdateParameters
 * @version 0.5.0
 */
var MemoryUpdateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryUpdateParameters</code>.
   * @alias module:model/MemoryUpdateParameters
   * @param id {Number} A unique Memory identifier.
   * @param name {String} The Memory name.
   */
  function MemoryUpdateParameters(id, name) {
    _classCallCheck(this, MemoryUpdateParameters);

    MemoryUpdateParameters.initialize(this, id, name);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryUpdateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, id, name) {
      obj['id'] = id;
      obj['name'] = name;
    }
    /**
     * Constructs a <code>MemoryUpdateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryUpdateParameters} obj Optional instance to populate.
     * @return {module:model/MemoryUpdateParameters} The populated <code>MemoryUpdateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryUpdateParameters();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }
      }

      return obj;
    }
  }]);

  return MemoryUpdateParameters;
}();
/**
 * A unique Memory identifier.
 * @member {Number} id
 */


MemoryUpdateParameters.prototype['id'] = undefined;
/**
 * The Memory name.
 * @member {String} name
 */

MemoryUpdateParameters.prototype['name'] = undefined;
var _default = MemoryUpdateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The MemoryUpdateResponse model module.
 * @module model/MemoryUpdateResponse
 * @version 0.5.0
 */
var MemoryUpdateResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>MemoryUpdateResponse</code>.
   * @alias module:model/MemoryUpdateResponse
   */
  function MemoryUpdateResponse() {
    _classCallCheck(this, MemoryUpdateResponse);

    MemoryUpdateResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(MemoryUpdateResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>MemoryUpdateResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/MemoryUpdateResponse} obj Optional instance to populate.
     * @return {module:model/MemoryUpdateResponse} The populated <code>MemoryUpdateResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new MemoryUpdateResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('num_updates')) {
          obj['num_updates'] = _ApiClient["default"].convertToType(data['num_updates'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return MemoryUpdateResponse;
}();
/**
 * A unique Memory identifier.
 * @member {Number} id
 */


MemoryUpdateResponse.prototype['id'] = undefined;
/**
 * The number of updates to the Memory.
 * @member {Number} num_updates
 */

MemoryUpdateResponse.prototype['num_updates'] = undefined;
var _default = MemoryUpdateResponse;
exports["default"] = _default;
},{"../ApiClient":3}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentWithoutSegments = _interopRequireDefault(require("./DocumentWithoutSegments"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Project model module.
 * @module model/Project
 * @version 0.5.0
 */
var Project = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Project</code>.
   * A Project is a collection of zero or more Documents. It is specific to a language pair, and is associated with exactly one Memory for that language pair. The Memory association cannot be changed after the Project is created. 
   * @alias module:model/Project
   */
  function Project() {
    _classCallCheck(this, Project);

    Project.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Project, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Project</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Project} obj Optional instance to populate.
     * @return {module:model/Project} The populated <code>Project</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Project();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('srclocale')) {
          obj['srclocale'] = _ApiClient["default"].convertToType(data['srclocale'], 'String');
        }

        if (data.hasOwnProperty('trglocale')) {
          obj['trglocale'] = _ApiClient["default"].convertToType(data['trglocale'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('state')) {
          obj['state'] = _ApiClient["default"].convertToType(data['state'], 'String');
        }

        if (data.hasOwnProperty('due_date')) {
          obj['due_date'] = _ApiClient["default"].convertToType(data['due_date'], 'Number');
        }

        if (data.hasOwnProperty('archived')) {
          obj['archived'] = _ApiClient["default"].convertToType(data['archived'], 'Boolean');
        }

        if (data.hasOwnProperty('metadata')) {
          obj['metadata'] = _ApiClient["default"].convertToType(data['metadata'], Object);
        }

        if (data.hasOwnProperty('sample_review_percentage')) {
          obj['sample_review_percentage'] = _ApiClient["default"].convertToType(data['sample_review_percentage'], 'Number');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }

        if (data.hasOwnProperty('document')) {
          obj['document'] = _ApiClient["default"].convertToType(data['document'], [_DocumentWithoutSegments["default"]]);
        }
      }

      return obj;
    }
  }]);

  return Project;
}();
/**
 * A unique number identifying the Project.
 * @member {Number} id
 */


Project.prototype['id'] = undefined;
/**
 * A unique number identifying the associated Memory.
 * @member {Number} memory_id
 */

Project.prototype['memory_id'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} srclang
 */

Project.prototype['srclang'] = undefined;
/**
 * An ISO 639-1 language identifier.
 * @member {String} trglang
 */

Project.prototype['trglang'] = undefined;
/**
 * A locale identifier, supported for srclang.
 * @member {String} srclocale
 */

Project.prototype['srclocale'] = undefined;
/**
 * A locale identifier, supported for trglang.
 * @member {String} trglocale
 */

Project.prototype['trglocale'] = undefined;
/**
 * A name for the project.
 * @member {String} name
 */

Project.prototype['name'] = undefined;
/**
 * The project's state. The possible states are 'backlog', 'inProgress', 'inReview', 'inQA', and 'done'
 * @member {String} state
 */

Project.prototype['state'] = undefined;
/**
 * The due date. Measured in seconds since the Unix epoch.
 * @member {Number} due_date
 */

Project.prototype['due_date'] = undefined;
/**
 * The archived state of the Project.
 * @member {Boolean} archived
 */

Project.prototype['archived'] = undefined;
/**
 * A JSON object for storing various project metadata.
 * @member {Object} metadata
 */

Project.prototype['metadata'] = undefined;
/**
 * The project's sample review percentage.
 * @member {Number} sample_review_percentage
 */

Project.prototype['sample_review_percentage'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

Project.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

Project.prototype['updated_at'] = undefined;
/**
 * A list of Documents.
 * @member {Array.<module:model/DocumentWithoutSegments>} document
 */

Project.prototype['document'] = undefined;
var _default = Project;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentWithoutSegments":33}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ProjectCreateParameters model module.
 * @module model/ProjectCreateParameters
 * @version 0.5.0
 */
var ProjectCreateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ProjectCreateParameters</code>.
   * @alias module:model/ProjectCreateParameters
   * @param name {String} A name for the Project.
   * @param memoryId {Number} The Memory to associate with this new Project.
   */
  function ProjectCreateParameters(name, memoryId) {
    _classCallCheck(this, ProjectCreateParameters);

    ProjectCreateParameters.initialize(this, name, memoryId);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ProjectCreateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, name, memoryId) {
      obj['name'] = name;
      obj['memory_id'] = memoryId;
    }
    /**
     * Constructs a <code>ProjectCreateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ProjectCreateParameters} obj Optional instance to populate.
     * @return {module:model/ProjectCreateParameters} The populated <code>ProjectCreateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ProjectCreateParameters();

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('file_ids')) {
          obj['file_ids'] = _ApiClient["default"].convertToType(data['file_ids'], ['Number']);
        }

        if (data.hasOwnProperty('due_date')) {
          obj['due_date'] = _ApiClient["default"].convertToType(data['due_date'], 'Number');
        }

        if (data.hasOwnProperty('metadata')) {
          obj['metadata'] = _ApiClient["default"].convertToType(data['metadata'], Object);
        }
      }

      return obj;
    }
  }]);

  return ProjectCreateParameters;
}();
/**
 * A name for the Project.
 * @member {String} name
 */


ProjectCreateParameters.prototype['name'] = undefined;
/**
 * The Memory to associate with this new Project.
 * @member {Number} memory_id
 */

ProjectCreateParameters.prototype['memory_id'] = undefined;
/**
 * A list of Files to add to this new Project.
 * @member {Array.<Number>} file_ids
 */

ProjectCreateParameters.prototype['file_ids'] = undefined;
/**
 * The due date. Measured in seconds since the Unix epoch.
 * @member {Number} due_date
 */

ProjectCreateParameters.prototype['due_date'] = undefined;
/**
 * Metadata associated with a project. This field must be valid JSON.
 * @member {Object} metadata
 */

ProjectCreateParameters.prototype['metadata'] = undefined;
var _default = ProjectCreateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ProjectDeleteResponse model module.
 * @module model/ProjectDeleteResponse
 * @version 0.5.0
 */
var ProjectDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ProjectDeleteResponse</code>.
   * @alias module:model/ProjectDeleteResponse
   */
  function ProjectDeleteResponse() {
    _classCallCheck(this, ProjectDeleteResponse);

    ProjectDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ProjectDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ProjectDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ProjectDeleteResponse} obj Optional instance to populate.
     * @return {module:model/ProjectDeleteResponse} The populated <code>ProjectDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ProjectDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return ProjectDeleteResponse;
}();
/**
 * A unique Project identifier.
 * @member {Number} id
 */


ProjectDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

ProjectDeleteResponse.prototype['deleted'] = undefined;
var _default = ProjectDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _DocumentQuote = _interopRequireDefault(require("./DocumentQuote"));

var _MatchBand = _interopRequireDefault(require("./MatchBand"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ProjectQuote model module.
 * @module model/ProjectQuote
 * @version 0.5.0
 */
var ProjectQuote = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ProjectQuote</code>.
   * Quoting information for a Project. 
   * @alias module:model/ProjectQuote
   */
  function ProjectQuote() {
    _classCallCheck(this, ProjectQuote);

    ProjectQuote.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ProjectQuote, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ProjectQuote</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ProjectQuote} obj Optional instance to populate.
     * @return {module:model/ProjectQuote} The populated <code>ProjectQuote</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ProjectQuote();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('num_source_words')) {
          obj['num_source_words'] = _ApiClient["default"].convertToType(data['num_source_words'], 'Number');
        }

        if (data.hasOwnProperty('num_words_new')) {
          obj['num_words_new'] = _ApiClient["default"].convertToType(data['num_words_new'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_new')) {
          obj['num_segments_new'] = _ApiClient["default"].convertToType(data['num_segments_new'], 'Number');
        }

        if (data.hasOwnProperty('num_words_repetition')) {
          obj['num_words_repetition'] = _ApiClient["default"].convertToType(data['num_words_repetition'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_repetition')) {
          obj['num_segments_repetition'] = _ApiClient["default"].convertToType(data['num_segments_repetition'], 'Number');
        }

        if (data.hasOwnProperty('bands')) {
          obj['bands'] = _ApiClient["default"].convertToType(data['bands'], [_MatchBand["default"]]);
        }

        if (data.hasOwnProperty('documents')) {
          obj['documents'] = _ApiClient["default"].convertToType(data['documents'], [_DocumentQuote["default"]]);
        }
      }

      return obj;
    }
  }]);

  return ProjectQuote;
}();
/**
 * A unique Project identifier.
 * @member {Number} id
 */


ProjectQuote.prototype['id'] = undefined;
/**
 * The number of source words in the Project.
 * @member {Number} num_source_words
 */

ProjectQuote.prototype['num_source_words'] = undefined;
/**
 * The number of new source words in the Project.
 * @member {Number} num_words_new
 */

ProjectQuote.prototype['num_words_new'] = undefined;
/**
 * The number of new segments in the Project.
 * @member {Number} num_segments_new
 */

ProjectQuote.prototype['num_segments_new'] = undefined;
/**
 * The number of repetition source words in the Project.
 * @member {Number} num_words_repetition
 */

ProjectQuote.prototype['num_words_repetition'] = undefined;
/**
 * The number of repetition segments in the Project.
 * @member {Number} num_segments_repetition
 */

ProjectQuote.prototype['num_segments_repetition'] = undefined;
/**
 * A list of MatchBand objects that represent translation memory leverage statistics.
 * @member {Array.<module:model/MatchBand>} bands
 */

ProjectQuote.prototype['bands'] = undefined;
/**
 * A list of DocumentQuote objects that quotes information for a Document.
 * @member {Array.<module:model/DocumentQuote>} documents
 */

ProjectQuote.prototype['documents'] = undefined;
var _default = ProjectQuote;
exports["default"] = _default;
},{"../ApiClient":3,"./DocumentQuote":30,"./MatchBand":46}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _ResourceStatus = _interopRequireDefault(require("./ResourceStatus"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ProjectStatus model module.
 * @module model/ProjectStatus
 * @version 0.5.0
 */
var ProjectStatus = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ProjectStatus</code>.
   * The status of a Project. 
   * @alias module:model/ProjectStatus
   */
  function ProjectStatus() {
    _classCallCheck(this, ProjectStatus);

    ProjectStatus.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ProjectStatus, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ProjectStatus</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ProjectStatus} obj Optional instance to populate.
     * @return {module:model/ProjectStatus} The populated <code>ProjectStatus</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ProjectStatus();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('num_source_words')) {
          obj['num_source_words'] = _ApiClient["default"].convertToType(data['num_source_words'], 'Number');
        }

        if (data.hasOwnProperty('num_words_confirmed')) {
          obj['num_words_confirmed'] = _ApiClient["default"].convertToType(data['num_words_confirmed'], 'Number');
        }

        if (data.hasOwnProperty('num_words_reviewed')) {
          obj['num_words_reviewed'] = _ApiClient["default"].convertToType(data['num_words_reviewed'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed')) {
          obj['time_elapsed'] = _ApiClient["default"].convertToType(data['time_elapsed'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_translation')) {
          obj['time_elapsed_translation'] = _ApiClient["default"].convertToType(data['time_elapsed_translation'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_research')) {
          obj['time_elapsed_research'] = _ApiClient["default"].convertToType(data['time_elapsed_research'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_review')) {
          obj['time_elapsed_review'] = _ApiClient["default"].convertToType(data['time_elapsed_review'], 'Number');
        }

        if (data.hasOwnProperty('resources')) {
          obj['resources'] = _ApiClient["default"].convertToType(data['resources'], [_ResourceStatus["default"]]);
        }
      }

      return obj;
    }
  }]);

  return ProjectStatus;
}();
/**
 * A unique Project identifier.
 * @member {Number} id
 */


ProjectStatus.prototype['id'] = undefined;
/**
 * The number of source words in the Project.
 * @member {Number} num_source_words
 */

ProjectStatus.prototype['num_source_words'] = undefined;
/**
 * The number of confirmed source words.
 * @member {Number} num_words_confirmed
 */

ProjectStatus.prototype['num_words_confirmed'] = undefined;
/**
 * The number of reviewed source words.
 * @member {Number} num_words_reviewed
 */

ProjectStatus.prototype['num_words_reviewed'] = undefined;
/**
 * The total time spent on the project by all resources. Measured in milliseconds.
 * @member {Number} time_elapsed
 */

ProjectStatus.prototype['time_elapsed'] = undefined;
/**
 * The total time spent on translation by all resources. Measured in milliseconds.
 * @member {Number} time_elapsed_translation
 */

ProjectStatus.prototype['time_elapsed_translation'] = undefined;
/**
 * The total time spent on research by all resources. Measured in milliseconds.
 * @member {Number} time_elapsed_research
 */

ProjectStatus.prototype['time_elapsed_research'] = undefined;
/**
 * The total time spent on reviewing by all resources. Measured in milliseconds.
 * @member {Number} time_elapsed_review
 */

ProjectStatus.prototype['time_elapsed_review'] = undefined;
/**
 * A list of ResourceStatus objects that represent per-resource statistics.
 * @member {Array.<module:model/ResourceStatus>} resources
 */

ProjectStatus.prototype['resources'] = undefined;
var _default = ProjectStatus;
exports["default"] = _default;
},{"../ApiClient":3,"./ResourceStatus":67}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ProjectUpdateResponse model module.
 * @module model/ProjectUpdateResponse
 * @version 0.5.0
 */
var ProjectUpdateResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ProjectUpdateResponse</code>.
   * @alias module:model/ProjectUpdateResponse
   * @param id {Number} A unique Project identifier.
   */
  function ProjectUpdateResponse(id) {
    _classCallCheck(this, ProjectUpdateResponse);

    ProjectUpdateResponse.initialize(this, id);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ProjectUpdateResponse, null, [{
    key: "initialize",
    value: function initialize(obj, id) {
      obj['id'] = id;
    }
    /**
     * Constructs a <code>ProjectUpdateResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ProjectUpdateResponse} obj Optional instance to populate.
     * @return {module:model/ProjectUpdateResponse} The populated <code>ProjectUpdateResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ProjectUpdateResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('state')) {
          obj['state'] = _ApiClient["default"].convertToType(data['state'], 'String');
        }

        if (data.hasOwnProperty('due_date')) {
          obj['due_date'] = _ApiClient["default"].convertToType(data['due_date'], 'Number');
        }

        if (data.hasOwnProperty('archived')) {
          obj['archived'] = _ApiClient["default"].convertToType(data['archived'], 'Boolean');
        }

        if (data.hasOwnProperty('metadata')) {
          obj['metadata'] = _ApiClient["default"].convertToType(data['metadata'], Object);
        }

        if (data.hasOwnProperty('sample_review_percentage')) {
          obj['sample_review_percentage'] = _ApiClient["default"].convertToType(data['sample_review_percentage'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return ProjectUpdateResponse;
}();
/**
 * A unique Project identifier.
 * @member {Number} id
 */


ProjectUpdateResponse.prototype['id'] = undefined;
/**
 * The Project name.
 * @member {String} name
 */

ProjectUpdateResponse.prototype['name'] = undefined;
/**
 * The project's state. The possible states are 'backlog', 'inProgress', 'inReview', 'inQA', and 'done'
 * @member {String} state
 */

ProjectUpdateResponse.prototype['state'] = undefined;
/**
 * The due date. Measured in seconds since the Unix epoch.
 * @member {Number} due_date
 */

ProjectUpdateResponse.prototype['due_date'] = undefined;
/**
 * True if the project is archived. Otherwise, false.
 * @member {Boolean} archived
 */

ProjectUpdateResponse.prototype['archived'] = undefined;
/**
 * Metadata associated with a project. This field must be valid JSON.
 * @member {Object} metadata
 */

ProjectUpdateResponse.prototype['metadata'] = undefined;
/**
 * The Project's sample review percentage. Must be an integer between 10 and 100, a multiple of 10 and greater than minimum value (displayed in error message).
 * @member {Number} sample_review_percentage
 */

ProjectUpdateResponse.prototype['sample_review_percentage'] = undefined;
var _default = ProjectUpdateResponse;
exports["default"] = _default;
},{"../ApiClient":3}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _QARuleMatchesMatches = _interopRequireDefault(require("./QARuleMatchesMatches"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatches model module.
 * @module model/QARuleMatches
 * @version 0.5.0
 */
var QARuleMatches = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatches</code>.
   * QA rules describing the errors in the text.
   * @alias module:model/QARuleMatches
   */
  function QARuleMatches() {
    _classCallCheck(this, QARuleMatches);

    QARuleMatches.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatches, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>QARuleMatches</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatches} obj Optional instance to populate.
     * @return {module:model/QARuleMatches} The populated <code>QARuleMatches</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatches();

        if (data.hasOwnProperty('matches')) {
          obj['matches'] = _ApiClient["default"].convertToType(data['matches'], [_QARuleMatchesMatches["default"]]);
        }
      }

      return obj;
    }
  }]);

  return QARuleMatches;
}();
/**
 * @member {Array.<module:model/QARuleMatchesMatches>} matches
 */


QARuleMatches.prototype['matches'] = undefined;
var _default = QARuleMatches;
exports["default"] = _default;
},{"../ApiClient":3,"./QARuleMatchesMatches":62}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesContext model module.
 * @module model/QARuleMatchesContext
 * @version 0.5.0
 */
var QARuleMatchesContext = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesContext</code>.
   * @alias module:model/QARuleMatchesContext
   * @param length {Number} The length of the error in characters in the context.
   * @param offset {Number} The 0-based character offset of the error in the context text.
   * @param text {String} Context of the error, i.e. the error and some text to the left and to the left.
   */
  function QARuleMatchesContext(length, offset, text) {
    _classCallCheck(this, QARuleMatchesContext);

    QARuleMatchesContext.initialize(this, length, offset, text);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesContext, null, [{
    key: "initialize",
    value: function initialize(obj, length, offset, text) {
      obj['length'] = length;
      obj['offset'] = offset;
      obj['text'] = text;
    }
    /**
     * Constructs a <code>QARuleMatchesContext</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesContext} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesContext} The populated <code>QARuleMatchesContext</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesContext();

        if (data.hasOwnProperty('length')) {
          obj['length'] = _ApiClient["default"].convertToType(data['length'], 'Number');
        }

        if (data.hasOwnProperty('offset')) {
          obj['offset'] = _ApiClient["default"].convertToType(data['offset'], 'Number');
        }

        if (data.hasOwnProperty('text')) {
          obj['text'] = _ApiClient["default"].convertToType(data['text'], 'String');
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesContext;
}();
/**
 * The length of the error in characters in the context.
 * @member {Number} length
 */


QARuleMatchesContext.prototype['length'] = undefined;
/**
 * The 0-based character offset of the error in the context text.
 * @member {Number} offset
 */

QARuleMatchesContext.prototype['offset'] = undefined;
/**
 * Context of the error, i.e. the error and some text to the left and to the left.
 * @member {String} text
 */

QARuleMatchesContext.prototype['text'] = undefined;
var _default = QARuleMatchesContext;
exports["default"] = _default;
},{"../ApiClient":3}],62:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _QARuleMatchesContext = _interopRequireDefault(require("./QARuleMatchesContext"));

var _QARuleMatchesReplacements = _interopRequireDefault(require("./QARuleMatchesReplacements"));

var _QARuleMatchesRule = _interopRequireDefault(require("./QARuleMatchesRule"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesMatches model module.
 * @module model/QARuleMatchesMatches
 * @version 0.5.0
 */
var QARuleMatchesMatches = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesMatches</code>.
   * @alias module:model/QARuleMatchesMatches
   * @param context {module:model/QARuleMatchesContext} 
   * @param length {Number} The length of the error in characters.
   * @param message {String} Message about the error displayed to the user.
   * @param offset {Number} The 0-based character offset of the error in the text.
   * @param replacements {Array.<module:model/QARuleMatchesReplacements>} Replacements that might correct the error. The array can be empty, in this case there is no suggested replacement.
   */
  function QARuleMatchesMatches(context, length, message, offset, replacements) {
    _classCallCheck(this, QARuleMatchesMatches);

    QARuleMatchesMatches.initialize(this, context, length, message, offset, replacements);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesMatches, null, [{
    key: "initialize",
    value: function initialize(obj, context, length, message, offset, replacements) {
      obj['context'] = context;
      obj['length'] = length;
      obj['message'] = message;
      obj['offset'] = offset;
      obj['replacements'] = replacements;
    }
    /**
     * Constructs a <code>QARuleMatchesMatches</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesMatches} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesMatches} The populated <code>QARuleMatchesMatches</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesMatches();

        if (data.hasOwnProperty('context')) {
          obj['context'] = _QARuleMatchesContext["default"].constructFromObject(data['context']);
        }

        if (data.hasOwnProperty('length')) {
          obj['length'] = _ApiClient["default"].convertToType(data['length'], 'Number');
        }

        if (data.hasOwnProperty('message')) {
          obj['message'] = _ApiClient["default"].convertToType(data['message'], 'String');
        }

        if (data.hasOwnProperty('offset')) {
          obj['offset'] = _ApiClient["default"].convertToType(data['offset'], 'Number');
        }

        if (data.hasOwnProperty('replacements')) {
          obj['replacements'] = _ApiClient["default"].convertToType(data['replacements'], [_QARuleMatchesReplacements["default"]]);
        }

        if (data.hasOwnProperty('rule')) {
          obj['rule'] = _QARuleMatchesRule["default"].constructFromObject(data['rule']);
        }

        if (data.hasOwnProperty('shortMessage')) {
          obj['shortMessage'] = _ApiClient["default"].convertToType(data['shortMessage'], 'String');
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesMatches;
}();
/**
 * @member {module:model/QARuleMatchesContext} context
 */


QARuleMatchesMatches.prototype['context'] = undefined;
/**
 * The length of the error in characters.
 * @member {Number} length
 */

QARuleMatchesMatches.prototype['length'] = undefined;
/**
 * Message about the error displayed to the user.
 * @member {String} message
 */

QARuleMatchesMatches.prototype['message'] = undefined;
/**
 * The 0-based character offset of the error in the text.
 * @member {Number} offset
 */

QARuleMatchesMatches.prototype['offset'] = undefined;
/**
 * Replacements that might correct the error. The array can be empty, in this case there is no suggested replacement.
 * @member {Array.<module:model/QARuleMatchesReplacements>} replacements
 */

QARuleMatchesMatches.prototype['replacements'] = undefined;
/**
 * @member {module:model/QARuleMatchesRule} rule
 */

QARuleMatchesMatches.prototype['rule'] = undefined;
/**
 * An optional shorter version of 'message'.
 * @member {String} shortMessage
 */

QARuleMatchesMatches.prototype['shortMessage'] = undefined;
var _default = QARuleMatchesMatches;
exports["default"] = _default;
},{"../ApiClient":3,"./QARuleMatchesContext":61,"./QARuleMatchesReplacements":63,"./QARuleMatchesRule":64}],63:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesReplacements model module.
 * @module model/QARuleMatchesReplacements
 * @version 0.5.0
 */
var QARuleMatchesReplacements = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesReplacements</code>.
   * @alias module:model/QARuleMatchesReplacements
   */
  function QARuleMatchesReplacements() {
    _classCallCheck(this, QARuleMatchesReplacements);

    QARuleMatchesReplacements.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesReplacements, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>QARuleMatchesReplacements</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesReplacements} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesReplacements} The populated <code>QARuleMatchesReplacements</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesReplacements();

        if (data.hasOwnProperty('value')) {
          obj['value'] = _ApiClient["default"].convertToType(data['value'], 'String');
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesReplacements;
}();
/**
 * the replacement string
 * @member {String} value
 */


QARuleMatchesReplacements.prototype['value'] = undefined;
var _default = QARuleMatchesReplacements;
exports["default"] = _default;
},{"../ApiClient":3}],64:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _QARuleMatchesRuleCategory = _interopRequireDefault(require("./QARuleMatchesRuleCategory"));

var _QARuleMatchesRuleUrls = _interopRequireDefault(require("./QARuleMatchesRuleUrls"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesRule model module.
 * @module model/QARuleMatchesRule
 * @version 0.5.0
 */
var QARuleMatchesRule = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesRule</code>.
   * @alias module:model/QARuleMatchesRule
   * @param category {module:model/QARuleMatchesRuleCategory} 
   * @param description {String} 
   * @param id {String} An rule's identifier that's unique for this language.
   */
  function QARuleMatchesRule(category, description, id) {
    _classCallCheck(this, QARuleMatchesRule);

    QARuleMatchesRule.initialize(this, category, description, id);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesRule, null, [{
    key: "initialize",
    value: function initialize(obj, category, description, id) {
      obj['category'] = category;
      obj['description'] = description;
      obj['id'] = id;
    }
    /**
     * Constructs a <code>QARuleMatchesRule</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesRule} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesRule} The populated <code>QARuleMatchesRule</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesRule();

        if (data.hasOwnProperty('category')) {
          obj['category'] = _QARuleMatchesRuleCategory["default"].constructFromObject(data['category']);
        }

        if (data.hasOwnProperty('description')) {
          obj['description'] = _ApiClient["default"].convertToType(data['description'], 'String');
        }

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'String');
        }

        if (data.hasOwnProperty('issueType')) {
          obj['issueType'] = _ApiClient["default"].convertToType(data['issueType'], 'String');
        }

        if (data.hasOwnProperty('subId')) {
          obj['subId'] = _ApiClient["default"].convertToType(data['subId'], 'String');
        }

        if (data.hasOwnProperty('urls')) {
          obj['urls'] = _ApiClient["default"].convertToType(data['urls'], [_QARuleMatchesRuleUrls["default"]]);
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesRule;
}();
/**
 * @member {module:model/QARuleMatchesRuleCategory} category
 */


QARuleMatchesRule.prototype['category'] = undefined;
/**
 * @member {String} description
 */

QARuleMatchesRule.prototype['description'] = undefined;
/**
 * An rule's identifier that's unique for this language.
 * @member {String} id
 */

QARuleMatchesRule.prototype['id'] = undefined;
/**
 * The Localization Quality Issue Type. This is not defined for all languages, in which case it will always be 'Uncategorized'.
 * @member {String} issueType
 */

QARuleMatchesRule.prototype['issueType'] = undefined;
/**
 * An optional sub identifier of the rule, used when several rules are grouped.
 * @member {String} subId
 */

QARuleMatchesRule.prototype['subId'] = undefined;
/**
 * An optional array of URLs with a more detailed description of the error.
 * @member {Array.<module:model/QARuleMatchesRuleUrls>} urls
 */

QARuleMatchesRule.prototype['urls'] = undefined;
var _default = QARuleMatchesRule;
exports["default"] = _default;
},{"../ApiClient":3,"./QARuleMatchesRuleCategory":65,"./QARuleMatchesRuleUrls":66}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesRuleCategory model module.
 * @module model/QARuleMatchesRuleCategory
 * @version 0.5.0
 */
var QARuleMatchesRuleCategory = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesRuleCategory</code>.
   * @alias module:model/QARuleMatchesRuleCategory
   */
  function QARuleMatchesRuleCategory() {
    _classCallCheck(this, QARuleMatchesRuleCategory);

    QARuleMatchesRuleCategory.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesRuleCategory, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>QARuleMatchesRuleCategory</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesRuleCategory} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesRuleCategory} The populated <code>QARuleMatchesRuleCategory</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesRuleCategory();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesRuleCategory;
}();
/**
 * A category's identifier that's unique for this language.
 * @member {String} id
 */


QARuleMatchesRuleCategory.prototype['id'] = undefined;
/**
 * A short description of the category.
 * @member {String} name
 */

QARuleMatchesRuleCategory.prototype['name'] = undefined;
var _default = QARuleMatchesRuleCategory;
exports["default"] = _default;
},{"../ApiClient":3}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The QARuleMatchesRuleUrls model module.
 * @module model/QARuleMatchesRuleUrls
 * @version 0.5.0
 */
var QARuleMatchesRuleUrls = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>QARuleMatchesRuleUrls</code>.
   * @alias module:model/QARuleMatchesRuleUrls
   */
  function QARuleMatchesRuleUrls() {
    _classCallCheck(this, QARuleMatchesRuleUrls);

    QARuleMatchesRuleUrls.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(QARuleMatchesRuleUrls, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>QARuleMatchesRuleUrls</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/QARuleMatchesRuleUrls} obj Optional instance to populate.
     * @return {module:model/QARuleMatchesRuleUrls} The populated <code>QARuleMatchesRuleUrls</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new QARuleMatchesRuleUrls();

        if (data.hasOwnProperty('value')) {
          obj['value'] = _ApiClient["default"].convertToType(data['value'], 'String');
        }
      }

      return obj;
    }
  }]);

  return QARuleMatchesRuleUrls;
}();
/**
 * the URL
 * @member {String} value
 */


QARuleMatchesRuleUrls.prototype['value'] = undefined;
var _default = QARuleMatchesRuleUrls;
exports["default"] = _default;
},{"../ApiClient":3}],67:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The ResourceStatus model module.
 * @module model/ResourceStatus
 * @version 0.5.0
 */
var ResourceStatus = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>ResourceStatus</code>.
   * The status of a resource working on a Project. 
   * @alias module:model/ResourceStatus
   */
  function ResourceStatus() {
    _classCallCheck(this, ResourceStatus);

    ResourceStatus.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(ResourceStatus, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>ResourceStatus</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/ResourceStatus} obj Optional instance to populate.
     * @return {module:model/ResourceStatus} The populated <code>ResourceStatus</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new ResourceStatus();

        if (data.hasOwnProperty('email')) {
          obj['email'] = _ApiClient["default"].convertToType(data['email'], 'String');
        }

        if (data.hasOwnProperty('name')) {
          obj['name'] = _ApiClient["default"].convertToType(data['name'], 'String');
        }

        if (data.hasOwnProperty('num_words_confirmed')) {
          obj['num_words_confirmed'] = _ApiClient["default"].convertToType(data['num_words_confirmed'], 'Number');
        }

        if (data.hasOwnProperty('num_words_new')) {
          obj['num_words_new'] = _ApiClient["default"].convertToType(data['num_words_new'], 'Number');
        }

        if (data.hasOwnProperty('num_words_fuzzy')) {
          obj['num_words_fuzzy'] = _ApiClient["default"].convertToType(data['num_words_fuzzy'], 'Number');
        }

        if (data.hasOwnProperty('num_words_exact')) {
          obj['num_words_exact'] = _ApiClient["default"].convertToType(data['num_words_exact'], 'Number');
        }

        if (data.hasOwnProperty('num_words_reviewed')) {
          obj['num_words_reviewed'] = _ApiClient["default"].convertToType(data['num_words_reviewed'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed')) {
          obj['time_elapsed'] = _ApiClient["default"].convertToType(data['time_elapsed'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_translation')) {
          obj['time_elapsed_translation'] = _ApiClient["default"].convertToType(data['time_elapsed_translation'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_research')) {
          obj['time_elapsed_research'] = _ApiClient["default"].convertToType(data['time_elapsed_research'], 'Number');
        }

        if (data.hasOwnProperty('time_elapsed_review')) {
          obj['time_elapsed_review'] = _ApiClient["default"].convertToType(data['time_elapsed_review'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_confirmed')) {
          obj['num_segments_confirmed'] = _ApiClient["default"].convertToType(data['num_segments_confirmed'], 'Number');
        }

        if (data.hasOwnProperty('num_segments_reviewed')) {
          obj['num_segments_reviewed'] = _ApiClient["default"].convertToType(data['num_segments_reviewed'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return ResourceStatus;
}();
/**
 * An email address.
 * @member {String} email
 */


ResourceStatus.prototype['email'] = undefined;
/**
 * The full name.
 * @member {String} name
 */

ResourceStatus.prototype['name'] = undefined;
/**
 * The number of source words confirmed.
 * @member {Number} num_words_confirmed
 */

ResourceStatus.prototype['num_words_confirmed'] = undefined;
/**
 * The number of new source words confirmed.
 * @member {Number} num_words_new
 */

ResourceStatus.prototype['num_words_new'] = undefined;
/**
 * The number of fuzzy match source words confirmed.
 * @member {Number} num_words_fuzzy
 */

ResourceStatus.prototype['num_words_fuzzy'] = undefined;
/**
 * The number of exact match source words confirmed.
 * @member {Number} num_words_exact
 */

ResourceStatus.prototype['num_words_exact'] = undefined;
/**
 * The number of source words reviewed.
 * @member {Number} num_words_reviewed
 */

ResourceStatus.prototype['num_words_reviewed'] = undefined;
/**
 * The total time spent on translation and research. Measured in milliseconds.
 * @member {Number} time_elapsed
 */

ResourceStatus.prototype['time_elapsed'] = undefined;
/**
 * The total time spent translating. Measured in milliseconds.
 * @member {Number} time_elapsed_translation
 */

ResourceStatus.prototype['time_elapsed_translation'] = undefined;
/**
 * The total time spent on research. Measured in milliseconds.
 * @member {Number} time_elapsed_research
 */

ResourceStatus.prototype['time_elapsed_research'] = undefined;
/**
 * The total time spent reviewing. Measured in milliseconds.
 * @member {Number} time_elapsed_review
 */

ResourceStatus.prototype['time_elapsed_review'] = undefined;
/**
 * The number of source segments confirmed.
 * @member {Number} num_segments_confirmed
 */

ResourceStatus.prototype['num_segments_confirmed'] = undefined;
/**
 * The number of source segments reviewed.
 * @member {Number} num_segments_reviewed
 */

ResourceStatus.prototype['num_segments_reviewed'] = undefined;
var _default = ResourceStatus;
exports["default"] = _default;
},{"../ApiClient":3}],68:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Segment model module.
 * @module model/Segment
 * @version 0.5.0
 */
var Segment = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Segment</code>.
   * A Segment is a source string and, optionally, its translation. A Segment can be associated with both a Memory and a Document. The Segment object contains additional metadata about the source and target strings. 
   * @alias module:model/Segment
   */
  function Segment() {
    _classCallCheck(this, Segment);

    Segment.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Segment, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Segment</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Segment} obj Optional instance to populate.
     * @return {module:model/Segment} The populated <code>Segment</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Segment();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }

        if (data.hasOwnProperty('document_id')) {
          obj['document_id'] = _ApiClient["default"].convertToType(data['document_id'], 'Number');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('is_confirmed')) {
          obj['is_confirmed'] = _ApiClient["default"].convertToType(data['is_confirmed'], 'Boolean');
        }

        if (data.hasOwnProperty('is_reviewed')) {
          obj['is_reviewed'] = _ApiClient["default"].convertToType(data['is_reviewed'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return Segment;
}();
/**
 * A unique number identifying the Segment.
 * @member {Number} id
 */


Segment.prototype['id'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

Segment.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

Segment.prototype['updated_at'] = undefined;
/**
 * A unique Document identifier.
 * @member {Number} document_id
 */

Segment.prototype['document_id'] = undefined;
/**
 * The Memory with which this Segment is associated.
 * @member {Number} memory_id
 */

Segment.prototype['memory_id'] = undefined;
/**
 * The source string.
 * @member {String} source
 */

Segment.prototype['source'] = undefined;
/**
 * An ISO 639-1 language code.
 * @member {String} srclang
 */

Segment.prototype['srclang'] = undefined;
/**
 * The target string.
 * @member {String} target
 */

Segment.prototype['target'] = undefined;
/**
 * An ISO 639-1 language code.
 * @member {String} trglang
 */

Segment.prototype['trglang'] = undefined;
/**
 * The confirmation status.
 * @member {Boolean} is_confirmed
 */

Segment.prototype['is_confirmed'] = undefined;
/**
 * The review status.
 * @member {Boolean} is_reviewed
 */

Segment.prototype['is_reviewed'] = undefined;
var _default = Segment;
exports["default"] = _default;
},{"../ApiClient":3}],69:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The SegmentCreateParameters model module.
 * @module model/SegmentCreateParameters
 * @version 0.5.0
 */
var SegmentCreateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>SegmentCreateParameters</code>.
   * @alias module:model/SegmentCreateParameters
   * @param source {String} The source string.
   */
  function SegmentCreateParameters(source) {
    _classCallCheck(this, SegmentCreateParameters);

    SegmentCreateParameters.initialize(this, source);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(SegmentCreateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, source) {
      obj['source'] = source;
    }
    /**
     * Constructs a <code>SegmentCreateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/SegmentCreateParameters} obj Optional instance to populate.
     * @return {module:model/SegmentCreateParameters} The populated <code>SegmentCreateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new SegmentCreateParameters();

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('document_id')) {
          obj['document_id'] = _ApiClient["default"].convertToType(data['document_id'], 'Number');
        }

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }
      }

      return obj;
    }
  }]);

  return SegmentCreateParameters;
}();
/**
 * A unique Memory identifier.
 * @member {Number} memory_id
 */


SegmentCreateParameters.prototype['memory_id'] = undefined;
/**
 * A unique Document identifier.
 * @member {Number} document_id
 */

SegmentCreateParameters.prototype['document_id'] = undefined;
/**
 * The source string.
 * @member {String} source
 */

SegmentCreateParameters.prototype['source'] = undefined;
/**
 * The target string.
 * @member {String} target
 */

SegmentCreateParameters.prototype['target'] = undefined;
var _default = SegmentCreateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],70:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The SegmentDeleteResponse model module.
 * @module model/SegmentDeleteResponse
 * @version 0.5.0
 */
var SegmentDeleteResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>SegmentDeleteResponse</code>.
   * @alias module:model/SegmentDeleteResponse
   */
  function SegmentDeleteResponse() {
    _classCallCheck(this, SegmentDeleteResponse);

    SegmentDeleteResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(SegmentDeleteResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>SegmentDeleteResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/SegmentDeleteResponse} obj Optional instance to populate.
     * @return {module:model/SegmentDeleteResponse} The populated <code>SegmentDeleteResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new SegmentDeleteResponse();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('deleted')) {
          obj['deleted'] = _ApiClient["default"].convertToType(data['deleted'], 'Boolean');
        }
      }

      return obj;
    }
  }]);

  return SegmentDeleteResponse;
}();
/**
 * A unique Segment identifier.
 * @member {Number} id
 */


SegmentDeleteResponse.prototype['id'] = undefined;
/**
 * If the operation succeeded, then `true`. Otherwise, `false`.
 * @member {Boolean} deleted
 */

SegmentDeleteResponse.prototype['deleted'] = undefined;
var _default = SegmentDeleteResponse;
exports["default"] = _default;
},{"../ApiClient":3}],71:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The SegmentUpdateParameters model module.
 * @module model/SegmentUpdateParameters
 * @version 0.5.0
 */
var SegmentUpdateParameters = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>SegmentUpdateParameters</code>.
   * @alias module:model/SegmentUpdateParameters
   * @param id {Number} A unique Segment identifier.
   * @param target {String} The target string.
   */
  function SegmentUpdateParameters(id, target) {
    _classCallCheck(this, SegmentUpdateParameters);

    SegmentUpdateParameters.initialize(this, id, target);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(SegmentUpdateParameters, null, [{
    key: "initialize",
    value: function initialize(obj, id, target) {
      obj['id'] = id;
      obj['target'] = target;
    }
    /**
     * Constructs a <code>SegmentUpdateParameters</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/SegmentUpdateParameters} obj Optional instance to populate.
     * @return {module:model/SegmentUpdateParameters} The populated <code>SegmentUpdateParameters</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new SegmentUpdateParameters();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }
      }

      return obj;
    }
  }]);

  return SegmentUpdateParameters;
}();
/**
 * A unique Segment identifier.
 * @member {Number} id
 */


SegmentUpdateParameters.prototype['id'] = undefined;
/**
 * The target string.
 * @member {String} target
 */

SegmentUpdateParameters.prototype['target'] = undefined;
var _default = SegmentUpdateParameters;
exports["default"] = _default;
},{"../ApiClient":3}],72:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Comment = _interopRequireDefault(require("./Comment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The SegmentWithComments model module.
 * @module model/SegmentWithComments
 * @version 0.5.0
 */
var SegmentWithComments = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>SegmentWithComments</code>.
   * A Segment is a source string and, optionally, its translation. A Segment can be associated with both a Memory and a Document. The Segment object contains additional metadata about the source and target strings. 
   * @alias module:model/SegmentWithComments
   */
  function SegmentWithComments() {
    _classCallCheck(this, SegmentWithComments);

    SegmentWithComments.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(SegmentWithComments, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>SegmentWithComments</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/SegmentWithComments} obj Optional instance to populate.
     * @return {module:model/SegmentWithComments} The populated <code>SegmentWithComments</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new SegmentWithComments();

        if (data.hasOwnProperty('id')) {
          obj['id'] = _ApiClient["default"].convertToType(data['id'], 'Number');
        }

        if (data.hasOwnProperty('created_at')) {
          obj['created_at'] = _ApiClient["default"].convertToType(data['created_at'], 'Number');
        }

        if (data.hasOwnProperty('updated_at')) {
          obj['updated_at'] = _ApiClient["default"].convertToType(data['updated_at'], 'Number');
        }

        if (data.hasOwnProperty('document_id')) {
          obj['document_id'] = _ApiClient["default"].convertToType(data['document_id'], 'Number');
        }

        if (data.hasOwnProperty('memory_id')) {
          obj['memory_id'] = _ApiClient["default"].convertToType(data['memory_id'], 'Number');
        }

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('srclang')) {
          obj['srclang'] = _ApiClient["default"].convertToType(data['srclang'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('trglang')) {
          obj['trglang'] = _ApiClient["default"].convertToType(data['trglang'], 'String');
        }

        if (data.hasOwnProperty('is_confirmed')) {
          obj['is_confirmed'] = _ApiClient["default"].convertToType(data['is_confirmed'], 'Boolean');
        }

        if (data.hasOwnProperty('is_reviewed')) {
          obj['is_reviewed'] = _ApiClient["default"].convertToType(data['is_reviewed'], 'Boolean');
        }

        if (data.hasOwnProperty('comments')) {
          obj['comments'] = _ApiClient["default"].convertToType(data['comments'], [_Comment["default"]]);
        }
      }

      return obj;
    }
  }]);

  return SegmentWithComments;
}();
/**
 * A unique number identifying the Segment.
 * @member {Number} id
 */


SegmentWithComments.prototype['id'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} created_at
 */

SegmentWithComments.prototype['created_at'] = undefined;
/**
 * Time at which the object was created. Measured in seconds since the Unix epoch.
 * @member {Number} updated_at
 */

SegmentWithComments.prototype['updated_at'] = undefined;
/**
 * A unique Document identifier.
 * @member {Number} document_id
 */

SegmentWithComments.prototype['document_id'] = undefined;
/**
 * The Memory with which this Segment is associated.
 * @member {Number} memory_id
 */

SegmentWithComments.prototype['memory_id'] = undefined;
/**
 * The source string.
 * @member {String} source
 */

SegmentWithComments.prototype['source'] = undefined;
/**
 * An ISO 639-1 language code.
 * @member {String} srclang
 */

SegmentWithComments.prototype['srclang'] = undefined;
/**
 * The target string.
 * @member {String} target
 */

SegmentWithComments.prototype['target'] = undefined;
/**
 * An ISO 639-1 language code.
 * @member {String} trglang
 */

SegmentWithComments.prototype['trglang'] = undefined;
/**
 * The confirmation status.
 * @member {Boolean} is_confirmed
 */

SegmentWithComments.prototype['is_confirmed'] = undefined;
/**
 * The review status.
 * @member {Boolean} is_reviewed
 */

SegmentWithComments.prototype['is_reviewed'] = undefined;
/**
 * A list of Comments.
 * @member {Array.<module:model/Comment>} comments
 */

SegmentWithComments.prototype['comments'] = undefined;
var _default = SegmentWithComments;
exports["default"] = _default;
},{"../ApiClient":3,"./Comment":18}],73:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The TaggedSegment model module.
 * @module model/TaggedSegment
 * @version 0.5.0
 */
var TaggedSegment = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>TaggedSegment</code>.
   * A source string with tags automatically projected from source to target.
   * @alias module:model/TaggedSegment
   */
  function TaggedSegment() {
    _classCallCheck(this, TaggedSegment);

    TaggedSegment.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(TaggedSegment, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>TaggedSegment</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/TaggedSegment} obj Optional instance to populate.
     * @return {module:model/TaggedSegment} The populated <code>TaggedSegment</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new TaggedSegment();

        if (data.hasOwnProperty('source_tagged')) {
          obj['source_tagged'] = _ApiClient["default"].convertToType(data['source_tagged'], 'String');
        }

        if (data.hasOwnProperty('target_tagged')) {
          obj['target_tagged'] = _ApiClient["default"].convertToType(data['target_tagged'], 'String');
        }
      }

      return obj;
    }
  }]);

  return TaggedSegment;
}();
/**
 * The tagged source string.
 * @member {String} source_tagged
 */


TaggedSegment.prototype['source_tagged'] = undefined;
/**
 * The tagged target string.
 * @member {String} target_tagged
 */

TaggedSegment.prototype['target_tagged'] = undefined;
var _default = TaggedSegment;
exports["default"] = _default;
},{"../ApiClient":3}],74:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The TranslateRegisterResponse model module.
 * @module model/TranslateRegisterResponse
 * @version 0.5.0
 */
var TranslateRegisterResponse = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>TranslateRegisterResponse</code>.
   * @alias module:model/TranslateRegisterResponse
   */
  function TranslateRegisterResponse() {
    _classCallCheck(this, TranslateRegisterResponse);

    TranslateRegisterResponse.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(TranslateRegisterResponse, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>TranslateRegisterResponse</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/TranslateRegisterResponse} obj Optional instance to populate.
     * @return {module:model/TranslateRegisterResponse} The populated <code>TranslateRegisterResponse</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new TranslateRegisterResponse();

        if (data.hasOwnProperty('source_hash')) {
          obj['source_hash'] = _ApiClient["default"].convertToType(data['source_hash'], 'Number');
        }

        if (data.hasOwnProperty('num_words')) {
          obj['num_words'] = _ApiClient["default"].convertToType(data['num_words'], 'Number');
        }
      }

      return obj;
    }
  }]);

  return TranslateRegisterResponse;
}();
/**
 * A unique source token required by the `prefix` parameter for translation requests.
 * @member {Number} source_hash
 */


TranslateRegisterResponse.prototype['source_hash'] = undefined;
/**
 * The number of billed words in the segment.
 * @member {Number} num_words
 */

TranslateRegisterResponse.prototype['num_words'] = undefined;
var _default = TranslateRegisterResponse;
exports["default"] = _default;
},{"../ApiClient":3}],75:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The Translation model module.
 * @module model/Translation
 * @version 0.5.0
 */
var Translation = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>Translation</code>.
   * A machine translation (MT) or a translation memory (TM) match of a source segment.
   * @alias module:model/Translation
   */
  function Translation() {
    _classCallCheck(this, Translation);

    Translation.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(Translation, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>Translation</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Translation} obj Optional instance to populate.
     * @return {module:model/Translation} The populated <code>Translation</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new Translation();

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('targetWithTags')) {
          obj['targetWithTags'] = _ApiClient["default"].convertToType(data['targetWithTags'], 'String');
        }

        if (data.hasOwnProperty('align')) {
          obj['align'] = _ApiClient["default"].convertToType(data['align'], 'String');
        }

        if (data.hasOwnProperty('provenance')) {
          obj['provenance'] = _ApiClient["default"].convertToType(data['provenance'], 'String');
        }

        if (data.hasOwnProperty('score')) {
          obj['score'] = _ApiClient["default"].convertToType(data['score'], 'Number');
        }

        if (data.hasOwnProperty('isTMMatch')) {
          obj['isTMMatch'] = _ApiClient["default"].convertToType(data['isTMMatch'], 'Boolean');
        }

        if (data.hasOwnProperty('targetDelimiters')) {
          obj['targetDelimiters'] = _ApiClient["default"].convertToType(data['targetDelimiters'], ['String']);
        }

        if (data.hasOwnProperty('targetWords')) {
          obj['targetWords'] = _ApiClient["default"].convertToType(data['targetWords'], ['String']);
        }
      }

      return obj;
    }
  }]);

  return Translation;
}();
/**
 * The target string.
 * @member {String} target
 */


Translation.prototype['target'] = undefined;
/**
 * The target string with source tags projected into the target.
 * @member {String} targetWithTags
 */

Translation.prototype['targetWithTags'] = undefined;
/**
 * \"MT only: A whitespace delimited list of source-target alignment indices.\" 
 * @member {String} align
 */

Translation.prototype['align'] = undefined;
/**
 * Positive values indicate that the word is from the Memory, with contiguous identical entries (e.g., 2 2) indicating phrase matches. Negative contiguous values indicate entries from the Lexicon. 0 indicates a word from the background data. 
 * @member {String} provenance
 */

Translation.prototype['provenance'] = undefined;
/**
 * The score of the translation.
 * @member {Number} score
 */

Translation.prototype['score'] = undefined;
/**
 * TM only: If true, indicates an exact translation memory match.
 * @member {Boolean} isTMMatch
 */

Translation.prototype['isTMMatch'] = undefined;
/**
 * A format string that indicates, for each word, if the word should be preceded by a space.
 * @member {Array.<String>} targetDelimiters
 */

Translation.prototype['targetDelimiters'] = undefined;
/**
 * The target string can be constructed by suffixing each `targetDelimiters` entry with its corresponding word in `targetWords` and concatenating the constructed array. Please note that the `targetDelimiters` array has one more entry than `targetWords` array which is why the last entry in the array will be the last value of `targetDelimiters`. 
 * @member {Array.<String>} targetWords
 */

Translation.prototype['targetWords'] = undefined;
var _default = Translation;
exports["default"] = _default;
},{"../ApiClient":3}],76:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

var _Translation = _interopRequireDefault(require("./Translation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The TranslationList model module.
 * @module model/TranslationList
 * @version 0.5.0
 */
var TranslationList = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>TranslationList</code>.
   * An ranked list of translations and associated metadata.
   * @alias module:model/TranslationList
   */
  function TranslationList() {
    _classCallCheck(this, TranslationList);

    TranslationList.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(TranslationList, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>TranslationList</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/TranslationList} obj Optional instance to populate.
     * @return {module:model/TranslationList} The populated <code>TranslationList</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new TranslationList();

        if (data.hasOwnProperty('untokenizedSource')) {
          obj['untokenizedSource'] = _ApiClient["default"].convertToType(data['untokenizedSource'], 'String');
        }

        if (data.hasOwnProperty('tokenizedSource')) {
          obj['tokenizedSource'] = _ApiClient["default"].convertToType(data['tokenizedSource'], 'String');
        }

        if (data.hasOwnProperty('sourceDelimiters')) {
          obj['sourceDelimiters'] = _ApiClient["default"].convertToType(data['sourceDelimiters'], ['String']);
        }

        if (data.hasOwnProperty('translation')) {
          obj['translation'] = _ApiClient["default"].convertToType(data['translation'], [_Translation["default"]]);
        }
      }

      return obj;
    }
  }]);

  return TranslationList;
}();
/**
 * The untokenized source segment. Punctuation has not been separated from words.
 * @member {String} untokenizedSource
 */


TranslationList.prototype['untokenizedSource'] = undefined;
/**
 * The tokenized source segment. Punctuation has been separated from words.
 * @member {String} tokenizedSource
 */

TranslationList.prototype['tokenizedSource'] = undefined;
/**
 * A format string that indicates, for each word, if the word should be preceded by a space.
 * @member {Array.<String>} sourceDelimiters
 */

TranslationList.prototype['sourceDelimiters'] = undefined;
/**
 * A list of Translation objects.
 * @member {Array.<module:model/Translation>} translation
 */

TranslationList.prototype['translation'] = undefined;
var _default = TranslationList;
exports["default"] = _default;
},{"../ApiClient":3,"./Translation":75}],77:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiClient = _interopRequireDefault(require("../ApiClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The TranslationMemoryEntry model module.
 * @module model/TranslationMemoryEntry
 * @version 0.5.0
 */
var TranslationMemoryEntry = /*#__PURE__*/function () {
  /**
   * Constructs a new <code>TranslationMemoryEntry</code>.
   * A translation memory entry.
   * @alias module:model/TranslationMemoryEntry
   */
  function TranslationMemoryEntry() {
    _classCallCheck(this, TranslationMemoryEntry);

    TranslationMemoryEntry.initialize(this);
  }
  /**
   * Initializes the fields of this object.
   * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
   * Only for internal use.
   */


  _createClass(TranslationMemoryEntry, null, [{
    key: "initialize",
    value: function initialize(obj) {}
    /**
     * Constructs a <code>TranslationMemoryEntry</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/TranslationMemoryEntry} obj Optional instance to populate.
     * @return {module:model/TranslationMemoryEntry} The populated <code>TranslationMemoryEntry</code> instance.
     */

  }, {
    key: "constructFromObject",
    value: function constructFromObject(data, obj) {
      if (data) {
        obj = obj || new TranslationMemoryEntry();

        if (data.hasOwnProperty('source')) {
          obj['source'] = _ApiClient["default"].convertToType(data['source'], 'String');
        }

        if (data.hasOwnProperty('target')) {
          obj['target'] = _ApiClient["default"].convertToType(data['target'], 'String');
        }

        if (data.hasOwnProperty('score')) {
          obj['score'] = _ApiClient["default"].convertToType(data['score'], 'Number');
        }

        if (data.hasOwnProperty('metadata')) {
          obj['metadata'] = _ApiClient["default"].convertToType(data['metadata'], Object);
        }
      }

      return obj;
    }
  }]);

  return TranslationMemoryEntry;
}();
/**
 * The source string.
 * @member {String} source
 */


TranslationMemoryEntry.prototype['source'] = undefined;
/**
 * The target string. Tags will be automatically placed according to the query string.
 * @member {String} target
 */

TranslationMemoryEntry.prototype['target'] = undefined;
/**
 * The fuzzy match score.
 * @member {Number} score
 */

TranslationMemoryEntry.prototype['score'] = undefined;
/**
 * Attributes describing the translation memory entry.
 * @member {Object} metadata
 */

TranslationMemoryEntry.prototype['metadata'] = undefined;
var _default = TranslationMemoryEntry;
exports["default"] = _default;
},{"../ApiClient":3}],78:[function(require,module,exports){
/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = require('component-emitter');
var RequestBase = require('./request-base');
var isObject = require('./is-object');
var ResponseBase = require('./response-base');
var shouldRetry = require('./should-retry');

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function(method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only version of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    if (index === -1) { // could be empty line, just skip it
      continue;
    }
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
      status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD'
      ? this._parseBody(this.text ? this.text : this.xhr.response)
      : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if(this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      }
    } catch(custom_err) {
      new_err = custom_err; // ok() callback can throw
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
    options = pass;
  }
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto',
    }
  }

  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;

    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', 'Bearer ' + user);
    break;
  }
  return this;
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options){
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  // console.log(this._retries, this._maxRetries)
  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function(){
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
}

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // querystring
  this._finalizeQueryString();

  return this._end();
};

Request.prototype._end = function() {
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts();

  // state change
  xhr.onreadystatechange = function(){
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // initiate request
  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;

    if (this.header.hasOwnProperty(field))
      xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, data, fn){
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":79,"./request-base":80,"./response-base":81,"./should-retry":82,"component-emitter":1}],79:[function(require,module,exports){
'use strict';

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],80:[function(require,module,exports){
'use strict';

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout(){
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options){
  if (!options || 'object' !== typeof options) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for(var option in options) {
    switch(option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;
      case 'response':
        this._responseTimeout = options.response;
        break;
      default:
        console.warn("Unknown timeout option", option);
    }
  }
  return this;
};

/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.retry = function retry(count){
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  return this;
};

/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */

RequestBase.prototype._retry = function() {
  this.clearTimeout();

  // node
  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;

  return this._end();
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

RequestBase.prototype.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
}

RequestBase.prototype.ok = function(cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function(res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function(on){
  // This is browser-only functionality. Node side is no-op.
  if(on==undefined) on = true;
  this._withCredentials = on;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n
 * @return {Request} for chaining
 */
RequestBase.prototype.maxResponseSize = function(n){
  if ('number' !== typeof n) {
    throw TypeError("Invalid argument");
  }
  this._maxResponseSize = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};


/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function(data){
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};


/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function(sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */
RequestBase.prototype._finalizeQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }
  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if ('function' === typeof this._sort) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

// For backwards compat only
RequestBase.prototype._appendQueryString = function() {console.trace("Unsupported");}

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function(reason, timeout, errno){
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function() {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function(){
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
}

},{"./is-object":79}],81:[function(require,module,exports){
'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function(field){
    return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function(header){
    // TODO: moar!
    // TODO: make this a util

    // content-type
    var ct = header['content-type'] || '';
    this.type = utils.type(ct);

    // params
    var params = utils.params(ct);
    for (var key in params) this[key] = params[key];

    this.links = {};

    // links
    try {
        if (header.link) {
            this.links = utils.parseLinks(header.link);
        }
    } catch (err) {
        // ignore
    }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = this.statusCode = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.redirect = 3 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = (4 == type || 5 == type)
        ? this.toError()
        : false;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.forbidden = 403 == status;
    this.notFound = 404 == status;
};

},{"./utils":83}],82:[function(require,module,exports){
'use strict';

var ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EADDRINFO',
  'ESOCKETTIMEDOUT'
];

/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */
module.exports = function shouldRetry(err, res) {
  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
  if (res && res.status && res.status >= 500) return true;
  // Superagent timeout
  if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
  if (err && 'crossDomain' in err) return true;
  return false;
};

},{}],83:[function(require,module,exports){
'use strict';

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function(str){
  return str.split(/ *, */).reduce(function(obj, str){
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function(header, shouldStripCookie){
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  if (shouldStripCookie) {
    delete header['cookie'];
  }
  return header;
};

},{}],84:[function(require,module,exports){
require('dotenv').config();
var LiltNode = require('lilt-node');

const APIKey = document.getElementById("APIKeyInput").value;

var defaultClient = LiltNode.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
var ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
ApiKeyAuth.apiKey = APIKey
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//ApiKeyAuth.apiKeyPrefix['key'] = "Token"
// Configure HTTP basic authorization: BasicAuth
var BasicAuth = defaultClient.authentications['BasicAuth'];
BasicAuth.username = APIKey
BasicAuth.password = APIKey

try {
    let apiInstance = new LiltNode.RootApi();
    apiInstance.root().then((data) => {
        console.log('API called successfully. Returned data: ' + data);
        window.sessionStorage.setItem("APIKEY", APIKey);
        console.log("Successfully stored API Key in process.env")
        window.location.href = "home.html";
    }, (error) => {
        console.error(error);
        document.getElementById("errorMessage").innerHTML = "Invalid API Key";
    });
} catch {
    document.getElementById("errorMessage").innerHTML = "Invalid API Key";
}
},{"dotenv":2,"lilt-node":15}],85:[function(require,module,exports){

},{}],86:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],87:[function(require,module,exports){
arguments[4][85][0].apply(exports,arguments)
},{"dup":85}],88:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":86,"buffer":88,"ieee754":89}],89:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],90:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

exports.homedir = function () {
	return '/'
};

},{}],91:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":92}],92:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],93:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],94:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],95:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":93,"./encode":94}]},{},[84]);
