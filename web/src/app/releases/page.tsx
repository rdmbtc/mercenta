import type {Metadata} from 'next';
import ReleaseComposer from '@/components/experience/ReleaseComposer';
export const metadata:Metadata={title:'Release notes',description:'Mercenta product notes and a local conventional-commit changelog composer.',alternates:{canonical:'/releases'}};
export default function Page(){return <ReleaseComposer/>}
