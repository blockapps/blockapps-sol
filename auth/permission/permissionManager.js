const ba = require('blockapps-rest');
const rest = ba.rest;
const util = ba.common.util;
const BigNumber = ba.common.BigNumber;
const config = ba.common.config;

const contractName = 'PermissionManager';
const contractFilename = `${config.libPath}/auth/permission/contracts/PermissionManager.sol`;
const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);


function* uploadContract(admin, master) {
  // NOTE: in production, the contract is created and owned by the AdminInterface
  // for testing purposes the creator is the admin user
  const args = {
    owner: admin.address,
    master: master.address,
  }
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args));
  contract.src = 'removed';
  return bind(admin, contract);
}

function* createPermissionsAdmin(admin, master, permissions) {
  const contract = yield uploadContract(admin, master);
  // add permission to create and modify contracts
  const args = {address: admin.address, id: admin.name, permissions: permissions};
  yield contract.grant(args);
  return contract;
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield rest.getState(contract);
  }
  contract.grant = function* (args) {
    return yield grant(admin, contract, args);
  }
  contract.getPermissions = function* (args) {
    return yield getPermissions(admin, contract, args);
  }
  contract.revoke = function* (args) {
    return yield revoke(admin, contract, args);
  }
  contract.check = function* (args) {
    return yield check(admin, contract, args);
  }
  contract.transferOwnership = function* (args) {
    return yield transferOwnership(admin, contract, args);
  }
  return contract;
}

function bindAddress(admin, address) {
  const contract = {
    name: contractName,
    address,
  }
  return bind(admin, contract)
}

// throws: ErrorCodes
// returns: updated permissions
function* grant(admin, contract, args) {
  rest.verbose('grant', args);
  // function grant(address _address, uint _permissions) returns (ErrorCodes) {
  const method = 'grant';
  const [restStatus, permissions] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.OK) {
    throw new Error(restStatus);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: permissions
function* getPermissions(admin, contract, args) {
  rest.verbose('getPermissions', args);
  // function getPermissions(address _address) returns (ErrorCodes, uint) {
  const method = 'getPermissions';
  const [restStatus, permissions] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: true if permitted
function* check(admin, contract, args) {
  rest.verbose('check', args);
  // function check(address _address, uint _permissions) returns (ErrorCodes) {
  const method = 'check';
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.OK) {
    return false;
  }
  return true;
}

// throws: ErrorCodes
function* revoke(admin, contract, args) {
  rest.verbose('revoke', args);
  // function revoke(address _address) returns (ErrorCodes) {
  const method = 'revoke';
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return RestStatus.OK;
}

// transferOwnership
function* transferOwnership(admin, contract, args) {
  const method = "transferOwnership";
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args));
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return RestStatus.OK;
}

module.exports = {
  bind,
  bindAddress,
  uploadContract,
  createPermissionsAdmin,
  contractName,
};
