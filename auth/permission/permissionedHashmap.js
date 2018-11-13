require('co-mocha')
const ba = require('blockapps-rest')

const { config, util } = ba.common
const rest = ba['rest' + config.restVersion ? config.restVersion : ''];

const contractName = 'PermissionedHashmap'
const contractFilename = `${config.libPath}/auth/permission/contracts/PermissionedHashmap.sol`

function* uploadContract(admin, permissionManager) {
  const args = { permissionManager: permissionManager.address }
  const contract = yield rest.uploadContract(admin, contractName, contractFilename, util.usc(args))
  contract.src = 'removed'
  return bind(admin, contract)
}

function bind(admin, _contract) {
  const contract = _contract
  contract.getState = function* () {
    return yield rest.getState(contract)
  }
  contract.getStateVar = function* (args) {
    return yield rest.getStateVar(contract, args.name, args.count, args.offset, args.length)
  }
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

function bindAddress(admin, address) {
  const contract = {
    name: contractName,
    address,
  }
  return bind(admin, contract)
}

function* put(admin, contract, args) {
  rest.verbose('put', args)
  const method = 'put'
  const result = yield rest.callMethod(admin, contract, method, util.usc(args))
  return result
}

function* get(admin, contract, args) {
  rest.verbose('get', args)
  const method = 'get'
  const result = yield rest.callMethod(admin, contract, method, util.usc(args))
  return result[0]
}

function* contains(admin, contract, args) {
  rest.verbose('contains', args)
  const method = 'contains'
  const result = yield rest.callMethod(admin, contract, method, util.usc(args))
  return result[0] == true
}

function* size(admin, contract, args) {
  rest.verbose('size', args)
  const method = 'size'
  const result = yield rest.callMethod(admin, contract, method, util.usc(args))
  return parseInt(result[0], 10)
}

function* remove(admin, contract, args) {
  rest.verbose('remove', args)
  const method = 'remove'
  yield rest.callMethod(admin, contract, method, util.usc(args))
}

module.exports = {
  bind,
  bindAddress,
  uploadContract,
}
