const ba = require('blockapps-rest')

const { config, util } = ba.common
const rest = ba[`rest${config.restVersion ? config.restVersion : ''}`];

const contractName = 'UnsafeHashmap'
const contractFilename = `${config.libPath}/collections/hashmap/contracts/UnsafeHashmap.sol`

function* uploadContract(admin, chainId) {
  const args = {}
  const doNotResolve = undefined;
  const txParams = undefined;
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args), doNotResolve, txParams, chainId)
  contract.src = 'removed'
  return bind(admin, contract)
}

function bind(admin, _contract, chainId) {
  const contract = _contract
  contract.getState = function* () {
    return yield rest.getState(contract, chainId)
  }
  contract.getStateVar = function* (args) {
    return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length, chainId)
  }
  contract.put = function* (args) {
    return yield put(admin, contract, args, chainId)
  }
  contract.get = function* (args) {
    return yield get(admin, contract, args, chainId)
  }
  contract.contains = function* (args) {
    return yield contains(admin, contract, args, chainId)
  }
  contract.size = function* (args) {
    return yield size(admin, contract, args, chainId)
  }
  contract.remove = function* (args) {
    return yield remove(admin, contract, args, chainId)
  }
  return contract
}

function* put(admin, contract, args, chainId) {
  rest.verbose('put', args)
  const method = 'put'
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId)
  return result
}

function* get(admin, contract, args, chainId) {
  rest.verbose('get', args)
  const method = 'get'
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId)
  return result[0]
}

function* contains(admin, contract, args, chainId) {
  rest.verbose('contains', args)
  const method = 'contains'
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId)
  return result[0] == true
}

function* size(admin, contract, args, chainId) {
  rest.verbose('size', args)
  const method = 'size'
  const value = undefined;
  const doNotResolve = undefined;
  const result = yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId)
  return parseInt(result[0])
}

function* remove(admin, contract, args, chainId) {
  rest.verbose('remove', args)
  const method = 'remove'
  const value = undefined;
  const doNotResolve = undefined;
  yield rest.callMethod(admin, contract, method, util.usc(args), value, doNotResolve, chainId)
}

module.exports = {
  bind,
  uploadContract,
}
