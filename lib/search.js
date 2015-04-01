/**
 * @class Cogwheels.Search
 * @private
 * @todo Inline back with {@link Cogwheels.Importer} depending on how node-sass' API changes.
 * @todo Change back to asynchronous filesystem methods when node-sass fixes importer functions.
 */

'use strict';

var Promise = require('bluebird')
  , fs      = Promise.promisifyAll(require('fs'))
  , _       = require('lodash')
;

/**
 * @method constructor
 * @param {Object} options
 * @param {String} options.uri
 * @param {String} options.source
 */
function Search(options) {
  this.uri    = options.uri;
  this.source = options.source;
  this.graph  = options.graph;
}

module.exports = Search;

/**
 * @property {String} uri
 */

/**
 * @property {String} source
 */

/**
 * @param {String[]} paths
 * @param {function(LibSass.ImportSource): void} done
 * @return {Object}
 */
Search.prototype.execute = function Search$execute(paths, done) {
  this.graph.addNode(this.source);

  var resolved_path = _.detect(paths, fs.existsSync);

  if (!resolved_path) {
    // Return an impossible path that give a slightly-descriptive error message.
    // TODO: fix after node-sass documentation improves for how to handle missing paths.
    return { file: '@import "'+this.uri+'";' };
  }

  this.graph.addNode(resolved_path);
  this.graph.addDependency(this.source, resolved_path);

  return { file: resolved_path };
};
