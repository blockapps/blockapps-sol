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
    uint eventType;
    string id;
    address adrs;
    uint permissions;
    uint result;
  }

  // event log type
  enum EventLogType { // TODO expose -LS
    NULL,
    GRANT,
    REVOKE,
    CHECK
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
  constructor(address _owner, address _master) public {
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

  function exists(address _address) public view returns (bool) {
    return addressToIndexMap[_address] != 0;
  }

  function getPermissions(address _address) public view returns (uint, uint) {
    // error if address doesnt exists
    if (!exists(_address)) {
      return (RestStatus.NOT_FOUND, 0);
    }
    // got permissions
    uint index = addressToIndexMap[_address];
    return (RestStatus.OK, permits[index].permissions);
  }


  function _grant(string memory _id, address _address, uint _permissions) private returns (uint, uint) {
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

  function grant(string memory _id, address _address, uint _permissions) public returns (uint, uint) {
    uint restStatus;
    uint permitPermissions;
    // call grant
    (restStatus, permitPermissions) = _grant(_id, _address, _permissions);
    // log the results
    EventLogEntry memory eventLogEntry = EventLogEntry(
    // meta
      msg.sender,
      block.timestamp,
    // event
      uint(EventLogType.GRANT),
      _id,
      _address,
      _permissions,
      restStatus
    );
    eventLog.push(eventLogEntry);
    return (restStatus, permitPermissions);
  }

  function _revoke(address _address) private returns (uint) {
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
    Permit storage permit = permits[index];
    permit.permissions = 0;
    permits[index] = permit;
    return (RestStatus.OK);
  }

  function revoke(address _address) public returns (uint) {
    // call revoke
    uint result = _revoke(_address);
    // log the result
    EventLogEntry memory eventLogEntry = EventLogEntry(
    // meta
      msg.sender,
      block.timestamp,
    // event
      uint(EventLogType.REVOKE),
      '',
      _address,
      0,
      result
    );
    eventLog.push(eventLogEntry);
    return (result);
  }

  function _check(address _address, uint _permissions) private view returns (uint) {
    // error if address doesnt exists
    if (!exists(_address)) {
      return (RestStatus.NOT_FOUND);
    }
    // check
    uint index = addressToIndexMap[_address];
    Permit storage permit = permits[index];
    if (permit.permissions & _permissions != _permissions) {
      return (RestStatus.UNAUTHORIZED);
    }
    return (RestStatus.OK);
  }

  function check(address _address, uint _permissions) public returns (uint) {
    // call check
    uint result = _check(_address, _permissions);
    // log the result
    if (result != RestStatus.OK) {
      EventLogEntry memory eventLogEntry = EventLogEntry(
      // meta
        msg.sender,
        block.timestamp,
      // event
        uint(EventLogType.CHECK),
        '',
        _address,
        _permissions,
        result
      );
      eventLog.push(eventLogEntry);
    }
    return (result);
  }

  // STUB base function - must be overriden
  function canModifyMap(address) public returns (bool) {
    return false;
  }
}
