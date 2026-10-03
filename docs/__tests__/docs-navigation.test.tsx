import {describe,it,expect,vi,afterEach} from 'vitest'
import {render,screen,cleanup} from '@testing-library/react'
import type {Root} from 'fumadocs-core/page-tree'
import {DocsNavigation} from '../app/components/docs/docs-navigation'
import {MercentaDocsHome} from '../app/components/docs/mercenta-docs-home'
vi.mock('next/navigation',()=>({usePathname:()=>'/docs/account/funds'}))
vi.mock('next/link',()=>({default:({children,href,...props}: React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={href} {...props}>{children}</a>}))
afterEach(cleanup)
const tree:Root={name:'Docs',children:[{type:'page',name:'Documentation',url:'/docs'},{type:'separator',name:'Use Mercenta'},{type:'folder',name:'Account',children:[{type:'page',name:'Balances',url:'/docs/account/funds'}]},{type:'folder',name:'API',children:[{type:'page',name:'Endpoints',url:'/docs/api-reference/endpoints'}]}]}
describe('task-first documentation',()=>{
 it('labels the navigation landmark',()=>{render(<DocsNavigation tree={tree}/>);expect(screen.getByRole('navigation',{name:'Documentation navigation'})).toBeTruthy()})
 it('marks only the current page',()=>{render(<DocsNavigation tree={tree}/>);expect(screen.getByRole('link',{name:'Balances'}).getAttribute('aria-current')).toBe('page');expect(screen.getByRole('link',{name:'Documentation'}).getAttribute('aria-current')).toBeNull()})
 it('opens the active section but keeps unrelated sections collapsed',()=>{const {container}=render(<DocsNavigation tree={tree}/>);const folders=container.querySelectorAll('details');expect(folders[0].open).toBe(true);expect(folders[1].open).toBe(false)})
 it('keeps the app and source discoverable',()=>{render(<DocsNavigation tree={tree}/>);expect(screen.getByRole('link',{name:/Open workspace/}).getAttribute('href')).toBe('https://app.mercenta.xyz');expect(screen.getByRole('link',{name:/Source on GitHub/})).toBeTruthy()})
 it('gives the home page one clear heading',()=>{render(<MercentaDocsHome/>);expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);expect(screen.getByRole('link',{name:/Make your first purchase/}).getAttribute('href')).toBe('/docs/account/getting-started')})
 it('provides a direct route to all four primary tasks',()=>{render(<MercentaDocsHome/>);for(const label of ['Find and buy a product','Understand your balances','Set a spending limit','Build with the API'])expect(screen.getByRole('link',{name:new RegExp(label)})).toBeTruthy()})
 it('labels testnet and disabled capabilities without promising yield',()=>{render(<MercentaDocsHome/>);expect(screen.getByText(/Product delivery is simulated/)).toBeTruthy();expect(screen.getByRole('link',{name:/Check release gates/}).getAttribute('href')).toBe('/docs/guides/mainnet-readiness')})
})
