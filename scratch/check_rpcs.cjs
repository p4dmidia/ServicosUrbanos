const fs = require('fs');
const content = fs.readFileSync('src/lib/businessRules.ts', 'utf8');
const matches = content.match(/rpc\([^)]+\)/g) || [];
console.log('RPC calls in businessRules:');
matches.slice(0, 30).forEach(m => console.log(m));
