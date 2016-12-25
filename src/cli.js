import 'regenerator-runtime/runtime'

import * as P from 'path'
import yargs from 'yargs'
import co from 'co'

import * as Loader from './node-loader'
import * as Reporter from './reporters'
import createRunner from './runner'
import runWatched from './watcher'
import {hasFailure} from './result'
import UserError from './UserError'

const DEFAULT_LOAD_EXTENSIONS = [
  '.spec.js', '.test.js',
]

export default function exec () {
  co(main(process.argv.slice(2)))
  .then(function (passed) {
    process.exit(passed ? 0 : 1)
  }, function (error) {
    /* eslint no-console: off */
    if (error instanceof UserError) {
      console.error(error.message)
      process.exit(2)
    } else {
      // TODO format this properly
      console.error(error)
      process.exit(3)
    }
  })
}

function* main (argv) {
  const {options, args} = parseArgs(argv)
  if (options.help) {
    process.exit(0)
  }

  if (!args.length) {
    throw new UserError('No test files given')
  }
  const paths = args
  const extensions = options.extensions || DEFAULT_LOAD_EXTENSIONS
  const load = Loader.fromPaths(paths, extensions)

  // TODO load reporter from file
  const reporter = Reporter[options.reporter]
  if (typeof reporter !== 'function') {
    throw new UserError(`Unknown reporter ${options.reporter}`)
  }

  // TODO reload this when using the watcher
  if (options.require) {
    require(P.resolve(options.require))
  }

  if (options.watch !== undefined) {
    const watchDirs = (options.watch || '.').split(',')
    yield runWatched(watchDirs, load, reporter())
  } else {
    const runner = createRunner(load, reporter())
    const {results, loadErrors} = yield runner.run()
    if (results.isEmpty()) {
      throw new UserError('Did not run any tests')
    }

    return !hasFailure(results) && loadErrors.isEmpty()
  }
}

function parseArgs (argv) {
  const parser = yargs(argv)
    .exitProcess(false)
    .strict()
    .help('h')
    .alias('h', 'help')
    .usage('kanu [OPTIONS] FILES...')
    .options({
      watch: {
        description: 'Comma separated list of directories to watch',
        type: 'string',
      },
      require: {
        description: 'A file to require before running',
        type: 'string',
      },
      // TODO add option to list reporters
      reporter: {
        description: 'The reporter to use',
        type: 'string',
        nargs: 1,
        default: 'spec',
      },
      // TODO handle this
      // 'rerun-failed': {
      //   description: 'Only rerun failed tests when watching file',
      //   type: 'boolean',
      //   nargs: 0,
      // },
      extensions: {
        description: [
          'Comma separted list of extension.',
          'Test cases are loaded from these files',
        ].join(' '),
        type: 'string',
        requiresArg: true,
        nargs: 1,
        coerce: (x) => x.split(','),
      },
    })

  let options
  try {
    options = parser.parse(argv)
  } catch (_e) {
    process.exit(2)
  }
  const args = options._
  delete options._
  return {args, options}
}
