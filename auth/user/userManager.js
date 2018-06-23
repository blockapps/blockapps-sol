const ba = require('blockapps-rest');
const rest = ba.rest;
const util = ba.common.util;
const BigNumber = ba.common.BigNumber;
const config = ba.common.config;
const cwd = ba.common.cwd;

const contractName = 'UserManager';
const contractFilename = `${cwd}/${config.libPath}/auth/user/contracts/UserManager.sol`;

const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;
const userJs = require(`${cwd}/${config.libPath}/auth/user/user`);

function* uploadContract(admin) {
  // NOTE: in production, the contract is created and owned by the AdminInterface
  // for testing purposes the creator is the admin user
  const args = { _owner: admin.address };
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, args);
  yield compileSearch(contract);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield rest.getState(contract);
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

function* compileSearch(contract) {
  rest.verbose('compileSearch', contractName);
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
  rest.verbose('createUser', args);

  // function createUser(address account, string username, bytes32 pwHash, uint role) returns (ErrorCodes) {
  const method = 'createUser';

  // create the user, with the eth account
  const [restStatus, address] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.CREATED) {
    throw new rest.RestError(restStatus, method, args);
  }
  // block until the user shows up in search
  const user = yield getUser(admin, contract, args.username);
  return user;
}

function* exists(admin, contract, username) {
  rest.verbose('exists', username);
  // function exists(string username) returns (bool) {
  const method = 'exists';
  const args = {
    username: username,
  };
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  const exist = (result[0] === true);
  return exist;
}

function* getUser(admin, contract, username) {
  rest.verbose('getUser', username);
  // function getUser(string username) returns (address) {
  const method = 'getUser';
  const args = {
    username: username,
  };

  // get the use address
  const [address] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (address == 0) {
    throw new rest.RestError(RestStatus.NOT_FOUND, method, args);
  }
  // found - query for the full user record
  return yield userJs.getUserByAddress(address);
}

function* getUsers(admin, contract) {
  rest.verbose('getUsers');
  const {users: usersHashmap} = yield rest.getState(contract);
  const {values} = yield rest.getState({name: 'Hashmap', address:usersHashmap});
  const addresses = values.slice(1);
  return yield userJs.getUsers(addresses);
}

function* authenticate(admin, contract, args) {
  rest.verbose('authenticate', args);

  // function authenticate(string _username, bytes32 _pwHash) returns (bool) {
  const method = 'authenticate';
  const [result] = yield rest.callMethod(admin, contract, method, util.usc(args));
  const isOK = (result == true);
  return isOK;
}

module.exports = {
  uploadContract: uploadContract,
  compileSearch: compileSearch,
  contractName: contractName,
  bind: bind,
};
