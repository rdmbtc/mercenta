import type {Metadata} from 'next';
import OperationsLab from '@/components/experience/OperationsLab';
export const metadata:Metadata={title:'Operations tools',description:'Mercenta operations layouts with clearly identified synthetic demonstrations.',alternates:{canonical:'/operations'},openGraph:{title:'Operations tools',description:'Operations layouts with clearly identified synthetic demonstrations.',url:'/operations',type:'website'},keywords:['mercenta operations','synthetic demo layouts','operations tools']};
export default function Page(){return <OperationsLab/>}
