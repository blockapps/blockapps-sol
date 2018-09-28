const ba = require('blockapps-rest');
const rest = ba.rest;
const util = ba.common.util;
const config = ba.common.config;

const contractName = 'Hashmap';
const contractFilename = `${config.libPath}/collections/hashmap/contracts/Hashmap.sol`;

function* uploadContract(admin, chainId) {
  const args = {};
  const doNotResolve = undefined;
  const txParams = undefined;
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args), doNotResolve, txParams, chainId);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract, chainId) {
  contract.getState = function* () {
    return yield rest.getState(contract, chainId);
  }
  contract.getStateVar = function* (args) {
    return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length, chainId);
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

function* put(admin, contract, args, chainId) {
  rest.verbose('put', args);
  const method = 'put';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  return result;
}

function* get(admin, contract, args, chainId) {
  rest.verbose('get', args);
  const method = 'get';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  return result[0];
}

function* contains(admin, contract, args, chainId) {
  rest.verbose('contains', args);
  const method = 'contains';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  return result[0] == true;
}

function* size(admin, contract, args, chainId) {
  rest.verbose('size', args);
  const method = 'size';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  return parseInt(result[0]);
}

function* transferOwnership(admin, contract, args, chainId) {
  rest.verbose('transferOwnership', args);
  const method = 'transferOwnership';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
  return result[0] == true;
}

function* getOwner(admin, contract, args, chainId) {
  rest.verbose('getOwner', args);
  const method = 'getOwner';
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId);
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
