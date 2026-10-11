import type {Metadata} from 'next';
import ReleaseComposer from '@/components/experience/ReleaseComposer';
export const metadata:Metadata={title:'Release notes',description:'Mercenta product notes and a local conventional-commit changelog composer.',alternates:{canonical:'/releases'},openGraph:{title:'Release notes',description:'Mercenta product notes and a local conventional-commit changelog composer.',url:'/releases',type:'website'},keywords:['mercenta release notes','conventional commit changelog','product updates']};
export default function Page(){return <ReleaseComposer/>}
