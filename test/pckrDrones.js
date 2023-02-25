const Hpprs = artifacts.require("Hpprs");
const PckrDrones = artifacts.require("PckrDrones");
const HpprsProjectOrchestrator = artifacts.require("PckrDronesOrchestrator");

contract("PckrDronesOrchestrator", (accounts) => {
    let hpprs = null;
    let drones = null;
    let hpprsProjectOrchestrator = null;

    before(async () => {
        hpprs = await Hpprs.deployed();
        drones = await PckrDrones.deployed();
        hpprsProjectOrchestrator = await HpprsProjectOrchestrator.deployed();

        await hpprs.setApprovalForAll(hpprsProjectOrchestrator.address, true);
        await hpprs.setApprovalForAll(hpprsProjectOrchestrator.address, true, {from: accounts[1]});
        await drones.addController(hpprsProjectOrchestrator.address);

        for (let i = 0; i < 10; i++) {
            await hpprs.mintNextTokenTo(accounts[0]);
        }

        for (let i = 0; i < 10; i++) {
            await hpprs.mintNextTokenTo(accounts[1]);
        }
    })

    // it('Set drones state', async () => {
    //     await hpprsProjectOrchestrator.setDronesState(2);
    // })

    // it('Check mint gas', async () => {
    //     const gasEstimate = await hpprsProjectOrchestrator.mintDrone.estimateGas(3, {value: web3.utils.toWei(String(0.1), 'ether')});
    //     console.log(gasEstimate);
    //     const gasPrice = web3.eth.getGasPrice();
    //     console.log()
    // })
    //
    // it('Check premint gas', async () => {
    //     await hpprsProjectOrchestrator.setSaleState(0);
    //     const gasEstimate = await hpprsProjectOrchestrator.preMintDrone.estimateGas(3, '0x1eaab5cd42aab991cbb056aa7cb0cfca667a52665f35c16f03772ab462c919816f96a8762f82bbb326ed1b3e3ea6e534117bc97a73a323beff081f48c6c9b0911b', {value: web3.utils.toWei(String(0.08), 'ether')});
    //     const gasPrice = web3.eth.getGasPrice();
    //     console.log(gasEstimate);
    // })

    it('Check hpprs balance', async () => {
        let userTokenNumber = (await hpprs.balanceOf(accounts[0])).toNumber();
        assert.equal(userTokenNumber, 10, "User must have 10 hpprs")
    })

    it('Check drones state', async () => {
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 3, "Drones state must be set to STOPPED.")
    })

    it('Try to mint drone', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.05), 'ether')})
        } catch (e) {
            assert(e.message.includes('Sale is closed'));
            return;
        }

        assert(false);
    })

    it('Try to trade drone', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1, 2])
        } catch (e) {
            assert(e.message.includes('Trade is closed'));
            return;
        }

        assert(false);
    })

    it('Turn on trades', async () => {
        await hpprsProjectOrchestrator.setDronesState(0)
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 0, "Drones state must be set to TRADE_ONLY.")
    })

    it('Trade using not my hoppers', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1, 2], {from: accounts[1]});
        } catch (e) {
            assert(e.message.includes("Not HPPR owner"));
            return;
        }

        assert(false);
    })

    it('Trade', async () => {
        await hpprsProjectOrchestrator.tradeDrone([1, 2]);

        let hpprsNumber = (await hpprs.balanceOf(accounts[0])).toNumber();
        assert.equal(hpprsNumber, 8, "User must have 8 hpprs.");

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 4, "User must have 4 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 4, "1 drone must be minted.");
    })

    it('Turn on mints', async () => {
        await hpprsProjectOrchestrator.setDronesState(1)
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 1, "Drones state must be set to MINT_ONLY.")
    })

    it('Try to mint drone with wrong ETH amount', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.049), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #2', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.051), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #3', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.05), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #4', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.11), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(11, {value: web3.utils.toWei(String(0.55), 'ether')})
        } catch (e) {
            assert(e.message.includes('Limit per transaction'));
            return;
        }

        assert(false);
    })

    it('Mint', async () => {
        await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.05), 'ether')})

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 5, "User must have 5 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 5, "5 drones must be minted.");
    })

    it('Mint #2', async () => {
        await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.1), 'ether')})

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 7, "User must have 7 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 7, "7 drones must be minted.");
    })

    it('Try to exceed drones supply', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(4, {value: web3.utils.toWei(String(0.2), 'ether')})
        } catch (e) {
            assert(e.message.includes('Supply limit'));
            return;
        }

        assert(false);
    })

    it('Set new drones max supply', async () => {
        await drones.setSettings(20);
        const maxSupply = (await drones.maxSupply()).toNumber();

        assert.equal(maxSupply, 20, "Drones max supply must be equal to 20.");
    })

    it('Try to trade #2', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([3, 4, 5, 6, 7, 8]);
        } catch (e) {
            assert(e.message.includes('Trade is closed'));
            return;
        }

        assert(false);
    })

    it('Turn on trades and mint', async () => {
        await hpprsProjectOrchestrator.setDronesState(2)
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 2, "Drones state must be set to TRADE_AND_MINT.")
    })

    it('Trade #2', async () => {
        await hpprsProjectOrchestrator.tradeDrone([11, 12], {from: accounts[1]});

        let hpprsNumber = (await hpprs.balanceOf(accounts[1])).toNumber();
        assert.equal(hpprsNumber, 8, "User must have 8 hpprs.");

        let dronesNumber = (await drones.balanceOf(accounts[1])).toNumber();
        assert.equal(dronesNumber, 4, "User must have 4 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 11, "11 drones must be minted.");
    })

    it('Turn on premints', async () => {
        await hpprsProjectOrchestrator.setSaleState(0)
        let saleState = (await hpprsProjectOrchestrator.saleState()).toNumber();
        assert.equal(saleState, 0, "Sale state must be set to PRE.")
    })

    it('Try to mint drone', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.05), 'ether')})
        } catch (e) {
            assert(e.message.includes('Not public sale'));
            return;
        }

        assert(false);
    })

    it('Try to premint drone with wrong ETH amount', async () => {
        try {
            await hpprsProjectOrchestrator.preMintDrone(
                1,
                '0x1eaab5cd42aab991cbb056aa7cb0cfca667a52665f35c16f03772ab462c919816f96a8762f82bbb326ed1b3e3ea6e534117bc97a73a323beff081f48c6c9b0911b',
                {value: web3.utils.toWei(String(0.039), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount'));
            return;
        }

        assert(false);
    })

    it('Try to premint drone exceeding the limit', async () => {
        try {
            await hpprsProjectOrchestrator.preMintDrone(
                3,
                '0x1eaab5cd42aab991cbb056aa7cb0cfca667a52665f35c16f03772ab462c919816f96a8762f82bbb326ed1b3e3ea6e534117bc97a73a323beff081f48c6c9b0911b',
                {value: web3.utils.toWei(String(0.12), 'ether')})
        } catch (e) {
            assert(e.message.includes('Cannot exceed max premint'));
            return;
        }

        assert(false);
    })

    it('Try to premint using invalid signature', async () => {
        try {
            await hpprsProjectOrchestrator.preMintDrone(
                1,
                '0x1eaab5cd42aab991cbb055aa7cb0cfca667a52665f35c16f03772ab462c919816f96a8762f82bbb326ed1b3e3ea6e534117bc97a73a323beff081f48c6c9b0911b',
                {value: web3.utils.toWei(String(0.04), 'ether')})
        } catch (e) {
            assert(e.message.includes('Signature is invalid'));
            return;
        }

        assert(false);
    })
})