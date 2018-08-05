require('co-mocha')
const ba = require('blockapps-rest')

const { rest } = ba
const { config, util, assert, cwd } = ba.common

const permissionHashmapJs = require('../permissionHashmap')
const permissionManagerJs = require('../permissionManager')
const RestStatus = rest.getFields(`${cwd}/rest/contracts/RestStatus.sol`)

const adminName = util.uid('Admin')
const adminPassword = '1234'
const masterName = util.uid('Master')
const masterPassword = '5678'
const attackerName = util.uid('Attacker')
const attackerPassword = '9090'

describe('PermissionHashmap tests', function() {
  this.timeout(config.timeout)

  let admin, master, attacker, hashmapPermissionManager

  // get ready:  admin-user and manager-contract
  before(function* () {
    console.log('creating admin')
    admin = yield rest.createUser(adminName, adminPassword)
    console.log('creating master')
    master = yield rest.createUser(masterName, masterPassword)
    console.log('creating attacker')
    attacker = yield rest.createUser(attackerName, attackerPassword)
    // pm
    hashmapPermissionManager = yield createHashmapPermissionManager(admin, master)
  })

  it('put', function*() {
    const contract = yield permissionHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield contract.put(args);
    const state = yield contract.getState();
    assert.equal(state.values.length, 2, 'length 2');
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value');
  });

  it('put - unauthorized', function*() {
    const contract = yield permissionHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    const method = 'put'
    const result = yield rest.callMethod(attacker, contract, method, util.usc(args))

    const state = yield contract.getState();
    assert.equal(state.values.length, 1, 'length 1 - did not put');
    assert.equal(parseInt(state.values[0]), 0, 'empty');
  });

  it('get', function*() {
    const contract = yield permissionHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    // put
    yield contract.put(args);
    // get
    const value = yield contract.get({key: args.key});
    assert.equal(parseInt(value), parseInt(args.value), 'value');
    const notFound = yield contract.get({key: '666'});
    assert.equal(parseInt(notFound), 0, 'not found');
  });

  it('get - unauthorized', function*() {
    const contract = yield permissionHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const putArgs = factory.createEntity(iuid);
    // put
    yield contract.put(putArgs);
    // get
    const method = 'get'
    const args = {
      key: putArgs.key,
    }
    const [ value ] = yield rest.callMethod(attacker, contract, method, util.usc(args))
    assert.equal(parseInt(value), 0, 'value 0 - did not put');
  });

})

function* createHashmapPermissionManager(admin, master) {
  const contractName = 'HashmapPermissionManager';
  const contractFilename = `${config.libPath}/auth/permission/test/fixtures/HashmapPermissionManager.sol`;
  const args = {
    owner: admin.address,
    master: master.address,
  }
  const hashmapPermissionManager = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args));
  return hashmapPermissionManager
}

const factory = {
  createEntity(iuid) {
    const args = {
      key: `Key_${iuid}`,
      value: iuid,
    }
    return args
  },
}
