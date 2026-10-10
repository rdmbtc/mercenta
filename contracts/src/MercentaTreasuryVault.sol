// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUSYCTeller {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address account) external returns (uint256 assets);
}

/// @notice Separate merchant-capital vault. NOT customer custody or a guaranteed-yield product.
/// @dev Owner attests issuer access and off-chain liabilities. Attestations are NOT issuer proofs.
///      Official Arc Mainnet addresses; no upgrade/proxy/arbitrary execution surface in this vault.
contract MercentaTreasuryVault is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    uint256 public constant CHAIN_ID = 5042;
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    IERC20 public constant USYC = IERC20(0x8a5D989Bbb96929F689B0200f435f53dA42bF490);
    IUSYCTeller public constant TELLER = IUSYCTeller(0x51A8CE47dC08ba5CD19c7aa84EA6fD6664f60f9b);
    uint256 public constant SNAPSHOT_MAX_AGE = 15;
    address public immutable merchant;
    uint256 public immutable reserveFloorMicro;
    uint256 public immutable cycleLimitMicro;
    uint256 public immutable dayLimitMicro;
    uint256 public immutable maximumShares;
    address public keeper;
    bool public issuerAccessAttested;
    uint256 public accountedCashMicro;
    uint256 public accountedShares;
    uint256 public additionalProtectedMicro;
    uint48 public snapshotAt;
    bytes32 public snapshotHash;
    mapping(bytes32 => bool) public actionUsed;
    mapping(uint256 => uint256) public daySubscribedMicro;
    error InvalidConfiguration();
    error UnauthorizedKeeper();
    error UnsafeLiquidity();
    error StaleSnapshot();
    error InvalidAction();
    error InexactSettlement();
    event CapitalFunded(uint256 amountMicro);
    event RiskSnapshot(bytes32 indexed hash, uint256 additionalProtectedMicro, uint48 at);
    event IssuerAccessAttested(bool approved);
    event KeeperChanged(address indexed keeper);
    event Subscribed(bytes32 indexed actionId, uint256 assetsMicro, uint256 shares);
    event Redeemed(bytes32 indexed actionId, uint256 shares, uint256 assetsMicro);
    event MerchantWithdrawal(uint256 amountMicro);

    constructor(address owner_, address merchant_, address keeper_, uint256 reserveFloor_,
        uint256 cycleLimit_, uint256 dayLimit_, uint256 maximumShares_) Ownable(owner_) {
        if (block.chainid != CHAIN_ID || merchant_ == address(0) || keeper_ == address(0)
            || reserveFloor_ == 0 || cycleLimit_ == 0 || dayLimit_ < cycleLimit_ || maximumShares_ == 0
            || address(USDC).code.length == 0 || address(USYC).code.length == 0
            || address(TELLER).code.length == 0) revert InvalidConfiguration();
        if (IERC20Metadata(address(USDC)).decimals() != 6 || IERC20Metadata(address(USYC)).decimals() != 6)
            revert InvalidConfiguration();
        merchant = merchant_; keeper = keeper_; reserveFloorMicro = reserveFloor_;
        cycleLimitMicro = cycleLimit_; dayLimitMicro = dayLimit_; maximumShares = maximumShares_;
        _pause();
    }
    modifier onlyOperator() {
        if (msg.sender != owner() && msg.sender != keeper) revert UnauthorizedKeeper();
        _;
    }
    /// @notice Only the owner can fund accounted merchant capital. Direct token gifts are unaccounted.
    function fundMerchantCapital(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAction();
        uint256 beforeCash = USDC.balanceOf(address(this));
        uint256 beforeOwner = USDC.balanceOf(msg.sender);
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        if (USDC.balanceOf(address(this)) != beforeCash + amount
            || USDC.balanceOf(msg.sender) + amount != beforeOwner) revert InexactSettlement();
        accountedCashMicro += amount;
        emit CapitalFunded(amount);
    }
    /// @notice Trusted owner must cover liabilities, refunds, gas, pending spends and obligations.
    /// @dev Contract cannot discover these from off-chain books. Never let an LLM set this snapshot.
    function recordRiskSnapshot(uint256 additionalProtected, bytes32 evidenceHash) external onlyOwner {
        if (evidenceHash == bytes32(0)) revert InvalidAction();
        additionalProtectedMicro = additionalProtected;
        snapshotAt = uint48(block.timestamp); snapshotHash = evidenceHash;
        emit RiskSnapshot(evidenceHash, additionalProtected, snapshotAt);
    }
    function attestIssuerAccess(bool approved) external onlyOwner {
        issuerAccessAttested = approved;
        if (!paused()) _pause();
        emit IssuerAccessAttested(approved);
    }
    function setKeeper(address keeper_) external onlyOwner {
        if (keeper_ == address(0)) revert InvalidConfiguration();
        keeper = keeper_; if (!paused()) _pause(); emit KeeperChanged(keeper_);
    }
    function pause() external onlyOperator { _pause(); }
    function unpause() external onlyOwner {
        if (!issuerAccessAttested) revert InvalidConfiguration();
        _freshSnapshot(); _unpause();
    }
    /// @notice Exact USDC subscription; minShares is checked atomically AFTER Teller settlement.
    function subscribe(bytes32 actionId, uint256 assets, uint256 minShares, uint48 deadline)
        external onlyOperator whenNotPaused nonReentrant returns (uint256 shares) {
        _consumeAction(actionId, deadline); _freshSnapshot();
        if (!issuerAccessAttested || assets == 0 || assets > cycleLimitMicro || minShares == 0)
            revert InvalidAction();
        uint256 beforeCash = USDC.balanceOf(address(this));
        uint256 beforeShares = USYC.balanceOf(address(this));
        uint256 protectedCash = reserveFloorMicro + additionalProtectedMicro;
        if (accountedCashMicro < assets || accountedCashMicro - assets < protectedCash
            || beforeCash < accountedCashMicro) revert UnsafeLiquidity();
        uint256 day = block.timestamp / 1 days;
        if (daySubscribedMicro[day] + assets > dayLimitMicro) revert InvalidAction();
        daySubscribedMicro[day] += assets;
        USDC.forceApprove(address(TELLER), assets);
        shares = TELLER.deposit(assets, address(this));
        USDC.forceApprove(address(TELLER), 0);
        if (USDC.balanceOf(address(this)) + assets != beforeCash || shares < minShares
            || USYC.balanceOf(address(this)) != beforeShares + shares || shares == 0
            || accountedShares + shares > maximumShares) revert InexactSettlement();
        accountedCashMicro -= assets; accountedShares += shares;
        emit Subscribed(actionId, assets, shares);
    }
    /// @notice Owner may attempt redemption while paused. Keeper cannot operate when paused.
    /// @dev Teller revert or failed balance check rolls back the entire operation, including its ID.
    function redeem(bytes32 actionId, uint256 shares, uint256 minAssets, uint48 deadline)
        external onlyOperator nonReentrant returns (uint256 assets) {
        if (paused() && msg.sender != owner()) revert UnauthorizedKeeper();
        _consumeAction(actionId, deadline);
        if (shares == 0 || shares > accountedShares || minAssets == 0) revert InvalidAction();
        uint256 beforeCash = USDC.balanceOf(address(this));
        uint256 beforeShares = USYC.balanceOf(address(this));
        USYC.forceApprove(address(TELLER), shares);
        assets = TELLER.redeem(shares, address(this), address(this));
        USYC.forceApprove(address(TELLER), 0);
        if (assets < minAssets || assets == 0 || USDC.balanceOf(address(this)) != beforeCash + assets
            || USYC.balanceOf(address(this)) + shares != beforeShares) revert InexactSettlement();
        accountedShares -= shares; accountedCashMicro += assets;
        emit Redeemed(actionId, shares, assets);
    }
    /// @notice Manual owner payout only to immutable merchant, preserving fresh protected liquidity.
    function withdrawMerchantCash(uint256 assets) external onlyOwner nonReentrant {
        _freshSnapshot();
        if (assets == 0 || accountedCashMicro < assets
            || accountedCashMicro - assets < reserveFloorMicro + additionalProtectedMicro)
            revert UnsafeLiquidity();
        uint256 beforeCash = USDC.balanceOf(address(this));
        uint256 beforeMerchant = USDC.balanceOf(merchant);
        if (beforeCash < accountedCashMicro) revert UnsafeLiquidity();
        accountedCashMicro -= assets; USDC.safeTransfer(merchant, assets);
        if (USDC.balanceOf(address(this)) + assets != beforeCash
            || USDC.balanceOf(merchant) != beforeMerchant + assets) revert InexactSettlement();
        emit MerchantWithdrawal(assets);
    }
    function _freshSnapshot() private view {
        if (snapshotHash == bytes32(0) || block.timestamp > uint256(snapshotAt) + SNAPSHOT_MAX_AGE)
            revert StaleSnapshot();
    }
    function _consumeAction(bytes32 id, uint48 deadline) private {
        if (id == bytes32(0) || actionUsed[id] || deadline <= block.timestamp
            || deadline > block.timestamp + 60) revert InvalidAction();
        actionUsed[id] = true;
    }
    function renounceOwnership() public override onlyOwner { revert InvalidConfiguration(); }
    receive() external payable { revert InvalidAction(); }
}
