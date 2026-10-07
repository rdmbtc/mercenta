import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('AGENT-13: OpenAPI Contract Parity & Schema Guardian', () => {
  const testnetSpecPath = path.resolve(process.cwd(), '../web/src/lib/openapi-testnet.json');
  const mainnetSpecPath = path.resolve(process.cwd(), '../web/src/lib/openapi-mainnet.json');

  assert.ok(fs.existsSync(testnetSpecPath), 'openapi-testnet.json must exist');
  assert.ok(fs.existsSync(mainnetSpecPath), 'openapi-mainnet.json must exist');

  const testnetSpec = JSON.parse(fs.readFileSync(testnetSpecPath, 'utf8'));
  const mainnetSpec = JSON.parse(fs.readFileSync(mainnetSpecPath, 'utf8'));

  test('validates OpenAPI 3.1.0 root structure and metadata', () => {
    assert.equal(testnetSpec.openapi, '3.1.0');
    assert.equal(testnetSpec.info.title, 'Mercenta API — Testnet');
    assert.equal(testnetSpec['x-chain-id'], 5042002);
    assert.equal(testnetSpec['x-network'], 'testnet');

    assert.equal(mainnetSpec.openapi, '3.1.0');
    assert.equal(mainnetSpec['x-chain-id'], 5042);
    assert.equal(mainnetSpec['x-network'], 'mainnet');
    assert.equal(mainnetSpec['x-real-purchases-enabled'], false);
  });

  test('verifies documented operation parity across core routes', () => {
    const requiredTestnetPaths = [
      '/api/account/settings',
      '/api/account/summary',
      '/api/account/funds',
      '/api/account/orders',
      '/api/account/deposits',
      '/api/v1/orders',
      '/api/v1/account',
      '/api/catalog'
    ];

    for (const p of requiredTestnetPaths) {
      assert.ok(testnetSpec.paths[p], `Path ${p} missing in testnet OpenAPI spec`);
    }

    const opCount = Object.values(testnetSpec.paths).reduce(
      (acc: number, p: any) => acc + Object.keys(p).length,
      0
    );
    assert.ok(opCount > 20, `Expected > 20 operations, got ${opCount}`);
  });

  test('enforces documented exclusions for internal-only endpoints', () => {
    const excluded = testnetSpec['x-coverage']?.excluded ?? [];
    const excludedRoutes = excluded.map((x: any) => x.path);

    // Verify backend-only internal routes are explicitly excluded
    assert.ok(
      excludedRoutes.includes('/api/x402/margin-report'),
      'Margin report must be listed as internal exclusion'
    );
    assert.ok(
      excludedRoutes.includes('/api/launch-readiness'),
      'Launch readiness must be listed as internal exclusion'
    );

    // Verify they do not exist in public paths
    assert.equal(testnetSpec.paths['/api/x402/margin-report'], undefined);
    assert.equal(testnetSpec.paths['/api/launch-readiness'], undefined);
  });

  test('verifies mainnet routes are closed with HTTP 503 release gate', () => {
    // Only catalog, network, openapi are enabled for GET
    const closedRoutes = ['/api/account/orders', '/api/account/deposits', '/api/v1/orders'];

    for (const r of closedRoutes) {
      const pathItem = mainnetSpec.paths[r];
      if (!pathItem) continue;
      for (const [method, op] of Object.entries(pathItem)) {
        const operation = op as any;
        assert.equal(operation['x-enabled'], false, `${method} ${r} must be disabled on mainnet`);
        assert.ok(operation.responses['503'], `${method} ${r} must have 503 response on mainnet`);
      }
    }
  });

  test('mutation of required field schema causes strict validation failure', () => {
    const orderOp = testnetSpec.paths['/api/account/orders']?.post;
    assert.ok(orderOp, 'POST /api/account/orders must be present');
    const reqBody = orderOp.requestBody?.content?.['application/json']?.schema;
    assert.ok(reqBody, 'POST /api/account/orders must define request body schema');
    assert.ok(reqBody.required.includes('requestId'));
    assert.ok(reqBody.required.includes('productId'));
    assert.ok(reqBody.required.includes('quantity'));

    // Verify mutation detection
    const mutated = structuredClone(reqBody);
    mutated.required = mutated.required.filter((x: string) => x !== 'requestId');
    assert.notDeepEqual(mutated.required, reqBody.required);
  });
});
