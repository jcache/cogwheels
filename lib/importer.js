/**
 * @class Cogwheels.Importer
 * @private
 */

'use strict';

var DepGraph  = require('dependency-graph').DepGraph
  , Search    = require('./search')
  , path      = require('path')
  , util      = require('util')
  , ehd       = require('expand-home-dir')
  , _         = require('lodash')
;

/**
 * @method constructor
 * @param {Object} options
 * @param {String[]} options.paths
 */
function Importer(options) {
  options = options || {};

  this.graph = new DepGraph();

  if (Array.isArray(options.paths)) {
    this.paths = options.paths.map(sanitizePath);
  } else {
    this.paths = [];
  }

  _.bindAll(this, 'find');
}

module.exports = Importer;

/**
 * @property {String[]} FILENAME_FORMATS
 * @readonly
 * @private
 * @static
 */
var FILENAME_FORMATS = [
  '_%s.scss',
  '_%s.css.scss',
  '%s.scss',
  '%s.css.scss',
  '%s.css'
];

/**
 * Format of return object is `{file: result.path, contents: result.data}`
 *
 * @param {String} uri the path in `@import` as is, which libsass encountered
 * @param {String} prev the previously resolved path
 * @param {function(LibSass.ImportSource): void} done
 * @return {Object}
 */
Importer.prototype.find = function Importer$find(uri, prev, done) {
  var search  = new Search({ graph: this.graph, uri: uri, source: prev })
    , paths   = this.allPossiblePathsFor(uri, prev)
  ;

  return search.execute(paths, done);
};

/**
 * @private
 * @param {String} uri
 * @param {String} prev
 * @return {String[]}
 */
Importer.prototype.allPossiblePathsFor = function Importer$allPossiblePathsFor(uri, prev) {
  var resolved_uri  = path.resolve(path.dirname(prev), uri)
    , matching_uri  = this.matching_uri_for(resolved_uri)
    , potentially_matching_uris
  ;

  potentially_matching_uris = [matching_uri];

  // `@import` can also fetch from a root as well as the current directory
  if (!isRelative(uri) && matching_uri !== uri) {
    potentially_matching_uris.push(uri);
  }

  return _.chain(potentially_matching_uris).
    map(this.possible_paths_for, this).
    flatten().
    value();
};

/**
 * @private
 * @param {String} uri
 * @return {String[]} paths
 */
Importer.prototype.possible_paths_for = function Importer$possible_paths_for(uri) {
  var base_dir  = path.dirname(uri)
    , basename  = path.basename(uri)
  ;

  var possible_uris = FILENAME_FORMATS.map(function(format) {
    return path.join(base_dir, util.format(format, basename));
  });

  return generate_full_paths_for(this.paths, possible_uris);
};

/**
 * @static
 * @private
 * @param {String[]} paths
 * @param {String[]} possible_uris
 * @return {String[]}
 */
function generate_full_paths_for(paths, possible_uris) {
  return _.chain(paths).map(function(load_path) {
    return possible_uris.map(function(possible_uri) {
      return path.join(load_path, possible_uri);
    });
  }).flatten().value();
}

/**
 * @private
 * @param {String} resolved_uri
 * @return {String}
 */
Importer.prototype.matching_uri_for = function Importer$matching_uri_for(resolved_uri) {
  var matching_root = _.detect(this.paths, function(path) {
    return resolved_uri.indexOf(path) === 0;
  });

  if (matching_root) {
    return resolved_uri.slice(matching_root.length + 1);
  } else {
    return resolved_uri;
  }
};

/**
 * Check if a URI is relative, i.e. starts with `'..'`
 *
 * @static
 * @private
 * @param {String} uri
 * @return {Boolean}
 */
function isRelative(uri) {
  return !!~uri.indexOf('..');
}

/**
 * Make sure each path is fully expanded.
 *
 * @static
 * @private
 * @param {String} path
 * @return {String}
 */
function sanitizePath(path) {
  return ehd(path);
}
