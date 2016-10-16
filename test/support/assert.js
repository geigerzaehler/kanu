import * as I from 'immutable'
import * as assert from 'assert'

export {
  deepEqual as equal,
  strictEqual as same,
} from 'assert'

export function equalCollection (actual, expected) {
  actual = I.fromJS(actual)
  expected = I.fromJS(expected)
  if (!I.is(actual, expected)) {
    assert.fail(actual.toString(), expected.toString(), 'Immutable values differ')
  }
}

export function instanceOf (obj, ctor) {
  if (!(obj instanceof ctor)) {
    assert.fail(obj && obj.constructor, ctor, null, 'instanceof')
  }
}

export function fail (message, expected, actual) {
  assert.fail(actual, expected, message)
}
