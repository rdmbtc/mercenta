import type {Metadata} from 'next';
import {ArcOnrampKit} from '@/components/onramp/ArcOnrampKit';
import Link from 'next/link';
export const metadata:Metadata={title:'Add USDC | Mercenta',description:'Fund your signed-in wallet with USDC through Circle’s hosted onramp. Availability, verification and fees are determined by the provider.',alternates:{canonical:'/onramp'}};
export default function OnrampPage(){return <main className="onramp-page"><nav className="onramp-top" aria-label="Funding navigation"><Link href="/" className="onramp-brand">MERCEN<span>TA</span></Link><Link href="/app?section=funds" aria-label="Return to workspace">Workspace ↗</Link></nav><ArcOnrampKit defaultAmount="50"/></main>;}
