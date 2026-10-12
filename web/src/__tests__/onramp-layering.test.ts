import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

describe('funding page decorative-layer regression',()=>{
 it('places the opaque funding surface above the fixed global atmosphere',()=>{
  const css=readFileSync(resolve(process.cwd(),'src/components/onramp/onramp.css'),'utf8');
  const atmosphere=readFileSync(resolve(process.cwd(),'src/components/Atmosphere.module.css'),'utf8');
  const page=css.match(/\.onramp-page\{([^}]+)\}/)?.[1]??'';
  const backdrop=atmosphere.match(/\.root\s*\{([^}]+)\}/)?.[1]??'';
  expect(page).toMatch(/position:\s*relative\s*;/);
  expect(page).toMatch(/z-index:\s*1\s*;/);
  expect(page).toMatch(/isolation:\s*isolate\s*;/);
  expect(page).toMatch(/background:\s*var\(--o-bg\)\s*;/);
  expect(backdrop).toMatch(/z-index:\s*0\s*;/);
  expect(backdrop).toMatch(/pointer-events:\s*none\s*;/);
 });
});
