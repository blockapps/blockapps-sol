const { rest, util, importer } = require('blockapps-rest');
const { getYamlFile } = require('../../util/config');
const { createContract, getState, call } = rest;
const config = getYamlFile('config.yaml');

const contractName = 'UserManager';
const contractFilename = `${util.cwd}/${config.libPath}/auth/user/contracts/UserManager.sol`;

const logger = console;

// TODO: (remove if not in use) const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
const userJs = require(`${util.cwd}/${config.libPath}/auth/user/user`);

function* uploadContract(admin) {
  // NOTE: in production, the contract is created and owned by the AdminInterface
  // for testing purposes the creator is the admin user
  const args = { owner: admin.address };
  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: util.usc(args)
  }
  const contract = yield createContract(admin, contractArgs, { config, logger });
  // TODO: Please confirm that it is needed
  // yield compileSearch(contract);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield getState(contract, { config });
  }
  contract.createUser = function* (args) {
    return yield createUser(admin, contract, args);
  }
  contract.exists = function* (username) {
    return yield exists(admin, contract, username);
  }
  contract.getUser = function* (username) {
    return yield getUser(admin, contract, username);
  }
  contract.getUsers = function* () {
    return yield getUsers(admin, contract);
  }
  contract.authenticate = function* (args) {
    return yield authenticate(admin, contract, args);
  }
  return contract;
}

// TODO: remove if not in use
function* compileSearch(contract) {
  if (yield rest.isSearchable(contract.codeHash)) {
    return;
  }
  // compile + dependencies
  const searchable = [userJs.contractName, contractName];
  yield rest.compileSearch(searchable, contractName, contractFilename);

}

// throws: RestStatus
// returns: user record from search
function* createUser(admin, contract, args) {
  // function createUser(address account, string username, bytes32 pwHash, uint role) returns (ErrorCodes) {
  const callArgs = {
    contract,
    method: 'createUser',
    args: util.usc(args)
  }

  // create the user, with the eth account
  const [restStatus] = yield call(admin, callArgs, { config });
  // TODO:  add RestStatus api call. No magic numbers
  if (restStatus != '201') {
    throw new rest.RestError(restStatus, method, args);
  }
  // block until the user shows up in search
  const user = yield getUser(admin, contract, args.username);
  return user;
}

function* exists(admin, contract, username) {
  // function exists(string username) returns (bool) {
  const callArgs = {
    contract,
    method: 'exists',
    args: util.usc(args)
  }

  const args = {
    username: username,
  };
  const result = yield call(admin, callArgs, { config });
  const exist = (result[0] === true);
  return exist;
}

function* getUser(admin, contract, username) {
  // function getUser(string username) returns (address) {
  const args = {
    username: username,
  };
  const callArgs = {
    contract,
    method: 'getUser',
    args: util.usc(args)
  }

  // get the use address
  const [address] = yield call(admin, callArgs, { config });
  if (address == 0) {
    throw new rest.RestError('404', method, args);
  }
  // found - query for the full user record
  return yield userJs.getUserByAddress(contract, address);
}

function* getUsers(admin, contract) {
  const { users: usersHashmap } = yield rest.getState(contract, { config });
  const { values } = yield getState({ name: 'Hashmap', address: usersHashmap }, { config });
  const addresses = values.slice(1);
  return yield userJs.getUsers(addresses);
}

function* authenticate(admin, contract, args) {
  // function authenticate(string _username, bytes32 _pwHash) returns (bool) {
  const callArgs = {
    contract,
    method: 'authenticate',
    args: util.usc(args)
  }
  const [result] = yield call(admin, callArgs, { config });
  const isOK = (result == true);
  return isOK;
}

module.exports = {
  uploadContract: uploadContract,
  compileSearch: compileSearch,
  contractName: contractName,
  bind: bind,
};
