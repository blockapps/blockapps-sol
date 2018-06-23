const ba = require('blockapps-rest');
const rest = ba.rest;
const util = ba.common.util;
const config = ba.common.config;

const contractName = 'User';
const contractFilename = `${ba.common.cwd}/${config.libPath}/auth/user/contracts/User.sol`;

const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;

function* uploadContract(admin, args) {
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args));
  yield compileSearch(contract);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield rest.getState(contract);
  }
  contract.authenticate = function* (pwHash) {
    return yield authenticate(admin, contract, pwHash);
  }
  return contract;
}

function* compileSearch(contract) {
  rest.verbose('compileSearch', contractName);

  if (yield rest.isSearchable(contract.codeHash)) {
    return;
  }
  const searchable = [contractName];
  yield rest.compileSearch(searchable, contractName, contractFilename);
}

function* getUsers(addresses) { // FIXME must break to batches of 50 addresses
  const csv = util.toCsv(addresses); // generate csv string
  const results = yield rest.query(`${contractName}?address=in.${csv}`);
  return results;
}

function* getUser(username) {
  return (yield rest.waitQuery(`${contractName}?username=eq.${username}`, 1))[0];
}

function* getUserByAddress(address) {
  return (yield rest.waitQuery(`${contractName}?address=eq.${address}`, 1))[0];
}

function* authenticate(admin, contract, pwHash) {
  rest.verbose('authenticate', pwHash);
  // function authenticate(bytes32 _pwHash) return (bool) {
  const method = 'authenticate';
  const args = {
    _pwHash: pwHash,
  };
  const result = yield rest.callMethod(admin, contract, method, args);
  const isAuthenticated = (result[0] === true);
  return isAuthenticated;
}


module.exports = {
  uploadContract: uploadContract,
  bind: bind,
  compileSearch: compileSearch,

  // constants
  contractName: contractName,

  // business logic
  authenticate: authenticate,
  getUserByAddress: getUserByAddress,
  getUsers: getUsers,
  getUser: getUser,
};
