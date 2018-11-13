require('co-mocha')

const ba = require('blockapps-rest')
const { config, util, assert } = ba.common
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];

const unsafeHashmapJs = require('../unsafeHashmap')

const adminName = util.uid('Admin')
const adminPassword = '1234'

describe('UnsafeHashmap', function () {
  this.timeout(config.timeout)

  let admin

  before(function* () {
    admin = yield rest.createUser(adminName, adminPassword)
  })

  it('put', function* () {
    const hashmap = yield unsafeHashmapJs.uploadContract(admin)
    const iuid = util.iuid()
    const args = factory.createEntity(iuid)
    yield hashmap.put(args)
    const state = yield hashmap.getState()
    assert.equal(state.values.length, 2, 'length 2')
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value')
  })

  it('get', function* () {
    const hashmap = yield unsafeHashmapJs.uploadContract(admin)
    const iuid = util.iuid()
    const args = factory.createEntity(iuid)
    yield hashmap.put(args)
    const value = yield hashmap.get({ key: args.key })
    assert.equal(parseInt(value), parseInt(args.value), 'value')
    const notFound = yield hashmap.get({ key: '666' })
    assert.equal(parseInt(notFound), 0, 'not found')
  })

  it('contains', function* () {
    const hashmap = yield unsafeHashmapJs.uploadContract(admin)
    const iuid = util.iuid()
    const args = factory.createEntity(iuid)
    yield hashmap.put(args)
    const result = yield hashmap.contains({ key: args.key })
    assert.equal(result, true, 'contains: true')
    const notFound = yield hashmap.contains({ key: '666' })
    assert.equal(notFound, false, 'contains: false')
  })

  it('size', function* () {
    const hashmap = yield unsafeHashmapJs.uploadContract(admin)
    const iuid = util.iuid()
    const args = factory.createEntity(iuid)
    yield hashmap.put(args)
    const size1 = yield hashmap.size()
    assert.equal(size1, 1, 'size: 1')
    args.key += 'x'
    yield hashmap.put(args)
    const size2 = yield hashmap.size()
    assert.equal(size2, 2, 'size: 2')
  })

  it('remove', function* () {
    const hashmap = yield unsafeHashmapJs.uploadContract(admin)
    const iuid = util.iuid()
    const count = 5;
    for (let i = 0; i < count; i++) {
      const args = factory.createEntity(iuid * 10 + i)
      yield hashmap.put(args)
    }
    const { values } = yield hashmap.getState()
    assert.equal(values.length, count + 1, 'length')
    // remove
    {
      const target = 2;
      const args = factory.createEntity(iuid * 10 + target)
      yield hashmap.remove({ key: args.key })
      const { values } = yield hashmap.getState()
      assert.equal(parseInt(values[target+1]), 0, 'zero now')
      // get removed element
      const value = yield hashmap.get({ key: args.key })
      assert.equal(parseInt(value), 0, 'zero')
      // contains removed element
      const contains = yield hashmap.contains({ key: args.key })
      assert.equal(contains, false, 'not contained')
    }
  })
})

const factory = {
  createEntity(iuid) {
    const args = {
      key: `Key_${iuid}`,
      value: iuid,
    }
    return args
  },
}
