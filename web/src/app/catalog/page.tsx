import type {Metadata} from "next";
import "../product.css";
import {getCatalog} from "@/lib/supplier";
import {ProductCatalog} from "@/components/product/ProductCatalog";
export const metadata:Metadata={title:"Catalog",description:"Structured digital resources for software agents. Source prices and availability are verified before authorization.",alternates:{canonical:"/catalog"}};
export default async function CatalogPage(){const catalog=await getCatalog();return <ProductCatalog {...catalog}/>;}
