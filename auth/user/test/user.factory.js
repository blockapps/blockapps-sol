const ba = require('blockapps-rest');
const util = ba.common.util;

const createUserArgs = function(accountAddress, uid, role=1) {
  const username = `User_${uid}`
  const pwHash = util.toBytes32(''+uid); // FIXME this is not a hash

  // function User(address _account, string _username, bytes32 _pwHash, uint _role)
  const args = {
    account: accountAddress,
    username: username,
    pwHash: pwHash,
    role: role,
  };
  return args;
}

module.exports = {
  createUserArgs: createUserArgs,
}
