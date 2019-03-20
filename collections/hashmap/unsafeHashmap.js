const { rest, util, importer } = require('blockapps-rest');
const { getYamlFile } = require('../../util/config');
const { createContract, getState, call } = rest;

const config = getYamlFile('config.yaml');

const contractName = 'UnsafeHashmap'
const contractFilename = `${config.libPath}/collections/hashmap/contracts/UnsafeHashmap.sol`

function* uploadContract(admin) {
  const args = {}

  const contractArgs = {
    name: contractName,
    source: yield importer.combine(contractFilename),
    args: util.usc(args)
  }

  const contract = yield createContract(admin, contractArgs, { config })
  contract.src = 'removed'
  return bind(admin, contract)
}

function bind(admin, _contract) {
  const contract = _contract
  contract.getState = function* () {
    return yield getState(contract, { config })
  }
  // TODO: Why we are using this function which is not in use
  // contract.getStateVar = function* (args) {
  //   return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length)
  // }
  contract.put = function* (args) {
    return yield put(admin, contract, args)
  }
  contract.get = function* (args) {
    return yield get(admin, contract, args)
  }
  contract.contains = function* (args) {
    return yield contains(admin, contract, args)
  }
  contract.size = function* (args) {
    return yield size(admin, contract, args)
  }
  contract.remove = function* (args) {
    return yield remove(admin, contract, args)
  }
  return contract
}

function* put(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'put',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config })
  return result
}

function* get(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'get',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config })
  return result[0]
}

function* contains(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'contains',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config })
  return result[0] == true
}

function* size(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'size',
    args: util.usc(args)
  }

  const result = yield call(admin, callArgs, { config })
  return parseInt(result[0])
}

function* remove(admin, contract, args) {
  const callArgs = {
    contract,
    method: 'remove',
    args: util.usc(args)
  }

  yield call(admin, callArgs, { config })
}

module.exports = {
  bind,
  uploadContract,
}
