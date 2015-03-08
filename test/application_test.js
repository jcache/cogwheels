'use strict';

var Helper      = require('./test_helper')
  , Application = Helper.Cogwheels.Application
;

exports.withValidStyles = {
  setUp: function(done) {
    this.data = '@import "default";';
    this.app  = new Application({ paths: Helper.LOAD_PATHS });

    done();
  },

  testRenderResult: function(test) {
    test.expect(2);

    this.app.render({data: this.data}).nodeify(function(err, result) {
      test.ifError(err);
      test.ok(result, 'expected some css');

      test.done();
    });
  }
};
