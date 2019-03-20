const { rest, util, importer } = require('blockapps-rest');
const { getYamlFile } = require('../../util/config');
const { createContract, getState, call, search } = rest;
const config = getYamlFile('config.yaml');

const contractName = 'User';
const contractFilename = `${util.cwd}/${config.libPath}/auth/user/contracts/User.sol`;

// const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);
// const UserRole = rest.getEnums(`${config.libPath}/auth/user/contracts/UserRole.sol`).UserRole;

function* uploadContract(admin, args) {
  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: util.usc(args)
  }

  const contract = yield createContract(admin, contractArgs, { config });
  // TODO: Please confirm that it is needed
  // yield compileSearch(contract);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield getState(contract, { config });
  }
  contract.authenticate = function* (pwHash) {
    return yield authenticate(admin, contract, pwHash);
  }
  return contract;
}

// TODO: remove if not in use
function* compileSearch(contract) {
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
  // function authenticate(bytes32 _pwHash) return (bool) {
  const args = {
    pwHash: pwHash,
  };
  const callArgs = {
    contract,
    method: 'authenticate',
    args: util.usc(args)
  }
  const result = yield call(admin, callArgs, { config });
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
