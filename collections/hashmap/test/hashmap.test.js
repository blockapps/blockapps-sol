require('co-mocha');
const ba = require('blockapps-rest');
const common = ba.common;
const config = common.config;
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];
const util = common.util;
const assert = common.assert;

const hashmapJs = require('../hashmap');

const adminName = util.uid('Admin');
const adminPassword = '1234';

const otherAdminName = util.uid('OtherAdmin');
const otherAdminPassword = '5678';

describe('Hashmap', function() {
  this.timeout(config.timeout);

  let admin;
  let otherAdmin;

  before(function*() {
    admin = yield rest.createUser(adminName, adminPassword);
    otherAdmin = yield rest.createUser(otherAdminName, otherAdminPassword);
  });

  it('getOwner', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const owner = yield hashmap.getOwner();
    assert.equal(owner.toString(), admin.address);
  });

  it('put', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    const state = yield hashmap.getState();
    assert.equal(state.values.length, 2, 'length 2');
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value');
  });

  it('get', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    const value = yield hashmap.get({key: args.key});
    assert.equal(parseInt(value), parseInt(args.value), 'value');
    const notFound = yield hashmap.get({key: '666'});
    assert.equal(parseInt(notFound), 0, 'not found');
  });

  it('contains', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    const result = yield hashmap.contains({key: args.key});
    assert.equal(result, true, 'contains: true');
    const notFound = yield hashmap.contains({key: '666'});
    assert.equal(notFound, false, 'contains: false');
  });

  it('size', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    const size1 = yield hashmap.size();
    assert.equal(size1, 1, 'size: 1');
    args.key += 'x';
    yield hashmap.put(args);
    const size2 = yield hashmap.size();
    assert.equal(size2, 2, 'size: 2');
  });

  it('transferOwnership to otherAdmin', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});
    const owner = yield hashmap.getOwner();
    assert.notEqual(owner.toString(), admin.address);
    assert.equal(owner.toString(), otherAdmin.address);
  });

  it('reject get from original admin', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});

    const result = yield hashmap.get({key: args.key});
    assert.equal(result.toString(), "0000000000000000000000000000000000000000");
  });

  it('reject put from original admin', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);

    yield hashmap.put(args);
    const result = yield hashmapJs.get(otherAdmin, hashmap, {key: args.key})
    assert.equal(result.toString(), "0000000000000000000000000000000000000000");

    const result2 = yield hashmapJs.size(otherAdmin, hashmap, {key: args.key})
    assert.equal(result2, 0);
  });

  it('reject contains from original admin', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});

    const result = yield hashmap.contains({key: args.key});
    assert.equal(result, false);
  });

  it('reject size from original admin', function*() {
    const hashmap = yield hashmapJs.uploadContract(admin);
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield hashmap.put(args);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});

    const result = yield hashmap.size();
    assert.equal(result, 0)
  });

  it('reject transferOwnership from original admin', function*() {
    const newAdmin = yield rest.createUser(util.uid('newAdmin'), '4321');
    const hashmap = yield hashmapJs.uploadContract(admin);
    yield hashmap.transferOwnership({newOwner: otherAdmin.address});

    const result = yield hashmap.transferOwnership({newOwner: newAdmin.address});
    assert.equal(result, false);
  });
});

const factory = {
  createEntity: factory_createEntity,
};

function factory_createEntity(iuid) {
  const args = {
    key: 'Key_' + iuid,
    value: iuid,
  };
  return args;
}
