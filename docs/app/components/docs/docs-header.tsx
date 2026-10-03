 'use client'
import {useState,useCallback} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type {Root} from 'fumadocs-core/page-tree'
import {SearchTrigger} from './search-dialog'
import {ThemeToggle} from './theme-toggle'
import {MobileSidebar} from './mobile-sidebar'
export function DocsHeader({tree}: {tree: Root}) {
 const [open,setOpen]=useState(false);const close=useCallback(()=>setOpen(false),[])
 return <><a className="md-skip" href="#docs-content">Skip to content</a><header className="md-header"><div className="md-header-inner"><div className="md-header-brand"><button type="button" className="md-menu-trigger" aria-label="Open menu" aria-expanded={open} onClick={()=>setOpen(true)}><span aria-hidden="true">☰</span></button><Link href="/docs" aria-label="Mercenta documentation home" className="md-brand"><Image src="/mercenta-mark.webp" alt="" width={26} height={26}/><span>mercenta.</span></Link><span className="md-brand-divider"/><span className="md-brand-section">Docs</span></div><div className="md-search"><SearchTrigger/></div><div className="md-header-actions"><ThemeToggle/><a className="md-open-app" href="https://app.mercenta.xyz">Open app <span aria-hidden="true">↗</span></a></div></div></header><MobileSidebar tree={tree} isOpen={open} onClose={close}/></>
}
