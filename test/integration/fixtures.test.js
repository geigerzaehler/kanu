import * as Proc from 'child_process'
import * as P from 'path'
import * as assert from 'support/assert'
import * as FS from 'fs'

describe('fixtures', function () {
  [
    'main',
  ].forEach(function (file) {
    const cmd = testCmd([file + '.js'])
    test(cmd, function* () {
      const resultFile = P.resolve(`test/fixtures/results/${file}.json`)
      yield* assertResults(cmd, resultFile)
    })
  })

  test('corrupt input file', function* () {
    const cmd = testCmd(['main.js', 'corrupt.js'])
    const resultFile = P.resolve(`test/fixtures/results/corrupt.json`)
    yield* assertResults(cmd, resultFile)
  })
})


// TODO move results into fixture files comments and extract them
function* assertResults (cmd, resultFile) {
  const {stdout, stderr, code} = yield pexec(cmd)
  if (code !== 0 && code !== 1) {
    assert.fail(`Process exited with code ${code}\n${stdout}\n${stderr}`)
  }

  const parsedStdout = JSON.parse(stdout)
  if (process.env.RECORD_RESULTS) {
    yield writeJSON(resultFile, {stdout: parsedStdout, code})
  } else {
    const recorded = yield readJSON(resultFile)
    assert.equal({stdout: parsedStdout, code}, recorded)
  }
}

function testCmd(files) {
  const paths = files.map((f) => {
    return `"test/fixtures/${f}"`
  }).join(' ')
  return `./node_modules/.bin/babel-node bin/kanu
    --reporter json
    ${paths}`.replace(/[\s\n]+/g, ' ')
}

function readJSON (path) {
  return new Promise((resolve, reject) => {
    FS.readFile(path, 'utf8', (err, contents) => {
      if (err) {
        reject(err)
      } else {
        resolve(contents)
      }
    })
  }).then((contents) => {
    return JSON.parse(contents)
  })
}

function writeJSON (path, obj) {
  return new Promise((resolve, reject) => {
    FS.writeFile(path, JSON.stringify(obj, null, 2), 'utf8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Run the given command in a shell. Returns a promise that resolves to
 * an object with the following properties
 * - `code` The exit code of the command
 * - `stdout` String containing output to stdout
 * - `sdterr` String containing output to stderr
 *
 * Rejects the promise if the command could not be run properly, e.g.
 * if it does not exist or the shell fails to parse it.
 */
function pexec (command, options) {
  return new Promise((resolve, reject) => {
    Proc.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        if (err.code) {
          resolve({stdout, stderr, code: err.code})
        } else {
          reject(err)
        }
      } else {
        resolve({stdout, stderr, code: 0})
      }
    })
  })
}
