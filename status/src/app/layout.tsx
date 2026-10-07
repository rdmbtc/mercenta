import type {Metadata} from "next";
export const metadata: Metadata = { icons:{icon:[{url:'/favicon.ico?v=mercenta-2',sizes:'any'},{url:'/favicon-32.png',sizes:'32x32',type:'image/png'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180'}]},manifest:'/site.webmanifest',title:"Mercenta Status",description:"Mercenta status has moved to the unified product site.",alternates:{canonical:"https://mercenta.xyz/status"},robots:{index:false,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
