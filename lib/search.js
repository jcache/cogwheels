/**
 * @class Cogwheels.Search
 * @private
 */

'use strict';

var Promise = require('bluebird')
  , async   = require('async')
  , fs      = Promise.promisifyAll(require('fs'))
;

/**
 * @method constructor
 * @param {Object} options
 * @param {String} options.uri
 * @param {String} options.source
 */
function Search(options) {
  var pending_path  = Promise.pending()
    , contents      = pending_path.promise.then(readFile)
  ;

  this.uri    = options.uri;
  this.source = options.source;
  this.graph  = options.graph;

  Object.defineProperties(this, {
    _pending_path:  { value: pending_path, enumerable: false, writable: false },
    contents:       { value: contents, enumerable: true, writable: false },
    path:           { value: pending_path.promise, enumerable: true, writable: false }
  });
}

module.exports = Search;

/**
 * @property {String} uri
 */

/**
 * @property {Promise.<String>} path
 */

/**
 * @property {String} source
 */

/**
 * @property {Promise.<String>} contents
 */

/**
 * @param {String[]} paths
 * @return {void}
 */
Search.prototype.detect = function Search$detect(paths) {
  detectFirstExisting(paths).bind(this).done(pathFound, pathNotFound);
};

/**
 * @param {String[]} paths
 * @param {function(LibSass.ImportSource): void} done
 * @return {void}
 */
Search.prototype.execute = function Search$execute(paths, done) {
  this.graph.addNode(this.source);

  this.detect(paths);

  Promise.settle([this.path, this.contents]).bind(this).spread(toImportSource).tap(updateGraph).done(done, done);
};

/**
 * @param {Promise.<String>} pathPromise
 * @param {Promise.<String>} contentsPromise
 * @return {Promise.<LibSass.ImportSource>}
 */
function toImportSource(pathPromise, contentsPromise) {
  //jshint validthis:true

  var obj   = {}
    , valid = false
  ;

  if (pathPromise.isFulfilled()) {
    obj.file = pathPromise.value();

    if (contentsPromise.isFulfilled()) {
      obj.contents = contentsPromise.value();

      valid = true;
    }
  } else {
    obj.file = this.uri;
  }

  return valid ? Promise.resolve(obj) : Promise.reject(obj);
}

/**
 * @static
 * @private
 * @return {void}
 */
function updateGraph() {
  //jshint validthis:true

  this.graph.addNode(this.path.value());
  this.graph.addDependency(this.source, this.path.value());
}

/**
 * @property {Object} NOT_FOUND
 * @readonly
 * @static
 */
var NOT_FOUND = Object.create(null);

Object.defineProperty(Search, 'NOT_FOUND', { value: NOT_FOUND, writable: false, enumerable: false });

/**
 * @static
 * @param {Object} err
 * @return {Boolean}
 */
Search.notFound = function Search_notFound(err) {
  return err === NOT_FOUND;
};

/**
 * @param {String} path
 * @return {void}
 */
function pathFound(path) {
  //jshint validthis:true

  this._pending_path.resolve(path);
}

function pathNotFound() {
  //jshint validthis:true

  this._pending_path.reject(NOT_FOUND);
}

/**
 * @static
 * @private
 * @param {String}
 * @return {Promise.<String>}
 */
function readFile(path) {
  return fs.readFileAsync(path, { encoding: 'utf8' });
}

/**
 * @static
 * @private
 * @param {String[]} paths
 * @return {Promise.<String>}
 */
function detectFirstExisting(paths) {
  return new Promise(function(resolve, reject) {
    async.detect(paths, fs.exists, function(path) {
      if (path) {
        return resolve(path);
      } else {
        return reject(NOT_FOUND);
      }
    });
  });
}
