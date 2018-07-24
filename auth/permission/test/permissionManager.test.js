require('co-mocha');
const ba = require('blockapps-rest');

const { rest } = ba;
const { config, util, assert, cwd } = ba.common;

const permissionManagerJs = require('../permissionManager');
const RestStatus = rest.getFields(`${cwd}/rest/contracts/RestStatus.sol`);

const adminName = util.uid('Admin');
const adminPassword = '1234';
const masterName = util.uid('Master');
const masterPassword = '5678';

describe('PermissionManager tests', function() {
  this.timeout(config.timeout);

  let admin, master;

  // get ready:  admin-user and manager-contract
  before(function*() {
    console.log('creating admin');
    admin = yield rest.createUser(adminName, adminPassword);
    console.log('creating master');
    master = yield rest.createUser(masterName, masterPassword);
  });

  it('Grant (address with permissions)', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const args = yield createPermitArgs(uid);
    const permissions = yield contract.grant(args);
    assert.equal(permissions, args.permissions, 'permissions added');
    const state = yield contract.getState();
    const permit = state.permits[1];
    assert.equal(permit._address, args.address, ' address in array');
    assert.equal(permit.permissions, args.permissions, ' permissions in array');
    assert.equal(permit.id, args.id, 'id in array');
  });

  it('Grant Multiple Permissions', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const args = yield createPermitArgs(uid);
    // add permit
    {
      const permissions = yield contract.grant(args);
      assert.equal(permissions, args.permissions, 'permissions added');
    }
    // add different permission
    {
      args.permissions = 0x30;
      const permissions = yield contract.grant(args);
      const expected = 0x30 | 0x03;
      assert.equal(permissions, expected, 'permissions added');
    }
  });

  it('Get permit', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const permitArgs = yield createPermitArgs(uid);
    yield contract.grant(permitArgs);
    const args = {address: permitArgs.address};
    const permissions = yield contract.getPermissions(args);
    assert.equal(permissions, permitArgs.permissions, 'permissions');
    {
      permitArgs.permissions = 0x30;
      yield contract.grant(permitArgs);
      const permissions2 = yield contract.getPermissions(args);
      const expected = 0x03 | 0x30;
      assert.equal(permissions2, expected, 'new permissions');
    }
  });

  it('Get permit 404', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const args = {address: 1234};
    yield assert.shouldThrowRest(function* () {
       const permissions =  yield contract.getPermissions(args);
    }, RestStatus.NOT_FOUND);
  });

  it.skip('Get permit - history', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const permitArgs = yield createPermitArgs(uid);
    yield contract.grant(permitArgs);
    // found
    {
      const args = {address: permitArgs.address};
      const permissions = yield contract.getPermissions(args);
      assert.equal(permissions, permitArgs.permissions, 'permissions');
    }
    // not found
    {
      const args = {address: uid};
      yield assert.shouldThrowRest(function* () {
        const permissions =  yield contract.getPermissions(args);
      }, RestStatus.NOT_FOUND);
    }
    // check the history
    const {history} = yield contract.getState();
    assert.equal(history[0], permitArgs.address, 'valid call');
    assert.equal(history[1], uid, 'valid call');
  });

  it('Check permissions', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const permitArgs = yield createPermitArgs(uid);
    yield contract.grant(permitArgs);
    // check
    const args = {address: permitArgs.address, permissions: permitArgs.permissions};
    const isPermitted = yield contract.check(args);
    assert.equal(isPermitted, true, 'permitted');
    {
      const args = {address: permitArgs.address, permissions: ~permitArgs.permissions};
      const isPermitted = yield contract.check(args);
      assert.equal(isPermitted, false, 'NOT permitted');
    }
  });

  it('Revoke permissions', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const uid = util.uid();
    const permitArgs = yield createPermitArgs(uid);
    yield contract.grant(permitArgs);
    // get permissions
    const args = {address: permitArgs.address};
    const permissions = yield contract.getPermissions(args);
    assert.equal(permissions, permitArgs.permissions, 'permissions');
    // revoke
    {
      const args = {address: permitArgs.address};
      yield contract.revoke(args);
    }
    // get permissions
    {
      const args = {address: permitArgs.address};
      const permissions = yield contract.getPermissions(args);
      assert.equal(permissions, 0, 'no permissions');
    }
  });

  it('Revoke - 404', function*() {
    const contract = yield permissionManagerJs.uploadContract(admin, master);

    const args = {address: 1234};
    yield assert.shouldThrowRest(function* () {
      yield contract.revoke(args);
    }, RestStatus.BAD_REQUEST);
  });

  it('Transfer Ownership - AUTHORIZED', function* () {
    const uid = util.uid();
    const newOwner = yield rest.createUser('NewOwner_'+uid, ''+uid);
    const contract = yield permissionManagerJs.uploadContract(admin, master);
    // transfer ownership to a new admin, by the master
    {
      const args = {newOwner: newOwner.address}
      const method = 'transferOwnership';
      const [restStatus] = yield rest.callMethod(master, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.OK, 'should succeed');
    }
  });

  it('Transfer Ownership - positive case', function* () {
    const uid = util.uid();
    const newOwner = yield rest.createUser('NewOwner_'+uid, ''+uid);
    const contract = yield permissionManagerJs.uploadContract(admin, master);
    // admin works
    const args = yield createPermitArgs(uid);
    yield contract.grant(args);
    // new admin unauthorized
    {
      const method = 'grant';
      const [restStatus, permissions] = yield rest.callMethod(newOwner, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail');
    }
    // transfer ownership - must be master
    {
      const args = {newOwner: newOwner.address}
      const method = "transferOwnership";
      const [restStatus] = yield rest.callMethod(master, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.OK, 'should succeed');
    }
    // old admin unauthorized
    {
      const method = 'grant';
      const [restStatus, permissions] = yield rest.callMethod(admin, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail');
    }
    // new admin works
    {
      const method = 'grant';
      const [restStatus, permissions] = yield rest.callMethod(newOwner, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.OK, 'should succeed');
    }
  });

  it('Transfer Ownership - UNAUTHORIZED', function* () {
    const uid = util.uid();
    const contract = yield permissionManagerJs.uploadContract(admin, master);
    // transfer ownership to attacker
    {
      const attacker = yield rest.createUser('Attacker_'+uid, ''+uid);
      const args = {newOwner: attacker.address}
      const method = 'transferOwnership';
      const [restStatus, permissions] = yield rest.callMethod(attacker, contract, method, util.usc(args));
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail');
    }
  });
});

function* createPermitArgs(uid) {
  const user = yield rest.createUser(uid, uid);
  const permissions = 0x3;

  const args = {
    id: 'ID_' + uid,
    address: user.address,
    permissions: permissions,
  }
  return args;
}
