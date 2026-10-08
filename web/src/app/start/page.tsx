import type {Metadata} from 'next';
import {GuideHub} from '@/components/guides/GuideHub';
export const metadata:Metadata={title:'Getting started',description:'Choose your first step with Mercenta: catalogue, bounded Testnet agent or budget. Clear permissions and environment boundaries.',alternates:{canonical:'/start'},openGraph:{title:'Getting started · Mercenta',description:'Choose your first step with Mercenta: catalogue, bounded Testnet agent or budget. Clear permissions and environment boundaries.',url:'/start'}};
export default function Page(){return <GuideHub page="start"/>}
