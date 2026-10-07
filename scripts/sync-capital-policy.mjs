import {readFile,writeFile} from 'node:fs/promises';
const source='backend/src/services/capital-policy.ts',target='web/src/lib/capital-policy.ts';
const canonical=await readFile(source,'utf8');
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==canonical)throw Error('CAPITAL_POLICY_DRIFT');console.log('Capital policy parity: PASS');}
else{await writeFile(target,canonical);console.log('Synced canonical capital policy.');}
