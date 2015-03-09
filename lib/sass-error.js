/**
 * @class Cogwheels.SassError
 * @extends Error
 */

'use strict';

var util    = require('util')
  , indent  = require('indent-string')
;

function SassError(properties) {
  Error.call(this);

  if (typeof properties === 'object') {
    for (var key in properties) {
      this[key] = properties[key];
    }
  } else if (typeof properties === 'string') {
    this.message = properties;
  }

  if (!this.message) {
    this.message = 'Sass Error';
  }
}

module.exports = SassError;

util.inherits(SassError, Error);

SassError.prototype.status  = 1;

SassError.prototype.line    = 1;

SassError.prototype.column  = 1;

SassError.prototype.code    = undefined;

SassError.prototype.file    = undefined;

var FULL_MESSAGE_FORMAT = '[SassError] in file `%s` on line %d column %d code %d:\n%s\n\n';

Object.defineProperty(SassError.prototype, 'full_message', {
  get: function() {
    return util.format(FULL_MESSAGE_FORMAT, this.file || '-', this.line, this.column, this.code || 3, indent(this.message, '  '));
  }
});
