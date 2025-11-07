// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title IMMBot Staking Contract
 * @dev Enhanced staking contract for IMMBOT tokens with rewards and tiers
 */
contract IMMBotStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // The IMMBOT token contract
    IERC20 public immutable stakingToken;
    
    // Reward token (same as staking token in this case)
    IERC20 public immutable rewardToken;

    // Staking parameters
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Base APY in basis points (5% = 500)
    uint256 public baseAPY = 500;
    
    // Minimum staking amount (1000 IMMBOT)
    uint256 public minimumStakeAmount = 1000 * 10**18;
    
    // Lock periods and their multipliers
    struct LockPeriod {
        uint256 duration;     // Lock duration in seconds
        uint256 multiplier;   // APY multiplier in basis points (10000 = 1x)
        string name;          // Human readable name
    }
    
    mapping(uint256 => LockPeriod) public lockPeriods;
    uint256 public lockPeriodsCount = 0;
    
    // User staking info
    struct StakeInfo {
        uint256 amount;           // Staked amount
        uint256 stakingTime;      // When the stake was created
        uint256 unlockTime;       // When the stake can be withdrawn
        uint256 lockPeriodId;     // Which lock period was chosen
        uint256 accumulatedReward;// Accumulated rewards
        uint256 lastRewardTime;   // Last time rewards were calculated
        bool isActive;            // Whether this stake is active
    }
    
    // User stakes mapping (user -> stake array)
    mapping(address => StakeInfo[]) public userStakes;
    mapping(address => uint256) public userStakeCount;
    
    // Global staking stats
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    uint256 public totalStakers;
    
    // User stats
    mapping(address => bool) public hasStaked; // Track if user has ever staked
    mapping(address => uint256) public userTotalStaked;
    mapping(address => uint256) public userTotalRewards;
    
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriodId, uint256 stakeIndex);
    event Withdrawn(address indexed user, uint256 amount, uint256 rewards, uint256 stakeIndex);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 stakeIndex);
    event LockPeriodAdded(uint256 indexed periodId, uint256 duration, uint256 multiplier, string name);
    event LockPeriodUpdated(uint256 indexed periodId, uint256 duration, uint256 multiplier, string name);
    event BaseAPYUpdated(uint256 oldAPY, uint256 newAPY);
    event MinimumStakeUpdated(uint256 oldAmount, uint256 newAmount);
    event EmergencyWithdrawToggled(bool enabled);

    constructor(
        address _stakingToken,
        address _rewardToken,
        address _owner
    ) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_owner != address(0), "Invalid owner");
        
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        
        // Transfer ownership to the specified owner
        _transferOwnership(_owner);
        
        // Initialize default lock periods
        _addLockPeriod(0, 10000, "No Lock");           // No lock, 1x multiplier
        _addLockPeriod(30 days, 12000, "30 Days");     // 30 days, 1.2x multiplier
        _addLockPeriod(90 days, 15000, "90 Days");     // 90 days, 1.5x multiplier
        _addLockPeriod(180 days, 20000, "180 Days");   // 180 days, 2x multiplier
        _addLockPeriod(365 days, 30000, "365 Days");   // 365 days, 3x multiplier
    }

    /**
     * @dev Stake tokens with specified lock period
     */
    function stake(uint256 _amount, uint256 _lockPeriodId) external nonReentrant whenNotPaused {
        require(_amount >= minimumStakeAmount, "Amount below minimum");
        require(_lockPeriodId < lockPeriodsCount, "Invalid lock period");
        require(stakingToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Transfer tokens to this contract
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Create stake info
        StakeInfo memory newStake = StakeInfo({
            amount: _amount,
            stakingTime: block.timestamp,
            unlockTime: block.timestamp.add(lockPeriods[_lockPeriodId].duration),
            lockPeriodId: _lockPeriodId,
            accumulatedReward: 0,
            lastRewardTime: block.timestamp,
            isActive: true
        });
        
        // Add to user stakes
        userStakes[msg.sender].push(newStake);
        uint256 stakeIndex = userStakes[msg.sender].length.sub(1);
        userStakeCount[msg.sender] = userStakeCount[msg.sender].add(1);
        
        // Update global stats
        totalStaked = totalStaked.add(_amount);
        userTotalStaked[msg.sender] = userTotalStaked[msg.sender].add(_amount);
        
        // Track if this is user's first stake
        if (!hasStaked[msg.sender]) {
            hasStaked[msg.sender] = true;
            totalStakers = totalStakers.add(1);
        }
        
        emit Staked(msg.sender, _amount, _lockPeriodId, stakeIndex);
    }

    /**
     * @dev Withdraw staked tokens and rewards
     */
    function withdraw(uint256 _stakeIndex) external nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        StakeInfo storage userStake = userStakes[msg.sender][_stakeIndex];
        require(userStake.isActive, "Stake not active");
        
        if (!emergencyWithdrawEnabled) {
            require(block.timestamp >= userStake.unlockTime, "Still locked");
        }
        
        // Calculate pending rewards
        uint256 pendingReward = _calculatePendingReward(msg.sender, _stakeIndex);
        
        // Update accumulated rewards
        userStake.accumulatedReward = userStake.accumulatedReward.add(pendingReward);
        userStake.lastRewardTime = block.timestamp;
        
        uint256 stakeAmount = userStake.amount;
        uint256 totalReward = userStake.accumulatedReward;
        
        // Mark stake as inactive
        userStake.isActive = false;
        userStake.amount = 0;
        userStakeCount[msg.sender] = userStakeCount[msg.sender].sub(1);
        
        // Update global stats
        totalStaked = totalStaked.sub(stakeAmount);
        totalRewardsPaid = totalRewardsPaid.add(totalReward);
        userTotalRewards[msg.sender] = userTotalRewards[msg.sender].add(totalReward);
        
        // Transfer stake amount back
        stakingToken.safeTransfer(msg.sender, stakeAmount);
        
        // Transfer rewards if any
        if (totalReward > 0) {
            rewardToken.safeTransfer(msg.sender, totalReward);
        }
        
        emit Withdrawn(msg.sender, stakeAmount, totalReward, _stakeIndex);
    }

    /**
     * @dev Claim rewards without withdrawing stake
     */
    function claimRewards(uint256 _stakeIndex) external nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        StakeInfo storage userStake = userStakes[msg.sender][_stakeIndex];
        require(userStake.isActive, "Stake not active");
        
        // Calculate pending rewards
        uint256 pendingReward = _calculatePendingReward(msg.sender, _stakeIndex);
        require(pendingReward > 0, "No rewards to claim");
        
        // Update accumulated rewards and last reward time
        userStake.accumulatedReward = userStake.accumulatedReward.add(pendingReward);
        userStake.lastRewardTime = block.timestamp;
        
        // Update stats
        totalRewardsPaid = totalRewardsPaid.add(pendingReward);
        userTotalRewards[msg.sender] = userTotalRewards[msg.sender].add(pendingReward);
        
        // Reset accumulated reward (since we're claiming it)
        uint256 totalReward = userStake.accumulatedReward;
        userStake.accumulatedReward = 0;
        
        // Transfer rewards
        rewardToken.safeTransfer(msg.sender, totalReward);
        
        emit RewardsClaimed(msg.sender, totalReward, _stakeIndex);
    }

    /**
     * @dev Calculate pending reward for a specific stake
     */
    function _calculatePendingReward(address _user, uint256 _stakeIndex) internal view returns (uint256) {
        StakeInfo storage userStake = userStakes[_user][_stakeIndex];
        
        if (!userStake.isActive || userStake.amount == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp.sub(userStake.lastRewardTime);
        LockPeriod storage lockPeriod = lockPeriods[userStake.lockPeriodId];
        
        // Calculate effective APY
        uint256 effectiveAPY = baseAPY.mul(lockPeriod.multiplier).div(BASIS_POINTS);
        
        // Calculate reward
        uint256 reward = userStake.amount
            .mul(effectiveAPY)
            .mul(timeElapsed)
            .div(BASIS_POINTS)
            .div(SECONDS_PER_YEAR);
            
        return reward;
    }

    // View functions
    
    /**
     * @dev Get user's stake information
     */
    function getUserStakes(address _user) external view returns (StakeInfo[] memory) {
        return userStakes[_user];
    }
    
    /**
     * @dev Get pending rewards for a specific stake
     */
    function getPendingReward(address _user, uint256 _stakeIndex) external view returns (uint256) {
        if (_stakeIndex >= userStakes[_user].length) {
            return 0;
        }
        
        uint256 pendingReward = _calculatePendingReward(_user, _stakeIndex);
        return userStakes[_user][_stakeIndex].accumulatedReward.add(pendingReward);
    }
    
    /**
     * @dev Get total pending rewards for user
     */
    function getTotalPendingRewards(address _user) external view returns (uint256) {
        uint256 totalPending = 0;
        
        for (uint256 i = 0; i < userStakes[_user].length; i++) {
            if (userStakes[_user][i].isActive) {
                uint256 pendingReward = _calculatePendingReward(_user, i);
                totalPending = totalPending.add(userStakes[_user][i].accumulatedReward).add(pendingReward);
            }
        }
        
        return totalPending;
    }

    /**
     * @dev Get effective APY for a lock period
     */
    function getEffectiveAPY(uint256 _lockPeriodId) external view returns (uint256) {
        require(_lockPeriodId < lockPeriodsCount, "Invalid lock period");
        return baseAPY.mul(lockPeriods[_lockPeriodId].multiplier).div(BASIS_POINTS);
    }

    /**
     * @dev Get user's total active stake amount
     */
    function getUserTotalActiveStake(address _user) external view returns (uint256) {
        uint256 totalActive = 0;
        
        for (uint256 i = 0; i < userStakes[_user].length; i++) {
            if (userStakes[_user][i].isActive) {
                totalActive = totalActive.add(userStakes[_user][i].amount);
            }
        }
        
        return totalActive;
    }

    // Admin functions
    
    /**
     * @dev Add a new lock period
     */
    function addLockPeriod(uint256 _duration, uint256 _multiplier, string memory _name) external onlyOwner {
        _addLockPeriod(_duration, _multiplier, _name);
    }
    
    function _addLockPeriod(uint256 _duration, uint256 _multiplier, string memory _name) internal {
        require(_multiplier >= BASIS_POINTS, "Multiplier must be >= 1x");
        
        lockPeriods[lockPeriodsCount] = LockPeriod({
            duration: _duration,
            multiplier: _multiplier,
            name: _name
        });
        
        emit LockPeriodAdded(lockPeriodsCount, _duration, _multiplier, _name);
        lockPeriodsCount = lockPeriodsCount.add(1);
    }

    /**
     * @dev Update base APY
     */
    function setBaseAPY(uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 10000, "APY too high"); // Max 100% APY
        uint256 oldAPY = baseAPY;
        baseAPY = _newAPY;
        emit BaseAPYUpdated(oldAPY, _newAPY);
    }

    /**
     * @dev Update minimum stake amount
     */
    function setMinimumStakeAmount(uint256 _newAmount) external onlyOwner {
        uint256 oldAmount = minimumStakeAmount;
        minimumStakeAmount = _newAmount;
        emit MinimumStakeUpdated(oldAmount, _newAmount);
    }

    /**
     * @dev Toggle emergency withdraw
     */
    function toggleEmergencyWithdraw() external onlyOwner {
        emergencyWithdrawEnabled = !emergencyWithdrawEnabled;
        emit EmergencyWithdrawToggled(emergencyWithdrawEnabled);
    }

    /**
     * @dev Pause/Unpause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw of contract tokens (only owner)
     */
    function emergencyTokenWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be > 0");
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
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
