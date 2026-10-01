import type {Metadata} from "next";
export const metadata:Metadata={title:"Mercenta Status",description:"Mercenta status has moved to the unified product site.",alternates:{canonical:"https://mercenta.xyz/status"},robots:{index:false,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
