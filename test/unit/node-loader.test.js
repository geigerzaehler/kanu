import proxyquire from 'proxyquire'
import * as MockFS from 'mock-fs'
import * as sinon from 'sinon'
import * as assert from 'support/assert'

describe('node-loader', function () {
  subject(function () {
    this.require = sinon.spy((file) => {
      this.require.cache[file] = true
    })
    this.require.cache = {}
    return (paths, extensions, fs) => {
      const {fromPaths} = proxyquire('../../src/node-loader', {
        fs: fs,
      })
      return fromPaths(paths, extensions, this.require)()
    }
  })

  it('requires all files with extensions', function* (load) {
    const fs = MockFS.fs({
      '/test': {
        't1.ext': '',
        'd1': {
          't2.ext': '',
          't3.ext': '',
          't4.ext2': '',
          'noload': '',
        },
      },
      '/other/deep/test/directory': {
        't4.ext': '',
      },
    })
    yield load(['/test', '/other'], ['.ext', '.ext2'], fs)
    assert.equal(Object.keys(this.require.cache).sort(), [
      '/test/t1.ext',
      '/test/d1/t2.ext',
      '/test/d1/t3.ext',
      '/test/d1/t4.ext2',
      '/other/deep/test/directory/t4.ext',
    ].sort())
  })

  it('removes required files from cache when unloading', function* (load) {
    const fs = MockFS.fs({
      '/test': {
        't1.ext': '',
        't2.ext': '',
      },
    })
    const [unload] = yield load(['/test'], ['.ext'], fs)
    unload()
    assert.equal(this.require.cache, {})
  })

  it('records load errors', function* (load) {
    const err = new Error()
    this.require = sinon.stub()
    this.require.withArgs('/test/error.ext').throws(err)
    const fs = MockFS.fs({
      '/test': {
        't1.ext': '',
        'error.ext': '',
      },
    })
    const [_, errors] = yield load(['/test'], ['.ext'], fs)
    assert.equal(errors.size, 1)
    assert.same(errors.get(0).error, err)
    sinon.assert.calledWith(this.require, '/test/error.ext')
  })

  it('requires paths that are files', function* (load) {
    const fs = MockFS.fs({
      '/test': {
        't1.noext': '',
        't2.ext': '',
      },
    })
    yield load(['/test/t1.noext', '/test/t2.ext'], ['.ext'], fs)
    assert.equal(Object.keys(this.require.cache).sort(), [
      '/test/t1.noext',
      '/test/t2.ext',
    ].sort())
  })
})
