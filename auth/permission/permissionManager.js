const ba = require('blockapps-rest');
const util = ba.common.util;
const BigNumber = ba.common.BigNumber;
const config = ba.common.config;
const rest = ba[`rest${config.restVersion ? config.restVersion : ''}`];

const contractName = 'PermissionManager';
const contractFilename = `${config.libPath}/auth/permission/contracts/PermissionManager.sol`;
const RestStatus = rest.getFields(`${config.libPath}/rest/contracts/RestStatus.sol`);

util.bitmaskToEnumString = function (bitmask, bitmaskEnum) {
  const strings = []
  for (let i = 0; i < bitmaskEnum.MAX; i++) {
    const mask = (1 << i)
    if (bitmask & mask) {
      strings.push(bitmaskEnum[i])
    }
  }
  return strings
}


function* uploadContract(admin, master, chainId) {
  // NOTE: in production, the contract is created and owned by the AdminInterface
  // for testing purposes the creator is the admin user
  const args = {
    owner: admin.address,
    master: master.address,
  }
  const doNotResolve = undefined;
  const txParams = undefined;
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args), doNotResolve, txParams, chainId);
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

function bind(admin, contract, chainId) {
  contract.getState = function* () {
    return yield rest.getState(contract, chainId);
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
  contract.listPermits = function* (args) {
    return yield listPermits(admin, contract, args);
  }
  contract.listEvents = function* (args) {
    return yield listEvents(admin, contract, args);
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
function* grant(admin, contract, args, chainId) {
  rest.verbose('grant', args);
  // function grant(address _address, uint _permissions) returns (ErrorCodes) {
  const method = 'grant';
  const value = undefined;
  const doNotResolve = undefined;
  const [restStatus, permissions] = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  if (restStatus != RestStatus.OK) {
    throw new Error(restStatus);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: permissions
function* getPermissions(admin, contract, args, chainId) {
  rest.verbose('getPermissions', args);
  // function getPermissions(address _address) returns (ErrorCodes, uint) {
  const method = 'getPermissions';
  const value = undefined;
  const doNotResolve = undefined;
  const [restStatus, permissions] = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: true if permitted
function* check(admin, contract, args, chainId) {
  rest.verbose('check', args);
  // function check(address _address, uint _permissions) returns (ErrorCodes) {
  const method = 'check';
  const value = undefined;
  const doNotResolve = undefined;
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  if (restStatus != RestStatus.OK) {
    return false;
  }
  return true;
}

// throws: ErrorCodes
function* revoke(admin, contract, args, chainId) {
  rest.verbose('revoke', args);
  // function revoke(address _address) returns (ErrorCodes) {
  const method = 'revoke';
  const value = undefined;
  const doNotResolve = undefined;
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return RestStatus.OK;
}

// transferOwnership
function* transferOwnership(admin, contract, args, chainId) {
  const method = "transferOwnership";
  const value = undefined;
  const doNotResolve = undefined;
  const [restStatus] = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  if (restStatus != RestStatus.OK) {
    throw new rest.RestError(restStatus, method, args);
  }
  return RestStatus.OK;
}

// list
function* listPermits(admin, contract, args) {
  const { permits } = yield contract.getState()
  const permitsJson = permits.map((permit) => {
    permit.permissionsHex = Number(permit.permissions).toString(16)
    permit.strings = util.bitmaskToEnumString(permit.permissions, args.enum)
    return permit
  })
  return permitsJson
}

function* listEvents(admin, contract, args) {
  const { eventLog } = yield contract.getState()
  const eventsJson = eventLog.map((event) => {
    event.permissionsHex = Number(event.permissions).toString(16)
    event.strings = util.bitmaskToEnumString(event.permissions, args.enum)
    return event
  })
  return eventsJson
}

module.exports = {
  bind,
  bindAddress,
  uploadContract,
  createPermissionsAdmin,
  contractName,
};
