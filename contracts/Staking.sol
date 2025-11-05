// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IMMBotStaking
 * @dev Staking contract for IMMBOT tokens
 * - Users stake IMMBOT to earn rewards
 * - Rewards come from bot trading fees
 * - Longer staking = higher APY
 */
contract IMMBotStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token being staked
    IERC20 public immutable stakingToken;

    // Staking tiers
    struct StakingTier {
        uint256 duration; // in seconds
        uint256 apyBasisPoints; // APY in basis points (10000 = 100%)
        bool active;
    }

    // User stake info
    struct Stake {
        uint256 amount;
        uint256 stakedAt;
        uint256 tier;
        uint256 rewardDebt;
    }

    // State
    mapping(uint256 => StakingTier) public tiers;
    mapping(address => Stake[]) public userStakes;
    uint256 public totalStaked;
    uint256 public rewardPool;
    uint256 public nextTierId;

    // Constants
    uint256 public constant MIN_STAKE = 1000 * 10**18; // 1000 IMMBOT minimum
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 tier, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex);
    event RewardAdded(uint256 amount);
    event TierCreated(uint256 tierId, uint256 duration, uint256 apy);
    event TierUpdated(uint256 tierId, bool active);

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);

        // Create default tiers
        _createTier(30 days, 500); // 30 days = 5% APY
        _createTier(90 days, 1500); // 90 days = 15% APY
        _createTier(180 days, 3000); // 180 days = 30% APY
        _createTier(365 days, 5000); // 365 days = 50% APY
    }

    /**
     * @dev Stake tokens
     */
    function stake(uint256 amount, uint256 tierId) external nonReentrant {
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(tiers[tierId].active, "Invalid tier");

        // Transfer tokens
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create stake
        userStakes[msg.sender].push(
            Stake({
                amount: amount,
                stakedAt: block.timestamp,
                tier: tierId,
                rewardDebt: 0
            })
        );

        totalStaked += amount;

        emit Staked(msg.sender, amount, tierId, userStakes[msg.sender].length - 1);
    }

    /**
     * @dev Unstake tokens and claim rewards
     */
    function unstake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake");

        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.amount > 0, "Stake already withdrawn");

        uint256 reward = calculateReward(msg.sender, stakeIndex);

        // Check if minimum staking duration met
        StakingTier memory tier = tiers[userStake.tier];
        if (block.timestamp < userStake.stakedAt + tier.duration) {
            // Early withdrawal penalty: lose 50% of rewards
            reward = reward / 2;
        }

        uint256 amount = userStake.amount;

        // Update state
        totalStaked -= amount;
        userStake.amount = 0;

        // Transfer tokens and rewards
        if (reward > 0 && reward <= rewardPool) {
            rewardPool -= reward;
            stakingToken.safeTransfer(msg.sender, amount + reward);
        } else {
            stakingToken.safeTransfer(msg.sender, amount);
        }

        emit Unstaked(msg.sender, amount, reward, stakeIndex);
    }

    /**
     * @dev Calculate pending reward for a stake
     */
    function calculateReward(address user, uint256 stakeIndex) public view returns (uint256) {
        if (stakeIndex >= userStakes[user].length) return 0;

        Stake memory userStake = userStakes[user][stakeIndex];
        if (userStake.amount == 0) return 0;

        StakingTier memory tier = tiers[userStake.tier];
        uint256 stakingDuration = block.timestamp - userStake.stakedAt;

        // Calculate reward based on APY
        // reward = (amount * APY * duration) / (BASIS_POINTS * SECONDS_PER_YEAR)
        uint256 reward = (userStake.amount * tier.apyBasisPoints * stakingDuration) /
            (BASIS_POINTS * SECONDS_PER_YEAR);

        return reward - userStake.rewardDebt;
    }

    /**
     * @dev Get all stakes for a user
     */
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }

    /**
     * @dev Get total pending rewards for a user
     */
    function getPendingRewards(address user) external view returns (uint256 total) {
        uint256 stakeCount = userStakes[user].length;
        for (uint256 i = 0; i < stakeCount; i++) {
            total += calculateReward(user, i);
        }
        return total;
    }

    /**
     * @dev Add rewards to the pool (called by bot after profitable trades)
     */
    function addRewards(uint256 amount) external {
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardAdded(amount);
    }

    /**
     * @dev Create a new staking tier (owner only)
     */
    function createTier(uint256 duration, uint256 apyBasisPoints) external onlyOwner {
        _createTier(duration, apyBasisPoints);
    }

    /**
     * @dev Internal: Create tier
     */
    function _createTier(uint256 duration, uint256 apyBasisPoints) internal {
        require(duration > 0, "Invalid duration");
        require(apyBasisPoints <= 10000, "APY too high"); // Max 100% APY

        tiers[nextTierId] = StakingTier({
            duration: duration,
            apyBasisPoints: apyBasisPoints,
            active: true
        });

        emit TierCreated(nextTierId, duration, apyBasisPoints);
        nextTierId++;
    }

    /**
     * @dev Update tier status (owner only)
     */
    function updateTierStatus(uint256 tierId, bool active) external onlyOwner {
        require(tierId < nextTierId, "Invalid tier");
        tiers[tierId].active = active;
        emit TierUpdated(tierId, active);
    }

    /**
     * @dev Emergency withdraw (owner only) - for migration or security
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.safeTransfer(owner(), balance);
    }
}
