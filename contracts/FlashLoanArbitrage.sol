// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashLoanArbitrage
 * @notice Executes arbitrage strategies using flash loans from PancakeSwap V3
 * @dev Implements the flash loan callback interface
 */
contract FlashLoanArbitrage is Ownable, ReentrancyGuard {
    // PancakeSwap V3 Pool interface
    interface IPancakeV3Pool {
        function flash(
            address recipient,
            uint256 amount0,
            uint256 amount1,
            bytes calldata data
        ) external;
    }

    // Uniswap V2 Router interface
    interface IUniswapV2Router {
        function swapExactTokensForTokens(
            uint256 amountIn,
            uint256 amountOutMin,
            address[] calldata path,
            address to,
            uint256 deadline
        ) external returns (uint256[] memory amounts);

        function getAmountsOut(uint256 amountIn, address[] calldata path)
            external
            view
            returns (uint256[] memory amounts);
    }

    struct ArbitrageParams {
        address buyRouter;      // Router to buy from
        address sellRouter;     // Router to sell on
        address[] buyPath;      // Token path for buy
        address[] sellPath;     // Token path for sell
        uint256 minProfit;      // Minimum profit required
    }

    // Events
    event ArbitrageExecuted(
        address indexed token,
        uint256 loanAmount,
        uint256 profit,
        uint256 timestamp
    );

    event ProfitWithdrawn(address indexed token, uint256 amount);

    /**
     * @notice Initialize flash loan arbitrage
     * @param pool PancakeSwap V3 pool to borrow from
     * @param params Arbitrage parameters
     */
    function executeFlashLoanArbitrage(
        address pool,
        uint256 amount0,
        uint256 amount1,
        ArbitrageParams calldata params
    ) external onlyOwner nonReentrant {
        require(amount0 > 0 || amount1 > 0, "Invalid loan amount");

        // Encode params for callback
        bytes memory data = abi.encode(params);

        // Request flash loan
        IPancakeV3Pool(pool).flash(address(this), amount0, amount1, data);
    }

    /**
     * @notice PancakeSwap V3 flash loan callback
     * @dev This function is called by the pool after sending tokens
     */
    function pancakeV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external {
        // Decode params
        ArbitrageParams memory params = abi.decode(data, (ArbitrageParams));

        // Get the borrowed token
        address token = params.buyPath[0];
        uint256 loanAmount = IERC20(token).balanceOf(address(this)) - fee0;

        // Execute arbitrage
        uint256 profit = _executeArbitrage(loanAmount, params);

        // Calculate total repayment
        uint256 totalRepayment = loanAmount + fee0;

        // Ensure we have enough to repay
        require(
            IERC20(token).balanceOf(address(this)) >= totalRepayment,
            "Insufficient funds to repay loan"
        );

        // Ensure minimum profit
        require(profit >= params.minProfit, "Insufficient profit");

        // Repay flash loan
        IERC20(token).transfer(msg.sender, totalRepayment);

        emit ArbitrageExecuted(token, loanAmount, profit, block.timestamp);
    }

    /**
     * @notice Execute the arbitrage strategy
     * @dev Buy low on one DEX, sell high on another
     */
    function _executeArbitrage(
        uint256 loanAmount,
        ArbitrageParams memory params
    ) private returns (uint256 profit) {
        address token = params.buyPath[0];

        // Record initial balance
        uint256 initialBalance = IERC20(token).balanceOf(address(this));

        // Step 1: Approve buy router
        IERC20(token).approve(params.buyRouter, loanAmount);

        // Step 2: Buy on first DEX
        uint256[] memory buyAmounts = IUniswapV2Router(params.buyRouter)
            .swapExactTokensForTokens(
                loanAmount,
                0, // Accept any amount (will check profit later)
                params.buyPath,
                address(this),
                block.timestamp + 300
            );

        uint256 boughtAmount = buyAmounts[buyAmounts.length - 1];
        address intermediateToken = params.buyPath[params.buyPath.length - 1];

        // Step 3: Approve sell router
        IERC20(intermediateToken).approve(params.sellRouter, boughtAmount);

        // Step 4: Sell on second DEX
        uint256[] memory sellAmounts = IUniswapV2Router(params.sellRouter)
            .swapExactTokensForTokens(
                boughtAmount,
                0, // Accept any amount (will check profit later)
                params.sellPath,
                address(this),
                block.timestamp + 300
            );

        // Calculate profit
        uint256 finalBalance = IERC20(token).balanceOf(address(this));
        profit = finalBalance > initialBalance ? finalBalance - initialBalance : 0;

        return profit;
    }

    /**
     * @notice Simulate arbitrage without executing
     * @dev View function to check profitability before execution
     */
    function simulateArbitrage(
        uint256 loanAmount,
        ArbitrageParams calldata params
    ) external view returns (uint256 expectedProfit, bool profitable) {
        // Get expected amounts from buy DEX
        uint256[] memory buyAmounts = IUniswapV2Router(params.buyRouter)
            .getAmountsOut(loanAmount, params.buyPath);

        uint256 boughtAmount = buyAmounts[buyAmounts.length - 1];

        // Get expected amounts from sell DEX
        uint256[] memory sellAmounts = IUniswapV2Router(params.sellRouter)
            .getAmountsOut(boughtAmount, params.sellPath);

        uint256 soldAmount = sellAmounts[sellAmounts.length - 1];

        // Calculate flash loan fee (0.09% for PancakeSwap V3)
        uint256 flashLoanFee = (loanAmount * 9) / 10000;
        uint256 totalRepayment = loanAmount + flashLoanFee;

        // Calculate profit
        if (soldAmount > totalRepayment) {
            expectedProfit = soldAmount - totalRepayment;
            profitable = expectedProfit >= params.minProfit;
        } else {
            expectedProfit = 0;
            profitable = false;
        }

        return (expectedProfit, profitable);
    }

    /**
     * @notice Withdraw profits
     * @param token Token to withdraw
     */
    function withdrawProfit(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No profit to withdraw");

        IERC20(token).transfer(owner(), balance);

        emit ProfitWithdrawn(token, balance);
    }

    /**
     * @notice Withdraw native token (BNB)
     */
    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");

        payable(owner()).transfer(balance);
    }

    /**
     * @notice Approve token spending for a router
     * @dev Useful for setting up approvals before arbitrage
     */
    function approveRouter(address token, address router, uint256 amount)
        external
        onlyOwner
    {
        IERC20(token).approve(router, amount);
    }

    // Receive function to accept BNB
    receive() external payable {}
}
