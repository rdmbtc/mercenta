// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/** Testnet-only, non-upgradeable seller-owned USDC budget vault. No admin, yield, external lending or customer-account access.
 * COGS/fees/reserve are seller-declared, not certified supplier quotes. Direct token transfers are NOT credited. */
contract MercentaProfitVault is ReentrancyGuard {
 using SafeERC20 for IERC20;
 address public constant USDC=0x3600000000000000000000000000000000000000;
 uint256 public constant CHAIN_ID=5042002;
 uint256 public constant MAX_SALE=10_000_000; // Six-decimal USDC, maximum 10 test USDC per settlement.
 enum Bucket {Restock,Fees,RefundReserve,OwnersPay,Tax,Opex}
 struct ProfitLot {uint256 units;uint256 unlockAt;}
 mapping(address=>mapping(uint8=>uint256)) public buckets;
 mapping(address=>mapping(bytes32=>bool)) public settled;
 mapping(address=>ProfitLot[]) private lots;
 mapping(address=>uint256) public profitTotal;
 mapping(address=>uint256) public profitCursor;
 mapping(address=>uint256) public allocatedMarginTotal;
 event SaleAllocated(address indexed seller,bytes32 indexed saleId,uint256 gross,uint256 cogs,uint256 fees,uint256 refundReserve,uint256 margin,uint256 profit,uint256 ownersPay,uint256 tax,uint256 opex,uint256 unlockAt);
 event BucketWithdrawn(address indexed seller,uint8 bucket,uint256 amount);
 event ProfitClaimed(address indexed seller,uint256 amount,uint256 throughLot);
 error InvalidInput();error WrongChain();error AlreadySettled();error MarginBelowFloor();error InsufficientBucket();error ProfitLocked();
 constructor(){if(block.chainid!=CHAIN_ID)revert WrongChain();if(IERC20Metadata(USDC).decimals()!=6)revert InvalidInput();}
 function settleSale(bytes32 saleId,uint256 gross,uint256 cogs,uint256 fees,uint256 refundReserve,uint16[4] calldata taps,uint16 minMarginBps) external nonReentrant {
  if(block.chainid!=CHAIN_ID)revert WrongChain();
  if(saleId==bytes32(0)||gross==0||gross>MAX_SALE||minMarginBps<500||minMarginBps>10000||taps[0]<500||taps[0]>3000||uint256(taps[0])+taps[1]+taps[2]+taps[3]!=10000)revert InvalidInput();
  if(settled[msg.sender][saleId])revert AlreadySettled();
  if(cogs+fees+refundReserve>=gross)revert MarginBelowFloor();
  uint256 margin=gross-cogs-fees-refundReserve;
  if(margin*10000<gross*minMarginBps)revert MarginBelowFloor();
  uint256 p=margin*taps[0]/10000;uint256 o=margin*taps[1]/10000;uint256 t=margin*taps[2]/10000;uint256 x=margin-p-o-t;
  if(p==0)revert InvalidInput();
  uint256 unlockAt=nextQuarter(block.timestamp);
  settled[msg.sender][saleId]=true;
  buckets[msg.sender][uint8(Bucket.Restock)]+=cogs;buckets[msg.sender][uint8(Bucket.Fees)]+=fees;buckets[msg.sender][uint8(Bucket.RefundReserve)]+=refundReserve;
  buckets[msg.sender][uint8(Bucket.OwnersPay)]+=o;buckets[msg.sender][uint8(Bucket.Tax)]+=t;buckets[msg.sender][uint8(Bucket.Opex)]+=x;
  lots[msg.sender].push(ProfitLot(p,unlockAt));profitTotal[msg.sender]+=p;allocatedMarginTotal[msg.sender]+=margin;
  uint256 beforeBalance=IERC20(USDC).balanceOf(address(this));IERC20(USDC).safeTransferFrom(msg.sender,address(this),gross);
  if(IERC20(USDC).balanceOf(address(this))-beforeBalance!=gross)revert InvalidInput();
  emit SaleAllocated(msg.sender,saleId,gross,cogs,fees,refundReserve,margin,p,o,t,x,unlockAt);
 }
 function withdrawBucket(uint8 bucket,uint256 amount) external nonReentrant {if(bucket>uint8(Bucket.Opex)||amount==0)revert InvalidInput();if(buckets[msg.sender][bucket]<amount)revert InsufficientBucket();buckets[msg.sender][bucket]-=amount;IERC20(USDC).safeTransfer(msg.sender,amount);emit BucketWithdrawn(msg.sender,bucket,amount);}
 function claimProfit(uint256 maxLots) external nonReentrant returns(uint256 amount){if(maxLots==0||maxLots>100)revert InvalidInput();uint256 i=profitCursor[msg.sender];uint256 end=i+maxLots;uint256 n=lots[msg.sender].length;if(end>n)end=n;for(;i<end;i++){ProfitLot storage lot=lots[msg.sender][i];if(lot.unlockAt>block.timestamp)break;amount+=lot.units;}if(amount==0)revert ProfitLocked();profitCursor[msg.sender]=i;profitTotal[msg.sender]-=amount;IERC20(USDC).safeTransfer(msg.sender,amount);emit ProfitClaimed(msg.sender,amount,i);}
 function profitLotCount(address seller) external view returns(uint256){return lots[seller].length;}
 function profitLot(address seller,uint256 index) external view returns(uint256 units,uint256 unlockAt){ProfitLot storage lot=lots[seller][index];return(lot.units,lot.unlockAt);}
 // Standard Julian/Gregorian conversion; next UTC Jan/Apr/Jul/Oct boundary, not a fixed 90-day approximation.
 function nextQuarter(uint256 timestamp) public pure returns(uint256){int256 L=int256(timestamp/86400)+68569+2440588;int256 N=4*L/146097;L=L-(146097*N+3)/4;int256 y=4000*(L+1)/1461001;L=L-1461*y/4+31;int256 m=80*L/2447;L=m/11;m=m+2-12*L;y=100*(N-49)+y+L;uint256 nextM=((uint256(m)-1)/3+1)*3+1;uint256 nextY=uint256(y);if(nextM>12){nextM=1;nextY++;}return _date(nextY,nextM,1)*86400;}
 function _date(uint256 year,uint256 month,uint256 day) private pure returns(uint256){int256 y=int256(year);int256 m=int256(month);int256 d=int256(day);int256 days_=d-32075+1461*(y+4800+(m-14)/12)/4+367*(m-2-(m-14)/12*12)/12-3*((y+4900+(m-14)/12)/100)/4-2440588;return uint256(days_);}
}
