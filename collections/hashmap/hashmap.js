const { rest, util, importer } = require('blockapps-rest');
const { getYamlFile } = require('../../util/config');
const { createContract, getState, call } = rest;
const config = getYamlFile('config.yaml');

const contractName = 'Hashmap';
const contractFilename = `${config.libPath}/collections/hashmap/contracts/Hashmap.sol`;

function* uploadContract(admin) {
  const args = {};

  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: util.usc(args)
  }

  const contract = yield createContract(admin, contractArgs, { config });
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = function* () {
    return yield getState(contract, { config });
  }
  // TODO: Why we are using this function which is not in use
  // contract.getStateVar = function* (args) {
  //   return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length);
  // }
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
  const callArgs = {
    contract,
    method: 'put',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
  return result;
}

function* get(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'get',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
  return result[0];
}

function* contains(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'contains',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
  return result[0] == true;
}

function* size(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'size',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
  return parseInt(result[0]);
}

function* transferOwnership(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'transferOwnership',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
  return result[0] == true;
}

function* getOwner(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'getOwner',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config });
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
