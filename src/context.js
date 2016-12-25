import * as Suite from './suite'
import * as assert from 'assert'

export default function createContext () {
  /* eslint object-property-newline: off */
  const dsl = {
    describe, fdescribe, xdescribe,
    describeEach, fdescribeEach, xdescribeEach,
    it, fit, xit,
    test: it, ftest: fit, xtest: xit,
    beforeEach, afterEach, setup,
    subject,
  }
  const ctx = {
    dsl: dsl,
    reset: reset,
  }

  return ctx

  function reset () {
    ctx.suite = Suite.make('', {hide: true})
  }

  function describe (desc, fn) {
    addSuite(desc, fn)
  }

  function describeEach (desc, subjects, fn) {
    _describeEach(desc, subjects, fn)
  }

  function fdescribeEach (...args) {
    _describeEach(...args, {focused: true})
  }

  function xdescribeEach (...args) {
    _describeEach(...args, {pending: true})
  }

  function xdescribe (desc, fn) {
    addSuite(desc, fn, {pending: true})
  }

  function fdescribe (desc, fn) {
    addSuite(desc, fn, {focused: true})
  }

  function it (title, fn) {
    addTest(ctx.suite, {title, fn})
  }

  function xit (title, fn) {
    addTest(ctx.suite, {title, fn, pending: true})
  }

  function fit (title, fn) {
    addTest(ctx.suite, {title, fn, focused: true})
  }

  function beforeEach (fn) {
    ctx.suite.befores.push(fn)
  }

  function afterEach (fn) {
    ctx.suite.afters.push(fn)
  }

  function setup (before, after) {
    beforeEach(before)
    if (after) {
      afterEach(after)
    }
  }

  function subject (fn) {
    assert.ok(
      !ctx.suite.subject,
      'Test suite already has a subject'
    )
    ctx.suite.subject = fn
  }

  function addSuite (desc, fn, opts = {}) {
    if (fn) {
      const parent = ctx.suite
      ctx.suite = Suite.make(desc, opts)
      fn(dsl)
      parent.suites.push(ctx.suite)
      ctx.suite = parent
    } else {
      opts.pending = true
      ctx.suite.suites.push(Suite.make(desc, opts))
    }
  }

  function _describeEach (desc, subjects, fn, opts) {
    addSuite(desc, () => {
      for (const desc in subjects) {
        addSuite(desc, () => {
          subject(subjects[desc])
          fn()
        })
      }
    }, opts)
  }
}

function addTest (suite, params) {
  if (!params.fn) {
    params.pending = true
  }
  suite.specs.push(params)
}
