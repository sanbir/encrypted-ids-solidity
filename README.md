### run

```npm install```

```npm run test```
___

The main Solidity contract is ```./contracts/IdHolder.sol```. Examples of using the contract are in JavaScript tests ```./test/runTest.js```.

The contract is lightweight. It only stores data without encryption/hashing functionality. All the required business logic can be implemented outside the contract in order to preserve gas. 

Decryption is only shown for demontration. It won't be so accessible in a real-world app.

The main implementation idea: use blind indexing. For each field we have a dedicated lookup mapping (e.g. TypeLookup).

For lookup, the user will 

1. take a hash of the field (e.g. LastName) with the salt (it is the same here for simplicity, will be randomly generated and stored for each field in the real world)
2. send a transaction to lookUpIds with field name (e.g. LastName) and hash
3. read record keys from LogIdLookup event args
4. read records from IdTable by keys
5. do the joins (e.g. Ivan + Ivanov) in the application.
