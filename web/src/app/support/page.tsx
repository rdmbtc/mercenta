import type {Metadata} from 'next';
import {GuideHub} from '@/components/guides/GuideHub';
export const metadata:Metadata={title:'Help centre',description:'Answers about regions, accounts, agent permissions and manual refund reviews by Mercenta Support.',alternates:{canonical:'/support'},openGraph:{title:'Help centre · Mercenta',description:'Answers about regions, accounts, agent permissions and manual refund reviews by Mercenta Support.',url:'/support'}};
export default function Page(){return <GuideHub page="support"/>}
