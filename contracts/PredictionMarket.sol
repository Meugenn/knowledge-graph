// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket — LMSR
 * @dev Logarithmic Market Scoring Rule prediction markets for paper replication outcomes.
 *      "Polymarket for Science" — The Republic, ETH Oxford 2026.
 *
 *      Cost function: C(q) = b * ln(e^(qYes/b) + e^(qNo/b))
 *      Price of YES:  p = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))
 *
 *      Fixed-point arithmetic: 18 decimals (WAD), Taylor-series exp/ln
 *      capped at shares/b <= 20 to prevent overflow.
 */
contract PredictionMarket is Ownable, ReentrancyGuard {

    IERC20 public researchToken;

    int256 constant WAD = 1e18;
    int256 constant HALF_WAD = 5e17;
    int256 constant MAX_EXP_INPUT = 20e18; // cap at e^20

    struct Market {
        uint256 id;
        uint256 paperId;
        address creator;
        string question;
        uint256 endTime;
        int256 qYes;      // outstanding YES shares (WAD)
        int256 qNo;       // outstanding NO shares  (WAD)
        int256 b;          // liquidity parameter    (WAD)
        bool resolved;
        bool outcome;
        uint256 totalParticipants;
    }

    struct Position {
        int256 yesShares;  // WAD
        int256 noShares;   // WAD
        bool claimed;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;

    event MarketCreated(uint256 indexed marketId, uint256 indexed paperId, string question, uint256 endTime, int256 b);
    event SharesBought(uint256 indexed marketId, address indexed user, bool isYes, int256 shares, uint256 cost);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event PayoutClaimed(uint256 indexed marketId, address indexed user, uint256 payout);

    constructor(address _researchToken) Ownable(msg.sender) {
        researchToken = IERC20(_researchToken);
    }

    /* ─── Fixed-point math ─────────────────────────────────────── */

    /// @dev e^x via 6th-order Taylor series, x in WAD, capped at MAX_EXP_INPUT
    function _expWad(int256 x) internal pure returns (int256) {
        if (x > MAX_EXP_INPUT) x = MAX_EXP_INPUT;
        if (x < -MAX_EXP_INPUT) return 0;

        // Taylor: 1 + x + x^2/2! + x^3/3! + x^4/4! + x^5/5! + x^6/6!
        int256 term = WAD;
        int256 result = WAD;

        term = (term * x) / WAD;     result += term;            // x
        term = (term * x) / (2 * WAD); result += term;          // x^2/2
        term = (term * x) / (3 * WAD); result += term;          // x^3/6
        term = (term * x) / (4 * WAD); result += term;          // x^4/24
        term = (term * x) / (5 * WAD); result += term;          // x^5/120
        term = (term * x) / (6 * WAD); result += term;          // x^6/720

        return result > 0 ? result : int256(1); // floor at 1 wei
    }

    /// @dev ln(x) via Halley iteration, x in WAD (x > 0)
    function _lnWad(int256 x) internal pure returns (int256) {
        require(x > 0, "ln of non-positive");

        // Initial guess via bit-length
        int256 y = 0;
        int256 xx = x;
        if (xx >= 100e18) { y += 4605170185988091368; xx = (xx * WAD) / (100e18); } // ln(100)
        if (xx >= 10e18)  { y += 2302585092994045684; xx = (xx * WAD) / (10e18); }  // ln(10)
        if (xx >= 2e18)   { y +=  693147180559945309; xx = (xx * WAD) / (2e18); }   // ln(2)

        // Newton for ln near 1: ln(z) ≈ 2*(z-1)/(z+1)
        int256 z = xx;
        int256 num = z - WAD;
        int256 den = z + WAD;
        int256 ratio = (num * WAD) / den;
        int256 ratio2 = (ratio * ratio) / WAD;

        // Series: 2*(r + r^3/3 + r^5/5)
        int256 series = ratio;
        series += (ratio * ratio2) / (3 * WAD);
        int256 r4 = (ratio2 * ratio2) / WAD;
        series += (ratio * r4) / (5 * WAD);
        y += 2 * series;

        return y;
    }

    /* ─── LMSR cost function ──────────────────────────────────── */

    /// @dev C(q) = b * ln(e^(qYes/b) + e^(qNo/b))
    function _cost(int256 qYes, int256 qNo, int256 b) internal pure returns (int256) {
        int256 expYes = _expWad((qYes * WAD) / b);
        int256 expNo  = _expWad((qNo * WAD) / b);
        return (b * _lnWad(expYes + expNo)) / WAD;
    }

    /* ─── External functions ──────────────────────────────────── */

    function createMarket(
        uint256 paperId,
        string memory question,
        uint256 duration,
        int256 b
    ) external returns (uint256) {
        require(b > 0, "b must be positive");
        marketCount++;

        markets[marketCount] = Market({
            id: marketCount,
            paperId: paperId,
            creator: msg.sender,
            question: question,
            endTime: block.timestamp + duration,
            qYes: 0,
            qNo: 0,
            b: b,
            resolved: false,
            outcome: false,
            totalParticipants: 0
        });

        emit MarketCreated(marketCount, paperId, question, block.timestamp + duration, b);
        return marketCount;
    }

    function buyYes(uint256 marketId, int256 shares) external nonReentrant {
        _buy(marketId, shares, true);
    }

    function buyNo(uint256 marketId, int256 shares) external nonReentrant {
        _buy(marketId, shares, false);
    }

    function _buy(uint256 marketId, int256 shares, bool isYes) internal {
        Market storage m = markets[marketId];
        require(m.id != 0, "Market does not exist");
        require(!m.resolved, "Market already resolved");
        require(block.timestamp < m.endTime, "Market ended");
        require(shares > 0, "Shares must be positive");

        int256 costBefore = _cost(m.qYes, m.qNo, m.b);
        if (isYes) {
            m.qYes += shares;
        } else {
            m.qNo += shares;
        }
        int256 costAfter = _cost(m.qYes, m.qNo, m.b);

        int256 price = costAfter - costBefore;
        require(price > 0, "Price underflow");

        uint256 cost = uint256(price);
        require(
            researchToken.transferFrom(msg.sender, address(this), cost),
            "Token transfer failed"
        );

        Position storage pos = positions[marketId][msg.sender];
        if (pos.yesShares == 0 && pos.noShares == 0) {
            m.totalParticipants++;
        }

        if (isYes) {
            pos.yesShares += shares;
        } else {
            pos.noShares += shares;
        }

        emit SharesBought(marketId, msg.sender, isYes, shares, cost);
    }

    function resolveMarket(uint256 marketId, bool outcome) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.id != 0, "Market does not exist");
        require(!m.resolved, "Already resolved");

        m.resolved = true;
        m.outcome = outcome;

        emit MarketResolved(marketId, outcome);
    }

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.resolved, "Market not resolved");

        Position storage pos = positions[marketId][msg.sender];
        require(!pos.claimed, "Already claimed");

        int256 winningShares = m.outcome ? pos.yesShares : pos.noShares;
        require(winningShares > 0, "No winning shares");

        pos.claimed = true;

        // Payout = shares (1:1 redemption for winning outcome)
        uint256 payout = uint256(winningShares);
        require(
            researchToken.transfer(msg.sender, payout),
            "Payout transfer failed"
        );

        emit PayoutClaimed(marketId, msg.sender, payout);
    }

    /* ─── View functions ──────────────────────────────────────── */

    /// @dev YES price = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))
    function getYesPrice(uint256 marketId) external view returns (int256) {
        Market memory m = markets[marketId];
        if (m.b == 0) return HALF_WAD;
        int256 expYes = _expWad((m.qYes * WAD) / m.b);
        int256 expNo  = _expWad((m.qNo * WAD) / m.b);
        return (expYes * WAD) / (expYes + expNo);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getUserPosition(uint256 marketId, address user) external view returns (Position memory) {
        return positions[marketId][user];
    }
}
