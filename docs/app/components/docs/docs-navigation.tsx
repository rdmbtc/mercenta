'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Root, Node } from 'fumadocs-core/page-tree'
function contains(nodes: Node[], path: string): boolean { return nodes.some(n => n.type === 'page' ? n.url === path : n.type === 'folder' && contains(n.children, path)) }
function Nodes({nodes, path}: {nodes: Node[], path: string}) { return <>{nodes.map((node, i) => {
 if(node.type === 'separator') return <p key={i} className="md-nav-label">{node.name}</p>
 if(node.type === 'folder') return <details key={`${path}:${i}`} className="md-nav-folder" open={contains(node.children, path) || undefined}><summary>{node.name}<span aria-hidden="true">⌄</span></summary><div><Nodes nodes={node.children} path={path}/></div></details>
 return <Link key={node.url} href={node.url} aria-current={path === node.url ? 'page' : undefined} className="md-nav-link">{node.name}</Link>
 })}</> }
export function DocsNavigation({tree}: {tree: Root}) { const path = usePathname(); return <nav aria-label="Documentation navigation" className="md-navigation"><Nodes nodes={tree.children} path={path}/><div className="md-nav-footer"><a href="https://app.mercenta.xyz">Open workspace ↗</a><a href="https://github.com/rdmbtc/mercenta">Source on GitHub ↗</a></div></nav> }
