#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

/**
 * Generates a clean, verifiable metrics report from operational evidence logs.
 * Separates synthetic and testnet data from real financial revenue.
 */
export function generateTractionReport(inputData) {
  if (!inputData || typeof inputData !== 'object') {
    throw new Error('INVALID_INPUT_DATA');
  }

  const records = Array.isArray(inputData.records) ? inputData.records : [];
  const seenEventIds = new Set();
  const seenTxHashes = new Set();
  const consentedPilots = new Set();

  let verifiedCount = 0;
  let simulatedCount = 0;
  let mirrorCount = 0;
  let testnetVolumeMicro = 0n;
  let tractionEligibleMicro = 0n;

  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    const eventId = record.pilotId && record.externalEventId ? JSON.stringify([record.pilotId,record.externalEventId]) : '';
    if (!eventId || seenEventIds.has(eventId)) {
      continue; // Skip missing or duplicate events
    }
    seenEventIds.add(eventId);

    const isSynthetic = record.synthetic !== false; // Missing provenance is never real pilot evidence.
    const isConsented = record.consented === true && record.status === 'ACCEPTED';
    const pilotId = String(record.pilotId || '');
    const evidenceClass = String(record.evidenceClass || 'SIMULATED');

    let amtMicro = 0n;
    try {
      if (typeof record.amountMicro === 'string' && /^\d+$/.test(record.amountMicro)) {
        amtMicro = BigInt(record.amountMicro);
      }
    } catch {
      amtMicro = 0n;
    }

    const hasEvidence = record.status==='ACCEPTED' && record.chainId===5042002 && Number.isInteger(record.confirmations) && record.confirmations>=2 && /^0x[\da-f]{64}$/i.test(record.txHash??'') && /^[\da-f]{64}$/i.test(record.verificationDigest??'') && amtMicro>0n;
    if (evidenceClass === 'VERIFIED' && hasEvidence && !seenTxHashes.has(record.txHash.toLowerCase())) {
      seenTxHashes.add(record.txHash.toLowerCase());
      verifiedCount++;
      testnetVolumeMicro += amtMicro;
      if (!isSynthetic && isConsented && pilotId) {
        consentedPilots.add(pilotId);
        tractionEligibleMicro += amtMicro;
      }
    } else if (evidenceClass === 'TESTNET_MIRROR' && /^0x[\da-f]{64}$/i.test(record.txHash??'') && record.chainId===5042002 && record.status==='ACCEPTED') {
      mirrorCount++;
      testnetVolumeMicro += amtMicro;
    } else {
      simulatedCount++;
    }
  }

  const formatUsd = (micro) => {
    const whole = micro / 1000000n;
    const dec = (micro % 1000000n).toString().padStart(6, '0');
    return `${whole}.${dec}`;
  };

  const draftArgv = [
    'update-traction',
    '--project', 'mercenta',
    '--pilots', String(consentedPilots.size),
    '--testnet-volume-usdc', formatUsd(testnetVolumeMicro),
    '--verified-txs', String(verifiedCount)
  ];

  return {
    timestamp: new Date().toISOString(),
    uniqueConsentedPilotsCount: consentedPilots.size,
    totalEventsProcessed: seenEventIds.size,
    verifiedEventsCount: verifiedCount,
    simulatedEventsCount: simulatedCount,
    testnetMirrorEventsCount: mirrorCount,
    testnetVolumeUsdc: formatUsd(testnetVolumeMicro),
    tractionEligibleVolumeUsdc: formatUsd(tractionEligibleMicro),
    evidenceValidation: 'STRUCTURAL_IMPORT_ONLY_REVERIFY_ON_CHAIN_BEFORE_SUBMISSION',
    productionReady: false,
    liveRevenueUsdc: '0.000000', // Strictly separated: no real live revenue claimed
    evidenceClasses: {
      SIMULATED: simulatedCount,
      TESTNET_MIRROR: mirrorCount,
      VERIFIED: verifiedCount
    },
    cliCommandDrafts: [
      {
        tool: 'arc-canteen',
        syntaxStatus: 'UNVERIFIED', // Official CLI flags unverified in this isolated environment
        argv: draftArgv
      }
    ]
  };
}

export function runSelfTest() {
  let recordsFixtureCounter=0;
  // Test 1: Empty input returns zeroed metrics
  const emptyReport = generateTractionReport({ records: [] });
  assert.equal(emptyReport.uniqueConsentedPilotsCount, 0);
  assert.equal(emptyReport.totalEventsProcessed, 0);
  assert.equal(emptyReport.testnetVolumeUsdc, '0.000000');
  assert.equal(emptyReport.liveRevenueUsdc, '0.000000');
  assert.equal(emptyReport.cliCommandDrafts[0]?.syntaxStatus, 'UNVERIFIED');

  // Test 2: Synthetic input is never counted towards pilot count or eligible traction
  const syntheticInput = {
    records: [
      {
        externalEventId: 'syn-1',
        pilotId: 'pilot-syn',
        amountMicro: '50000000',
        evidenceClass: 'VERIFIED',
        status: 'ACCEPTED', chainId: 5042002, confirmations: 2, verificationDigest: 'a'.repeat(64),
        txHash: '0x' + (String.fromCharCode(97 + recordsFixtureCounter++)).repeat(64),
        synthetic: true,
        consented: true
      }
    ]
  };
  const synReport = generateTractionReport(syntheticInput);
  assert.equal(synReport.uniqueConsentedPilotsCount, 0, 'Synthetic pilots must not count');
  assert.equal(synReport.tractionEligibleVolumeUsdc, '0.000000', 'Synthetic volume must not count towards traction');
  assert.equal(synReport.verifiedEventsCount, 1);

  // Test 3: Real consented verified input counts toward traction
  const realInput = {
    records: [
      {
        externalEventId: 'real-1',
        pilotId: 'pilot-agency-a',
        amountMicro: '25000000', // $25.00
        evidenceClass: 'VERIFIED',
        status: 'ACCEPTED', chainId: 5042002, confirmations: 2, verificationDigest: 'a'.repeat(64),
        txHash: '0x' + (String.fromCharCode(97 + recordsFixtureCounter++)).repeat(64),
        synthetic: false,
        consented: true
      },
      {
        externalEventId: 'real-1', // Duplicate
        pilotId: 'pilot-agency-a',
        amountMicro: '25000000',
        evidenceClass: 'VERIFIED',
        status: 'ACCEPTED', chainId: 5042002, confirmations: 2, verificationDigest: 'a'.repeat(64),
        txHash: '0x' + (String.fromCharCode(97 + recordsFixtureCounter++)).repeat(64),
        synthetic: false,
        consented: true
      },
      {
        externalEventId: 'real-2',
        pilotId: 'pilot-agency-b',
        amountMicro: '15000000', // $15.00
        evidenceClass: 'VERIFIED',
        status: 'ACCEPTED', chainId: 5042002, confirmations: 2, verificationDigest: 'a'.repeat(64),
        txHash: '0x' + (String.fromCharCode(97 + recordsFixtureCounter++)).repeat(64),
        synthetic: false,
        consented: true
      }
    ]
  };
  const realReport = generateTractionReport(realInput);
  assert.equal(realReport.totalEventsProcessed, 2, 'Duplicate eventId filtered');
  assert.equal(realReport.uniqueConsentedPilotsCount, 2);
  assert.equal(realReport.verifiedEventsCount, 2);
  assert.equal(realReport.tractionEligibleVolumeUsdc, '40.000000');

  // Test 4: Unconsented real events do not count towards traction
  const unconsentedInput = {
    records: [
      {
        externalEventId: 'uncon-1',
        pilotId: 'pilot-agency-c',
        amountMicro: '10000000',
        evidenceClass: 'VERIFIED',
        status: 'ACCEPTED', chainId: 5042002, confirmations: 2, verificationDigest: 'a'.repeat(64),
        txHash: '0x' + (String.fromCharCode(97 + recordsFixtureCounter++)).repeat(64),
        synthetic: false,
        consented: false
      }
    ]
  };
  const unconReport = generateTractionReport(unconsentedInput);
  assert.equal(unconReport.uniqueConsentedPilotsCount, 0);
  assert.equal(unconReport.tractionEligibleVolumeUsdc, '0.000000');

  console.log(JSON.stringify({ status: 'PASS', selfTest: true, cases: 4 }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
if (process.argv.includes('--self-test')) {
  runSelfTest();
} else if (process.argv.includes('--input')) {
  const fileIdx = process.argv.indexOf('--input') + 1;
  const filePath = process.argv[fileIdx];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(JSON.stringify({ error: 'FILE_NOT_FOUND', path: filePath }));
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(JSON.stringify(generateTractionReport(data), null, 2));
} else {
  console.log('Usage: node scripts/traction-reporter.mjs [--self-test] [--input <path>]');
}

}
