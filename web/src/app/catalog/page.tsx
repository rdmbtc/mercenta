import type {Metadata} from "next";
import "../product.css";
import {browseBootstrap} from "@/lib/catalog-bootstrap";
import {BrowseCatalog} from "@/components/product/BrowseCatalog";
export const metadata:Metadata={title:"Catalog",description:"Structured digital resources for software agents. Source prices and availability are verified before authorization.",alternates:{canonical:"/catalog"}};
export default function CatalogPage(){return <BrowseCatalog initial={browseBootstrap}/>;}
