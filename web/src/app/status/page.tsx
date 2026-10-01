import type {Metadata} from "next";
import "../product.css";
import {ProductStatus} from "@/components/product/ProductStatus";
export const metadata:Metadata={title:"Status",description:"On-demand endpoint health and explicit monitoring coverage for Mercenta.",alternates:{canonical:"/status"}};
export default function StatusPage(){return <ProductStatus/>}
