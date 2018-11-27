import "./User.sol";
import "../../../rest/contracts/RestStatus.sol";
import "../../../collections/hashmap/contracts/Hashmap.sol";

/**
* Interface for Gas Deal data contracts
*/

/**
* Interface for User data contracts
*/
contract UserManager is RestStatus, Util {
  // owner of the contract
  address owner;
  // users array
  Hashmap users;

  /**
  * Constructor
  */
  constructor(address _owner) public {
    owner = _owner;
    users = new Hashmap();
  }

  function exists(string memory _username) public view returns (bool) {
    return users.contains(_username);
  }

  function getUser(string memory _username) public view returns (address) {
    return users.get(_username);
  }

  function createUser(
    address _account,
    string memory _username,
    bytes32 _pwHash,
    uint _role) public returns (uint, address) {
    address ZERO = address(0);
    // only owner can execute
    if (msg.sender != owner) {
      return (RestStatus.UNAUTHORIZED, ZERO);
    }

    // name must be <= 32 bytes
    if (bytes(_username).length > 32) return (RestStatus.BAD_REQUEST, ZERO);
    if (_pwHash.length > 32) return (RestStatus.BAD_REQUEST, ZERO);
    // fail if username exists
    if (exists(_username)) return (RestStatus.BAD_REQUEST, ZERO);
    // add user
    address user = address(new User(_account, _username, _pwHash, _role));
    users.put(_username, user);
    return (RestStatus.CREATED, user);
  }

  function authenticate(string memory _username, bytes32 _pwHash) public view returns (bool) {
    // fail if username doesnt exists
    if (!exists(_username)) return (false);
    // get the user
    address a = getUser(_username);
    User user = User(a);
    return user.authenticate(_pwHash);
  }
}
