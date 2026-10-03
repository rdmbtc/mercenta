 'use client'
import {useEffect, useRef} from 'react'
import type {Root} from 'fumadocs-core/page-tree'
import {usePathname} from 'next/navigation'
import {DocsNavigation} from './docs-navigation'
export function MobileSidebar({tree,isOpen,onClose}: {tree: Root,isOpen: boolean,onClose: ()=>void}) {
 const dialog = useRef<HTMLDialogElement>(null); const path = usePathname()
 useEffect(()=>{onClose()},[path,onClose])
 useEffect(()=>{const d=dialog.current;if(!d)return;if(isOpen){const active=document.activeElement as HTMLElement;d.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return ()=>{d.close();document.body.style.overflow=overflow;active?.focus()}}else d.close()},[isOpen])
 return <dialog ref={dialog} className="md-mobile-menu" aria-labelledby="docs-menu-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="md-mobile-menu-heading"><h2 id="docs-menu-title">Documentation</h2><button type="button" aria-label="Close menu" onClick={onClose}>×</button></div><DocsNavigation tree={tree}/></dialog>
}
