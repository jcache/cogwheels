'use strict';

var Helper      = require('./test_helper')
  , CLI         = Helper.CLI
  , CLIOptions  = Helper.CLIOptions
  , cliRunner   = Helper.cliRunner
;

function setupCLI(done) {
  //jshint validthis:true

  this.options  = new CLIOptions();
  this.cli      = new CLI(this.options);

  this.options.startCapture();

  done();
}

exports.withMockedStreams = {
  setUp: setupCLI,

  withValidData: cliRunner('p { color: black;}', { success: true }),
  withInvalidData: cliRunner('p { color ')
};
