
/**
 * User data contract
 */
contract User {
  address public account;
  string public username;
  bytes32 public pwHash;
  uint public role;

  // internal
  uint public updateCounter = 0;

  function User(address _account, string _username, bytes32 _pwHash, uint _role) {
    account = _account;
    username = _username;
    pwHash = _pwHash;
    role = _role;
    updateCounter = 1; // set update counter
  }

  function authenticate(bytes32 _pwHash) returns (bool) {
    return pwHash == _pwHash;
  }
}
