import { rest, util, importer } from 'blockapps-rest';
const { createContract, getState, call } = rest;

import config from '../../util/load.config';
const contractName = 'Hashmap';
const contractFilename = `${config.libPath}/collections/hashmap/contracts/Hashmap.sol`;

const options = { config };

async function uploadContract(admin, options) {
  const args = {};

  const contractArgs = {
    name: contractName,
    source: await importer.combine(contractFilename),
    args: util.usc(args)
  }

  const contract = await createContract(admin, contractArgs, options);
  contract.src = 'removed';
  return bind(admin, contract, options);
}

function bind(admin, _contract, defaultOptions) {
  const contract = { ..._contract }
  contract.getState = async function (options = defaultOptions) {
    return await getState(admin, contract, options);
  }
  contract.put = async function (args, options = defaultOptions) {
    return await put(admin, contract, args, options);
  }
  contract.get = async function (args, options = defaultOptions) {
    return await get(admin, contract, args, options);
  }
  contract.getArray = async function (args, options = defaultOptions) {
    return await getArray(admin, contract, args, options);
  }
  contract.getValues = async function (options = defaultOptions) {
    return await getValues(admin, contract, options);
  }
  contract.contains = async function (args, options = defaultOptions) {
    return await contains(admin, contract, args, options);
  }
  contract.size = async function (args, options = defaultOptions) {
    return await size(admin, contract, args, options);
  }
  contract.transferOwnership = async function (args, options = defaultOptions) {
    return await transferOwnership(admin, contract, args, options);
  }
  contract.getOwner = async function (args, options = defaultOptions) {
    return await getOwner(admin, contract, args, options);
  }

  return contract;
}

function bindAddress(admin, address, options) {
  const contract = {
    name: contractName,
    address,
  }
  return bind(admin, contract, options)
}

async function put(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'put',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return result;
}

async function get(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'get',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return result[0];
}

async function contains(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'contains',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return result[0] == true;
}

async function size(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'size',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return parseInt(result[0]);
}

async function transferOwnership(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'transferOwnership',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return result[0] == true;
}

async function getOwner(admin, contract, args, options) {
  const callArgs = {
    contract,
    method: 'getOwner',
    args: util.usc(args)
  }

  const result = await call(admin, callArgs, options);
  return result[0];
}

/**
 * @see https://blockapps.atlassian.net/browse/SER-115
 * blockapps-rest.getArray() mutates the options object
 */

async function getArray(admin, contract, args, _options) {
  const options = { ..._options } // SER-115 workaround
  return await rest.getArray(admin, contract, args.name, options);
}

async function getValues(admin, contract, options) {
  const args = { name: 'values' };
  const values = await getArray(admin, contract, args, options);
  const tail = values.slice(1);
  return tail;
}

export {
  uploadContract,
  bind,
  bindAddress,
  put,
  get,
  contains,
  size,
  transferOwnership,
  getOwner,
};
