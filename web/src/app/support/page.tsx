import type {Metadata} from 'next';
import {GuideHub} from '@/components/guides/GuideHub';
export const metadata:Metadata={title:'Help centre',description:'Answers about regions, accounts, agent permissions and manual refund reviews by Mercenta Support.',alternates:{canonical:'/support'},openGraph:{title:'Help centre · Mercenta',description:'Answers about regions, accounts, agent permissions and manual refund reviews by Mercenta Support.',url:'/support',type:'website'},keywords:['buy gift cards with stablecoin','psn card crypto payment refund','steam wallet code crypto support']};
export default function Page(){return <GuideHub page="support"/>}
