import {parseAbi} from 'viem';
/** Official issuer addresses only. Presence of code does NOT grant investor eligibility. */
export const USYC_MAINNET = Object.freeze({
  chainId:5042 as const,
  usdc:'0x3600000000000000000000000000000000000000' as const,
  usyc:'0x8a5D989Bbb96929F689B0200f435f53dA42bF490' as const,
  teller:'0x51A8CE47dC08ba5CD19c7aa84EA6fD6664f60f9b' as const,
  entitlements:'0xb69ecb156Dc0028198028c501340d5367845ca72' as const,
  oracle:'0x4BC8d5aCD3d040d2903dD9C5B7048520c6ff537A' as const,
  source:'https://developers.circle.com/tokenized/usyc/smart-contracts',
  executionEnabled:false as const,
});
/** Issuer-documented Teller ABI, NOT a transaction client or authorization to invest. */
export const USYC_TELLER_ABI=parseAbi([
 'function deposit(uint256 assets,address receiver) returns (uint256 shares)',
 'function redeem(uint256 shares,address receiver,address account) returns (uint256 assets)',
]);
