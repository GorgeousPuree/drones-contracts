// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./PckrDronesInterface.sol";
import "./HpprsInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PckrDronesOrchestrator is Ownable {
    uint256 public dronesMintPrice;
    uint256 public dronesPreMintPrice;

    uint256 public maxPreMintsPerWallet;
    uint256 public maxMintsPerTransaction;

    address public secret;

    PckrDronesInterface public drones;
    HpprsInterface public hpprs;
    DronesState public dronesState;
    SaleState public saleState;

    mapping(address => uint) public walletsPreMints;

    enum DronesState{TRADE_ONLY, SALE_ONLY, TRADE_AND_SALE, STOPPED}
    enum SaleState{PRE, PUBLIC}

    event Mint(address owner, uint256 tokenAmount);
    event Trade(address owner, uint256 tokenAmount);

    constructor(
        address _drones,
        address _hpprs,
        address _secret,
        uint256 _dronesPreMintPrice,
        uint256 _dronesMintPrice,
        uint256 _maxPreMintsPerWallet,
        uint256 _maxMintsPerTransaction,
        DronesState _droneState,
        SaleState _saleState
    ) {
        hpprs = HpprsInterface(_hpprs);
        drones = PckrDronesInterface(_drones);
        secret = _secret;
        dronesPreMintPrice = _dronesPreMintPrice;
        dronesMintPrice = _dronesMintPrice;
        maxPreMintsPerWallet = _maxPreMintsPerWallet;
        maxMintsPerTransaction = _maxMintsPerTransaction;
        dronesState = _droneState;
        saleState = _saleState;
    }

    function setSettings(
        address _drones,
        address _hpprs,
        address _secret,
        uint256 _dronesPreMintPrice,
        uint256 _dronesMintPrice,
        uint256 _maxPreMintsPerWallet,
        uint256 _maxMintsPerTransaction,
        DronesState _droneState,
        SaleState _saleState
    ) external onlyOwner {
        hpprs = HpprsInterface(_hpprs);
        drones = PckrDronesInterface(_drones);
        secret = _secret;
        dronesMintPrice = _dronesMintPrice;
        dronesPreMintPrice = _dronesPreMintPrice;
        maxPreMintsPerWallet = _maxPreMintsPerWallet;
        maxMintsPerTransaction = _maxMintsPerTransaction;
        dronesState = _droneState;
        saleState = _saleState;
    }

    function setSaleState(SaleState _saleState) external onlyOwner {
        saleState = _saleState;
    }

    function setDronesState(DronesState _dronesState) external onlyOwner {
        dronesState = _dronesState;
    }

    function setSalePrices(uint256 _dronesPreMintPrice, uint256 _dronesMintPrice) external onlyOwner {
        dronesPreMintPrice = _dronesPreMintPrice;
        dronesMintPrice = _dronesMintPrice;
    }

    function preMintDrone(uint256 tokenAmount, bytes calldata signature) external payable {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.SALE_ONLY, "Sale is closed");
        require(saleState == SaleState.PRE, "Not presale");
        require(tokenAmount + walletsPreMints[msg.sender] <= maxPreMintsPerWallet, "Cannot exceed max premint");
        require(msg.value == tokenAmount * dronesPreMintPrice, "Wrong ETH amount");
        require(
            _verifyHashSignature(keccak256(abi.encode(msg.sender)), signature),
            "Signature is invalid"
        );

        walletsPreMints[msg.sender] += tokenAmount;
        emit Mint(msg.sender, tokenAmount);
        drones.airdrop(msg.sender, tokenAmount);
    }

    function mintDrone(uint256 tokenAmount) external payable {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.SALE_ONLY, "Sale is closed");
        require(saleState == SaleState.PUBLIC, "Not public sale");
        require(msg.value == tokenAmount * dronesMintPrice, "Wrong ETH amount");
        require(tokenAmount <= maxMintsPerTransaction, "Limit per transaction");

        emit Mint(msg.sender, tokenAmount);
        drones.airdrop(msg.sender, tokenAmount);
    }

    function tradeDrone(uint256[] calldata hpprsIds) external {
        require(dronesState == DronesState.TRADE_AND_SALE || dronesState == DronesState.TRADE_ONLY, "Trade is closed");

        for (uint256 i = 0; i < hpprsIds.length; i++) {
            require(hpprs.ownerOf(hpprsIds[i]) == msg.sender, "Not HPPR owner");
            hpprs.burn(hpprsIds[i]);
        }

        emit Trade(msg.sender, hpprsIds.length * 2);
        drones.airdrop(msg.sender, hpprsIds.length * 2);
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
