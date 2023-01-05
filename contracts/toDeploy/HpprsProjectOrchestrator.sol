pragma solidity ^0.8.0;

import "./DronesInterface.sol";
import "./HpprsInterface.sol";

contract HpprsProjectOrchestrator {
    uint256 public hpprsNumberToTrade;
    uint256 public dronesMintPrice;
    DronesInterface public drones;
    HpprsInterface public hpprs;
    DronesState public dronesState;

    enum DronesState{TRADE_ONLY, MINT_ONLY, TRADE_AND_MINT, STOPPED}

    constructor(
        address _drones,
        address _hpprs,
        uint256 _hpprsNumberToTrade,
        uint256 _dronesMintPrice,
        DronesState _droneState
    ) {
        hpprs = HpprsInterface(_hpprs);
        drones = DronesInterface(_drones);
        dronesMintPrice = _dronesMintPrice;
        hpprsNumberToTrade = _hpprsNumberToTrade;
        dronesState = _droneState;
    }

    function setSettings(
        address _drones,
        address _hpprs,
        uint256 _hpprsNumberToTrade,
        uint256 _dronesMintPrice,
        DronesState _droneState
    ) external {
        hpprs = HpprsInterface(_hpprs);
        drones = DronesInterface(_drones);
        dronesMintPrice = _dronesMintPrice;
        hpprsNumberToTrade = _hpprsNumberToTrade;
        dronesState = _droneState;
    }

    function setDronesState(DronesState _dronesState) external {
        dronesState = _dronesState;
    }

    function setDronesMintPrice(uint256 _dronesMintPrice) external {
        dronesMintPrice = _dronesMintPrice;
    }

    function mintDrone(uint256 tokenAmount) external payable {
        require(dronesState == DronesState.TRADE_AND_MINT || dronesState == DronesState.MINT_ONLY, "Mint is not available.");
        require(msg.value == tokenAmount * dronesMintPrice, "Wrong ETH amount.");
        drones.airdrop(msg.sender, tokenAmount);
    }

    function tradeDrone(uint256[] calldata hpprsIds) external {
        require(dronesState == DronesState.TRADE_AND_MINT || dronesState == DronesState.TRADE_ONLY, "Trade is not available.");
        require(hpprsIds.length % hpprsNumberToTrade == 0, "Incorrect number of hoppers to trade!");

        for (uint256 i = 0; i < hpprsIds.length; i++) {
            require(hpprs.ownerOf(hpprsIds[i]) == msg.sender, "You must be the owner of selected HPPRS.");
            hpprs.burn(hpprsIds[i]);
        }

        drones.airdrop(msg.sender, hpprsIds.length / hpprsNumberToTrade);
    }
}
