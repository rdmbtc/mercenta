import {it,expect,vi,afterEach} from 'vitest';
import {regionLabel} from '@/lib/catalog-families';
afterEach(()=>vi.restoreAllMocks());
it('keeps region names stable across server and browser ICU revisions',()=>{
 const of=vi.spyOn(Intl.DisplayNames.prototype,'of').mockImplementation(code=>code==='HK'?'Hong Kong SAR China':'Palestinian Territories');
 const server=['HK','PS'].map(c=>regionLabel(c));
 of.mockImplementation(code=>code==='HK'?'Hong Kong':'Palestine');
 const browser=['HK','PS'].map(c=>regionLabel(c));
 expect(server).toEqual(['Hong Kong (HK)','Palestine (PS)']);
 expect(browser).toEqual(server);
 expect(of).not.toHaveBeenCalled();
});
it('keeps Russian region labels deterministic too',()=>{
 const of=vi.spyOn(Intl.DisplayNames.prototype,'of').mockImplementation(()=> 'unstable ICU label');
 expect(regionLabel('HK',true)).toBe('Гонконг (HK)');
 expect(regionLabel('PS',true)).toBe('Палестина (PS)');
 expect(of).not.toHaveBeenCalled();
});
