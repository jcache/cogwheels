'use strict';

var Promise       = require('bluebird')
  , TimeoutError  = Promise.TimeoutError
  , async         = Promise.promisifyAll(require('async'))
  , spawn         = require('child-process-promise').spawn
  , Constants     = require('./constants')
  , Utility       = require('./utility')
  , _             = require('lodash')
;

/**
 * Exec without aborting.
 *
 * Same params as {@link #retryProcess}.
 *
 * @return {void}
 */
exports.exec = function() {
  retry.apply(null, arguments).then(sanitize).catch(TimeoutError, handleTimeout).catch(sanitize).done(printAndExit, failure);
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

function addStdin(ctx) {
  if (ctx.include_stdin) {
    return Utility.asString(process.stdin).then(function(stdin) {
      ctx.stdin = stdin;
    }).timeout(Constants.MAX_TIME, 'took too long to input').return(ctx);
  } else {
    return ctx;
  }
}

function attemptProcess(ctx) {
  function doSpawn(cb) {
    var spawn_opts  = { capture: ['stdout', 'stderr'], stdio: ['pipe', 'pipe'] }
      , spawn_ctx   = { retry_ctx: ctx }
    ;

    spawn_opts.stdio.unshift(ctx.include_stdin ? 'pipe' : 'ignore');

    Promise.resolve(spawn(ctx.cmd, ctx.args || [], spawn_opts).progress(attachToChild.bind(spawn_ctx))).
      bind(spawn_ctx).
      then(mergeSuccess).
      catch(catchProcessError).
      nodeify(cb);
  }

  return async.retryAsync(ctx.attempts, doSpawn);
}

/**
 * @param {ChildProcess} child
 * @return {void}
 */
function attachToChild(child) {
  //jshint validthis:true

  this.pid = child.pid;

  function attachSignal(code, signal) {
    this.code   = code;
    this.signal = signal;
  }

  child.on('exit', attachSignal.bind(this));

  if (this.retry_ctx.include_stdin) {
    child.stdin.write(this.retry_ctx.stdin);
    child.stdin.end();
  }
}

/**
 * @param {Object} result
 * @return {void}
 */
function mergeSuccess(result) {
  //jshint validthis:true
  _.extend(this, result);

  return this;
}

/**
 * @param {Error} err
 * @return {void}
 */
function catchProcessError(err) {
  //jshint validthis:true

  this.err    = err;
  this.stdout = err.stdout;
  this.stderr = err.stderr;

  if (this.signal) {
    throw this;
  } else {
    return this;
  }
}

function sanitize(result) {
  if (result.code == null || result.signal) {
    result.code = Constants.EXIT.ABORTED;
  }

  return result;
}

/**
 * @private
 * @return {void}
 */
function handleTimeout() {
  return {
    stderr: "timed out\n",
    code: 2
  };
}

function printAndExit(result) {
  if (result.stdout || result.stderr) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
  } else if (result.code === 0) {
    process.stdout.write('');
  } else {
    process.stderr.write('');
  }

  process.exit(result.code);
}

function failure(err) {
  console.warn('Undefined err!');
  console.dir(err);

  process.exit(Constants.EXIT.UNKNOWN);
}
