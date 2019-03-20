import { rest, util, importer } from 'blockapps-rest';
const { createContract, getState, call } = rest;

import { getYamlFile } from '../../util/config';
const config = getYamlFile('config.yaml');

const contractName = 'User';
const contractFilename = `${util.cwd}/${config.libPath}/auth/user/contracts/User.sol`;

async function uploadContract(admin, args) {
  const contractArgs = {
    name: contractName,
    source: await importer.combine(contractFilename),
    args: util.usc(args)
  }

  const contract = await createContract(admin, contractArgs, { config });
  // TODO: Please confirm that it is needed
  // await compileSearch(contract);
  contract.src = 'removed';
  return bind(admin, contract);
}

function bind(admin, contract) {
  contract.getState = async function () {
    return await getState(contract, { config });
  }
  contract.authenticate = async function (pwHash) {
    return await authenticate(admin, contract, pwHash);
  }
  return contract;
}

// TODO: remove if not in use
async function compileSearch(contract) {
  if (await rest.isSearchable(contract.codeHash)) {
    return;
  }
  const searchable = [contractName];
  await rest.compileSearch(searchable, contractName, contractFilename);
}

async function getUsers(addresses) { // FIXME must break to batches of 50 addresses
  const csv = util.toCsv(addresses); // generate csv string
  const results = await rest.query(`${contractName}?address=in.${csv}`);
  return results;
}

async function getUser(username) {
  return (await rest.waitQuery(`${contractName}?username=eq.${username}`, 1))[0];
}

async function getUserByAddress(address) {
  return (await rest.waitQuery(`${contractName}?address=eq.${address}`, 1))[0];
}

async function authenticate(admin, contract, pwHash) {
  // function authenticate(bytes32 _pwHash) return (bool) {
  const args = {
    pwHash: pwHash,
  };
  const callArgs = {
    contract,
    method: 'authenticate',
    args: util.usc(args)
  }
  const result = await call(admin, callArgs, { config });
  const isAuthenticated = (result[0] === true);
  return isAuthenticated;
}


export {
  uploadContract,
  bind,
  compileSearch,

  // constants
  contractName,

  // business logic
  authenticate,
  getUserByAddress,
  getUsers,
  getUser
};
