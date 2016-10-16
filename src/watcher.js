import throttle from 'lodash/throttle'
import {watch} from 'chokidar'
import createRunner from './runner'
import * as P from 'path'

// TODO handle fail fast option
export default function run (dirs, load, reporter) {
  dirs = dirs.map((d) => P.resolve(d))
  const matchFile = makeFileMatcher(dirs)
  const runner = createRunner(load, reporter)
  return watchRun(dirs, matchFile, () => {
    return runner.rerunFailed()
      .then(() => unload(matchFile))
  })
}

function makeFileMatcher (dirs) {
  return function (path) {
    const inDir = dirs.some((dir) => {
      return path.startsWith(dir)
    })
    if (!inDir) {
      return false
    }
    for (const seg of path.split('/').slice(1)) {
      if (seg === 'node_modules') {
        return false
      }
      if (seg[0] === '.') {
        return false
      }
    }
    return true
  }
}

function watchRun (dirs, match, run) {
  return new Promise((_resolve, reject) => {
    const runThrottled = throttle(runLock, 100, {leading: false})
    let running

    watch(dirs, {
      usePolling: true,
      ignored: (path) => !match(path),
      ignoreInitial: true,
    })
    .on('change', runThrottled)
    .on('ready', runThrottled)
    .on('add', runThrottled)
    .on('error', reject)


    function runLock () {
      if (!running) {
        running = true
        run().then(function () {
          running = false
        }).catch(reject)
      }
    }
  })
}

function unload (match) {
  for (const file in require.cache) {
    if (match(file)) {
      delete require.cache[file]
    }
  }
}
