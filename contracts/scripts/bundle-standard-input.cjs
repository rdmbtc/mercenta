const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sources = {};
function readSource(p) {
  let content;
  if (fs.existsSync(p)) {
    content = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  } else if (fs.existsSync(path.join(__dirname, '../node_modules', p))) {
    content = fs.readFileSync(path.join(__dirname, '../node_modules', p), 'utf8').replace(/\r\n/g, '\n');
  } else {
    throw new Error('Not found: ' + p);
  }
  sources[p] = { content };
  const lines = content.split('\n');
  const importRegex = /import\s+(?:\{[^}]+\}\s+from\s+)?["']([^"']+)["'];/;
  for (const l of lines) {
    const m = l.match(importRegex);
    if (m && m[1]) {
      let imp = m[1];
      if (imp.startsWith('.')) {
        imp = path.posix.normalize(path.posix.join(path.posix.dirname(p), imp));
      }
      if (!sources[imp]) {
        readSource(imp);
      }
    }
  }
}

readSource('src/MercentaCheckout.sol');
console.log('Total bundled sources:', Object.keys(sources).length);

const standardInput = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'metadata']
      }
    }
  }
};

const outPath = path.join(__dirname, '../artifacts/MercentaCheckout-standard-input.json');
fs.writeFileSync(outPath, JSON.stringify(standardInput, null, 2));
console.log('Saved standard input JSON to:', outPath);
