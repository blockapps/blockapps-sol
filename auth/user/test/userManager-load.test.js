require('co-mocha');
const ba = require('blockapps-rest');
const common = ba.common;
const config = common.config;
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];
const util = common.util;
const should = common.should;
const assert = common.assert;
const constants = common.constants;
const BigNumber = common.BigNumber;
const Promise = common.Promise;

const ErrorCodes = rest.getEnums(`${config.libPath}/error/ErrorCodes.sol`).ErrorCodes;
const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;

const adminName = util.uid('Admin');
const adminPassword = '1234';
const userManagerJs = require('../userManager');
const factory = require('./user.factory');

describe('UserManager LOAD tests', function() {
  this.timeout(config.timeout);

  const count = util.getArgInt('--count', 4);

  let admin;
  let contract;

  // get ready:  admin-user and manager-contract
  before(function* () {
    admin = yield rest.createUser(adminName, adminPassword);
    contract = yield userManagerJs.uploadContract(admin);
  });

  it('User address leading zeros - load test - count:' + count, function *() {
    this.timeout(60*60*1000);

    const users = [];
    const uid = util.uid() * 100;
    const accountAddress = 1234500;
    // create users
    for (let i = 0; i < count; i++) {
      const args = factory.createUserArgs(accountAddress+i, uid+i);
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
