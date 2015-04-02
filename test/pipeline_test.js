'use strict';

var Helper      = require('./test_helper')
  , Pipeline = Helper.Cogwheels.Pipeline
;

exports['pipeline tests'] = {
  setUp: function(done) {
    this.pipeline = defaultPipeline();

    done();
  },

  'succeeds on a valid import': succeedsWith('@import "default";'),

  'succeeds on valid css': succeedsWith('p { color: black; }'),

  'fails on an invalid import': failsWith('@import "nope";'),

  'fails on invalid css': failsWith('p {')
};

function defaultPipeline() {
  return new Pipeline({ paths: Helper.LOAD_PATHS });
}

function succeedsWith(css) {
  return function(test) {
    test.expect(3);

    this.pipeline.render({data: css}).nodeify(function(err, result) {
      test.ifError(err);
      test.ok(result, 'expected some css');
      test.ok(Helper.isValidCSS(result.css.toString()), 'should be valid css');

      test.done();
    });
  };
}

function failsWith(css) {
  return function(test) {
    test.expect(2);

    this.pipeline.render({data: css}).nodeify(function(err, result) {
      test.ok(err, 'throws an error');
      test.ok(!result, 'has no result');

      test.done();
    });
  };
}

