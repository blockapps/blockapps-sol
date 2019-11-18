import "../../../util/contracts/Util.sol";

contract UnsafeHashmapSA is Util {

  struct SAPair {
    string stringKey;
    address addressKey;
  }

  address[] public values;
  SAPair[] public keys;
  bool public isIterable; // save the keys
  /*
    note on mapping to array index:
    a non existing mapping will return 0, so 0 should not be a valid value in a map,
    otherwise exists() will not work
  */
  mapping (bytes32 => uint) keyMap;

  constructor() {
    values.length = 1; // see above note
    keys.length = 1; // see above note
    isIterable = false; // not saving keys, to conserve space
  }

  function put(string _stringKey, address _addressKey, address _value) public {
    // save the value
    keyMap[keccak256(_stringKey, _addressKey)] = values.length;
    values.push(_value);
    // save the key if isIterable
    if (isIterable) {
      keys.push(SAPair(_stringKey, _addressKey));
    }
  }

  function get(string _stringKey, address _addressKey) public constant returns (address) {
    uint index = keyMap[keccak256(_stringKey, _addressKey)];
    return values[index];
  }

  function contains(string _stringKey, address _addressKey) public constant returns (bool) {
    uint index = keyMap[keccak256(_stringKey, _addressKey)];
    return values[index] != 0;
  }

  function size() public constant returns (uint) {
    return values.length -1; // not counting entry 0
  }

  function remove(string _stringKey, address _addressKey) public {
    bytes32 hash = keccak256(_stringKey, _addressKey);
    uint index = keyMap[hash];
    if (index == 0) return;
    // remove the index mapping
    keyMap[hash] = 0;
    // remove the value
    values[index] = 0;
    // remove the key
    if (isIterable) {
      delete keys[index];
    }
  }
}
