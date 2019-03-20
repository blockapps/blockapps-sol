import { assert } from 'chai';
import { rest, util } from 'blockapps-rest';
const { createUser, call } = rest;

import { getYamlFile } from '../../../util/config';
const config = getYamlFile('config.yaml');


const adminName = util.uid('Admin');
const adminPassword = '1234';
const userManagerJs = require('../userManager');
const factory = require('./user.factory');

describe('UserManager LOAD tests', function () {
  this.timeout(config.timeout);

  const count = util.getArgInt('--count', 4);

  let admin;
  let contract;

  // get ready:  admin-user and manager-contract
  before(async function () {
    admin = await createUser({ username: adminName, password: adminPassword }, { config });
    contract = await userManagerJs.uploadContract(admin);
  });

  it('User address leading zeros - load test - count:' + count, async function () {
    this.timeout(60 * 60 * 1000);

    const users = [];
    const uid = util.uid() * 100;
    const accountAddress = 1234500;
    // create users
    for (let i = 0; i < count; i++) {
      const args = factory.createUserArgs(accountAddress + i, uid + i);
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
