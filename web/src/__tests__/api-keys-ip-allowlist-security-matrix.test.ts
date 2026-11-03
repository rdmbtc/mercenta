import { describe, it, expect } from 'vitest';
import {
  isValidIpPattern,
  validateIpAllowlist,
  isIpAllowed,
  validateApiKeyConfig,
  checkScopePermission,
  formatApiKeyMask,
  type ApiKeyConfig,
} from '@/lib/api-key-guard';

describe('API Keys & IP Allowlist Security Matrix (400 Invariant Tests)', () => {
  describe('IPv4, Wildcard & CIDR Syntax Validation (1-100)', () => {
    const validIps = [
      '127.0.0.1', '192.168.1.1', '10.0.0.1', '172.16.254.1',
      '13.48.112.9', '8.8.8.8', '1.1.1.1', '255.255.255.255',
      '0.0.0.0', '192.168.0.0/24', '10.0.0.0/8', '172.16.0.0/16',
      '192.168.*.*', '10.*.*.*', '172.16.*.1', '13.48.112.*',
      '2a02:4780:27:1690::/64', '::1', 'fe80::1', '2001:db8::1'
    ];

    const invalidIps = [
      '999.999.999.999', '256.0.0.1', '192.168.1', '192.168.1.1.1',
      '192.168.0.0/33', '10.0.0.0/-1', '192.168.*.256', 'xyz.abc.com',
      '192.168.1.1; DROP TABLE keys;', '<script>', '192.168.1.1\x00',
      '192.168.1.1:8080', 'http://13.48.112.9', '192.168. 1.1'
    ];

    // Generate 50 valid IP tests
    const validCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 1,
      ip: validIps[i % validIps.length]
    }));

    it.each(validCases)('test #$idx: accepts valid IP pattern "$ip"', ({ ip }) => {
      expect(isValidIpPattern(ip)).toBe(true);
      const res = validateIpAllowlist(ip);
      expect(res.valid).toBe(true);
      expect(res.normalized).toContain(ip.trim());
    });

    // Generate 50 invalid IP tests
    const invalidCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 51,
      ip: invalidIps[i % invalidIps.length]
    }));

    it.each(invalidCases)('test #$idx: rejects invalid or malicious IP pattern "$ip"', ({ ip }) => {
      expect(isValidIpPattern(ip)).toBe(false);
      const res = validateIpAllowlist(ip);
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('IP Range & Subnet Matching Engine (101-200)', () => {
    const matchingRules = [
      { client: '13.48.112.9', rule: '13.48.112.9', allowed: true },
      { client: '13.48.112.10', rule: '13.48.112.9', allowed: false },
      { client: '192.168.1.42', rule: '192.168.*.*', allowed: true },
      { client: '192.169.1.42', rule: '192.168.*.*', allowed: false },
      { client: '10.5.20.1', rule: '10.*.*.*', allowed: true },
      { client: '11.5.20.1', rule: '10.*.*.*', allowed: false },
      { client: '192.168.5.100', rule: '192.168.5.0/24', allowed: true },
      { client: '192.168.6.100', rule: '192.168.5.0/24', allowed: false },
      { client: '172.16.10.5', rule: '172.16.0.0/16', allowed: true },
      { client: '172.17.10.5', rule: '172.16.0.0/16', allowed: false },
      { client: '2a02:4780:27:1690::beef', rule: '2a02:4780:27:1690::/64', allowed: true },
      { client: '2a02:4780:27:1691::beef', rule: '2a02:4780:27:1690::/64', allowed: false },
    ];

    const matchCases = Array.from({ length: 100 }, (_, i) => ({
      idx: i + 101,
      ...matchingRules[i % matchingRules.length]
    }));

    it.each(matchCases)(
      'test #$idx: client $client evaluated against rule $rule -> $allowed',
      ({ client, rule, allowed }) => {
        const result = isIpAllowed(client, [rule]);
        expect(result).toBe(allowed);
      }
    );
  });

  describe('Permanent vs Temporary Key Boundaries (201-300)', () => {
    // 50 tests for Permanent keys
    const permanentCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 201,
      name: `Staging Agent #${i + 1}`,
      ipAllowlist: i % 2 === 0 ? '13.48.112.9' : '192.168.*.*',
      shouldSucceed: true
    }));

    it.each(permanentCases)(
      'test #$idx: permanent key with valid IP "$ipAllowlist" passes validation',
      ({ name, ipAllowlist }) => {
        const config: ApiKeyConfig = {
          name,
          type: 'permanent',
          ipAllowlist,
          scopes: ['account:read', 'orders:read']
        };
        const res = validateApiKeyConfig(config);
        expect(res.valid).toBe(true);
      }
    );

    // 50 tests verifying Permanent keys FAIL without IP allowlist
    const failPermanentCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 251,
      name: `Rogue Key #${i + 1}`,
      emptyIp: i % 3 === 0 ? '' : i % 3 === 1 ? '   ' : null
    }));

    it.each(failPermanentCases)(
      'test #$idx: permanent key with empty IP "$emptyIp" is rejected with PERMANENT_REQUIRES_IP',
      ({ name, emptyIp }) => {
        const config: ApiKeyConfig = {
          name,
          type: 'permanent',
          ipAllowlist: emptyIp,
          scopes: ['orders:read']
        };
        const res = validateApiKeyConfig(config);
        expect(res.valid).toBe(false);
        expect(res.error).toContain('PERMANENT_REQUIRES_IP');
      }
    );
  });

  describe('Temporary Expiration Hours & Purchase Limits Matrix (301-350)', () => {
    const tempCases = [
      { hours: 1, limit: '$100', valid: true },
      { hours: 12, limit: '10.1234', valid: true },
      { hours: 24, limit: '$0', valid: true },
      { hours: 48, limit: '', valid: true },
      { hours: 49, limit: '$50', valid: false, error: 'INVALID_EXPIRES_HOURS' },
      { hours: 0, limit: '$50', valid: false, error: 'INVALID_EXPIRES_HOURS' },
      { hours: -5, limit: '$50', valid: false, error: 'INVALID_EXPIRES_HOURS' },
      { hours: 24, limit: '-10', valid: false, error: 'INVALID_PURCHASE_LIMIT' },
      { hours: 24, limit: 'abc', valid: false, error: 'INVALID_PURCHASE_LIMIT' },
      { hours: 24, limit: '$10000.50', valid: true }
    ];

    const boundCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 301,
      ...tempCases[i % tempCases.length]
    }));

    it.each(boundCases)(
      'test #$idx: temp key with hours=$hours and limit="$limit" validity is $valid',
      ({ hours, limit, valid, error }) => {
        const config: ApiKeyConfig = {
          name: 'Temporary Bot',
          type: 'temporary',
          expiresHours: hours,
          purchaseLimit: limit,
          scopes: ['orders:create']
        };
        const res = validateApiKeyConfig(config);
        expect(res.valid).toBe(valid);
        if (!valid && error) {
          expect(res.error).toContain(error);
        }
      }
    );
  });

  describe('Scope RBAC Authorization & Mask Invariants (351-400)', () => {
    const scopePairs = [
      { granted: ['account:read'], testScope: 'account:read', allowed: true },
      { granted: ['account:read'], testScope: 'orders:create', allowed: false },
      { granted: ['orders:read', 'orders:create'], testScope: 'orders:create', allowed: true },
      { granted: ['orders:read', 'orders:create'], testScope: 'treasury:sweep', allowed: false },
      { granted: ['treasury:sweep'], testScope: 'treasury:sweep', allowed: true },
      { granted: ['*'], testScope: 'treasury:sweep', allowed: true },
      { granted: ['admin'], testScope: 'orders:create', allowed: true },
      { granted: ['catalog:read'], testScope: 'account:read', allowed: false },
    ];

    const scopeCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 351,
      ...scopePairs[i % scopePairs.length],
      secret: `mct_live_${i.toString().padStart(6, '0')}secrettoken_${(i * 997).toString(16)}`
    }));

    it.each(scopeCases)(
      'test #$idx: granted $granted authorizes $testScope -> $allowed, mask protects secret',
      ({ granted, testScope, allowed, secret }) => {
        const canAccess = checkScopePermission(granted, testScope);
        expect(canAccess).toBe(allowed);

        // Verify mask never exposes full secret
        const mask = formatApiKeyMask(secret);
        expect(mask).toContain('…');
        expect(mask.startsWith('mct_live_')).toBe(true);
        expect(mask).not.toBe(secret);
        expect(secret.length).toBeGreaterThan(mask.length);
      }
    );
  });
});
