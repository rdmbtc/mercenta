import '../product.css';
import {headers} from 'next/headers';
import {AccountConsole} from '@/components/product/AccountConsole';
import {MainnetWorkspace} from '@/components/product/MainnetWorkspace';
import {browseBootstrap} from '@/lib/catalog-bootstrap';
import {sectionFromSlug} from '@/lib/workspace-navigation';
export default async function AppPage({searchParams}:{searchParams:Promise<{section?:string}>}){
 const params=await searchParams;const h=await headers();
 if(h.get('x-mercenta-network')==='mainnet')return <MainnetWorkspace catalog={browseBootstrap} initialSection={params.section??'dashboard'}/>;
 const requested=sectionFromSlug(params.section??null);
 return <AccountConsole initialSection={requested==='Getting Started'?'Dashboard':requested??'Dashboard'} initialCatalog={browseBootstrap}/>;
}
