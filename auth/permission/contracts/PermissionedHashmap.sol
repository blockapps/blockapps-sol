import "../../../collections/hashmap/contracts/UnsafeHashmap.sol";
import "../../../auth/permission/contracts/PermissionManager.sol";

/**
 * Permissioned Hashmap
 */
contract PermissionedHashmap is RestStatus, UnsafeHashmap {
  PermissionManager public permissionManager;

  constructor(address _permissionManager) public {
    permissionManager = PermissionManager(_permissionManager);
  }

  function put(string memory _key, address _value) public {
    // check permissions
    if (!permissionManager.canModifyMap(msg.sender)) return;
    // put
    return super.put(_key, _value);
  }

  function remove(string memory _key) public {
    // check permissions
    if (!permissionManager.canModifyMap(msg.sender)) return;
    // put
    return super.remove(_key);
  }
}
