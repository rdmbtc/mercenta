import {test} from 'node:test';import assert from 'node:assert/strict';import {generateTractionReport} from './traction-reporter.mjs';
// Synthetic fixtures test metadata validation; none of these hashes are live evidence.
const fixture={pilotId:'fixture-pilot',externalEventId:'fixture-event',amountMicro:'1000000',evidenceClass:'VERIFIED',status:'ACCEPTED',chainId:5042002,confirmations:2,txHash:'0x'+'a'.repeat(64),verificationDigest:'b'.repeat(64),synthetic:false,consented:true};
test('missing explicit consent cannot become traction',()=>{const {consented,...r}=fixture;assert.equal(generateTractionReport({records:[r]}).tractionEligibleVolumeUsdc,'0.000000')});
test('missing provenance cannot become a real pilot',()=>{const {synthetic,...r}=fixture;assert.equal(generateTractionReport({records:[r]}).uniqueConsentedPilotsCount,0)});
test('same transaction attributed twice does not inflate volume',()=>{const r=generateTractionReport({records:[fixture,{...fixture,pilotId:'other-fixture',externalEventId:'other-event'}]});assert.equal(r.testnetVolumeUsdc,'1.000000');assert.equal(r.uniqueConsentedPilotsCount,1)});
test('unknown execution never counts toward settled volume',()=>{const r=generateTractionReport({records:[{...fixture,status:'QUARANTINED_UNKNOWN'}]});assert.equal(r.testnetVolumeUsdc,'0.000000')});
test('metadata-only reporter never certifies mainnet or real revenue',()=>{const r=generateTractionReport({records:[fixture]});assert.equal(r.productionReady,false);assert.equal(r.liveRevenueUsdc,'0.000000');assert.match(r.evidenceValidation,/STRUCTURAL_IMPORT_ONLY/)});
