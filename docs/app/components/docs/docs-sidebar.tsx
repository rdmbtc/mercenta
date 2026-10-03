import type { Root } from 'fumadocs-core/page-tree'
import { DocsNavigation } from './docs-navigation'
export function DocsSidebar({tree}: {tree: Root}) { return <aside className="md-sidebar"><DocsNavigation tree={tree}/></aside> }
