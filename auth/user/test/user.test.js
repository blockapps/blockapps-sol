require('co-mocha');
const ba = require('blockapps-rest');
const common = ba.common;
const api = common.api;
const config = common.config;
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];
const util = common.util;
const should = common.should;
const assert = common.assert;
const Promise = common.Promise;

const userJs = require('../user');
const factory = require('./user.factory');

const adminName = util.uid('Admin');
const adminPassword = '1234';

describe('User tests', function() {
  this.timeout(config.timeout);

  let admin;

  before(function*() {
    admin = yield rest.createUser(adminName, adminPassword);
  });

  it('Create Contract', function* () {
    const uid = util.uid();
    // create the user with constructor args
    const args = factory.createUserArgs(admin.address, uid);
    const contract = yield userJs.uploadContract(admin, args);
    const user = yield contract.getState();
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.pwHash, args.pwHash, 'pwHash');
    assert.equal(user.role, args.role, 'role');
  });

  it('Search Contract', function* () {
    const uid = util.uid();
    // create the user with constructor args
    const args = factory.createUserArgs(admin.address, uid);
    const contract = yield userJs.uploadContract(admin, args);
    // search
    const user = yield userJs.getUser(args.username);
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.pwHash, args.pwHash, 'pwHash');
    assert.equal(user.role, args.role, 'role');
  });

  it('Authenticate', function* () {
    const uid = util.uid();
    // create the user with constructor args
    const args = factory.createUserArgs(admin.address, uid);
    const contract = yield userJs.uploadContract(admin, args);

    // create the user with constructor args
    let isAuthenticated;
    isAuthenticated = yield contract.authenticate(args.pwHash);
    assert.isOk(isAuthenticated, 'authenticated');
    isAuthenticated = yield contract.authenticate(util.toBytes32('666'));
    assert.isNotOk(isAuthenticated, 'not authenticated');
 });

});
