/**
 * @class Cogwheels.Squelcher
 * @singleton
 *
 * We need to squelch stdout because node-sass produces nonsense
 * from the importer.
 */
'use strict';

var StdOutFixture = require('fixture-stdout')
  , Promise       = require('bluebird')
;

var Squelcher = module.exports = {};

/**
 * @property {StdOutFixture} FIXTURE
 * @readonly
 * @private
 */
var FIXTURE = new StdOutFixture();

/**
 *  @property {Object[]} WRITES
 *  @readonly
 */
var WRITES = Squelcher.WRITES = [];

/**
 * @private
 * @return {false}
 */
function silenceWrites(string, encoding, fd) {
  WRITES.push({
    string:   string,
    encoding: encoding,
    fd:       fd
  });

  // suppress stdout
  return false;
}

/**
 * @return {void}
 */
Squelcher.mute = function() {
  FIXTURE.capture(silenceWrites);
};

/**
 * @return {void}
 */
Squelcher.unmute = function() {
  FIXTURE.release();
};

/**
 * @return {Promise.<void>}
 */
Squelcher.promise = function Squelcher_promise() {
  return Promise.resolve(Squelcher).call('mute').disposer(Squelcher.unmute);
};
