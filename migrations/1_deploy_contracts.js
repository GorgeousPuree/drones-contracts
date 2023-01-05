const Hpprs = artifacts.require("Hpprs");
const Drones = artifacts.require("Drones");
const HpprsProjectOrchestrator = artifacts.require("HpprsProjectOrchestrator");

module.exports = async function (deployer) {
    await deployer.deploy(Hpprs, 'HPPRS', 'HPPRS', [], [], [], [], 'hpprs', 'hpprs', '0xE2609354791Bf57E54B3f7F9A26b2dacBed61DA1');
    await deployer.deploy(Drones, 4);
    await deployer.deploy(HpprsProjectOrchestrator, Drones.address, Hpprs.address, 2, web3.utils.toWei(String(0.111), 'ether'), 3);
}