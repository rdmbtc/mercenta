import type {Metadata} from 'next';
import OperationsLab from '@/components/experience/OperationsLab';
export const metadata:Metadata={title:'Operations tools',description:'Mercenta operations layouts with clearly identified synthetic demonstrations.',alternates:{canonical:'/operations'}};
export default function Page(){return <OperationsLab/>}
