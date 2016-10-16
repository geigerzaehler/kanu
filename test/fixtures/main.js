/* eslint-disable */

var assert = require('assert')

describe('l1', function () {
  describe('l2.1', function () {
    describe('l3', function () {
      it('t3.1', noop)
      it('t3.2', noop)
      it('f3.2', fails('ERR'))
    })
  })

  describe('l2.2', function () {
    it('t2.1', noop)
    it('t2.2', noop)
  })
})

xdescribe('pending', function () {
  it('pends', noop)
})

describe('success', function () {
  xit('pending', noop)
})

function noop () {}

function fails (message) {
  return function () {
    throw assert.AssertionError(message)
  }
}
