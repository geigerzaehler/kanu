import {Result} from '../result'
import {caseof} from 'sum-types'

export default function json (stdout) {
  stdout = stdout || process.stdout
  const results = []
  const loadErrors = []
  return {
    started () {
    },

    done () {
      const output = makeOutput(results, loadErrors)
      stdout.write(JSON.stringify(output, null, 2))
    },

    suiteStarted (_suite) {},

    suiteDone (_suite) {},

    specStarted () {},

    specResult (result) {
      results.push(result)
    },

    loadError (file, error) {
      loadErrors.push({file, error})
    },
  }
}

function makeOutput (results, loadErrors) {
  return {
    tests: results.map((result) => {
      return caseof(result, [
        [Result.Success, (r) => ({
          status: 'success',
          title: r.fullTitle,
        })],
        [Result.Failure, (r) => ({
          status: 'failure',
          title: r.fullTitle,
        })],
        [Result.Pending, (r) => ({
          status: 'pending',
          title: r.fullTitle,
        })],
      ])
    }),
    errors: loadErrors.map(({file, error}) => {
      return {
        file,
        error: error.message,
      }
    }),
  }
}
