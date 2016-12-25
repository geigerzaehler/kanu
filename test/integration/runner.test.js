import noop from 'lodash/noop'
import {List} from 'immutable'
import createRunner from 'kanu/runner'
import {Result} from 'kanu/result'
import * as assert from 'support/assert'
import * as sinon from 'sinon'

/**
 * Test the test runner from 'kanu/runner'
 *
 * - Stubs the file loader
 * - Uses the 'dsl' object provided by the runer
 * - Makes assertions on the runner results
 */

function run (test, options) {
  return createRunner((dsl) => {
    return Promise.resolve(
      test(dsl) || [noop, List()]
    )
  }, null, options)
  .run()
}

describe('runner', function () {
  it('returns results', function* () {
    const error = new Error()

    const {results} = yield run((dsl) => {
      dsl.describe('test function', (dsl) => {
        dsl.it('passes', function () {})

        dsl.it('fails', function () {
          throw error
        })
      })

      dsl.describe('generator function', (dsl) => {
        dsl.it('passes', function* () {
          yield Promise.resolve()
        })

        dsl.it('fails', function* () {
          yield Promise.reject(error)
        })

        dsl.it('fails throw', function* () {
          throw error
        })
      })
    })
    assert.equal(results.size, 5)

    let result = results.get(0)
    assert.same(result.fullTitle, 'test function passes')
    assert.instanceOf(result, Result.Success)

    result = results.get(1)
    assert.instanceOf(result, Result.Failure)
    assert.same(result.fullTitle, 'test function fails')
    assert.equalCollection(result.failures, List([error]))

    result = results.get(2)
    assert.same(result.fullTitle, 'generator function passes')
    assert.instanceOf(result, Result.Success)

    result = results.get(3)
    assert.instanceOf(result, Result.Failure)
    assert.same(result.fullTitle, 'generator function fails')
    assert.equalCollection(result.failures, List([error]))

    result = results.get(4)
    assert.instanceOf(result, Result.Failure)
    assert.same(result.fullTitle, 'generator function fails throw')
    assert.equalCollection(result.failures, List([error]))
  })

  it('collects and does not run pending test and suites', function* () {
    const runner = sinon.spy()
    const {results} = yield run((dsl) => {
      dsl.xit('', runner)
      dsl.it('')
      dsl.xdescribe('', () => {
        dsl.it('', runner)
      })
    })

    assert.equal(results.size, 3)
    results.forEach((r) => {
      assert.instanceOf(r, Result.Pending)
    })
  })

  it('returns file load errors', function* () {
    const loadError = {}
    const {loadErrors} = yield createRunner(() => {
      return Promise.resolve([noop, List([loadError])])
    }, null).run()
    assert.equalCollection(loadErrors, List([loadError]))
  })

  it('fails fast', function* () {
    const skipRunner = sinon.spy()
    const failRunner = sinon.stub().throws(new Error())
    const {results} = yield run((dsl) => {
      dsl.describe('', () => {
        dsl.it('fails', failRunner)
        dsl.it('works', skipRunner)
      })

      dsl.describe('', () => {
        dsl.it('', skipRunner)
      })
    }, {failFast: true})

    sinon.assert.notCalled(skipRunner)
    assert.equal(results.size, 1)

    const result = results.get(0)
    assert.instanceOf(result, Result.Failure)
    assert.equal(result.fullTitle, 'fails')
  })

  it('runs hooks and tests in context', function* () {
    const hook = sinon.stub()
    yield run((dsl) => {
      dsl.describe('', () => {
        dsl.beforeEach(hook)
        dsl.afterEach(hook)
        dsl.subject(hook)
        dsl.describe('', () => {
          dsl.beforeEach(hook)
          dsl.afterEach(hook)
          dsl.subject(hook)
          dsl.it('', hook)
        })
      })
    })
    const ctx = hook.getCall(0).thisValue
    sinon.assert.alwaysCalledOn(hook, ctx)
  })

  test('describeEach', function* () {
    const runTest = sinon.stub()
    yield run((dsl) => {
      dsl.describeEach('', {
        1: () => 1,
        2: () => 2,
      }, () => {
        dsl.it('', runTest)
      })
    })
    sinon.assert.calledTwice(runTest)
    sinon.assert.calledWith(runTest, 1)
    sinon.assert.calledWith(runTest, 2)
  })


  test('subject', function* () {
    const runTest = sinon.stub()
    const sub = {call: 0}
    yield run((dsl) => {
      dsl.describe('', () => {
        dsl.subject(() => sub)
        dsl.describe('', () => {
          dsl.beforeEach(function () {
            this.modify = true
          })
          dsl.subject(function (sub) {
            if (this.modify) {
              sub.call++
            }
            return sub
          })
          dsl.it('', runTest)
        })
      })
    })
    sinon.assert.calledWith(runTest, sinon.match.same(sub))
    assert.equal(sub.call, 1)
  })
})
