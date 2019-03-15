const IdHolder = artifacts.require("IdHolder");

module.exports = function(deployer) {
  deployer.deploy(IdHolder);
};
