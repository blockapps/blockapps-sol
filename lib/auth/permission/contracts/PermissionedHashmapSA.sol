import "../../../collections/hashmap/contracts/UnsafeHashmapSA.sol";
import "../../../auth/permission/contracts/PermissionManager.sol";

/**
 * Permissioned Hashmap
 */
contract PermissionedHashmap is RestStatus, UnsafeHashmapSA {
  PermissionManager public permissionManager;

  constructor(address _permissionManager) {
    permissionManager = PermissionManager(_permissionManager);
  }

  function put(string _stringKey, address _addressKey, address _value) public {
    // check permissions
    if (!permissionManager.canModifyMap(msg.sender)) return;
    // put
    return super.put(_stringKey, _addressKey, _value);
  }

  function remove(string _stringKey, address _addressKey) public {
    // check permissions
    if (!permissionManager.canModifyMap(msg.sender)) return;
    // put
    return super.remove(_stringKey, _addressKey);
  }
}
