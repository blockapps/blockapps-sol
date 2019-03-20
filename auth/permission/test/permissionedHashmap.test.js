import { assert } from 'chai';
import { rest, util, importer } from 'blockapps-rest';
const { createUser, call, createContract } = rest;

import { getYamlFile } from '../../../util/config';
import * as permissionedHashmapJs from '../permissionedHashmap';


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
  before(async function () {
    console.log('creating admin')
    admin = await createUser({ username: adminName, password: adminPassword }, { config })
    console.log('creating master')
    master = await createUser({ username: masterName, password: masterPassword }, { config })
    console.log('creating attacker')
    attacker = await createUser({ username: attackerName, password: attackerPassword }, { config })
    // pm
    hashmapPermissionManager = await createHashmapPermissionManager(admin, master)
  })

  it('put', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    await contract.put(args);
    const state = await contract.getState();
    assert.equal(state.values.length, 2, 'length 2');
    assert.equal(parseInt(state.values[1]), parseInt(args.value), 'value');
  });

  it('put - unauthorized', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);

    const callArgs = {
      contract,
      method: 'put',
      args: util.usc(args)
    }

    const result = await call(attacker, callArgs, { config })

    const state = await contract.getState();
    assert.equal(state.values.length, 1, 'length 1 - did not put');
    assert.equal(parseInt(state.values[0]), 0, 'empty');
  });

  it('get', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    // put
    await contract.put(args);
    // get
    const value = await contract.get({ key: args.key });
    assert.equal(parseInt(value), parseInt(args.value), 'value');
    const notFound = await contract.get({ key: '666' });
    assert.equal(parseInt(notFound), 0, 'not found');
  });

  it('contains', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    //put
    await contract.put(args);
    // contains
    const result = await contract.contains({ key: args.key });
    assert.equal(result, true, 'contains: true');
    const notFound = await contract.contains({ key: '666' });
    assert.equal(notFound, false, 'contains: false');
  });

  it('size', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const args = factory.createEntity(iuid);
    await contract.put(args);
    const size1 = await contract.size({});
    assert.equal(size1, 1, 'size: 1');
    args.key += 'x';
    await contract.put(args);
    const size2 = await contract.size({});
    assert.equal(size2, 2, 'size: 2');
  });

  it('remove', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const putArgs = factory.createEntity(iuid);
    // put
    await contract.put(putArgs);
    const args = { key: putArgs.key }
    // contains
    {
      const result = await contract.contains(args);
      assert.equal(result, true, 'contains: true');
    }
    // remove
    await contract.remove(args);
    await contract.getState()
    // contains not
    {
      const result = await contract.contains(args);
      assert.equal(result, false, 'contains: not');
    }
  });

  it('remove - unauthorized', async function () {
    const contract = await permissionedHashmapJs.uploadContract(admin, hashmapPermissionManager)
    const iuid = util.iuid();
    const putArgs = factory.createEntity(iuid);
    // put
    await contract.put(putArgs);
    const args = { key: putArgs.key }
    // contains
    {
      const result = await contract.contains(args);
      assert.equal(result, true, 'contains: true');
    }
    // remove
    const callArgs = {
      contract,
      method: 'remove',
      args: util.usc(args)
    }
    const result = await call(attacker, callArgs, { config })

    await contract.getState()
    // still contained - was not removed
    {
      const result = await contract.contains(args);
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

async function createHashmapPermissionManager(admin, master) {
  const contractName = 'HashmapPermissionManager';
  const contractFilename = `${config.libPath}/auth/permission/test/fixtures/HashmapPermissionManager.sol`;
  const args = {
    owner: admin.address,
    master: master.address,
  }

  const contractArgs = {
    name: contractName,
    source: await importer.combine(contractFilename),
    args: util.usc(args)
  }

  const hashmapPermissionManager = await createContract(admin, contractArgs, { config });
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
