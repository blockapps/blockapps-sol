require('co-mocha');
const ba = require('blockapps-rest');
const common = ba.common;
const config = common.config;
const rest = ba[`rest${config.restVersion ? config.restVersion : ''}`];
const util = common.util;
const should = common.should;
const assert = common.assert;
const constants = common.constants;
const BigNumber = common.BigNumber;
const Promise = common.Promise;

const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;

const adminName = util.uid('Admin');
const adminPassword = '1234';
const blocName = util.uid('Bloc');
const blocPassword = '4567';
const userManagerJs = require('../userManager');
const factory = require('./user.factory');

describe('UserManager tests', function() {
  this.timeout(config.timeout);

  let admin;
  let contract;
  let account;

  // get ready:  admin-user and manager-contract
  before(function* () {
    admin = yield rest.createUser(adminName, adminPassword);
    contract = yield userManagerJs.uploadContract(admin);
    // bloc account must be created separately
    account = yield rest.createUser(blocName, blocPassword);
  });

  it('Create User', function* () {
    const uid = util.uid();
    // create user with the bloc account
    const args = factory.createUserArgs(account.address, uid);
    const user = yield contract.createUser(args);
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

  it('Create User - UNAUTHORIZED', function*() {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    const attacker = yield rest.createUser('Attacker_'+uid, ''+uid);

    // create user UNAUTHORIZED
    const method = 'createUser';
    const chainId = '';
    const value = undefined;
    const doNotResolve = undefined;
    const [restStatus, address] = yield rest.callMethod(attacker, contract, method, util.usc(args), value, doNotResolve, chainId);
    assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail');
  });

  it('Create User - illegal name', function* () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    args.username = '123456789012345678901234567890123'; // 33 chars
    yield assert.shouldThrowRest(function*() {
      return yield contract.createUser(args);
    }, RestStatus.BAD_REQUEST);
  });

  it('Test exists()', function* () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    let exists;
    // should not exist
    exists = yield contract.exists(args.username);
    assert.isDefined(exists, 'should be defined');
    assert.isNotOk(exists, 'should not exist');
    // create user
    const user = yield contract.createUser(args);
    // should exist
    exists = yield contract.exists(args.username);
    assert.equal(exists, true, 'should exist')
  });

  it('Test exists() with special characters', function* () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    args.username += ' ?#%!@*';

    let exists;
    // should not exist
    exists = yield contract.exists(args.username);
    assert.isDefined(exists, 'should be defined');
    assert.isNotOk(exists, 'should not exist');
    // create user
    const user = yield contract.createUser(args);
    // should exist
    exists = yield contract.exists(args.username);
    assert.equal(exists, true, 'should exist')
  });

  it('Create Duplicate User', function* () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // create user
    const user = yield contract.createUser(args);
    yield assert.shouldThrowRest(function*() {
      const user = yield contract.createUser(args);
    }, RestStatus.BAD_REQUEST);
  });

  it('Get User', function *() {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // get non-existing user
    yield assert.shouldThrowRest(function*() {
      const user = yield contract.getUser(args.username);
    }, RestStatus.NOT_FOUND);
    // create user
    yield contract.createUser(args);
    // get user - should exist
    const user = yield contract.getUser(args.username);
    assert.equal(user.username, args.username, 'username should be found');
  });

  it('Get Users', function* () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // get users - should not exist
    {
      const users = yield contract.getUsers();
      const found = users.filter(function(user) {
        return user.username === args.username;
      });
      assert.equal(found.length, 0, 'user list should NOT contain ' + args.username);
    }
    // create user
    const user = yield contract.createUser(args);
    // get user - should exist
    {
      const users = yield contract.getUsers(admin, contract);
      const found = users.filter(function(user) {
        return user.username === args.username;
      });
      assert.equal(found.length, 1, 'user list should contain ' + args.username);
    }
  });

  it.skip('User address leading zeros - load test - skipped', function *() {
    this.timeout(60*60*1000);
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    const username = args.username;

    const count = 16*4; // leading 0 once every 16
    const users = [];
    // create users
    for (let i = 0; i < count; i++) {
      args.username = username + '_' + i;
      const user = yield contract.createUser(args);
      users.push(user);
    }

    // get single user
    for (let user of users) {
      const resultUser = yield contract.getUser(user.username);
    }

    // get all users
    const resultUsers = yield contract.getUsers(admin, contract);
    const comparator = function(a, b) { return a.username == b.username; };
    const notFound = util.filter.isContained(users, resultUsers, comparator, true);
    assert.equal(notFound.length, 0, JSON.stringify(notFound));
  });

});
