/**
 * @class Cogwheels.Importer
 */

'use strict';

var assert    = require('assert')
  , async     = require('async')
  , path      = require('path')
  , util      = require('util')
  , ehd       = require('expand-home-dir')
  , fs        = require('fs')
  , _         = require('lodash')
;

var FILENAME_FORMATS = [
  '_%s.scss',
  '_%s.css.scss',
  '%s.scss',
  '%s.css.scss',
  '%s.css'
];

/**
 * @method constructor
 * @param {Object} options
 */
function Importer(options) {
  options = options || {};

  this.formats  = FILENAME_FORMATS;

  if (Array.isArray(options.paths)) {
    this.paths = options.paths.map(sanitizePath);
  } else {
    this.paths = [];
  }

  _.bindAll(this, 'find');
}

module.exports = Importer;

/**
 * Format of return object is `{file: result.path, contents: result.data}`
 *
 * @param {String} uri the path in `@import` as is, which libsass encountered
 * @param {String} prev the previously resolved path
 * @param {function(Object): void} done is an optional callback, either consume it or return its value synchronously
 * @return {Object, void}
 */
Importer.prototype.find = function Importer$find(uri, prev, done) {
  var resolved_uri  = path.resolve(path.dirname(prev), uri)
    , matching_uri  = this.matching_uri_for(resolved_uri)
  ;

  var potentially_matching_uris = [matching_uri];

  // `@import` can also fetch from a root as well as the current directory
  if (!isRelative(uri) && matching_uri !== uri) {
    potentially_matching_uris.push(uri);
  }

  this.multifind_scss(potentially_matching_uris, function(err, result) {
    if (err) {
      console.dir(uri);
      console.dir(potentially_matching_uris);
      console.error('failed to find scss by uri: %s', matching_uri);

      return done({ file: matching_uri });
    }

    done(result);
  });
};

/**
 * @private
 * @param {String[]} uris
 * @param {function(Error=, Object): void} done
 * @return {void}
 */
Importer.prototype.multifind_scss = function Importer$multifind_scss(uris, done) {
  async.reduce(uris, null, checkEachUri.bind(this), function(err, found_path) {
    if (!found_path) {
      return done(new Error('not found'));
    } else if (err) {
      return done(err);
    } else {
      return done(null, found_path);
    }
  });
};

/**
 * @private
 * @param {String} uri
 * @param {function(Error=, Object): void} done
 * @return {void}
 */
Importer.prototype.find_scss = function Importer$find_scss(uri, done) {
  async.detect(this.possible_paths_for(uri), fs.exists, function(result) {
    if (!result) {
      return done(null, null);
    }

    fs.readFile(result, { encoding: 'utf8' }, function(err, contents) {
      if (err) {
        return done(err);
      }

      done(null, { file: result, contents: contents });
    });
  });
};

/**
 * @private
 * @param {String} uri
 * @return {String[]} paths
 */
Importer.prototype.possible_paths_for = function Importer$possible_paths_for(uri) {
  var base_dir      = path.dirname(uri)
    , basename      = path.basename(uri)
  ;

  var possible_uris = this.formats.map(function(format) {
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
 * Iterator function for `async.reduce`.
 *
 * @static
 * @private
 * @param {String / null} found_path
 * @param {String} uri
 * @param {function(Error=, Object): void} callback
 * @return {void}
 */
function checkEachUri(found_path, uri, callback) {
  //jshint validthis:true

  if (found_path) {
    return callback(null, found_path);
  }

  this.find_scss(uri, callback);
}

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

