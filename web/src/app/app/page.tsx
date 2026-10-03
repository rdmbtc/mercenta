import "../product.css";
import {AccountConsole} from "@/components/product/AccountConsole";
import {browseBootstrap} from '@/lib/catalog-bootstrap';
import {sectionFromSlug} from '@/lib/workspace-navigation';
export default async function AppPage({searchParams}:{searchParams:Promise<{section?:string}>}){
 const params=await searchParams;
 const requested=sectionFromSlug(params.section??null);
 return <AccountConsole initialSection={requested==='Getting Started'?'Dashboard':requested??'Dashboard'} initialCatalog={browseBootstrap}/>;
}
