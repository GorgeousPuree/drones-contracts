// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./DronesInterface.sol";
import "./HpprsInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HpprsProjectOrchestrator is Ownable {
    uint256 public hpprsNumberToTrade;
    uint256 public dronesMintPrice;
    uint256 public dronesPreMintPrice;
    uint256 public maxPreMintsNumber;
    uint256 public maxMintedNumber;
    uint256 public maxTradedNumber;
    uint256 public mintedNumber;
    uint256 public tradedNumber;

    address public secret;
    address public vault;

    DronesInterface public drones;
    HpprsInterface public hpprs;
    DronesState public dronesState;
    SaleState public saleState;

    mapping(address => uint) public walletsPreMints;

    enum DronesState{TRADE_ONLY, SALE_ONLY, TRADE_AND_SALE, STOPPED}
    enum SaleState{PRE, PUBLIC}

    constructor(
        address _drones,
        address _hpprs,
        address _secret,
        uint256 _hpprsNumberToTrade,
        uint256 _dronesPreMintPrice,
        uint256 _dronesMintPrice,
        uint256 _maxPreMintsNumber,
        uint256 _maxMintedNumber,
        uint256 _maxTradedNumber,
        DronesState _droneState,
        SaleState _saleState
    ) {
        hpprs = HpprsInterface(_hpprs);
        drones = DronesInterface(_drones);
        secret = _secret;
        dronesPreMintPrice = _dronesPreMintPrice;
        dronesMintPrice = _dronesMintPrice;
        hpprsNumberToTrade = _hpprsNumberToTrade;
        maxPreMintsNumber = _maxPreMintsNumber;
        maxMintedNumber = _maxMintedNumber;
        maxTradedNumber = _maxTradedNumber;
        dronesState = _droneState;
        saleState = _saleState;
    }

    function setSettings(
        address _drones,
        address _hpprs,
        address _secret,
        uint256 _hpprsNumberToTrade,
        uint256 _dronesPreMintPrice,
        uint256 _dronesMintPrice,
        uint256 _maxPreMintsNumber,
        uint256 _maxMintedNumber,
        uint256 _maxTradedNumber,
        DronesState _droneState,
        SaleState _saleState
    ) external onlyOwner {
        hpprs = HpprsInterface(_hpprs);
        drones = DronesInterface(_drones);
        secret = _secret;
        dronesMintPrice = _dronesMintPrice;
        dronesPreMintPrice = _dronesPreMintPrice;
        hpprsNumberToTrade = _hpprsNumberToTrade;
        maxPreMintsNumber = _maxPreMintsNumber;
        maxMintedNumber = _maxMintedNumber;
        maxTradedNumber = _maxTradedNumber;
        dronesState = _droneState;
        saleState = _saleState;
    }

    function setSaleState(SaleState _saleState) external onlyOwner {
        saleState = _saleState;
    }

    function setSalePrices(uint256 _dronesPreMintPrice, uint256 _dronesMintPrice) external onlyOwner {
        dronesPreMintPrice = _dronesPreMintPrice;
        dronesMintPrice = _dronesMintPrice;
    }

    function setDronesState(DronesState _dronesState) external onlyOwner {
        dronesState = _dronesState;
    }

    function preMintDrone(uint256 tokenAmount, bytes calldata signature) external payable {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.SALE_ONLY, "Sale is closed");
        require(saleState == SaleState.PRE, "Not presale");
        require(tokenAmount + walletsPreMints[msg.sender] <= maxPreMintsNumber, "Cannot exceed max premint");
        require(msg.value == tokenAmount * dronesPreMintPrice, "Wrong ETH amount");
        require(mintedNumber + tokenAmount <= maxMintedNumber, "Mint supply is exhausted");
        require(
            _verifyHashSignature(keccak256(abi.encode(msg.sender)), signature),
            "Signature is invalid"
        );

        walletsPreMints[msg.sender] += tokenAmount;
        mintedNumber += tokenAmount;
        drones.airdrop(msg.sender, tokenAmount);
    }

    function mintDrone(uint256 tokenAmount) external payable {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.SALE_ONLY, "Sale is closed");
        require(saleState == SaleState.PUBLIC, "Not public sale");
        require(msg.value == tokenAmount * dronesMintPrice, "Wrong ETH amount");
        require(mintedNumber + tokenAmount <= maxMintedNumber, "Mint supply is exhausted");

        mintedNumber += tokenAmount;
        drones.airdrop(msg.sender, tokenAmount);
    }

    function tradeDrone(uint256[] calldata hpprsIds) external {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.TRADE_ONLY, "Trade is closed");
        require(hpprsIds.length % hpprsNumberToTrade == 0, "Wrong number of HPPRS");
        uint256 numberOfDronesToGet = hpprsIds.length / hpprsNumberToTrade;

        require(tradedNumber + numberOfDronesToGet <= maxTradedNumber, "Trade supply is exhausted");

        for (uint256 i = 0; i < hpprsIds.length; i++) {
            require(hpprs.ownerOf(hpprsIds[i]) == msg.sender, "Not HPPR owner");
            hpprs.burn(hpprsIds[i]);
        }

        tradedNumber += numberOfDronesToGet;
        drones.airdrop(msg.sender, numberOfDronesToGet);
    }

    function withdraw() external onlyOwner {
        payable(0xB3b3C662B547eBc3cDE4C481d9fB63f03a8d90Eb).transfer(address(this).balance);
    }

    function _verifyHashSignature(bytes32 freshHash, bytes memory signature) internal view returns (bool)
    {
        bytes32 hash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", freshHash)
        );

        bytes32 r;
        bytes32 s;
        uint8 v;

        if (signature.length != 65) {
            return false;
        }
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        address signer = address(0);
        if (v == 27 || v == 28) {
            signer = ecrecover(hash, v, r, s);
        }
        return secret == signer;
    }
}
