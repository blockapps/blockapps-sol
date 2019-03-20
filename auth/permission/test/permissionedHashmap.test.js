require('co-mocha')

const { assert } = require('chai')
const { rest, util, importer } = require('blockapps-rest');
const { getYamlFile } = require('../../../util/config');
const { createUser, call, createContract } = rest;

const permissionedHashmapJs = require('../permissionedHashmap')

const config = getYamlFile('config.yaml');

const adminName = util.uid('Admin')
const adminPassword = '1234'
const masterName = util.uid('Master')
const masterPassword = '5678'
const attackerName = util.uid('Attacker')
const attackerPassword = '9090'

describe('PermissionedHashmap tests', function () {
  this.timeout(config.timeout)

  let admin, master, attacker, hashmapPermissionManager

  // get ready:  admin-user and manager-contract
  before(function* () {
    console.log('creating admin')
    admin = yield createUser({ username: adminName, password: adminPassword }, { config })
    console.log('creating master')
    master = yield createUser({ username: masterName, password: masterPassword }, { config })
    console.log('creating attacker')
    attacker = yield createUser({ username: attackerName, password: attackerPassword }, { config })
    // pm
    hashmapPermissionManager = yield createHashmapPermissionManager(admin, master)
  })

  it('put', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield contract.put(args);
    const state = yield contract.getState();
    assert.equal(state.values.length, 2, 'length 2');
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value');
  });

  it('put - unauthorized', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);

    const callArgs = {
      contract,
      method: 'put',
      args: util.usc(args)
    }

    const result = yield call(attacker, callArgs, { config })

    const state = yield contract.getState();
    assert.equal(state.values.length, 1, 'length 1 - did not put');
    assert.equal(parseInt(state.values[0]), 0, 'empty');
  });

  it('get', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    // put
    yield contract.put(args);
    // get
    const value = yield contract.get({ key: args.key });
    assert.equal(parseInt(value), parseInt(args.value), 'value');
    const notFound = yield contract.get({ key: '666' });
    assert.equal(parseInt(notFound), 0, 'not found');
  });

  it('contains', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    //put
    yield contract.put(args);
    // contains
    const result = yield contract.contains({ key: args.key });
    assert.equal(result, true, 'contains: true');
    const notFound = yield contract.contains({ key: '666' });
    assert.equal(notFound, false, 'contains: false');
  });

  it('size', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    yield contract.put(args);
    const size1 = yield contract.size({});
    assert.equal(size1, 1, 'size: 1');
    args.key += 'x';
    yield contract.put(args);
    const size2 = yield contract.size({});
    assert.equal(size2, 2, 'size: 2');
  });

  it('remove', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const putArgs = factory.createEntity(iuid);
    // put
    yield contract.put(putArgs);
    const args = { key: putArgs.key }
    // contains
    {
      const result = yield contract.contains(args);
      assert.equal(result, true, 'contains: true');
    }
    // remove
    yield contract.remove(args);
    yield contract.getState()
    // contains not
    {
      const result = yield contract.contains(args);
      assert.equal(result, false, 'contains: not');
    }
  });

  it('remove - unauthorized', function* () {
    const contract = yield permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const putArgs = factory.createEntity(iuid);
    // put
    yield contract.put(putArgs);
    const args = { key: putArgs.key }
    // contains
    {
      const result = yield contract.contains(args);
      assert.equal(result, true, 'contains: true');
    }
    // remove
    const callArgs = {
      contract,
      method: 'remove',
      args: util.usc(args)
    }
    const result = yield call(attacker, callArgs, { config })

    yield contract.getState()
    // still contained - was not removed
    {
      const result = yield contract.contains(args);
      assert.equal(result, true, 'contains: true');
    }
  });

})

/**
 * creating a TEST permission manager that provides a real canModifyMap() implementation
 * @param admin
 * @param master
 * @returns {object} the contract
 */

function* createHashmapPermissionManager(admin, master) {
  const contractName = 'HashmapPermissionManager';
  const contractFilename = `${config.libPath}/auth/permission/test/fixtures/HashmapPermissionManager.sol`;
  const args = {
    owner: admin.address,
    master: master.address,
  }

  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: util.usc(args)
  }

  const hashmapPermissionManager = yield createContract(admin, contractArgs, { config });
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
