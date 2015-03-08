/**
 * @class Cogwheels.Result
 * @extends LibSass.Result
 */

'use strict';

var Minifier        = require('./minifier')
  , addLazyProperty = require('lazy-property')
;

/**
 * @method constructor
 * @param {LibSass.Result} params
 * @param {Object} options
 * @param {Cogwheels.Minifier} options.minifier
 */
function Result(params, options) {
  params      = params || {};
  options     = options || {};

  //setupPromises(this);

  this.css    = params.css;
  this.map    = params.map || '';
  this.stats  = params.stats || {};
  this.graph  = params.graph || {};

  this.minifier = options.minifier || new Minifier();
}

module.exports = Result;

/**
 * @property {String} minified
 * @readonly
 */
addLazyProperty(Result.prototype, 'minified', function() {
  return this.minifier.minify(this.css);
});
