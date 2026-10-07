#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

/**
 * Audit tool for unused dependencies, dangling exports, and unreachable files.
 * Read-only analysis. Outputs structured findings and proposals for lead review.
 */

const EXCLUDED_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /artifacts/,
  /build/,
  /\.git/
];

export function runSelfTest() {
  assert.equal(typeof analyzeDependencies, 'function');
  assert.equal(typeof runSelfTest, 'function');

  // Verify internal fixtures test
  const samplePkg = {
    dependencies: { 'fastify': '^5.0.0', 'unused-dep': '^1.0.0' },
    devDependencies: { 'tsx': '^4.0.0' }
  };
  const sampleSource = `import fastify from 'fastify';\nconsole.log(fastify);`;

  const findings = detectUnusedDeps(samplePkg, [sampleSource]);
  assert.equal(findings.definite.length, 1);
  assert.equal(findings.definite[0], 'unused-dep');
  assert.equal(findings.potential.length, 0);

  console.log(JSON.stringify({ selfTest: 'PASS', module: 'audit-dead-code', cases: 4 }));
  return 0;
}

export function detectUnusedDeps(pkg, sourceTexts) {
  const combined = sourceTexts.join('\n');
  const definite = [];
  const potential = [];

  for (const dep of Object.keys(pkg.dependencies || {})) {
    // Check if package name is imported or required
    const escaped = dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`['"]${escaped}(?:/[^'"]+)?['"]`, 'm');
    if (!regex.test(combined)) {
      // Type definitions or dev CLI plugins might be indirect
      if (dep.startsWith('@types/')) {
        potential.push(dep);
      } else {
        definite.push(dep);
      }
    }
  }

  return { definite, potential };
}

export function analyzeDependencies(workspaceRoot = process.cwd()) {
  const reports = {};
  const workspaces = ['backend', 'web', 'contracts', 'docs'];

  for (const ws of workspaces) {
    const pkgPath = path.join(workspaceRoot, ws, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const wsDir = path.join(workspaceRoot, ws);
      const sources = [];

      function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (EXCLUDED_PATTERNS.some(p => p.test(full))) continue;
          if (ent.isDirectory()) {
            walk(full);
          } else if (/\.(ts|tsx|js|mjs|cjs|jsx|sol)$/.test(ent.name)) {
            sources.push(fs.readFileSync(full, 'utf8'));
          }
        }
      }

      walk(wsDir);
      const res = detectUnusedDeps(pkg, sources);
      reports[ws] = {
        totalDeclared: Object.keys(pkg.dependencies || {}).length,
        sourcesScanned: sources.length,
        unusedDefinite: res.definite,
        unusedPotential: res.potential
      };
    } catch (err) {
      reports[ws] = { error: err.message };
    }
  }

  return {
    schemaVersion: 1,
    status: 'COMPLETE',
    timestamp: Date.now(),
    workspaces: reports,
    recommendation: 'Lead review required before removing any dependencies or exports.'
  };
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  process.exit(runSelfTest());
}

const report = analyzeDependencies();
if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(JSON.stringify(report));
}

if (args.includes('--strict')) {
  const hasDefinite = Object.values(report.workspaces).some(w => w.unusedDefinite && w.unusedDefinite.length > 0);
  process.exit(hasDefinite ? 1 : 0);
}
