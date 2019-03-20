require('co-mocha')
const { assert } = require('chai')
const { rest, util, parser, fsUtil } = require('blockapps-rest');
const { getYamlFile } = require('../../../util/config');
const { createUser, call } = rest;

const config = getYamlFile('config.yaml');

const permissionManagerJs = require('../permissionManager')

const adminName = util.uid('Admin')
const adminPassword = '1234'
const masterName = util.uid('Master')
const masterPassword = '5678'

describe('PermissionManager tests', function () {
  this.timeout(config.timeout);

  let admin, master, EventLogType, RestStatus;

  // get ready:  admin-user and manager-contract
  before(function* () {
    // Parse fields
    const restStatusSource = fsUtil.get(`${util.cwd}/rest/contracts/RestStatus.sol`)
    RestStatus = yield parser.parseFields(restStatusSource);
    
    // parse Enums
    const source = fsUtil.get(`${util.cwd}/auth/permission/contracts/EventLogType.sol`)
    EventLogType = yield parser.parseEnum(source);

    console.log('creating admin')
    admin = yield createUser({ username: adminName, password: adminPassword }, { config })
    console.log('creating master')
    master = yield createUser({ username: masterName, password: masterPassword }, { config })
  })

  it('upload', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)
    const { eventLog } = yield contract.getState()
    assert.isDefined(eventLog, 'eventLog')
    assert.equal(eventLog.length, 0, 'empty')
  })

  it('Grant (address with permissions)', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const args = yield createPermitArgs(uid)
    const permissions = yield contract.grant(args)
    assert.equal(permissions, args.permissions, 'permissions added')
    const state = yield contract.getState()
    const permit = state.permits[1]
    assert.equal(permit.adrs, args.address, ' address in array')
    assert.equal(permit.permissions, args.permissions, ' permissions in array')
    assert.equal(permit.id, args.id, 'id in array')
  })

  it('Grant Multiple Permissions', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const args = yield createPermitArgs(uid)
    // add permit
    {
      const permissions = yield contract.grant(args)
      assert.equal(permissions, args.permissions, 'permissions added')
    }
    // add different permission
    {
      args.permissions = 0x30
      const permissions = yield contract.grant(args)
      const expected = 0x30 | 0x03
      assert.equal(permissions, expected, 'permissions added')
    }
  })

  it('Get permit', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    const args = { address: permitArgs.address }
    const permissions = yield contract.getPermissions(args)
    assert.equal(permissions, permitArgs.permissions, 'permissions')
    {
      permitArgs.permissions = 0x30
      yield contract.grant(permitArgs)
      const permissions2 = yield contract.getPermissions(args)
      const expected = 0x03 | 0x30
      assert.equal(permissions2, expected, 'new permissions')
    }
  })

  it('Get permit 404', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const args = { address: 1234 }
    try {
      yield contract.getPermissions(args)
    } catch (e) {
      assert.equal(e.response.status, '404', 'should Throws 404 Not found')
    }
  })

  it.skip('Get permit - history', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    // found
    {
      const args = { address: permitArgs.address }
      const permissions = yield contract.getPermissions(args)
      assert.equal(permissions, permitArgs.permissions, 'permissions')
    }
    // not found
    {
      const args = { address: uid }
      yield assert.shouldThrowRest(function* () {
        const permissions = yield contract.getPermissions(args)
      }, RestStatus.NOT_FOUND)
    }
    // check the history
    const { history } = yield contract.getState()
    assert.equal(history[0], permitArgs.address, 'valid call')
    assert.equal(history[1], uid, 'valid call')
  })

  it('Check permissions', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    // check
    const args = { address: permitArgs.address, permissions: permitArgs.permissions }
    const isPermitted = yield contract.check(args)
    assert.equal(isPermitted, true, 'permitted')
    {
      const args = { address: permitArgs.address, permissions: 0xFF }
      const isPermitted = yield contract.check(args)
      assert.equal(isPermitted, false, 'NOT permitted')
    }
  })

  it('Revoke permissions', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    // get permissions
    const args = { address: permitArgs.address }
    const permissions = yield contract.getPermissions(args)
    assert.equal(permissions, permitArgs.permissions, 'permissions')
    // revoke
    {
      const args = { address: permitArgs.address }
      yield contract.revoke(args)
    }
    // get permissions
    {
      const args = { address: permitArgs.address }
      const permissions = yield contract.getPermissions(args)
      assert.equal(permissions, 0, 'no permissions')
    }
  })

  it('Revoke - 404', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const args = { address: 1234 }
    // TODO: Add shouldThrowRest in util or blockapps-rest
    // yield assert.shouldThrowRest(function* () {
    //   yield contract.revoke(args)
    // }, RestStatus.BAD_REQUEST)
    try {
      yield contract.revoke(args)
    } catch (e) {
      assert.equal(e.response.status, RestStatus.BAD_REQUEST, 'should throws 404 Not found')
    }
  })

  it('Transfer Ownership - AUTHORIZED', function* () {
    const uid = util.uid()
    const newOwner = yield createUser({ username: `NewOwner_${uid}`, password: '1234' }, { config })
    const contract = yield permissionManagerJs.uploadContract(admin, master)
    // transfer ownership to a new admin, by the master
    {
      const callArgs = {
        contract,
        method: 'transferOwnership',
        args: util.usc({ newOwner: newOwner.address })
      }

      const [restStatus] = yield call(master, callArgs, { config })
      assert.equal(restStatus, RestStatus.OK, 'should succeed')
    }
  })

  it('Transfer Ownership - positive case', function* () {
    const uid = util.uid()
    const newOwner = yield createUser({ username: `NewOwner_${uid}`, password: '1234' }, { config })
    const contract = yield permissionManagerJs.uploadContract(admin, master)
    // admin works
    const args = yield createPermitArgs(uid)
    yield contract.grant(args)
    // new admin unauthorized
    {
      const callArgs = {
        contract,
        method: 'grant',
        args: util.usc(args)
      }
      const [restStatus, permissions] = yield call(newOwner, callArgs, { config })
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail')
    }
    // transfer ownership - must be master
    {
      const args = { newOwner: newOwner.address }
      const callArgs = {
        contract,
        method: 'transferOwnership',
        args: util.usc(args)
      }

      const [restStatus] = yield call(master, callArgs, { config })
      assert.equal(restStatus, RestStatus.OK, 'should succeed')
    }
    // old admin unauthorized
    {
      const callArgs = {
        contract,
        method: 'grant',
        args: util.usc(args)
      }

      const [restStatus] = yield call(admin, callArgs, { config })
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail')
    }
    // new admin works
    {
      const callArgs = {
        contract,
        method: 'grant',
        args: util.usc(args)
      }

      const [restStatus] = yield call(newOwner, callArgs, { config })
      assert.equal(restStatus, RestStatus.OK, 'should succeed')
    }
  })

  it('Transfer Ownership - UNAUTHORIZED', function* () {
    const uid = util.uid()
    const contract = yield permissionManagerJs.uploadContract(admin, master)
    // transfer ownership to attacker
    {
      const attacker = yield createUser({ username: `Attacker_${uid}`, password: '1234' }, { config })
      const args = { newOwner: attacker.address }

      const callArgs = {
        contract,
        method: 'transferOwnership',
        args: util.usc(args)
      }

      const [restStatus] = yield call(attacker, callArgs, { config })
      assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail')
    }
  })

  it('EventLog - Check permissions', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    // check OK - should not be logged
    {
      const args = { address: permitArgs.address, permissions: permitArgs.permissions }
      yield contract.check(args)
      // event log
      const { eventLog } = yield contract.getState()
      assert.equal(eventLog.length, 1, 'not logged')
    }
    // check unauthorized
    {
      const args = { address: permitArgs.address, permissions: 0x8 }
      yield contract.check(args)
      // event log
      const { eventLog } = yield contract.getState()
      assert.equal(eventLog.length, 2, 'one entry')
      const eventLogEntry = eventLog[1];
      assert.equal(eventLogEntry.msgSender, admin.address, 'msg sender')
      assert.isDefined(eventLogEntry.blockTimestamp, 'timestamp')
      assert.equal(eventLogEntry.eventType, EventLogType.CHECK, 'type')
      assert.equal(eventLogEntry.id, '', 'id')
      assert.equal(eventLogEntry.adrs, args.address, 'address')
      assert.equal(eventLogEntry.permissions, args.permissions, 'permissions')
      assert.equal(eventLogEntry.result, RestStatus.UNAUTHORIZED, 'result')
    }
  })

  it('EventLog - Grant', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const args = yield createPermitArgs(uid)
    yield contract.grant(args)
    // event log
    const { eventLog } = yield contract.getState()
    assert.equal(eventLog.length, 1, 'one entry')
    const eventLogEntry = eventLog[0];
    assert.equal(eventLogEntry.msgSender, admin.address, 'msg sender')
    assert.isDefined(eventLogEntry.blockTimestamp, 'timestamp')
    assert.equal(eventLogEntry.eventType, EventLogType.GRANT, 'type')
    assert.equal(eventLogEntry.id, args.id, 'id')
    assert.equal(eventLogEntry.adrs, args.address, 'address')
    assert.equal(eventLogEntry.permissions, args.permissions, 'permissions')
    assert.equal(eventLogEntry.result, RestStatus.OK, 'result')
  })

  it('EventLog - Revoke', function* () {
    const contract = yield permissionManagerJs.uploadContract(admin, master)

    const uid = util.uid()
    const permitArgs = yield createPermitArgs(uid)
    yield contract.grant(permitArgs)
    // revoke
    {
      const args = { address: permitArgs.address }
      yield contract.revoke(args)
    }
    // event log
    const { eventLog } = yield contract.getState()
    assert.equal(eventLog.length, 2, 'two entries')
    const eventLogEntry = eventLog[1];
    assert.equal(eventLogEntry.msgSender, admin.address, 'msg sender')
    assert.isDefined(eventLogEntry.blockTimestamp, 'timestamp')
    assert.equal(eventLogEntry.eventType, EventLogType.REVOKE, 'type')
    assert.equal(eventLogEntry.id, '', 'id')
    assert.equal(eventLogEntry.adrs, permitArgs.address, 'address')
    assert.equal(eventLogEntry.permissions, 0, 'permissions')
    assert.equal(eventLogEntry.result, RestStatus.OK, 'result')
  })
})


function* createPermitArgs(uid) {
  // TODO:
  const userArgs = {
    username: `username_${uid}`,
    password: adminPassword
  };

  const user = yield createUser(userArgs, { config })
  const permissions = 0x3

  const args = {
    id: `ID_${uid}`,
    address: user.address,
    permissions,
  }
  return args
}
