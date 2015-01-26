/**
 * @class Cogwheels.Config
 * @singleton
 */

'use strict';

var ehd   = require('expand-home-dir')
  , nconf = require('nconf')
  , ini   = require('ini')
;

module.exports = nconf;

nconf.file('localini', {
  dir: process.cwd(),
  file: 'config/cogwheels.ini',
  search: true,
  format: ini
});

nconf.file('local', {
  dir: process.cwd(),
  file: 'config/cogwheels.json',
  search: true
});

nconf.file('global', ehd('~/.cogwheels.json'));

nconf.defaults({
  paths: [],
  foo: 'bar'
});
