### Version: 1.2.0

#### Minor upgrades
* `PermissionedHashmap` added. 
  * Takes an implementation _PermissionManager_ on construction
  * `put()` and `remove()` require `canModifyMap()` to be provided by the _PermissionManager_
  
------------
### Version: 1.1.1

#### Minor upgrades
* `RestStatus` added the following codes: 
   * `504` GATEWAY_TIMEOUT
   * `502` BAD_GATEWAY

------------

### Version: 1.1.0

#### Minor upgrades
* `PermissionManager` now logs the following events: 
   * `grant` permissions to an address
   * `revoke` permissions of an address
   * `check` that resulted an _Unauthorized_ response
* `Hashmap` now supports `remove`
   * Note: the removed key will not exist anymore, however, the address array is not compacted. As a result, `size` will reflect the number of active and deleted entries.

------------

### Version: 0.0.0
* semver https://semver.org/

#### Major upgrades
* Backwards Incompatibilities (Watch out for this one !!)
* Link to requirements and client facing documents
* semver X.0.0

#### Minor upgrades
* New Features
* Performance
* semver 0.X.0

#### Issues Fixed
* Bugs, yes we used to have them
* semver 0.0.X

#### Known Issues
* Whats broken, known workaround
