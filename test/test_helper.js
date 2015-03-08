'use strict';

var path      = require('path')
  , Cogwheels = require('../lib/cogwheels')
  , stream    = require('mock-utf8-stream')
  , resumer   = require('resumer')
;

exports.Cogwheels = Cogwheels;
exports.CLI       = require('../lib/cli');

exports.LOAD_PATHS = [
  path.join(__dirname, 'dummy2'),
  path.join(__dirname, 'dummy1')
];


function CLIOptions() {
  this.stdin  = resumer();
  this.stdout = new stream.MockWritableStream();
  this.stderr = new stream.MockWritableStream();
  this.argv   = [];
}

exports.CLIOptions = CLIOptions;

CLIOptions.prototype.startCapture = function() {
  this.stdout.startCapture();
  this.stderr.startCapture();
};

function cliRunner(data, options, cb) {
  options = options || {};

  var be_successful = !!options.success;

  var actual_test_count = (options.test_count >>> 0) + 4;

  return function(test) {
    test.expect(actual_test_count);

    function ranAsExpected(err, result) {
      //jshint validthis:true
      test.ifError(err);

      if (be_successful) {
        testSuccess(this, test);
      } else {
        testFailure(this, test);
      }

      if (typeof cb === 'function') {
        cb.call(this, test, err, result);
      } else {
        test.done();
      }
    }

    this.cli.run().nodeify(ranAsExpected.bind(this));

    this.options.stdin.queue(data).end();
  };
}

exports.cliRunner = cliRunner;

function testSuccess(context, test) {
  test.strictEqual(context.cli.exitStatus, 0, 'expected exitStatus to be 0');
  test.equal(context.options.stderr.capturedData, '', 'expected stderr to be empty');
  test.ok(context.options.stdout.capturedData, 'expected stdout to contain css');
}

function testFailure(context, test) {
  test.notStrictEqual(context.cli.exitStatus, 0, 'expected exitStatus not to be 0');
  test.ok(context.options.stderr.capturedData, 'expected stderr to contain error message');
  test.equal(context.options.stdout.capturedData, '', 'expected stdout to not be empty');
}
