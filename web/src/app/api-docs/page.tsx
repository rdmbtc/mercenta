import '../product.css';import {headers} from 'next/headers';import {SwaggerReference} from '@/components/product/SwaggerReference';
export const metadata={title:'Mercenta · API reference',description:'OpenAPI and Swagger reference for Mercenta Testnet and Mainnet release gates.'};
export default async function ApiDocs(){const h=await headers();return <SwaggerReference hostMode={h.get('x-mercenta-network')==='mainnet'?'mainnet':'testnet'}/>}
