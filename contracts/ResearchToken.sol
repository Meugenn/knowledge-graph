// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ResearchToken
 * @dev Governance token for the Decentralized Research Graph
 * Earned through quality contributions: accepted papers, reviews, citations
 */
contract ResearchToken is ERC20, Ownable {

    // Minting limits to prevent inflation
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    // Authorized minters (ResearchGraph contract)
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    constructor() ERC20("Research Token", "RESEARCH") Ownable(msg.sender) {
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, 10_000_000 * 10**18); // 10M initial supply
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized minter");
        _;
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
