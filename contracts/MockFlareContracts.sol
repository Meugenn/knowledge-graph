// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IFlareContracts.sol";

/**
 * @title MockFtsoRegistry
 * @dev Mock Flare Time Series Oracle for testing
 */
contract MockFtsoRegistry is IFtsoRegistry {
    mapping(string => uint256) public prices;

    constructor() {
        prices["RESEARCH"] = 1 * 10**18; // $1.00
        prices["FLR"] = 2 * 10**17;      // $0.20
    }

    function getCurrentPrice(string memory symbol) external view override returns (uint256 price, uint256 timestamp, uint256 decimals) {
        return (prices[symbol], block.timestamp, 18);
    }

    function getCurrentPriceWithDecimals(string memory symbol) external view override returns (uint256 price, uint256 timestamp, uint256 decimals) {
        return (prices[symbol], block.timestamp, 18);
    }

    function setPrice(string memory symbol, uint256 price) external {
        prices[symbol] = price;
    }
}

/**
 * @title MockFlareDataConnector
 * @dev Mock FDC for testing external data verification
 */
contract MockFlareDataConnector is IFlareDataConnector {
    uint256 private requestCounter;
    mapping(bytes32 => DataResponse) public responses;

    function requestData(
        string memory dataSource,
        string memory query
    ) external override returns (bytes32 requestId) {
        requestCounter++;
        requestId = keccak256(abi.encodePacked(dataSource, query, requestCounter));

        // Mock response - in production, this would be set by oracle
        responses[requestId] = DataResponse({
            requestId: requestId,
            data: abi.encode(true, "Paper verified from CrossRef"),
            verified: true,
            timestamp: block.timestamp
        });

        return requestId;
    }

    function getDataResponse(bytes32 requestId) external view override returns (DataResponse memory) {
        return responses[requestId];
    }

    // Test helper
    function setResponse(bytes32 requestId, bytes memory data, bool verified) external {
        responses[requestId] = DataResponse({
            requestId: requestId,
            data: data,
            verified: verified,
            timestamp: block.timestamp
        });
    }
}

/**
 * @title MockRandomProvider
 * @dev Mock Random Number Generator for testing
 */
contract MockRandomProvider is IRandomProvider {
    uint256 private nonce;

    function getRandomNumber() external override returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, nonce)));
    }

    function getSecureRandomNumber() external override returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, nonce, msg.sender)));
    }
}
