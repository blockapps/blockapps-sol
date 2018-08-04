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

describe('PermissionHashmap tests', function() {
  this.timeout(config.timeout)

  let admin, master, hashmapPermissionManager

  // get ready:  admin-user and manager-contract
  before(function* () {
    console.log('creating admin')
    admin = yield rest.createUser(adminName, adminPassword)
    console.log('creating master')
    master = yield rest.createUser(masterName, masterPassword)
    // pm
    hashmapPermissionManager = yield getHashmapPermissionManager(admin, master)
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
    yield contract.put(args);
    const state = yield contract.getState();
    assert.equal(state.values.length, 2, 'length 2');
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value');
  });

})

function* getHashmapPermissionManager(admin, master) {
  const contractName = 'HashmapPermissionManager';
  const contractFilename = `${config.libPath}/auth/permission/test/HashmapPermissionManager.sol`;
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
