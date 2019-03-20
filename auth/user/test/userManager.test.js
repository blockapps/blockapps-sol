import { assert } from 'chai';
import { rest, util, fsUtil, parser } from 'blockapps-rest';
const { createUser, call } = rest;

import { getYamlFile } from '../../../util/config';
const config = getYamlFile('config.yaml');

import * as userManagerJs from '../userManager';
import * as factory from './user.factory';

const adminName = util.uid('Admin');
const adminPassword = '1234';
const blocName = util.uid('Bloc');
const blocPassword = '4567';

describe('UserManager tests', function () {
  this.timeout(config.timeout);

  let admin;
  let contract;
  let account;
  let RestStatus;

  // get ready:  admin-user and manager-contract
  before(async function () {
    // Parse fields
    const restStatusSource = fsUtil.get(`${util.cwd}/rest/contracts/RestStatus.sol`)
    RestStatus = await parser.parseFields(restStatusSource);

    admin = await createUser({ username: adminName, password: adminPassword }, { config });
    contract = await userManagerJs.uploadContract(admin);
    // bloc account must be created separately
    account = await createUser({ username: blocName, password: blocPassword }, { config });
  });

  it('Create User', async function () {
    const uid = util.uid();
    // create user with the bloc account
    const args = factory.createUserArgs(account.address, uid);
    const user = await contract.createUser(args);
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

  xit('Create User - UNAUTHORIZED', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    const attacker = await rest.createUser('Attacker_' + uid, '' + uid);

    // create user UNAUTHORIZED
    const method = 'createUser';
    const [restStatus, address] = await rest.callMethod(attacker, contract, method, util.usc(args));
    assert.equal(restStatus, RestStatus.UNAUTHORIZED, 'should fail');
  });

  xit('Create User - illegal name', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    args.username = '123456789012345678901234567890123'; // 33 chars
    await assert.shouldThrowRest(async function () {
      return await contract.createUser(args);
    }, RestStatus.BAD_REQUEST);
  });

  xit('Test exists()', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    let exists;
    // should not exist
    exists = await contract.exists(args.username);
    assert.isDefined(exists, 'should be defined');
    assert.isNotOk(exists, 'should not exist');
    // create user
    const user = await contract.createUser(args);
    // should exist
    exists = await contract.exists(args.username);
    assert.equal(exists, true, 'should exist')
  });

  xit('Test exists() with special characters', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    args.username += ' ?#%!@*';

    let exists;
    // should not exist
    exists = await contract.exists(args.username);
    assert.isDefined(exists, 'should be defined');
    assert.isNotOk(exists, 'should not exist');
    // create user
    const user = await contract.createUser(args);
    // should exist
    exists = await contract.exists(args.username);
    assert.equal(exists, true, 'should exist')
  });

  xit('Create Duplicate User', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // create user
    const user = await contract.createUser(args);
    await assert.shouldThrowRest(async function () {
      const user = await contract.createUser(args);
    }, RestStatus.BAD_REQUEST);
  });

  xit('Get User', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // get non-existing user
    await assert.shouldThrowRest(async function () {
      const user = await contract.getUser(args.username);
    }, RestStatus.NOT_FOUND);
    // create user
    await contract.createUser(args);
    // get user - should exist
    const user = await contract.getUser(args.username);
    assert.equal(user.username, args.username, 'username should be found');
  });

  xit('Get Users', async function () {
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);

    // get users - should not exist
    {
      const users = await contract.getUsers();
      const found = users.filter(function (user) {
        return user.username === args.username;
      });
      assert.equal(found.length, 0, 'user list should NOT contain ' + args.username);
    }
    // create user
    const user = await contract.createUser(args);
    // get user - should exist
    {
      const users = await contract.getUsers(admin, contract);
      const found = users.filter(function (user) {
        return user.username === args.username;
      });
      assert.equal(found.length, 1, 'user list should contain ' + args.username);
    }
  });

  it.skip('User address leading zeros - load test - skipped', async function () {
    this.timeout(60 * 60 * 1000);
    const uid = util.uid();
    const args = factory.createUserArgs(account.address, uid);
    const username = args.username;

    const count = 16 * 4; // leading 0 once every 16
    const users = [];
    // create users
    for (let i = 0; i < count; i++) {
      args.username = username + '_' + i;
      const user = await contract.createUser(args);
      users.push(user);
    }

    // get single user
    for (let user of users) {
      const resultUser = await contract.getUser(user.username);
    }

    // get all users
    const resultUsers = await contract.getUsers(admin, contract);
    const comparator = function (a, b) { return a.username == b.username; };
    const notFound = util.filter.isContained(users, resultUsers, comparator, true);
    assert.equal(notFound.length, 0, JSON.stringify(notFound));
  });

});
