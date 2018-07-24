import "../../../rest/contracts/RestStatus.sol";

/**
* Permission Manager for all
*/
contract PermissionManager is RestStatus {
  // master account
  address master;
  // owner account
  address owner;

  // addresses and their permissions
  struct Permit {
    string id;
    address adrs;
    uint permissions;
  }
  Permit[] permits;

  // event log entry
  struct EventLogEntry {
    // meta
    address msgSender;
    uint blockTimestamp;
    // event
    address adrs;
    uint permissions;
    uint result;
  }

  // event log
  EventLogEntry[] eventLog;

  /*
    note on mapping to array index:
    a non existing mapping will return 0, so 0 should not be a valid value in a map,
    otherwise exists() will not work
  */
  mapping (address => uint) addressToIndexMap;

  /**
  * Constructor
  */
  function PermissionManager(address _owner, address _master) {
    owner = _owner;
    master = _master;
    permits.length = 1; // see above note
  }

  function transferOwnership(address _newOwner) public returns (uint) {
    // only the master can transfer ownership
    if (msg.sender != master) {
      return (RestStatus.UNAUTHORIZED);
    }

    owner = _newOwner;
    return (RestStatus.OK);
  }

  function exists(address _address) public returns (bool) {
    return addressToIndexMap[_address] != 0;
  }

  function grant(string _id, address _address, uint _permissions) public returns (uint, uint) {
    // authorize owner
    if (msg.sender != owner) {
      return (RestStatus.UNAUTHORIZED, 0);
    }
    uint index;
    Permit memory permit;
    // exists ?
    if (!exists(_address)) {
      // if new - add permit with initial permissions
      index = permits.length;
      addressToIndexMap[_address] = index;
      permit = Permit(_id, _address, _permissions);
      permits.push(permit);
    } else {
      // if exists - update
      index = addressToIndexMap[_address];
      permit = permits[index];
      permit.permissions |= _permissions;
      permits[index] = permit;
    }
    return (RestStatus.OK, permit.permissions);
  }

  function revoke(address _address) public returns (uint) {
    // authorize owner
    if (msg.sender != owner) {
      return (RestStatus.UNAUTHORIZED);
    }
    // error if address doesnt exists
    if (!exists(_address)) {
      return (RestStatus.BAD_REQUEST);
    }
    // revoke
    uint index = addressToIndexMap[_address];
    Permit permit = permits[index];
    permit.permissions = 0;
    permits[index] = permit;
    return (RestStatus.OK);
  }

  function getPermissions(address _address) public constant returns (uint, uint) {
    // error if address doesnt exists
    if (!exists(_address)) {
      return (RestStatus.NOT_FOUND, 0);
    }
    uint index = addressToIndexMap[_address];
    return (RestStatus.OK, permits[index].permissions);
  }

  function checkImpl(address _address, uint _permissions) public constant returns (uint) {
    // error if address doesnt exists
    if (!exists(_address)) {
      return (RestStatus.NOT_FOUND);
    }
    // check
    uint index = addressToIndexMap[_address];
    Permit permit = permits[index];
    if (permit.permissions & _permissions == 0) {
      return (RestStatus.UNAUTHORIZED);
    }
    return (RestStatus.OK);
  }

  function check(address _address, uint _permissions) public constant returns (uint) {
    uint result = checkImpl(_address, _permissions);
    EventLogEntry memory eventLogEntry = EventLogEntry(
      // meta
      msg.sender,
      block.timestamp,
      // event
      _address,
      _permissions,
      result
    );
    eventLog.push(eventLogEntry);
    return (result);
  }


}
