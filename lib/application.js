/**
 * @class Cogwheels.Application
 */

'use strict';

var CleanCSS  = require('clean-css')
  , Promise   = require('bluebird')
  , Importer  = require('./importer')
  , Squelcher = require('./squelcher')
  , async     = require('async')
  , sass      = require('node-sass')
  , path      = require('path')
  , util      = require('util')
  , ehd       = require('expand-home-dir')
  , fs        = require('fs')
  , _         = require('lodash')
;

/**
 * @method constructor
 */
function Application(options) {
  this.data     = options.data;
  this.importer = new Importer(options);
}

module.exports = Application;

/**
 * @return {Promise}
 */
Application.prototype.render = function Application$render(done) {
  var options = this._createRenderOptions();

  return new Promise(function(resolve, reject) {
    Squelcher.mute();

    _.extend(options, {
      success:  resolve,
      error:    reject
    });

    sass.render(options);
  }).finally(function() {
    Squelcher.unmute();
  });
};

/**
 * @return {Promise}
 */
Application.prototype.minify = function Application$minify(done) {
  return this.render().then(function(result) {
    return minifyCss(result.css);
  }).nodeify(done);
};

/**
 * @private
 * @return {Object}
 */
Application.prototype._createRenderOptions = function() {
  return {
    data:               this.data,
    includePaths:       this.importer.paths,
    importer:           this.importer.find,
    indentedSyntax:     false,
    outputStyle:        'nested',
    sourceMapEmbedded:  false,
    sourceComments:     false
  };
};

/**
 * @static
 * @private
 * @param {String} raw
 * @return {String}
 */
function minifyCss(raw) {
  return new CleanCSS({
    keepSpecialComments: 0
  }).minify(raw).styles;
}
