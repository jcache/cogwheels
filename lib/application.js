/**
 * @class Cogwheels.Application
 */

'use strict';

var Promise   = require('bluebird')
  , Importer  = require('./importer')
  , Minifier  = require('./minifier')
  , Result    = require('./result')
  , SassError = require('./sass-error')
  , Squelcher = require('./squelcher')
  , sass      = require('node-sass')
;

/**
 * @method constructor
 */
function Application(options) {
  this.importer = new Importer(options);
  this.minifier = new Minifier();
}

module.exports = Application;

/**
 * @param {Object} params
 * @param {String} params.data
 * @return {Promise.<Cogwheels.Result>}
 */
Application.prototype.render = function Application$render(params) {
  return Promise.using(this._createRenderOptions(params), Squelcher.promise(), renderSass).bind(this).then(toResult);
};

/**
 * @return {Promise.<String>}
 */
Application.prototype.minify = function Application$minify(params, done) {
  return this.render(params).get('minified').nodeify(done);
};

/**
 * @private
 * @param {Object} params
 * @param {String} params.data
 * @return {Promise.<Object>}
 */
Application.prototype._createRenderOptions = function(params) {
  var render_options = {
    includePaths:       this.importer.paths,
    importer:           this.importer.find,
    indentedSyntax:     false,
    outputStyle:        'nested',
    sourceMapEmbedded:  false,
    sourceComments:     false
  };

  return Promise.try(function() {
    if (!params) {
      throw new TypeError('missing options');
    }

    if (!params.hasOwnProperty('data')) {
      throw new TypeError('missing data');
    }

    render_options.data = params.data;

    return render_options;
  });
};

/**
 * @private
 * @return {Object}
 */
Application.prototype._createResultOptions = function() {
  return {
    minifier: this.minifier
  };
};

/**
 * @private
 * @param {LibSass.Result} raw_result
 * @return {Promise.<Cogwheels.Result>}
 */
function toResult(raw_result) {
  //jshint validthis:true

  var options = this._createResultOptions();

  return new Result(raw_result, options);
}

/**
 * @private
 * @param {Object} options
 * @return {Promise.<LibSass.Result>}
 */
function renderSass(options) {
  return new Promise(function(resolve, reject) {
    options.success = resolve;

    options.error = function rejectSassError(err) {
      reject(new SassError(err));
    };

    sass.render(options);
  });
}
