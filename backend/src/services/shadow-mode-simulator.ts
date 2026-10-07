import { createHash } from 'node:crypto';
import type { ReceiptProofResult, ReceiptProofInput } from './receipt-proof-generator.js';

export type EvidenceClass = 'SIMULATED' | 'TESTNET_MIRROR' | 'VERIFIED';

export type OperationalEvent = {
  pilotId: string;
  sourceDigest: string;
  externalEventId: string;
  occurredAt: string;
  category: 'gaming' | 'streaming' | 'creator' | 'developer' | 'cloud' | string;
  amountMicro: string; // Decimal integer string
  currency: string;
  synthetic?: boolean;
  consented?: boolean;
};

export type ShadowPolicy = {
  expectedSender?: string;
  expectedRecipient?: string;
  dryRun?: boolean; // Default true
  network?: 'testnet' | 'mainnet'; // Mainnet is strictly rejected
  perRunCapMicro: bigint;
  oneOrderCeilingMicro: bigint;
  reserveFloorMicro: bigint;
  currentVaultBalanceMicro: bigint;
};

export type MirrorIntent = {
  eventId: string;
  pilotId: string;
  category: string;
  amountMicro: bigint;
  currency: string;
};

export type ShadowPorts = {
  clock: () => number;
  idempotencyStore: {
    has: (key: string) => Promise<boolean> | boolean;
    set: (key: string) => Promise<void> | void;
  };
  reserveAndClaim?: (key: string, intent: MirrorIntent, policy: ShadowPolicy) => Promise<boolean>;
  mirrorAdapter?: (intent: MirrorIntent) => Promise<{ hash: string; chainId: number }>;
  verifyReceipt?: (input: ReceiptProofInput) => Promise<ReceiptProofResult>;
};

export type ShadowAuditRecord = {
  externalEventId: string;
  pilotId: string;
  evidenceClass: EvidenceClass;
  status: 'ACCEPTED' | 'SKIPPED_DUPLICATE' | 'REJECTED_CAP' | 'REJECTED_CONSENT' | 'REJECTED_POLICY' | 'QUARANTINED_UNKNOWN';
  amountMicro: string;
  category: string;
  consented: boolean;
  chainId?: number;
  confirmations?: number;
  auditDigest?: string;
  synthetic: boolean;
  eligibleForTraction: boolean;
  txHash?: string;
  verificationDigest?: string;
  reason?: string;
};

export type ShadowSimulationResult = {
  processedCount: number;
  duplicatesSkipped: number;
  rejectedCount: number;
  acceptedCount: number;
  totalVolumeMicro: string;
  tractionEligibleVolumeMicro: string;
  records: ShadowAuditRecord[];
};

/**
 * Replays operational commerce logs in shadow mode to establish verifiable traction proofs.
 * Guarantees zero unconsented data leakage, strict limits, idempotent deduplication,
 * and dual-witness verification before marking on-chain evidence as VERIFIED.
 */
export async function simulateShadow(
  events: OperationalEvent[],
  ports: ShadowPorts,
  policy: ShadowPolicy
): Promise<ShadowSimulationResult> {
  const isDryRun = policy.dryRun !== false;
  const network = policy.network ?? 'testnet';

  if (network === 'mainnet') {
    throw new Error('MAINNET_PROHIBITED_IN_SHADOW_MODE');
  }

  if([policy.perRunCapMicro,policy.oneOrderCeilingMicro,policy.reserveFloorMicro,policy.currentVaultBalanceMicro].some(v=>typeof v!=='bigint'||v<0n)||policy.perRunCapMicro===0n||policy.oneOrderCeilingMicro===0n)throw Error('INVALID_SHADOW_POLICY');
  if(!isDryRun&&(!ports.reserveAndClaim||!ports.mirrorAdapter||!ports.verifyReceipt||!/^0x[\da-f]{40}$/i.test(policy.expectedSender??'')||!/^0x[\da-f]{40}$/i.test(policy.expectedRecipient??'')))throw Error('LIVE_SHADOW_ATOMIC_ADAPTER_REQUIRED');
  let accumulatedRunMicro = 0n;
  let remainingVaultBalanceMicro = policy.currentVaultBalanceMicro;
  let processedCount = 0;
  let duplicatesSkipped = 0;
  let rejectedCount = 0;
  let acceptedCount = 0;
  let totalVolumeMicro = 0n;
  let tractionEligibleVolumeMicro = 0n;
  const records: ShadowAuditRecord[] = [];

  for (const event of events) {
    processedCount++;
    const isSynthetic = event.synthetic === true;
    const consented = event.consented === true;
    if(!event.pilotId||!event.externalEventId||!event.sourceDigest||!Number.isFinite(Date.parse(event.occurredAt))||event.currency!=='USDC'||!['gaming','streaming','creator','developer','cloud'].includes(event.category))throw Error('INVALID_SHADOW_EVENT');
    const eventKey=['shadow-v2',network,isDryRun?'simulation':'mirror',event.pilotId,event.externalEventId].join(':');

    // 1. Idempotency check: Replay must not duplicate
    const alreadySeen = await ports.idempotencyStore.has(eventKey);
    if (alreadySeen) {
      duplicatesSkipped++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'SKIPPED_DUPLICATE',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'DUPLICATE_EVENT_ID'
      });
      continue;
    }

    // 2. Consent check for non-synthetic (real) events
    if (!isSynthetic && event.consented !== true) {
      rejectedCount++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'REJECTED_CONSENT',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'PILOT_CONSENT_REQUIRED'
      });
      continue;
    }

    // 3. Amount parsing & boundary validation
    let amtMicro: bigint;
    try {
      if (!/^\d+$/.test(event.amountMicro)) {
        throw new Error('INVALID_AMOUNT_FORMAT');
      }
      amtMicro = BigInt(event.amountMicro);
      if (amtMicro <= 0n) {
        throw new Error('NON_POSITIVE_AMOUNT');
      }
    } catch {
      rejectedCount++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'REJECTED_POLICY',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'INVALID_AMOUNT'
      });
      continue;
    }

    // 4. One-order ceiling check
    if (amtMicro > policy.oneOrderCeilingMicro) {
      rejectedCount++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'REJECTED_CAP',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'ONE_ORDER_CEILING_EXCEEDED'
      });
      continue;
    }

    // 5. Per-run cap check
    if (accumulatedRunMicro + amtMicro > policy.perRunCapMicro) {
      rejectedCount++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'REJECTED_CAP',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'PER_RUN_CAP_EXCEEDED'
      });
      continue;
    }

    // 6. Reserve floor check
    if (remainingVaultBalanceMicro - amtMicro < policy.reserveFloorMicro) {
      rejectedCount++;
      records.push({
        externalEventId: event.externalEventId,
        pilotId: event.pilotId,
        evidenceClass: 'SIMULATED',
        status: 'REJECTED_CAP',
        amountMicro: event.amountMicro,
        category: event.category,
        synthetic: isSynthetic,
        consented,
        eligibleForTraction: false,
        reason: 'RESERVE_FLOOR_BREACH'
      });
      continue;
    }

    // Update balances & mark idempotency
    accumulatedRunMicro += amtMicro;
    remainingVaultBalanceMicro -= amtMicro;
    if(!isDryRun){const claimed=await ports.reserveAndClaim!(eventKey,{eventId:event.externalEventId,pilotId:event.pilotId,category:event.category,amountMicro:amtMicro,currency:event.currency},policy);if(!claimed){duplicatesSkipped++;accumulatedRunMicro-=amtMicro;remainingVaultBalanceMicro+=amtMicro;continue}}
    await ports.idempotencyStore.set(eventKey);

    // 7. Determine evidence classification and execution
    let evidenceClass: EvidenceClass = 'SIMULATED';
    let txHash: string | undefined;
    let verificationDigest: string | undefined;
    let confirmations: number | undefined;
    let uncertain = false;

    if (!isDryRun && ports.mirrorAdapter) {
      try {
        const mirrorRes = await ports.mirrorAdapter({
          eventId: event.externalEventId,
          pilotId: event.pilotId,
          category: event.category,
          amountMicro: amtMicro,
          currency: event.currency
        });
        if(mirrorRes.chainId!==5042002||!/^0x[\da-f]{64}$/i.test(mirrorRes.hash))throw Error('WRONG_MIRROR_NETWORK_OR_HASH');
        txHash = mirrorRes.hash;
        evidenceClass = 'TESTNET_MIRROR';

        // Canonical on-chain verification if verifier injected
        if (ports.verifyReceipt) {
          const proof = await ports.verifyReceipt({
            hash: mirrorRes.hash,
            expectedSender: policy.expectedSender!,
            expectedRecipient: policy.expectedRecipient!,
            expectedAmountMicro: amtMicro,
            chainId: mirrorRes.chainId
          });

          if (proof.status === 'VERIFIED' && proof.hash.toLowerCase() === mirrorRes.hash.toLowerCase() && proof.chainId === 5042002 && proof.confirmations >= 2 && /^[\da-f]{64}$/i.test(proof.evidenceDigest)) {
            evidenceClass = 'VERIFIED';
            verificationDigest = proof.evidenceDigest;
            confirmations = proof.confirmations;
          }
        }
      } catch (err: any) {
        // Never relabel an ambiguous broadcast as a safe simulation. Keep the claim/reserve.
        evidenceClass = 'TESTNET_MIRROR';
        uncertain = true;
      }
    }

    // Synthetic logs are NEVER counted towards eligible traction
    const eligibleForTraction = !isSynthetic && event.consented === true && evidenceClass === 'VERIFIED';

    acceptedCount++;
    totalVolumeMicro += amtMicro;
    if (eligibleForTraction) {
      tractionEligibleVolumeMicro += amtMicro;
    }

    const payloadDigest = createHash('sha256')
      .update(JSON.stringify({ id: event.externalEventId, pilot: event.pilotId, amt: event.amountMicro, evidenceClass, txHash }))
      .digest('hex');

    records.push({
      externalEventId: event.externalEventId,
      pilotId: event.pilotId,
      evidenceClass,
      status: uncertain ? 'QUARANTINED_UNKNOWN' : 'ACCEPTED',
      amountMicro: event.amountMicro,
      category: event.category,
      synthetic: isSynthetic,
      consented,
      eligibleForTraction,
      txHash,
      verificationDigest,
      confirmations,
      chainId: txHash ? 5042002 : undefined,
      auditDigest: payloadDigest,
      reason: uncertain ? 'BROADCAST_OUTCOME_UNKNOWN_RESERVE_RETAINED' : undefined
    });
  }

  return {
    processedCount,
    duplicatesSkipped,
    rejectedCount,
    acceptedCount,
    totalVolumeMicro: totalVolumeMicro.toString(),
    tractionEligibleVolumeMicro: tractionEligibleVolumeMicro.toString(),
    records
  };
}
