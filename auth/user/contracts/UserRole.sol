// FIX ME: This is app dependant and probably should not be in the common lib.
// FIX ME: Naybe this should not be hard coded. Allow this to be setup as part of bootstrap
contract UserRole {

    enum UserRole {
        NULL,
        ADMIN,
        TRADER
    }
}
