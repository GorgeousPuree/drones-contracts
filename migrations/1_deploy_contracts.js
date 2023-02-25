const Hpprs = artifacts.require("Hpprs");
const PckrDrones = artifacts.require("PckrDrones");
const HpprsProjectOrchestrator = artifacts.require("PckrDronesOrchestrator");

module.exports = async function (deployer) {
    await deployer.deploy(Hpprs, 'HPPRS', 'HPPRS', [], [], [], [], 'hpprs', 'hpprs', '0xE2609354791Bf57E54B3f7F9A26b2dacBed61DA1');
    await deployer.deploy(PckrDrones, 10);
    await deployer.deploy(HpprsProjectOrchestrator,
        PckrDrones.address,
        Hpprs.address,
        '0x9c01B4EE5f92f9E3839cf017650921C0B9Cb0DBf',
        web3.utils.toWei(String(0.04), 'ether'),
        web3.utils.toWei(String(0.05), 'ether'),
        2,
        10,
        3,
        1
    );
}