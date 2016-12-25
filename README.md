Kanu
====

[![Build Status](https://travis-ci.org/geigerzaehler/kanu.svg?branch=master)](https://travis-ci.org/geigerzaehler/kanu)

_Powerful single-purpose test runner_

Error Codes
-----------

* `0` All tests passed
* `1` Some tests failed
* `2` Invalid command line options

Async
-----

Subjects
--------

~~~js
describe('a person', function () {
  subject(function () {
    return {
      name: 'Thomas',
      age: this.age
    }
  })

  describe('old', function () {
    before(function () {
      this.age = 49
    })

    it('is old', function (person) {
      assert.ok(person.age > 40)
    })
  })

  describe('young', function () {
    before(function () {
      this.age = 20
    })

    it('is young', function (person) {
      assert.ok(person.age < 27)
    })
  })
})
~~~

Roadmap
-------

- [ ] Keyboard controls for watcher.Like 'r' for automatic rerun
