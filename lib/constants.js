/**
 * @class Cogwhees.Constants
 * @singleton
 */
'use strict';

var Constants = module.exports = {};

/**
 * Max time cogwheels can run in milliseconds.
 */
Constants.MAX_TIME = 10000;

/**
 * Exit codes.
 */
Constants.EXIT = {
  ERROR:    1,
  TIMEOUT:  2,
  ABORTED:  3,
  UNKNOWN:  4
};
