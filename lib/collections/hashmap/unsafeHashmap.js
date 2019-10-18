
import { rest, util, importer } from 'blockapps-rest';
const { createContract, getState, call } = rest;

import config from '../../util/load.config';
const contractName = 'UnsafeHashmap'
const contractFilename = `${config.libPath}/collections/hashmap/contracts/UnsafeHashmap.sol`

async function uploadContract(admin, options) {
  const args = {}

  const contractArgs = {
    name: contractName,
    source: await importer.combine(contractFilename),
    args: util.usc(args),
  }

  const contract = await createContract(admin, contractArgs, options)
  contract.src = 'removed'
  return bind(admin, contract, options)
}

function bind(admin, _contract, defaultOptions) {
  const contract = { ..._contract }
  contract.getState = async function (options = defaultOptions) {
    return await getState(admin, contract, options)
  }
  contract.put = async function (args, options = defaultOptions) {
    return await put(admin, contract, args, options)
  }
  contract.get = async function (args, options = defaultOptions) {
    return await get(admin, contract, args, options)
  }
  contract.contains = async function (args, options = defaultOptions) {
    return await contains(admin, contract, args, options)
  }
  contract.size = async function (args, options = defaultOptions) {
    return await size(admin, contract, args, options)
  }
  contract.remove = async function (args, options = defaultOptions) {
    return await remove(admin, contract, args, options)
  }
  return contract
}

async function put(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'put',
    args: util.usc(args),
  }

  const result = await call(admin, callArgs, options)
  return result
}

async function get(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'get',
    args: util.usc(args),
  }

  const result = await call(admin, callArgs, options)
  return result[0]
}

async function contains(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'contains',
    args: util.usc(args),
  }

  const result = await call(admin, callArgs, options)
  return result[0] == true
}

async function size(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'size',
    args: util.usc(args),
  }

  const result = await call(admin, callArgs, options)
  return parseInt(result[0])
}

async function remove(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'remove',
    args: util.usc(args),
  }

  await call(admin, callArgs, options)
}

export {
  bind,
  uploadContract,
}
