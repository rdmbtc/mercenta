// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

/// @notice Non-upgradeable Arc Mainnet checkout router; not escrow, an AMM, lending or yield.
/// @dev Stock, procurement cash and actual fulfillment are off-chain facts vouched for by quoteSigner.
/// Quotes are issued only after server checks. A paid event does NOT prove delivery.
contract MercentaCheckout is Ownable2Step, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    address public constant USDC = 0x3600000000000000000000000000000000000000;
    uint256 public constant CHAIN_ID = 5042;
    uint256 public constant MARKUP_BPS = 900;
    uint256 public constant MAX_QUOTE_WINDOW = 5 minutes;
    uint256 public constant SIGNER_CHANGE_DELAY = 1 days;
    uint256 private constant NATIVE_SCALE = 1e12;
    bytes32 public constant QUOTE_TYPEHASH = keccak256("Quote(bytes32 orderId,address buyer,bytes32 skuHash,uint32 quantity,uint256 unitCostMicro,uint256 amountMicro,uint8 assetKind,uint48 validAfter,uint48 deadline,uint256 nonce,uint256 signerEpoch)");
    enum Asset { ERC20_USDC, NATIVE_USDC }
    struct Quote {
        bytes32 orderId;
        address buyer;
        bytes32 skuHash;
        uint32 quantity;
        uint256 unitCostMicro;
        uint256 amountMicro;
        uint8 assetKind;
        uint48 validAfter;
        uint48 deadline;
        uint256 nonce;
        uint256 signerEpoch;
    }
    struct Order {
        address buyer;
        uint8 assetKind;
        uint256 paidMicro;
        uint256 refundedMicro;
        bytes32 quoteHash;
    }
    address public immutable merchant;
    uint256 public immutable maxOrderMicro;
    uint256 public immutable dailyVolumeCapMicro;
    address public quoteSigner;
    address public pendingQuoteSigner;
    uint256 public signerChangeReadyAt;
    uint256 public signerEpoch = 1;
    uint256 public totalGrossMicro;
    uint256 public totalRefundedMicro;
    mapping(bytes32 => Order) public orders;
    mapping(bytes32 => bool) public cancelledOrders;
    mapping(address => mapping(uint256 => bool)) public nonceUsed;
    mapping(uint256 => uint256) public dayGrossMicro;

    event OrderPaid(bytes32 indexed orderId, address indexed buyer, bytes32 indexed quoteHash, address merchant, uint256 amountMicro, uint8 assetKind, bytes32 skuHash, uint32 quantity);
    event ManualRefund(bytes32 indexed orderId, address indexed buyer, uint256 amountMicro, uint8 assetKind, bytes32 supportCommitment);
    event NonceCancelled(address indexed buyer, uint256 nonce);
    event OrderCancelled(bytes32 indexed orderId);
    event QuoteSignerProposed(address indexed signer, uint256 readyAt);
    event QuoteSignerActivated(address indexed signer, uint256 epoch);
    event QuoteSignerProposalCancelled();
    event SurplusRecovered(address indexed asset, uint256 amount);
    error InvalidConfiguration();
    error WrongChain();
    error InvalidQuote();
    error InvalidSignature();
    error QuoteUnavailable();
    error OrderAlreadyPaid();
    error VolumeLimit();
    error NotOperator();
    error SignerChangeNotReady();
    error InvalidRefund();
    error TransferMismatch();
    error NativeTransferFailed();
    error DirectTransferNotSupported();
    error GovernanceRequired();

    /// @param owner_ Governance; prefer a reviewed multisig. Recipient and limits cannot be changed.
    /// @param signer_ EOA or ERC-1271 wallet allowed to authenticate server quotes. Not a withdrawal role.
    constructor(address owner_, address signer_, address merchant_, uint256 orderLimitMicro_, uint256 dayLimitMicro_)
        Ownable(owner_) EIP712("MercentaCheckout", "1") {
        if (block.chainid != CHAIN_ID) revert WrongChain();
        if (signer_ == address(0) || merchant_ == address(0) || merchant_ == address(this) || signer_ == address(this)
            || owner_ == address(this) || owner_ == USDC || merchant_ == USDC || signer_ == USDC
            || orderLimitMicro_ == 0 || orderLimitMicro_ > 1e18 || dayLimitMicro_ < orderLimitMicro_ || dayLimitMicro_ > 1e20
            || USDC.code.length == 0 || IERC20Metadata(USDC).decimals() != 6) revert InvalidConfiguration();
        merchant = merchant_;
        quoteSigner = signer_;
        maxOrderMicro = orderLimitMicro_;
        dailyVolumeCapMicro = dayLimitMicro_;
        _pause(); // Deployment alone must never silently open payment intake.
    }
    function quoteDigest(Quote calldata q) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(QUOTE_TYPEHASH, q.orderId, q.buyer, q.skuHash, q.quantity,
            q.unitCostMicro, q.amountMicro, q.assetKind, q.validAfter, q.deadline, q.nonce, q.signerEpoch)));
    }
    // Reuse OpenZeppelin ECDSA primitives without importing newer-EVM byte-copy helpers.
    function _validSignature(bytes32 digest, bytes calldata signature) private view returns (bool) {
        if (quoteSigner.code.length == 0) {
            (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, signature);
            return err == ECDSA.RecoverError.NoError && recovered == quoteSigner;
        }
        try IERC1271(quoteSigner).isValidSignature(digest, signature) returns (bytes4 magic) {
            return magic == IERC1271.isValidSignature.selector;
        } catch { return false; }
    }
    function retailAmount(uint256 unitCostMicro, uint32 quantity) public pure returns (uint256) {
        if (unitCostMicro == 0 || unitCostMicro > 1e18 || quantity == 0 || quantity > 100) revert InvalidQuote();
        return ((unitCostMicro * (10000 + MARKUP_BPS) + 9999) / 10000) * quantity;
    }
    function _consume(Quote calldata q, bytes calldata signature, Asset kind) private returns (bytes32 digest) {
        if (block.chainid != CHAIN_ID) revert WrongChain();
        if (q.orderId == bytes32(0) || q.skuHash == bytes32(0) || q.buyer != msg.sender || q.buyer == merchant
            || q.assetKind != uint8(kind) || q.signerEpoch != signerEpoch || q.validAfter == 0
            || q.deadline <= q.validAfter || uint256(q.deadline) - q.validAfter > MAX_QUOTE_WINDOW
            || q.amountMicro != retailAmount(q.unitCostMicro, q.quantity) || q.amountMicro > maxOrderMicro) revert InvalidQuote();
        if (block.timestamp < q.validAfter || block.timestamp >= q.deadline || cancelledOrders[q.orderId]
            || nonceUsed[q.buyer][q.nonce]) revert QuoteUnavailable();
        if (orders[q.orderId].buyer != address(0)) revert OrderAlreadyPaid();
        digest = quoteDigest(q);
        if (!_validSignature(digest, signature)) revert InvalidSignature();
        uint256 day = block.timestamp / 1 days;
        if (dayGrossMicro[day] + q.amountMicro > dailyVolumeCapMicro) revert VolumeLimit();
        nonceUsed[q.buyer][q.nonce] = true;
        orders[q.orderId] = Order(q.buyer, q.assetKind, q.amountMicro, 0, digest);
        dayGrossMicro[day] += q.amountMicro;
        totalGrossMicro += q.amountMicro;
    }
    function payUSDC(Quote calldata q, bytes calldata signature) external whenNotPaused nonReentrant {
        bytes32 digest = _consume(q, signature, Asset.ERC20_USDC);
        _exactTokenTransfer(q.buyer, merchant, q.amountMicro);
        emit OrderPaid(q.orderId, q.buyer, digest, merchant, q.amountMicro, q.assetKind, q.skuHash, q.quantity);
    }
    function payNativeUSDC(Quote calldata q, bytes calldata signature) external payable whenNotPaused nonReentrant {
        bytes32 digest = _consume(q, signature, Asset.NATIVE_USDC);
        if (msg.value != q.amountMicro * NATIVE_SCALE) revert TransferMismatch();
        _sendNative(merchant, msg.value);
        emit OrderPaid(q.orderId, q.buyer, digest, merchant, q.amountMicro, q.assetKind, q.skuHash, q.quantity);
    }
    function _exactTokenTransfer(address from, address to, uint256 amount) private {
        IERC20 token = IERC20(USDC);
        uint256 beforeTo = token.balanceOf(to);
        uint256 beforeFrom = token.balanceOf(from);
        token.safeTransferFrom(from, to, amount);
        uint256 afterTo = token.balanceOf(to);
        uint256 afterFrom = token.balanceOf(from);
        if (afterTo < beforeTo || afterFrom > beforeFrom || afterTo - beforeTo != amount || beforeFrom - afterFrom != amount) revert TransferMismatch();
    }
    function _sendNative(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert NativeTransferFailed();
    }
    /// @dev Only manual owner approval. Token refunds require merchant allowance and funds, not customer allowance.
    /// Refunds remain possible while sales are paused. The router never holds a funded refund reserve.
    function refundUSDC(bytes32 orderId, uint256 amountMicro, bytes32 supportCommitment) external onlyOwner nonReentrant {
        Order storage o = _refund(orderId, amountMicro, supportCommitment, Asset.ERC20_USDC);
        _exactTokenTransfer(merchant, o.buyer, amountMicro);
        emit ManualRefund(orderId, o.buyer, amountMicro, o.assetKind, supportCommitment);
    }
    function refundNativeUSDC(bytes32 orderId, uint256 amountMicro, bytes32 supportCommitment) external payable onlyOwner nonReentrant {
        Order storage o = _refund(orderId, amountMicro, supportCommitment, Asset.NATIVE_USDC);
        if (msg.value != amountMicro * NATIVE_SCALE) revert TransferMismatch();
        _sendNative(o.buyer, msg.value);
        emit ManualRefund(orderId, o.buyer, amountMicro, o.assetKind, supportCommitment);
    }
    function _refund(bytes32 orderId, uint256 amountMicro, bytes32 supportCommitment, Asset kind) private returns (Order storage o) {
        if (block.chainid != CHAIN_ID) revert WrongChain();
        o = orders[orderId];
        if (o.buyer == address(0) || o.assetKind != uint8(kind) || amountMicro == 0 || supportCommitment == bytes32(0)
            || amountMicro > o.paidMicro - o.refundedMicro) revert InvalidRefund();
        o.refundedMicro += amountMicro;
        totalRefundedMicro += amountMicro;
    }
    function cancelNonce(uint256 nonce) external {
        if (nonceUsed[msg.sender][nonce]) revert QuoteUnavailable();
        nonceUsed[msg.sender][nonce] = true;
        emit NonceCancelled(msg.sender, nonce);
    }
    function cancelOrder(bytes32 orderId) external {
        _operator();
        if (orderId == bytes32(0) || orders[orderId].buyer != address(0)) revert InvalidQuote();
        cancelledOrders[orderId] = true;
        emit OrderCancelled(orderId);
    }
    function _operator() private view { if (msg.sender != owner() && msg.sender != quoteSigner) revert NotOperator(); }
    function pauseSales() external { _operator(); _pause(); }
    function unpauseSales() external onlyOwner { _unpause(); }
    function proposeQuoteSigner(address next) external onlyOwner {
        if (next == address(0) || next == quoteSigner || next == address(this) || next == USDC) revert InvalidConfiguration();
        pendingQuoteSigner = next;
        signerChangeReadyAt = block.timestamp + SIGNER_CHANGE_DELAY;
        emit QuoteSignerProposed(next, signerChangeReadyAt);
    }
    function cancelQuoteSignerProposal() external onlyOwner {
        pendingQuoteSigner = address(0); signerChangeReadyAt = 0;
        emit QuoteSignerProposalCancelled();
    }
    function activateQuoteSigner() external onlyOwner {
        if (pendingQuoteSigner == address(0) || block.timestamp < signerChangeReadyAt) revert SignerChangeNotReady();
        quoteSigner = pendingQuoteSigner; pendingQuoteSigner = address(0); signerChangeReadyAt = 0; ++signerEpoch;
        if (!paused()) _pause(); // All old quotes invalidated; owner must deliberately reopen.
        emit QuoteSignerActivated(quoteSigner, signerEpoch);
    }
    function renounceOwnership() public pure override { revert GovernanceRequired(); }
    /// @dev Only unrelated accidental/forced balances; no buyer account, order credit or escrow is created by them.
    function recoverTokenSurplus(address token, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0) || amount == 0) revert InvalidConfiguration();
        IERC20(token).safeTransfer(merchant, amount);
        emit SurplusRecovered(token, amount);
    }
    function recoverNativeSurplus(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0 || amount > address(this).balance) revert InvalidConfiguration();
        _sendNative(merchant, amount); emit SurplusRecovered(address(0), amount);
    }
    receive() external payable { revert DirectTransferNotSupported(); }
    fallback() external payable { revert DirectTransferNotSupported(); }
}
