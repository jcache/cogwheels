/**
 * @class Cogwheels.Application
 */

'use strict';

var Promise   = require('bluebird')
  , Importer  = require('./importer')
  , Minifier  = require('./minifier')
  , Result    = require('./result')
  , SassError = require('./sass-error')
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
  return Promise.try(function() {
    var render_options  = this._createRenderOptions(params)
      , result_options  = this._createResultOptions()
      , raw_result      = sass.renderSync(render_options)
    ;

    return new Result(raw_result, result_options);
  }.bind(this)).catch(function(err) {
    throw new SassError(err);
  });
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

  if (!params) {
    throw new TypeError('missing options');
  }

  if (!params.hasOwnProperty('data')) {
    throw new TypeError('missing data');
  }

  render_options.data = params.data;

  return render_options;
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
