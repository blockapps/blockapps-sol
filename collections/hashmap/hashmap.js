const ba = require('blockapps-rest');
const util = ba.common.util;
const config = ba.common.config;
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];

const contractName = 'Hashmap';
const contractFilename = `${config.libPath}/collections/hashmap/contracts/Hashmap.sol`;

function* uploadContract(admin) {
  const args = {};
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args));
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield rest.getState(contract);
  }
  contract.getStateVar = function* (args) {
    return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length);
  }
  contract.put = function* (args) {
    return yield put(admin, contract, args);
  }
  contract.get = function* (args) {
    return yield get(admin, contract, args);
  }
  contract.contains = function* (args) {
    return yield contains(admin, contract, args);
  }
  contract.size = function* (args) {
    return yield size(admin, contract, args);
  }
  contract.transferOwnership = function* (args) {
    return yield transferOwnership(admin, contract, args);
  }
  contract.getOwner = function* (args) {
    return yield getOwner(admin, contract, args);
  }

  return contract;
}

function* put(admin, contract, args) {
  rest.verbose('put', args);
  const method = 'put';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return result;
}

function* get(admin, contract, args) {
  rest.verbose('get', args);
  const method = 'get';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return result[0];
}

function* contains(admin, contract, args) {
  rest.verbose('contains', args);
  const method = 'contains';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return result[0] == true;
}

function* size(admin, contract, args) {
  rest.verbose('size', args);
  const method = 'size';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return parseInt(result[0]);
}

function* transferOwnership(admin, contract, args) {
  rest.verbose('transferOwnership', args);
  const method = 'transferOwnership';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return result[0] == true;
}

function* getOwner(admin, contract, args) {
  rest.verbose('getOwner', args);
  const method = 'getOwner';
  const result = yield rest.callMethod(admin, contract, method, util.usc(args));
  return result[0];
}

module.exports = {
  bind: bind,
  uploadContract: uploadContract,
  put: put,
  get: get,
  contains: contains,
  size: size,
  transferOwnership: transferOwnership,
  getOwner: getOwner,
};
