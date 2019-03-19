const ba = require('blockapps-rest');
const { utils, importer } = ba;
const { getYamlFile } = require('../../util/config');
const { createContract, getState, call } = ba.default;
const config = getYamlFile('config.yaml');
const logger = console

const contractName = 'PermissionManager';
const contractFilename = `./auth/permission/contracts/PermissionManager.sol`;
// TODO: do some research on getFields
// const RestStatus = rest.getFields(`./rest/contracts/RestStatus.sol`);

utils.bitmaskToEnumString = function (bitmask, bitmaskEnum) {
  const strings = []
  for (let i = 0; i < bitmaskEnum.MAX; i++) {
    const mask = (1 << i)
    if (bitmask & mask) {
      strings.push(bitmaskEnum[i])
    }
  }
  return strings
}


function* uploadContract(admin, master) {
  // NOTE: in production, the contract is created and owned by the AdminInterface
  // for testing purposes the creator is the admin user
  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: {
      _master: master.address,
      _owner: admin.address
    }
  }

  const contract = yield createContract(admin, contractArgs, { config, logger })
  contract.src = 'removed';
  return bind(admin, contract);
}

function* createPermissionsAdmin(admin, master, permissions) {
  const contract = yield uploadContract(admin, master);
  // add permission to create and modify contracts
  const args = { address: admin.address, id: admin.name, permissions: permissions };
  yield contract.grant(args);
  return contract;
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield getState(contract, { config });
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
function* grant(admin, contract, args) {
  // function grant(address _address, uint _permissions) returns (ErrorCodes) {
  const callArgs = {
    contract,
    method: 'grant',
    args: utils.usc(args)
  }

  const [restStatus, permissions] = yield call(admin, callArgs, { config });
  if (restStatus != '200') {
    throw new Error(restStatus);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: permissions
function* getPermissions(admin, contract, args) {
  // function getPermissions(address _address) returns (ErrorCodes, uint) {
  const callArgs = {
    contract,
    method: 'getPermissions',
    args: utils.usc(args)
  }

  const [restStatus, permissions] = yield call(admin, callArgs, { config });
  if (restStatus != '200') {
    throw new utils.RestError(restStatus, callArgs.method, callArgs.args);
  }
  return permissions;
}

// throws: ErrorCodes
// returns: true if permitted
function* check(admin, contract, args) {
  // function check(address _address, uint _permissions) returns (ErrorCodes) {
  const callArgs = {
    contract,
    method: 'check',
    args: utils.usc(args)
  }

  const [restStatus] = yield call(admin, callArgs, { config });
  if (restStatus != '200') {
    return false;
  }
  return true;
}

// throws: ErrorCodes
function* revoke(admin, contract, args) {
  // function revoke(address _address) returns (ErrorCodes) {
  const callArgs = {
    contract,
    method: 'revoke',
    args: utils.usc(args)
  }

  const [restStatus] = yield call(admin, callArgs, { config });
  if (restStatus != '200') {
    throw new utils.RestError(restStatus, callArgs.method, callArgs.args);
  }
  return '200';
}

// transferOwnership
function* transferOwnership(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'transferOwnership',
    args: utils.usc(args)
  }
  
  const [restStatus] = yield call(admin, callArgs, {});
  if (restStatus != RestStatus.OK) {
    throw new RestError(restStatus, method, args);
  }
  return RestStatus.OK;
}

// list
function* listPermits(admin, contract, args) {
  const { permits } = yield contract.getState()
  const permitsJson = permits.map((permit) => {
    permit.permissionsHex = Number(permit.permissions).toString(16)
    permit.strings = utils.bitmaskToEnumString(permit.permissions, args.enum)
    return permit
  })
  return permitsJson
}

function* listEvents(admin, contract, args) {
  const { eventLog } = yield contract.getState()
  const eventsJson = eventLog.map((event) => {
    event.permissionsHex = Number(event.permissions).toString(16)
    event.strings = utils.bitmaskToEnumString(event.permissions, args.enum)
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
