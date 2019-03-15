const IdHolder = artifacts.require("IdHolder");
var aesjs = require('aes-js');

// An example 128-bit key (16 bytes * 8 bits/byte = 128 bits)
const encryptionKey = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];

function getEncryptedField(rawField) {
    // Convert text to bytes
    const textBytes = aesjs.utils.utf8.toBytes(rawField);
    
    // The counter is optional, and if omitted will begin at 1
    const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(5));
    const encryptedBytes = aesCtr.encrypt(textBytes);
    
    // To print or store the binary data, you may convert it to hex
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

    return encryptedHex;
}

function getDecryptedField(encryptedField) {    
    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs.utils.hex.toBytes(encryptedField);
    
    // The counter mode of operation maintains internal state, so to
    // decrypt a new instance must be instantiated.
    var aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(5));
    var decryptedBytes = aesCtr.decrypt(encryptedBytes);
    
    // Convert our bytes back into text
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    return decryptedText;
}

function getInputData(key, rawFields) {
    let encryptedFields = [];
    let hashedFields = [];
    const salt = "salt";
    for (const field in rawFields) {
        const fieldValue = rawFields[field];
    
        const encryptedFieldValue = getEncryptedField(fieldValue);
        encryptedFields.push(encryptedFieldValue);
    
        const hashedField = web3.utils.soliditySha3(fieldValue + salt);
        hashedFields.push(hashedField);
    }
    return {key, salt, rawFields, encryptedFields, hashedFields};
}

const idEntry1 = getInputData(42, {Type: "passport", Country: "Russia", Id: "RU123456", FirstName: "Ivan", LastName: "Ivanov"});
const idEntry2 = getInputData(43, {Type: "passport", Country: "Russia", Id: "RU123457", FirstName: "Ivan", LastName: "Petrov"});


contract('IdHolder', (accounts) => {
    
    it('test add id', async () => {
        const idHolderInstance = await IdHolder.deployed();

        const tx = await idHolderInstance.addId.sendTransaction(
          idEntry1.key,
          ...idEntry1.encryptedFields, 
          idEntry1.hashedFields,
          idEntry1.salt
          );

        const isId = await idHolderInstance.isId.call(idEntry1.key);

        assert.equal(isId.valueOf(), true, "isId should be true");
    });

    it('test lookUpIds', async () => {
        const idHolderInstance = await IdHolder.deployed();

        const idHashToLookUp = idEntry1.hashedFields[2];
        const lookUpTx = await idHolderInstance.lookUpIds.sendTransaction('Id', idHashToLookUp);

        const logIdLookup = lookUpTx.logs[0];
        const lookUpResultBn = logIdLookup.args.result[0];
        const lookUpResultString = lookUpResultBn.toString();

        assert.strictEqual(logIdLookup.event, "LogIdLookup", "wrong event name");
        assert.equal(lookUpResultString, idEntry1.key, "wrong key");

        const found = await idHolderInstance.IdTable(lookUpResultBn);
        const idToLookUp = idEntry1.encryptedFields[2];
        assert.strictEqual(found.Id, idToLookUp, "id does not match");
    });

    it('test multiple lookUpIds', async () => {
        const idHolderInstance = await IdHolder.deployed();

        await idHolderInstance.addId.sendTransaction(
            idEntry2.key,
            ...idEntry2.encryptedFields, 
            idEntry2.hashedFields,
            idEntry2.salt
            );

        const isIdIvanov = await idHolderInstance.isId.call(idEntry1.key);
        assert.equal(isIdIvanov.valueOf(), true, "isIdIvanov should be true");
        const isIdPetrov = await idHolderInstance.isId.call(idEntry2.key);
        assert.equal(isIdPetrov.valueOf(), true, "isIdPetrov should be true");

        const lookUpTx = await idHolderInstance.lookUpIds.sendTransaction('FirstName', idEntry1.hashedFields[3]);
        const logFirstNameLookup = lookUpTx.logs[0];
        const foundIvans = logFirstNameLookup.args.result;
        assert.strictEqual(foundIvans.length, 2, "should be 2 Ivans");

        const ivanovLookUpResultBn = foundIvans[0];
        const foundIvanov = await idHolderInstance.IdTable(ivanovLookUpResultBn);
        const foundIvanovId = getDecryptedField(foundIvanov.Id);
        assert.strictEqual(foundIvanovId, idEntry1.rawFields.Id, "should match Ivanov Id");

        const petrovLookUpResultBn = foundIvans[1];
        const foundPetrov = await idHolderInstance.IdTable(petrovLookUpResultBn);
        const foundPetrovId = getDecryptedField(foundPetrov.Id);
        assert.strictEqual(foundPetrovId, idEntry2.rawFields.Id, "should match Petrov Id");

        const lookUpLastNameTx = await idHolderInstance.lookUpIds.sendTransaction('LastName', idEntry1.hashedFields[4]);
        const logLastNameLookup = lookUpLastNameTx.logs[0];
        const foundIvanovs = logLastNameLookup.args.result;
        assert.strictEqual(foundIvanovs.length, 1, "should be 1 Ivanov");

        const ivanIvanovs = foundIvans.find(ivan => foundIvanovs.some(ivanov => ivanov.toString() == ivan.toString()));
        assert.strictEqual(ivanIvanovs.length, 1, "should be 1 Ivan Ivanov");
    });
});
