import type {Metadata} from 'next';import {EarnHub} from '@/components/earn/EarnHub';
export const metadata:Metadata={title:'Earn · External USDC yield',description:'Explore variable USDC supply interest in Aave V3 on Ethereum. Separate from Arc commerce; no Mercenta custody, guaranteed return or automatic bridging.',alternates:{canonical:'/earn'}};
export default function Page(){return <EarnHub/>;}
