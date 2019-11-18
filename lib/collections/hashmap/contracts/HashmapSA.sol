import "./UnsafeHashmapSA.sol";

/**
 * The Hashmap contract maintains a permissioned implementation
 * of an UnsafeHashmapSA. All function calls are restricted to the
 * owner of the contract.
 */
contract HashmapSA is UnsafeHashmapSA {
  address public owner;

  constructor() {
    owner = msg.sender;
  }

  function put(string _stringKey, address _addressKey, address _value) public {
    if (msg.sender != owner) {
      return;
    }

    return super.put(_stringKey, _addressKey, _value);
  }

  /**
   * @dev        If owner or manager contract is calling function, it will get the value at a key
   *
   * @param      _stringKey    The string part of the key
   *
   * @param      _addressKey    The address part of the key
   *
   * @return     returns the address of the contract value
   */
  function get(string _stringKey, address _addressKey) public constant returns (address) {
    if (msg.sender != owner) {
      return address(0);
    }

    return super.get(_stringKey, _addressKey);
  }

  /**
   * @dev        If owner or manager contract is calling function, it will check existence of a key/value
   *
   * @param      _stringKey    The string part of the key
   *
   * @param      _addressKey    The address part of the key
   *
   * @return     returns a boolean of containment
   */
  function contains(string _stringKey, address _addressKey) public constant returns (bool) {
    if (msg.sender != owner) {
      return false;
    }

    return super.contains(_stringKey, _addressKey);
  }

  /**
   * @dev        If owner or manager contract is calling function, it will return the size of hashmap
   *
   * @return     returns size of hashmap
   */
  function size() public constant returns (uint) {
    if (msg.sender != owner) {
      return 0;
    }

    return super.size();
  }

  /**
   * @dev        Allows the current owner to transfer control of the contract to a newOwner.
   *
   * @param      _newOwner   The address to transfer ownership to.
   *
   * @return     returns status of ownership transfer
   */
  function transferOwnership(address _newOwner) public returns (bool) {
    if (msg.sender != owner) {
      return false;
    }

    owner = _newOwner;
    return true;
  }

  function getOwner() public constant returns (address) {
    return owner;
  }
}
