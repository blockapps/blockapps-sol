/**
 * Util contract
 */
contract Util {
  function stringToBytes32(string memory source) returns (bytes32 result) {
      assembly {
          result := mload(add(source, 32))
      }
  }

  function b32(string memory source) returns (bytes32) {
    return stringToBytes32(source);
  }

  function uintToString(uint v) constant returns (string str) {
    uint maxlength = 100;
    bytes memory reversed = new bytes(maxlength);
    uint i = 0;
    while (v != 0) {
      uint remainder = v % 10;
      v = v / 10;
      reversed[i++] = byte(48 + remainder);
    }
    bytes memory s = new bytes(i + 1);
    for (uint j = 0; j <= i; j++) {
      s[j] = reversed[i - j];
    }
    str = string(s);
  }
}
