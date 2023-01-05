const Hpprs = artifacts.require("Hpprs");
const Drones = artifacts.require("Drones");
const HpprsProjectOrchestrator = artifacts.require("HpprsProjectOrchestrator");

contract("HpprsProjectOrchestrator", (accounts) => {
    let hpprs = null;
    let drones = null;
    let hpprsProjectOrchestrator = null;

    before(async () => {
        hpprs = await Hpprs.deployed();
        drones = await Drones.deployed();
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
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.111), 'ether')})
        } catch (e) {
            assert(e.message.includes('Mint is not available.'));
            return;
        }

        assert(false);
    })

    it('Try to trade drone', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1, 2])
        } catch (e) {
            assert(e.message.includes('Trade is not available.'));
            return;
        }

        assert(false);
    })

    it('Turn on trades', async () => {
        await hpprsProjectOrchestrator.setDronesState(0)
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 0, "Drones state must be set to TRADE_ONLY.")
    })

    it('Trade with invalid arguments', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1]);
        } catch (e) {
            assert(e.message.includes("Incorrect number of hoppers to trade!"));
            return;
        }

        assert(false);
    })

    it('Trade with invalid arguments #2', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1, 2, 3]);
        } catch (e) {
            assert(e.message.includes("Incorrect number of hoppers to trade!"));
            return;
        }

        assert(false);
    })

    it('Trade using not my hoppers', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([1, 2], {from: accounts[1]});
        } catch (e) {
            assert(e.message.includes("You must be the owner of selected HPPRS."));
            return;
        }

        assert(false);
    })

    it('Trade', async () => {
        await hpprsProjectOrchestrator.tradeDrone([1, 2]);

        let hpprsNumber = (await hpprs.balanceOf(accounts[0])).toNumber();
        assert.equal(hpprsNumber, 8, "User must have 8 hpprs.");

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 1, "User must have 1 drone.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 1, "1 drone must be minted.");
    })

    it('Turn on mints', async () => {
        await hpprsProjectOrchestrator.setDronesState(1)
        let dronesState = (await hpprsProjectOrchestrator.dronesState()).toNumber();
        assert.equal(dronesState, 1, "Drones state must be set to MINT_ONLY.")
    })

    it('Try to mint drone with wrong ETH amount', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.110), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #2', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.112), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #3', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.223), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Try to mint drone with wrong ETH amount #4', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.221), 'ether')})
        } catch (e) {
            assert(e.message.includes('Wrong ETH amount.'));
            return;
        }

        assert(false);
    })

    it('Mint', async () => {
        await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.111), 'ether')})

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 2, "User must have 2 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 2, "2 drones must be minted.");
    })

    it('Mint #2', async () => {
        await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.222), 'ether')})

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 4, "User must have 4 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 4, "4 drones must be minted.");
    })

    it('Change mint price', async () => {
        await hpprsProjectOrchestrator.setDronesMintPrice(web3.utils.toWei(String(0.099), 'ether'))

        let dronesMintPrice = web3.utils.fromWei(await hpprsProjectOrchestrator.dronesMintPrice(), "ether");
        assert.equal(dronesMintPrice, 0.099, "Drone mint price must be 0.099.");
    })

    it('Try to exceed drones supply', async () => {
        try {
            await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.099), 'ether')})
        } catch (e) {
            assert(e.message.includes('Supply limit.'));
            return;
        }

        assert(false);
    })

    it('Set new drones max supply', async () => {
        await drones.setSettings(13);
        const maxSupply = (await drones.maxSupply()).toNumber();

        assert.equal(maxSupply, 13, "Drones max supply must be equal to 13.");
    })

    it('Try to trade #2', async () => {
        try {
            await hpprsProjectOrchestrator.tradeDrone([3, 4, 5, 6, 7, 8]);
        } catch (e) {
            assert(e.message.includes('Trade is not available.'));
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
        await hpprsProjectOrchestrator.tradeDrone([11, 12, 13, 14, 15, 16], {from: accounts[1]});

        let hpprsNumber = (await hpprs.balanceOf(accounts[1])).toNumber();
        assert.equal(hpprsNumber, 4, "User must have 4 hpprs.");

        let dronesNumber = (await drones.balanceOf(accounts[1])).toNumber();
        assert.equal(dronesNumber, 3, "User must have 3 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 7, "7 drones must be minted.");
    })

    it('Mint #3', async () => {
        await hpprsProjectOrchestrator.mintDrone(1, {value: web3.utils.toWei(String(0.099), 'ether'), from: accounts[1]})

        let dronesNumber = (await drones.balanceOf(accounts[1])).toNumber();
        assert.equal(dronesNumber, 4, "User must have 4 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 8, "8 drones must be minted.");
    })

    it('Mint #4', async () => {
        await hpprsProjectOrchestrator.mintDrone(2, {value: web3.utils.toWei(String(0.198), 'ether'), from: accounts[1]})

        let dronesNumber = (await drones.balanceOf(accounts[1])).toNumber();
        assert.equal(dronesNumber, 6, "User must have 6 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 10, "10 drones must be minted.");
    })

    it('Mint #5', async () => {
        await hpprsProjectOrchestrator.mintDrone(3, {value: web3.utils.toWei(String(0.297), 'ether'), from: accounts[0]})

        let dronesNumber = (await drones.balanceOf(accounts[0])).toNumber();
        assert.equal(dronesNumber, 7, "User must have 7 drones.");

        let dronesMinted = (await drones.minted()).toNumber();
        assert.equal(dronesMinted, 13, "13 drones must be minted.");
    })
})