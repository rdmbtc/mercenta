import '../product.css';
import {headers} from 'next/headers';
import {AccountConsole} from '@/components/product/AccountConsole';
import {browseBootstrap} from '@/lib/catalog-bootstrap';
import {sectionFromSlug} from '@/lib/workspace-navigation';
export default async function AppPage({searchParams}:{searchParams:Promise<{section?:string}>}){
 const params=await searchParams;const h=await headers();
 const network=h.get('x-mercenta-network')==='mainnet'?'mainnet':'testnet';
 const requested=sectionFromSlug(params.section??null);
 return <AccountConsole network={network} initialSection={requested==='Getting Started'?'Dashboard':requested??'Dashboard'} initialCatalog={browseBootstrap}/>;
}
