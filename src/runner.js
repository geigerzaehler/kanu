import co from 'co'
import {List} from 'immutable'

import * as Reporters from './reporters'
import runSuite from './spec-runners'
import * as Suite from './suite'
import createContext from './context'


export default function create (load, reporter, options = {}) {
  if (!reporter) {
    reporter = Reporters.empty()
  }

  const ctx = createContext()

  return {
    run: co.wrap(run),
    // TODO move this out of this module
    rerunFailed: withRerunFailed(run),
  }

  function* run (specFilter) {
    ctx.reset()
    const [unload, loadErrors] = yield load(ctx.dsl)
    Suite.prepare(ctx.suite, specFilter)
    reporter.started()
    loadErrors.forEach(({file, error}) => {
      reporter.loadError(file, error)
    })
    let results
    if (options.failFast && !loadErrors.isEmpty()) {
      results = List()
    } else {
      results = yield* runSuite(ctx.suite, reporter, options.failFast)
    }
    unload()
    reporter.done()
    return {results, loadErrors}
  }
}

function withRerunFailed (run) {
  let specFilter
  let rerunningFailed = false

  return co.wrap(go)

  function* go () {
    const {results} = yield run(specFilter)
    specFilter = makeFilterFailed(results)
    // All tests passed. If rerunning run the full suite
    if (rerunningFailed && !specFilter) {
      rerunningFailed = false
      return yield* go()
    } else {
      rerunningFailed = !!specFilter
      return results
    }
  }
}

function makeFilterFailed (results) {
  const failedTitles = results.reduce((failedTitles, r) => {
    if (r.status === 'failed') {
      return failedTitles.push(r.fullTitle)
    } else {
      return failedTitles
    }
  }, List())

  if (failedTitles.isEmpty()) {
    return undefined
  } else {
    return function specFailed (spec) {
      return failedTitles.includes(spec.fullTitle)
    }
  }
}
