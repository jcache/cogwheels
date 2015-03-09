/**
 * @class Cogwheels.CLI
 */

'use strict';

var Promise       = require('bluebird')
  , TimeoutError  = Promise.TimeoutError
  , Cogwheels     = require('./cogwheels')
  , Constants     = require('./constants')
  , SassError     = require('./sass-error')
  , Utility       = require('./utility')
;

/**
 * @method constructor
 * @param {Object} options
 * @param {Stream} options.stdin
 * @param {Stream} options.stdout
 * @param {Stream} options.stderr
 * @param {String[]} options.argv
 */
function CLI(options) {
  if (!(this instanceof CLI)) {
    return new CLI(options);
  }

  this.stdin        = options.stdin;
  this.stdout       = options.stdout;
  this.stderr       = options.stderr;
  this.argv         = options.argv;
}

module.exports = CLI;

/**
 * @property {Number} exitStatus
 */
CLI.prototype.exitStatus = 0;

/**
 * @property {Stream} stdin
 */

/**
 * @property {Stream} stdout
 */

/**
 * @property {Stream} stderr
 */

/**
 * @property {String[]} argv
 */

/**
 * @param {Object} options
 * @return {Promise.<String>}
 */
CLI.prototype.run = function CLI$run(options) {
  return Utility.asString(this.stdin)
    .timeout(Constants.MAX_TIME, 'took too long')
    .bind(this)
    .then(minify)
    .tap(printCss)
    .catch(TimeoutError, handleTimeout)
    .catch(SassError, handleSassError)
    .catch(handleUnknownError)
  ;
};

/**
 * @static
 * @return {void}
 */
CLI.gracefulExit = function gracefulExit() {
  var exit = process.exit.bind(process, this.exitStatus);

  setImmediate(exit);
};

/**
 * @private
 * @param {String}
 * @return {void}
 */
function printCss(minified) {
  //jshint validthis: true

  this.stdout.write(minified);
}

/**
 * @private
 * @param {Cogwheels.SassError} err
 * @return {void}
 */
function handleSassError(err) {
  //jshint validthis: true

  this.exitStatus = err.status || 1;

  this.stderr.write(err.full_message);
}

function handleTimeout(err) {
  //jshint validthis:true
  this.exitStatus = Constants.EXIT.TIMEOUT;

  this.stderr.write(err.message);
}

/**
 * @private
 * @param {Error} err
 * @return {void}
 */
function handleUnknownError(err) {
  //jshint validthis: true

  if (!err) {
    this.exitStatus = 3;
    this.stderr.write('Unhandled null error');
    return;
  }

  this.exitStatus = err.status || 3;
  this.stderr.write('Uncaught error: ' + err.message);
}


/**
 * @private
 * @param {String} data
 * @return {Promise.<String>}
 */
function minify(data) {
  //jshint validthis:true

  var compiler = new Cogwheels.Application({ paths: Cogwheels.config.get('paths') });

  return compiler.minify({ data: data });
}
