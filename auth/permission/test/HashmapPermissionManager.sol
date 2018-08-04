import "../../../rest/contracts/RestStatus.sol";
import "../contracts/PermissionManager.sol";

/**
* Hashmap Permission Manager - test a permissioned hashmap
*/
contract HashmapPermissionManager is PermissionManager {

  constructor(
    address _owner,
    address _master
  ) public PermissionManager(_owner, _master) {
    // grant here
    grant('admin', msg.sender, 1234);
  }

  // base function - must be overriden
  function canModifyHashmap(address _address) returns (bool) {
    uint permissions = 1234;
    return check(_address, permissions) == RestStatus.OK;
  }
}
