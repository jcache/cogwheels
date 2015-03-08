/**
 * @class Cogwheels.Utility
 * @singleton
 */
'use strict';

var Promise     = require('bluebird')
  , concat      = require('concat-stream')
;

/**
 * @param {Stream} input
 * @return {Promise.<String>}
 */
function asString(input_stream) {
  return new Promise(function(resolve, reject) {
    input_stream.on('error', reject);
    input_stream.pipe(concat({ encoding: 'string' }, resolve));
  });
}

exports.asString = asString;
