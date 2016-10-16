import co from 'co'
import {List} from 'immutable'
import {Result, hasFailure} from './result'


/**
 * Run a given prepared test suite against a reporter
 */
export default function* runSuite (suite, reporter, failFast) {
  const hooks = {
    before: List(),
    after: List(),
    subjects: List(),
  }
  return yield* runSuite_(suite, hooks, reporter, failFast, List())
}

/**
 * Run the test cases in a suite recursively.
 *
 * This is a reducer of the test results. The results for all test
 * cases are concatted with to the `results` argument and the
 * concatenation is returned.
 *
 * @param {Suite} suite
 * @param {Hooks} hooks
 *   List of functions to run before or after each test case
 * @param {Reporter} reporter
 *   List of functions to run after each test case
 * @param {Immutable.List<Results>} results
 * @returns {Immutable.List<Results>}
 */
function* runSuite_ (suite, hooks, reporter, failFast, results) {
  if (!suite.hide) {
    reporter.suiteStarted(suite)
  }

  hooks = addSuiteHooks(suite, hooks)

  results = yield* reduceG(suite.specs, function* (results, spec) {
    // TODO use break
    if (failFast && hasFailure(results)) {
      return results
    }
    const result = yield* runSpec(spec, hooks, reporter)
    return results.push(result)
  }, results)
  delete suite.specs

  if (!(failFast && hasFailure(results))) {
    results = yield reduceG(suite.suites, (results, suite) => {
      return runSuite_(suite, hooks, reporter, failFast, results)
    }, results)
  }
  delete suite.suites

  if (!suite.hide) {
    reporter.suiteDone(suite)
  }
  return results
}

function* reduceG (it, fn, val) {
  for (const i of it) {
    val = yield* fn(val, i)
  }
  return val
}

function* runSpec (spec, hooks, reporter) {
  const ctx = {}
  reporter.specStarted(spec)

  if (spec.pending) {
    const result = Result.Pending(spec)
    reporter.specResult(result)
    return result
  }

  const failures = yield Promise.resolve()
    .then(function () {
      return runKleisli(hooks.before, ctx)
      .then(() => {
        return runKleisli(hooks.subjects, ctx)
      })
      .then(function (x) {
        return executeRunner(spec.fn, ctx)(x)
          .then(function () {
            return []
          }, function (e) {
            return [e]
          })
          .then(function (es) {
            return runSequence(hooks.after, ctx, x)
            .then(function () {
              return es
            }, function (e) {
              return es.concat([e])
            })
          })
      }, function (e) {
        // Catch before hook errors
        return [e]
      })
    })

  const result = failures.length ?
    Result.Failure(spec, failures) :
    Result.Success(spec)

  reporter.specResult(result)
  return result
}

function addSuiteHooks (suite, hooks) {
  const subjects = suite.subject ?
    hooks.subjects.push(suite.subject) :
    hooks.subjects
  return {
    before: hooks.before.concat(List(suite.befores)),
    after: hooks.after.concat(List(suite.afters)),
    subjects,
  }
}


function runKleisli (fns, ctx) {
  return fns.reduce((val, fn) => {
    return val.then(executeRunner(fn, ctx))
  }, Promise.resolve())
}

function runSequence (fns, ctx, arg) {
  return fns.reduce((val, fn) => {
    return val.then(() => executeRunner(fn, ctx)(arg))
  }, Promise.resolve())
}


/**
 * ~~~js
 * executeRunner(fn, ctx)(x)
 * ~~~
 *
 * Calls `fn` with context `ctx` and argument `x` and returns the
 * result as a promise
 *
 * If `fn` is a generator function it is executed as Promise coroutine
 * and the result is returned
 */
function executeRunner (fn, ctx) {
  return function (x) {
    try {
      const res = fn.call(ctx, x)
      if (res && res.next && res.throw) {
        return co(res)
      } else {
        return Promise.resolve(res)
      }
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
