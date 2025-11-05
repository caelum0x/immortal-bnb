// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IMMBotToken
 * @dev Immortal AI Trading Bot utility token with:
 * - 2% tax on transfers (1% to liquidity, 1% burn)
 * - Governance features
 * - Staking rewards
 */
contract IMMBotToken is ERC20, ERC20Burnable, Ownable {
    // Tax configuration
    uint256 public constant TAX_PERCENTAGE = 2; // 2% total tax
    uint256 public constant BURN_PERCENTAGE = 1; // 1% burn
    uint256 public constant LIQUIDITY_PERCENTAGE = 1; // 1% to liquidity

    // Addresses
    address public liquidityWallet;
    address public stakingContract;

    // Tax exemptions
    mapping(address => bool) public isExemptFromTax;

    // Events
    event TaxCollected(address indexed from, uint256 burnAmount, uint256 liquidityAmount);
    event LiquidityWalletUpdated(address indexed newWallet);
    event StakingContractUpdated(address indexed newContract);
    event TaxExemptionUpdated(address indexed account, bool isExempt);

    /**
     * @dev Constructor
     * @param initialSupply Initial token supply (e.g., 1,000,000,000 tokens)
     */
    constructor(
        uint256 initialSupply
    ) ERC20("Immortal Bot Token", "IMMBOT") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, initialSupply * 10 ** decimals());

        // Set initial liquidity wallet to deployer
        liquidityWallet = msg.sender;

        // Exempt owner and contract from taxes
        isExemptFromTax[msg.sender] = true;
        isExemptFromTax[address(this)] = true;
    }

    /**
     * @dev Override transfer to include tax
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Skip tax if minting or burning
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        // Skip tax if either party is exempt
        if (isExemptFromTax[from] || isExemptFromTax[to]) {
            super._update(from, to, amount);
            return;
        }

        // Calculate tax amounts
        uint256 burnAmount = (amount * BURN_PERCENTAGE) / 100;
        uint256 liquidityAmount = (amount * LIQUIDITY_PERCENTAGE) / 100;
        uint256 netAmount = amount - burnAmount - liquidityAmount;

        // Burn tokens
        super._update(from, address(0), burnAmount);

        // Send to liquidity wallet
        if (liquidityAmount > 0 && liquidityWallet != address(0)) {
            super._update(from, liquidityWallet, liquidityAmount);
        }

        // Transfer remaining amount
        super._update(from, to, netAmount);

        emit TaxCollected(from, burnAmount, liquidityAmount);
    }

    /**
     * @dev Update liquidity wallet
     */
    function setLiquidityWallet(address _liquidityWallet) external onlyOwner {
        require(_liquidityWallet != address(0), "Invalid address");
        liquidityWallet = _liquidityWallet;
        emit LiquidityWalletUpdated(_liquidityWallet);
    }

    /**
     * @dev Set staking contract (for rewards distribution)
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
        isExemptFromTax[_stakingContract] = true;
        emit StakingContractUpdated(_stakingContract);
    }

    /**
     * @dev Update tax exemption status
     */
    function setTaxExemption(address account, bool exempt) external onlyOwner {
        isExemptFromTax[account] = exempt;
        emit TaxExemptionUpdated(account, exempt);
    }

    /**
     * @dev Allow owner to withdraw accidentally sent tokens
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot rescue IMMBOT");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Allow owner to withdraw BNB
     */
    function rescueBNB() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Receive BNB
     */
    receive() external payable {}
}
