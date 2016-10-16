import * as P from 'path'
import {List} from 'immutable'
import * as FS from 'fs'

import expose from './utils/expose'

/**
 * Returns a function that recursively requires files from a directory.
 *
 * The promise resolves with an `[unload, errors]` tuple.
 * `unload` is a function that removes the loaded files from the module
 * cache so they can be required again.
 * `error` is a list of errors that occured while requiring the files.
 * Each item is an object with an 'error' and a 'file' property.
 *
 * @param {string[]} paths
 * @param {string[]} extension
 */
export function fromPaths (paths, extensions, requireLocal) {
  requireLocal = requireLocal || require
  return function load (dsl) {
    try {
      const loaded = []
      const errors = []

      const files = List(paths).flatMap((p) => {
        try {
          return getFiles(P.resolve(p), match)
        } catch (e) {
          errors.push({error: e, file: p})
          return List()
        }
      })

      const unexpose = expose(global, dsl)
      files.forEach((file) => {
        try {
          requireLocal(file)
          loaded.push(file)
        } catch (error) {
          errors.push({file, error})
        }
      })
      unexpose()
      return Promise.resolve([
        unloader(loaded, requireLocal),
        List(errors),
      ])
    } catch (e) {
      return Promise.reject(e)
    }
  }

  function match (path) {
    return extensions.some((ext) => path.endsWith(ext))
  }
}


/**
 * Get a immutable list of files in the base directory that match the
 * given function.
 *
 * @param {string} base
 * @param {funciont(string): boolean} match
 * @return {List<string>}
 */
function getFiles (base, match) {
  const stat = FS.statSync(base)
  if (stat.isFile()) {
    return List.of(base)
  } else {
    return go(base, List())
  }

  function go (path, collected) {
    const stat = FS.statSync(path)
    if (stat.isDirectory()) {
      return FS.readdirSync(path)
      .reduce((collected, item) => {
        const itemPath = P.join(path, item)
        return go(itemPath, collected)
      }, collected)
    } else if (stat.isFile() && match(path)) {
      return collected.push(path)
    } else {
      return collected
    }
  }
}


function unloader (files, require) {
  return function () {
    files.forEach((f) => {
      delete require.cache[f]
    })
  }
}
