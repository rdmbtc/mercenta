import {test} from 'node:test';
import assert from 'node:assert/strict';
import {range} from '../src/services/account.js';
for(const [period,days] of [['24h',1],['7d',7],['30d',30],['90d',90]] as const)test('overview exact rolling range '+period,()=>{const now=Date.UTC(2026,9,8,14,15);assert.deepEqual(range(period,undefined,undefined,now),{from:now-days*86400000,to:now})});
test('overview rejects unrecognised periods',()=>{assert.throws(()=>range('100d'),/INVALID_DATE_RANGE/)});
