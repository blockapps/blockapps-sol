require('co-mocha');
const ba = require('blockapps-rest');
const rest = ba.rest;
const common = ba.common;
const config = common.config;
const util = common.util;
const should = common.should;
const assert = common.assert;
const constants = common.constants;
const BigNumber = common.BigNumber;
const Promise = common.Promise;

const ErrorCodes = rest.getEnums(`${config.libPath}/exception-handling/ErrorCodes.sol`).ErrorCodes;
const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;

const adminName = util.uid('Admin');
const adminPassword = '1234';
const userManagerJs = require(`../userManager`);

describe('UserManager tests', function() {
  this.timeout(config.timeout);

  let admin;
  let contract;

  // get ready:  admin-user and manager-contract
  before(function* () {
    admin = yield rest.createUser(adminName, adminPassword);
    contract = yield userManagerJs.uploadContract(admin);
  });

  it('Create User', function* () {
    const args = createUserArgs();
    const user = yield contract.createUser(args);
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
    // test that the account was created
    const account = yield rest.getAccount(user.account);
  });

  it('Create User - by admin', function*() {
    const uid = util.uid();
    const args = createUserArgs();
    const randomUser = yield rest.createUser('User_'+uid, uid);

    // create user by admin
    const result = yield createUserAsync(admin, contract, args);
    assert.equal(result, ErrorCodes.SUCCESS, 'should succeed');
  });

  it('Create User - by a random user', function*() {
    const uid = util.uid();
    const args = createUserArgs();
    const randomUser = yield rest.createUser('User_'+uid, `${uid}`);

    // create user not by the admin - should throw
    yield assert.shouldThrowGen(function*() {
      return yield createUserAsync(randomUser, contract, args);
    }, new Error(ErrorCodes.UNAUTHORIZED));
  });

  it('Create User - illegal name', function* () {
    const args = createUserArgs();
    args.username = '123456789012345678901234567890123';
    yield assert.shouldThrowGen(function*() {
      return yield contract.createUser(args);
    }, new Error(ErrorCodes.ERROR));
  });

  it('Test exists()', function* () {
    const args = createUserArgs();

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
    const args = createUserArgs();
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
    const args = createUserArgs();

    // create user
    const user = yield contract.createUser(args);
    yield assert.shouldThrowGen(function*() {
      return yield contract.createUser(args);
    }, new Error(ErrorCodes.EXISTS));
  });

  it('Get User', function *() {
    const args = createUserArgs();

    // get non-existing user
    yield assert.shouldThrowGen(function*() {
      return yield contract.getUser(args.username);
    }, new Error(ErrorCodes.NOT_FOUND));
    // create user
    yield contract.createUser(args);
    // get user - should exist
    const user = yield contract.getUser(args.username);
    assert.equal(user.username, args.username, 'username should be found');
  });

  it('Get Users', function* () {
    const args = createUserArgs();

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

    const count = 16*4; // leading 0 once every 16
    const users = [];
    // create users
    for (let i = 0; i < count; i++) {
      const name = `User_${i}_`;
      const args = createUserArgs(name);
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


  it('User Login', function* () {
    const args = createUserArgs();

    // auth non-existing - should fail
    {
      const result = yield contract.login(args);
      assert.isDefined(result, 'auth result should be defined');
      assert.isNotOk(result, 'auth should fail');
    }

    // create user
    const user = yield contract.createUser(args);
    // auth
    {
      const result = yield contract.login(args);
      assert.isOk(result, 'auth should be ok');
    }
  });

  it('Get account', function* () {
    const args = createUserArgs();
    // create user
    const user = yield contract.createUser(args);
    // check account
    const account = (yield rest.getAccount(user.account))[0];
    const balance = new BigNumber(account.balance);
    const faucetBalance = new BigNumber(1000).times(constants.ETHER);
    balance.should.be.bignumber.equal(faucetBalance);
  });

  it('Get balance', function* () {
    const args = createUserArgs();
    // create user
    const user = yield contract.createUser(args);
    const balance = yield contract.getBalance(user.username);
    const faucetBalance = new BigNumber(1000).times(constants.ETHER);
    balance.should.be.bignumber.equal(faucetBalance);
  });

  it('Send funds wei', function* () {
    // create buyer/seller
    const buyerArgs = createUserArgs('Buyer', UserRole.BUYER);
    const buyer = yield contract.createUser(buyerArgs);
    buyer.startingBalance = yield contract.getBalance(buyer.username);

    const supplierArgs = createUserArgs('Supplier', UserRole.ADMIN);
    const supplier = yield contract.createUser(supplierArgs);
    supplier.startingBalance = yield contract.getBalance(supplier.username);

    // TRANSACTION
    // function* send(fromUser, toUser, value, nonce, node)
    const value = new BigNumber(12).mul(constants.ETHER);
    const receipt = yield rest.send(buyer.blocUser, supplier.blocUser, value);
    const txResult = yield rest.transactionResult(receipt.hash);
    assert.equal(txResult[0].status, 'success');

    // check balances
    buyer.endBalance = yield contract.getBalance(buyer.username);
    supplier.endBalance = yield contract.getBalance(supplier.username);
    // buyer end balance = start - value - fee
    buyer.startingBalance.minus(value).should.be.bignumber.gt(buyer.endBalance);
    // supplier end balance = start + value
    supplier.startingBalance.plus(value).should.be.bignumber.eq(supplier.endBalance);
  });
});

// function createUser(address account, string username, bytes32 pwHash, UserRole role) returns (ErrorCodes) {
function createUserArgs(_name, _role) {
  const uid = util.uid();
  const role = _role || UserRole.ADMIN;
  const name = _name || 'User_';
  const args = {
    account: `3db01104b0c639556a3e1757f1ee1f7a1d3541d5`,
    username: name + uid,
    password: '1234',
    role: role,
  }
  return args;
}




// throws: ErrorCodes
// returns: user record from search
function* createUserAsync(admin, contract, args) {
  rest.verbose('createUser', args);

  // create bloc user
  const blocUser = yield rest.createUser(args.username, args.password);
  args.account = blocUser.address;
  args.pwHash = util.toBytes32(args.password); // FIXME this is not a hash

  // function createUser(address account, string username, bytes32 pwHash, UserRole role) returns (ErrorCodes) {
  const method = 'createUser';

  // create the user, with the eth account
  const result = yield rest.callMethod(admin, contract, method, args);
  const errorCode = parseInt(result[0]);
  if (errorCode != ErrorCodes.SUCCESS) {
    throw new Error(errorCode);
  }
  return errorCode;
}
