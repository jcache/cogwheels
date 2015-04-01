/**
 * @class Cogwheels.Minifier
 *
 * Wrapper around CleanCSS to support future extension / options from command-line
 */

'use strict';

var CleanCSS = require('clean-css');

function Minifier(options) {
  this._minifier = new CleanCSS({ keepSpecialComments: 0 });
}

module.exports = Minifier;

/**
 * @param {String} css
 * @return {String} minified css
 */
Minifier.prototype.minify = function(css) {
  return this._minifier.minify(css.toString()).styles;
};
