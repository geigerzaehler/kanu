/**
 * Create a suite.
 *
 * @param {string}  title
 * @param {object}  opts
 * @param {boolean} opts.pending
 * @param {boolean} opts.focused
 * @param {boolean} opts.hide
 */
export function make (title, opts) {
  const {pending, focused, hide} = opts || {}
  return {
    title, pending, focused, hide,
    suites: [],
    specs: [],
    befores: [],
    afters: [],
  }
}

export function prepare (suite, specFilter, suiteFilter) {
  const constTrue = () => true
  markFocus(suite)
  markPending(suite)
  setTitleAndId(suite)
  filter(
    suite,
    specFilter || constTrue,
    suiteFilter || constTrue
  )
}

function markFocus (suite) {
  const fspecs = suite.specs.filter((spec) => spec.focused === true)
  const fsuites = suite.suites.filter((s) => markFocus(s))
  const childFocus = !!(fspecs.length || fsuites.length)
  if (childFocus) {
    suite.specs = fspecs
    suite.suites = fsuites
  }
  return childFocus || suite.focused
}

function setTitleAndId (suite) {
  let nextId = 0
  setTitleAndId(suite, null)

  function setTitleAndId (suite, parent) {
    suite.id = nextId++
    if (parent && parent.fullTitle) {
      suite.fullTitle = (parent.title + ' ' + suite.title).trim()
    } else {
      suite.fullTitle = suite.title
    }
    suite.specs.forEach((spec) => {
      spec.id = nextId++
      spec.fullTitle = (suite.fullTitle + ' ' + spec.title).trim()
    })
    suite.suites.forEach((s) => setTitleAndId(s, suite))
  }
}

function markPending (suite, parentPending = false) {
  suite.pending = parentPending || suite.pending
  suite.specs.forEach((s) => s.pending = s.pending || suite.pending)
  suite.suites.forEach((s) => markPending(s, suite.pending))
}

function filter (suite, matchSpec, matchSuite) {
  go(suite)
  function go (suite) {
    suite.specs = suite.specs.filter(matchSpec)
    suite.suites = suite.suites.filter(go)
    const hasSpecs = suite.specs.length || suite.suites.length
    return hasSpecs && matchSuite(suite)
  }
}
