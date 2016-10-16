import {makeSum, caseof} from 'sum-types'

export const Result = makeSum({
  Success: makeResult,
  Pending: makeResult,
  Failure: (spec, failures) => makeResult(spec, {failures}),
})


function makeResult (spec, params) {
  return Object.assign({
    title: spec.title,
    fullTitle: spec.fullTitle,
    body: spec.fn && spec.fn.toString(),
  }, params)
}


/**
 * Returns true if a list of Results has at least one Failure or Error
 * item.
 */
export function hasFailure (list) {
  return list.some((r) => {
    return caseof(r, [
      [[Result.Failure], () => true],
      [null, () => false],
    ])
  })
}
