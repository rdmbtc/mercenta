import {source} from '@/lib/docs-source'
import {DocsSidebar} from '../components/docs/docs-sidebar'
import {DocsHeader} from '../components/docs/docs-header'
export default function DocsLayout({children}: {children: React.ReactNode}) { return <div className="md-shell"><DocsHeader tree={source.pageTree}/><div className="md-layout"><DocsSidebar tree={source.pageTree}/><main id="docs-content" tabIndex={-1} className="md-content">{children}<footer className="md-footer"><span>Mercenta documentation</span><a href="/docs/guides/mainnet-readiness">Arc Testnet · View release gates ↗</a></footer></main></div></div> }
