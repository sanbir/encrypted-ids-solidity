pragma solidity >=0.4.25 <0.6.0;

import "./Owned.sol";

contract IdHolder is Owned {

    struct IdEntry {
        string Type;
        string Country;
        string Id;
        string FirstName;
        string LastName;
        string Salt;
    }

    event LogIdAdded(address sender, uint64 key);
    event LogIdLookup(uint64[] result);

    /**
        [key => record]
    */
    mapping (uint64 => IdEntry) public IdTable;

    /** [hash => [keys]] */
    mapping (bytes32 => uint64[]) TypeLookup;
    mapping (bytes32 => uint64[]) CountryLookup;
    mapping (bytes32 => uint64[]) IdLookup;
    mapping (bytes32 => uint64[]) FirstNameLookup;
    mapping (bytes32 => uint64[]) LastNameLookup;

    constructor() public Owned() {

    }

    /** 
        send transaction with addId to create a new record
    */
    function addId(
        uint64 key, 
        string memory Type, string memory Country, string memory Id, string memory FirstName, string memory LastName, 
        bytes32[] memory fieldHashes,
        string memory Salt)
        public
        fromOwner()
        whenNotId(key)
        whenFieldHashesLengthIsCorrect(fieldHashes) {

        IdEntry storage idEntry = IdTable[key];
        
        idEntry.Type = Type;
        idEntry.Country = Country;
        idEntry.Id = Id;
        idEntry.FirstName = FirstName;
        idEntry.LastName = LastName;
        idEntry.Salt = Salt;
        
        TypeLookup[fieldHashes[0]].push(key);
        CountryLookup[fieldHashes[1]].push(key);
        IdLookup[fieldHashes[2]].push(key);
        FirstNameLookup[fieldHashes[3]].push(key);
        LastNameLookup[fieldHashes[4]].push(key);

        IdTable[key] = idEntry;

        emit LogIdAdded(msg.sender, key);
    }

    /** 
        send transaction with lookUpIds to retrieve records (stored in LogIdLookup event payload)
     */
    function lookUpIds(string memory fieldName, bytes32 hashFieldValue) public {
        uint64[] memory keys;
        if (compareStrings(fieldName, "Type")) {
            keys = TypeLookup[hashFieldValue];
        } else if (compareStrings(fieldName, "Country")) {
            keys = CountryLookup[hashFieldValue];
        } else if (compareStrings(fieldName, "Id")) {
            keys = IdLookup[hashFieldValue];
        } else if (compareStrings(fieldName, "FirstName")) {
            keys = FirstNameLookup[hashFieldValue];
        } else if (compareStrings(fieldName, "LastName")) {
            keys = LastNameLookup[hashFieldValue];
        } else {
            keys = new uint64[](0);
        }
        
        emit LogIdLookup(keys);
    }

    function compareStrings (string memory a, string memory b) public pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function isId(uint64 key)
        public
        view
        returns(bool isIndeed) {

        return bytes(IdTable[key].Id).length > 0;
    }

    modifier whenId(uint64 Id) {
        require(isId(Id), "should be ID");
        _;
    }

    modifier whenFieldHashesLengthIsCorrect(bytes32[] memory fieldHashes) {
        require(fieldHashes.length == 5, "should be ID");
        _;
    }

    modifier whenNotId(uint64 Id) {
        require(!isId(Id), "should not be ID");
        _;
    }

    modifier whenIds(uint64 Id0, uint64 Id1) {
        require(isId(Id0) && isId(Id1), "both should be ID");
        _;
    }
}