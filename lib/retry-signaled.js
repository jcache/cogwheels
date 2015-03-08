'use strict';

var Promise     = require('bluebird')
  , LazyPromise = require('lazy-then')
  , async       = Promise.promisifyAll(require('async'))
  , spawn       = require('child-process-promise').spawn
  , Utility     = require('./utility')
  , _           = require('lodash')
;

/**
 * Exec without aborting.
 *
 * Same params as {@link #retryProcess}.
 *
 * @return {void}
 */
exports.exec = function() {
  retry.apply(null, arguments).then(sanitize).catch(sanitize).done(printAndExit, failure);
};

/**
 * @param {String}  cmd
 * @param {Array}   options.args
 */
var retry = exports.retryProcess = Promise.method(function(cmd, options) {
  options = options || {};

  var attempts = options.attempts >>> 0 || 10
    , include_stdin = !!options.include_stdin
  ;

  if (!cmd) {
    throw new Error('Missing required option: name');
  }

  var retry_context = {
    cmd:            cmd,
    options:        options,
    include_stdin:  include_stdin,
    attempts:       attempts
  };

  if (Array.isArray(options.args) && options.args.length > 0) {
    retry_context.args = options.args;
  }

  return Promise.resolve(retry_context).bind(retry_context).then(addStdin).then(attemptProcess);
});

function sanitize(result) {
  if (result.code == null) {
    result.code = -1;
  } else if (result.signal) {
    result.code = -1;
  }

  return result;
}

function printAndExit(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.code);
}

function failure(err) {
  console.warn('Undefined err!');
  console.dir(err);

  process.exit(-1);
}

function attemptProcess(ctx) {
  function doSpawn(cb) {
    var spawn_opts  = { capture: ['stdout', 'stderr'], stdio: ['pipe', 'pipe'] }
      , spawn_ctx   = {}
    ;

    spawn_opts.stdio.unshift(ctx.include_stdin ? 'pipe' : 'ignore');

    spawn(ctx.cmd, ctx.args || [], spawn_opts).progress(function(child) {
      spawn_ctx.pid = child.pid;

      child.on('exit', function(code, signal) {
        spawn_ctx.code    = code;
        spawn_ctx.signal  = signal;
      });

      if (ctx.include_stdin) {
        child.stdin.write(ctx.stdin);
        child.stdin.end();
      }

    }).then(function(result) {
      _.extend(spawn_ctx, result);

      return spawn_ctx;
    }).catch(function(err) {
      spawn_ctx.err     = err;
      spawn_ctx.stdout  = err.stdout;
      spawn_ctx.stderr  = err.stderr;

      if (spawn_ctx.signal) {
        //console.warn('[retry] #%d exited with signal %s, rethrowing', ++attempt, spawn_ctx.signal);

        throw spawn_ctx;
      } else {
        //console.warn('[retry] #%d exited with error %d', ++attempt, spawn_ctx.code);

        return spawn_ctx;
      }
    }).nodeify(cb);
  }

  return async.retryAsync(ctx.attempts, doSpawn);
}

function addStdin(ctx) {
  if (ctx.include_stdin) {
    return memoized_stdin.then(function(stdin) {
      ctx.stdin = stdin;
    }).return(ctx);
  } else {
    return ctx;
  }
}

var THIRTY_SECONDS = 30000;

var memoized_stdin = new LazyPromise(function(resolve, reject) {
  Utility.asString(process.stdin).timeout(THIRTY_SECONDS, 'took too long to input').done(resolve, reject);
});
