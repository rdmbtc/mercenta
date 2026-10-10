import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';
it('Earn creates a foreground stacking context above the global atmosphere',()=>{const css=readFileSync('src/components/earn/earn.module.css','utf8');expect(css).toMatch(/\.root\{position:relative;z-index:1;/);expect(css).toContain('@media(prefers-reduced-motion:reduce)');});
