import * as P from 'path'
import EventEmitter from 'events'
import {caseof} from 'sum-types'
import {Result} from '../result'

export default function fromMocha (name) {
  return function () {
    const Mocha = require('mocha/lib/reporters')
    let runner

    return {
      started () {
        runner = new EventEmitter()
        /* eslint no-new: off */
        new Mocha[name](runner)
        runner.emit('start')
      },

      done () {
        runner.emit('end')
      },

      suiteStarted (suite) {
        runner.emit('suite', makeMochaResult(suite))
      },

      suiteDone (suite) {
        runner.emit('suite end', makeMochaResult(suite))
      },

      specStarted () {
      },

      specResult (result) {
        caseof(result, [
          [Result.Success, (r) => {
            runner.emit('pass', makeMochaResult(r))
            runner.emit('test end', makeMochaResult(r))
          }],
          [Result.Failure, (r) => {
            r.failures.forEach((f) => {
              runner.emit('fail', makeMochaResult(r), f)
            })
            runner.emit('test end', makeMochaResult(r))
          }],
          [Result.Pending, (r) => {
            runner.emit('pending', makeMochaResult(r))
            runner.emit('test end', makeMochaResult(r))
          }],
        ])
      },

      loadError (file, error) {
        // TODO handle paths that are not in the cwd
        file = P.relative('', file)
        runner.emit('fail', {
          title: file,
          fullTitle: constant(`Failed to load ${file}`),
        }, error)
      },
    }
  }
}

function makeMochaResult (result) {
  return {
    title: result.title,
    slow: constant(Infinity),
    fullTitle: constant(result.fullTitle),
    body: result.body,
  }
}

function constant (x) {
  return function () { return x }
}
