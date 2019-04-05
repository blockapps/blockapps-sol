import { assert } from 'chai';
import { rest, util } from 'blockapps-rest';
const { createUser } = rest;

import { getYamlFile } from '../../lib/util/config';
const config = getYamlFile('config.yaml');

import userJs from '../../lib/auth/user/user';
import { createUserArgs } from './user.factory';
import { getCredentialArgs } from '../../lib/util/util';

const adminArgs = getCredentialArgs(util.uid(), 'Admin', '1234');

describe('User tests', function () {
  this.timeout(config.timeout);

  const options = { config }
  let admin;

  before(async function () {
    admin = await createUser(adminArgs, options);
  });

  it('Create Contract', async function () {
    const uid = util.uid();
    // create the user with constructor args
    const args = createUserArgs(admin.address, uid);
    const contract = await userJs.uploadContract(admin, args);
    const user = await contract.getState();
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

  it('Search Contract', async function () {
    const uid = util.uid();
    // create the user with constructor args
    const args = createUserArgs(admin.address, uid);
    const contract = await userJs.uploadContract(admin, args);
    // search
    const user = await userJs.getUser(args.username);
    assert.equal(user.account, args.account, 'account');
    assert.equal(user.username, args.username, 'username');
    assert.equal(user.role, args.role, 'role');
  });

});
