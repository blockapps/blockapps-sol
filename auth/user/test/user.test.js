import { assert } from 'chai';
import { rest, util } from 'blockapps-rest';
const { createUser, call } = rest;

import { getYamlFile } from '../../../util/config';
const config = getYamlFile('config.yaml');

import * as userJs from '../user';
import * as factory from './user.factory';

const adminName = util.uid('Admin');
const adminPassword = '1234';

describe('User tests', function () {
  this.timeout(config.timeout);

  let admin;

  before(async function () {
    admin = await createUser({ username: adminName, password: adminPassword }, { config });
  });

  it('Create Contract', async function () {
    const uid = util.uid();
    // create the user with constructor args
    const args = factory.createUserArgs(admin.address, uid);
    const contract = await userJs.uploadContract(admin, args);
    const user = await contract.getState();
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

  it('Search Contract', async function () {
    const uid = util.uid();
    // create the user with constructor args
    const args = factory.createUserArgs(admin.address, uid);
    const contract = await userJs.uploadContract(admin, args);
    // search
    const user = await userJs.getUser(args.username);
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

});
