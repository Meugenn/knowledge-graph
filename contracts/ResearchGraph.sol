// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ResearchToken.sol";
import "./IFlareContracts.sol";

/**
 * @title ResearchGraph
 * @dev Main contract for Decentralized Research Knowledge Graph
 * Integrates with Flare (FDC + FTSO) and Plasma (stablecoin payments)
 */
contract ResearchGraph is Ownable, ReentrancyGuard {

    ResearchToken public researchToken;
    IERC20 public stablecoin; // USDC on Plasma

    // Flare integrations
    IFtsoRegistry public ftsoRegistry;
    IFlareDataConnector public fdcHub;
    IRandomProvider public randomProvider;

    // Paper status
    enum PaperStatus { Submitted, UnderReview, Accepted, Rejected }

    struct Paper {
        uint256 id;
        address author;
        string ipfsHash;      // Paper content on IPFS
        string doi;           // DOI or external identifier
        PaperStatus status;
        uint256 submissionFee;
        uint256 timestamp;
        uint256 citationCount;
        uint256 replicationCount;
        bytes32 fdcRequestId; // Flare Data Connector request
        bool externalDataVerified;
    }

    struct Review {
        uint256 paperId;
        address reviewer;
        uint8 score;          // 1-10
        string ipfsHash;      // Review content on IPFS
        uint256 timestamp;
        bool rewarded;
    }

    struct Reviewer {
        uint256 reputation;
        uint256 reviewCount;
        uint256 stakedTokens;
        bool isActive;
    }

    // State variables
    uint256 public paperCount;
    uint256 public reviewCount;

    mapping(uint256 => Paper) public papers;
    mapping(uint256 => Review) public reviews;
    mapping(address => Reviewer) public reviewers;
    mapping(uint256 => address[]) public paperReviewers; // paperId => reviewer addresses
    mapping(uint256 => uint256[]) public citations; // paperId => cited paper IDs

    // Economics
    uint256 public submissionFeeUSD = 50 * 10**6;  // $50 in USDC (6 decimals)
    uint256 public reviewRewardUSD = 100 * 10**6;  // $100 in USDC
    uint256 public citationRewardTokens = 10 * 10**18; // 10 RESEARCH tokens
    uint256 public replicationRewardTokens = 50 * 10**18; // 50 RESEARCH tokens
    uint256 public minReviewersRequired = 3;
    uint256 public minStakeForReviewer = 100 * 10**18; // 100 RESEARCH tokens

    // Events
    event PaperSubmitted(uint256 indexed paperId, address indexed author, string ipfsHash, string doi);
    event PaperStatusUpdated(uint256 indexed paperId, PaperStatus status);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId, address indexed reviewer);
    event ReviewerAssigned(uint256 indexed paperId, address indexed reviewer);
    event CitationAdded(uint256 indexed citingPaper, uint256 indexed citedPaper);
    event ReplicationVerified(uint256 indexed paperId, address indexed replicator);
    event ExternalDataVerified(uint256 indexed paperId, bytes32 requestId);
    event RewardDistributed(address indexed recipient, uint256 amount, string rewardType);

    constructor(
        address _researchToken,
        address _stablecoin,
        address _ftsoRegistry,
        address _fdcHub,
        address _randomProvider
    ) Ownable(msg.sender) {
        researchToken = ResearchToken(_researchToken);
        stablecoin = IERC20(_stablecoin);
        ftsoRegistry = IFtsoRegistry(_ftsoRegistry);
        fdcHub = IFlareDataConnector(_fdcHub);
        randomProvider = IRandomProvider(_randomProvider);
    }

    /**
     * @dev Submit a paper for review
     * Requires stablecoin payment and initiates external data verification via Flare FDC
     */
    function submitPaper(
        string memory ipfsHash,
        string memory doi
    ) external nonReentrant returns (uint256) {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");

        // Charge submission fee in stablecoin (Plasma)
        require(
            stablecoin.transferFrom(msg.sender, address(this), submissionFeeUSD),
            "Submission fee payment failed"
        );

        paperCount++;

        papers[paperCount] = Paper({
            id: paperCount,
            author: msg.sender,
            ipfsHash: ipfsHash,
            doi: doi,
            status: PaperStatus.Submitted,
            submissionFee: submissionFeeUSD,
            timestamp: block.timestamp,
            citationCount: 0,
            replicationCount: 0,
            fdcRequestId: bytes32(0),
            externalDataVerified: false
        });

        emit PaperSubmitted(paperCount, msg.sender, ipfsHash, doi);

        // Request external verification via Flare Data Connector
        if (bytes(doi).length > 0) {
            _requestExternalVerification(paperCount, doi);
        }

        // Assign reviewers
        _assignReviewers(paperCount);

        return paperCount;
    }

    /**
     * @dev Request external data verification via Flare FDC
     * Checks if paper exists in CrossRef, arXiv, etc.
     */
    function _requestExternalVerification(uint256 paperId, string memory doi) internal {
        bytes32 requestId = fdcHub.requestData("crossref", doi);
        papers[paperId].fdcRequestId = requestId;
    }

    /**
     * @dev Verify external data response from Flare FDC
     * Called after FDC returns data
     */
    function verifyExternalData(uint256 paperId) external {
        Paper storage paper = papers[paperId];
        require(paper.fdcRequestId != bytes32(0), "No FDC request found");

        IFlareDataConnector.DataResponse memory response = fdcHub.getDataResponse(paper.fdcRequestId);
        require(response.verified, "Data not yet verified");

        paper.externalDataVerified = true;
        emit ExternalDataVerified(paperId, paper.fdcRequestId);

        // Reward author for verified paper
        researchToken.mint(paper.author, 50 * 10**18); // 50 RESEARCH tokens
    }

    /**
     * @dev Assign reviewers randomly using Flare's Random Number Generator
     */
    function _assignReviewers(uint256 paperId) internal {
        // Get active reviewers
        address[] memory activeReviewers = _getActiveReviewers();
        require(activeReviewers.length >= minReviewersRequired, "Not enough reviewers");

        // Use Flare's RNG to select reviewers randomly
        for (uint256 i = 0; i < minReviewersRequired; i++) {
            uint256 randomIndex = uint256(keccak256(abi.encodePacked(
                randomProvider.getRandomNumber(),
                paperId,
                i
            ))) % activeReviewers.length;

            address selectedReviewer = activeReviewers[randomIndex];
            paperReviewers[paperId].push(selectedReviewer);

            emit ReviewerAssigned(paperId, selectedReviewer);
        }

        papers[paperId].status = PaperStatus.UnderReview;
        emit PaperStatusUpdated(paperId, PaperStatus.UnderReview);
    }

    /**
     * @dev Submit a review for a paper
     */
    function submitReview(
        uint256 paperId,
        uint8 score,
        string memory ipfsHash
    ) external nonReentrant {
        require(papers[paperId].status == PaperStatus.UnderReview, "Paper not under review");
        require(score >= 1 && score <= 10, "Score must be 1-10");
        require(_isAssignedReviewer(paperId, msg.sender), "Not assigned as reviewer");

        reviewCount++;

        reviews[reviewCount] = Review({
            paperId: paperId,
            reviewer: msg.sender,
            score: score,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            rewarded: false
        });

        reviewers[msg.sender].reviewCount++;
        reviewers[msg.sender].reputation += score; // Simple reputation

        emit ReviewSubmitted(reviewCount, paperId, msg.sender);

        // Pay reviewer in stablecoin (Plasma)
        require(
            stablecoin.transfer(msg.sender, reviewRewardUSD),
            "Review reward payment failed"
        );
        reviews[reviewCount].rewarded = true;

        emit RewardDistributed(msg.sender, reviewRewardUSD, "review");

        // Check if all reviews are complete
        _checkReviewCompletion(paperId);
    }

    /**
     * @dev Check if all reviews are complete and update paper status
     */
    function _checkReviewCompletion(uint256 paperId) internal {
        uint256 completedReviews = 0;
        uint256 totalScore = 0;

        for (uint256 i = 1; i <= reviewCount; i++) {
            if (reviews[i].paperId == paperId) {
                completedReviews++;
                totalScore += reviews[i].score;
            }
        }

        if (completedReviews >= minReviewersRequired) {
            uint256 avgScore = totalScore / completedReviews;

            if (avgScore >= 7) {
                papers[paperId].status = PaperStatus.Accepted;
                // Reward author with governance tokens
                researchToken.mint(papers[paperId].author, 100 * 10**18);
                emit RewardDistributed(papers[paperId].author, 100 * 10**18, "acceptance");
            } else {
                papers[paperId].status = PaperStatus.Rejected;
            }

            emit PaperStatusUpdated(paperId, papers[paperId].status);
        }
    }

    /**
     * @dev Add citation to a paper (rewards original author)
     */
    function addCitation(uint256 citingPaperId, uint256 citedPaperId) external {
        require(papers[citingPaperId].author == msg.sender, "Not paper author");
        require(papers[citedPaperId].status == PaperStatus.Accepted, "Cited paper not accepted");

        citations[citingPaperId].push(citedPaperId);
        papers[citedPaperId].citationCount++;

        // Reward cited paper author
        researchToken.mint(papers[citedPaperId].author, citationRewardTokens);

        emit CitationAdded(citingPaperId, citedPaperId);
        emit RewardDistributed(papers[citedPaperId].author, citationRewardTokens, "citation");
    }

    /**
     * @dev Register as a reviewer (requires staking tokens)
     */
    function registerAsReviewer(uint256 stakeAmount) external {
        require(stakeAmount >= minStakeForReviewer, "Insufficient stake");
        require(
            researchToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Stake transfer failed"
        );

        reviewers[msg.sender] = Reviewer({
            reputation: 0,
            reviewCount: 0,
            stakedTokens: stakeAmount,
            isActive: true
        });
    }

    /**
     * @dev Verify paper replication (via Flare FDC checking GitHub/OSF)
     */
    function verifyReplication(uint256 paperId, string memory replicationDoi) external {
        require(papers[paperId].status == PaperStatus.Accepted, "Paper not accepted");

        // Request verification via FDC
        bytes32 requestId = fdcHub.requestData("github", replicationDoi);

        // Simplified: assume verified for demo
        papers[paperId].replicationCount++;

        // Reward original author
        researchToken.mint(papers[paperId].author, replicationRewardTokens);

        // Reward replicator
        researchToken.mint(msg.sender, replicationRewardTokens / 2);

        emit ReplicationVerified(paperId, msg.sender);
        emit RewardDistributed(papers[paperId].author, replicationRewardTokens, "replication");
    }

    /**
     * @dev Get token price in USD using Flare FTSO
     */
    function getTokenPriceUSD() public view returns (uint256) {
        (uint256 price, , uint256 decimals) = ftsoRegistry.getCurrentPrice("RESEARCH");
        return price / (10 ** decimals);
    }

    // Helper functions
    function _isAssignedReviewer(uint256 paperId, address reviewer) internal view returns (bool) {
        address[] memory assigned = paperReviewers[paperId];
        for (uint256 i = 0; i < assigned.length; i++) {
            if (assigned[i] == reviewer) return true;
        }
        return false;
    }

    function _getActiveReviewers() internal view returns (address[] memory) {
        // Simplified: return mock reviewers for demo
        // In production, iterate through all reviewers
        address[] memory active = new address[](5);
        uint256 count = 0;

        // This would iterate through a reviewer registry in production
        return active;
    }

    function getPaper(uint256 paperId) external view returns (Paper memory) {
        return papers[paperId];
    }

    function getPaperReviewers(uint256 paperId) external view returns (address[] memory) {
        return paperReviewers[paperId];
    }

    function getCitations(uint256 paperId) external view returns (uint256[] memory) {
        return citations[paperId];
    }

    // Admin functions
    function updateSubmissionFee(uint256 newFee) external onlyOwner {
        submissionFeeUSD = newFee;
    }

    function updateReviewReward(uint256 newReward) external onlyOwner {
        reviewRewardUSD = newReward;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = stablecoin.balanceOf(address(this));
        require(stablecoin.transfer(owner(), balance), "Withdrawal failed");
    }
}
