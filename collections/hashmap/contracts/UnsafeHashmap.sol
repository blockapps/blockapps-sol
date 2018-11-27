import "../../../util/contracts/Util.sol";

contract UnsafeHashmap is Util {

  address[] public values;
  string[] public keys;
  bool public isIterable; // save the keys
  /*
    note on mapping to array index:
    a non existing mapping will return 0, so 0 should not be a valid value in a map,
    otherwise exists() will not work
  */
  mapping (bytes32 => uint) keyMap;

  constructor() public {
    values.length = 1; // see above note
    keys.length = 1; // see above note
    isIterable = false; // not saving keys, to conserve space
  }

  function put(string memory _key, address _value) public {
    // save the value
    keyMap[b32(_key)] = values.length;
    values.push(_value);
    // save the key if isIterable
    if (isIterable) {
      keys.push(_key);
    }
  }

  function get(string memory _key) public view returns (address) {
    uint index = keyMap[b32(_key)];
    return values[index];
  }

  function contains(string memory _key) public view returns (bool) {
    uint index = keyMap[b32(_key)];
    return values[index] != address(0);
  }

  function size() public view returns (uint) {
    return values.length -1; // not counting entry 0
  }

  function remove(string memory _key) public {
    uint index = keyMap[b32(_key)];
    if (index == 0) return;
    // remove the index mapping
    keyMap[b32(_key)] = 0;
    // remove the value
    values[index] = address(0);
    // remove the key
    if (isIterable) {
      delete keys[index];
    }
  }
}
