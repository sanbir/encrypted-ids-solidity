pragma solidity >=0.4.25 <0.6.0;

contract Owned {
    address owner;

    event LogOwnerSet(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    function setOwner(address newOwner) public fromOwner() returns(bool) {
        require(newOwner != owner, "should not be old owner");
        require(newOwner != address(0x0), "should not be empty");
        emit LogOwnerSet(owner, newOwner);
        owner = newOwner;
        return true;
    }

    function getOwner() public view returns(address) {
        return owner;
    }

    modifier fromOwner() {
        require(owner == msg.sender, "sender should be owner");
        _;
    }
}