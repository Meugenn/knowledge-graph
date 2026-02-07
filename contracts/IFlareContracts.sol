// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFtsoRegistry
 * @dev Interface for Flare Time Series Oracle Registry
 * Used to get price feeds for token/stablecoin conversion
 */
interface IFtsoRegistry {
    function getCurrentPrice(string memory symbol) external view returns (uint256 price, uint256 timestamp, uint256 decimals);
    function getCurrentPriceWithDecimals(string memory symbol) external view returns (uint256 price, uint256 timestamp, uint256 decimals);
}

/**
 * @title IFlareDataConnector
 * @dev Interface for Flare Data Connector (FDC)
 * Used to fetch external academic data (citations, paper metadata, etc.)
 */
interface IFlareDataConnector {
    struct DataRequest {
        bytes32 requestId;
        string dataSource; // e.g., "crossref", "arxiv", "pubmed"
        string query;      // e.g., DOI, paper ID
        uint256 timestamp;
    }

    struct DataResponse {
        bytes32 requestId;
        bytes data;        // Encoded response data
        bool verified;
        uint256 timestamp;
    }

    function requestData(
        string memory dataSource,
        string memory query
    ) external returns (bytes32 requestId);

    function getDataResponse(bytes32 requestId) external view returns (DataResponse memory);
}

/**
 * @title IRandomProvider
 * @dev Interface for Flare's Secure Random Number Generator
 * Used for anonymous reviewer assignment
 */
interface IRandomProvider {
    function getRandomNumber() external returns (uint256);
    function getSecureRandomNumber() external returns (uint256);
}
