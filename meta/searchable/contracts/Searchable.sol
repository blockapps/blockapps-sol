contract Searchable {
  bool constant isSearchable = true;
  uint searchCounter;

  constructor() public {
    searchCounter = 1;
  }

  function searchable() public returns (uint) {
    return ++searchCounter;
  }
}
