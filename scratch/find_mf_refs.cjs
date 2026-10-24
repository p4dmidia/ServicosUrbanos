const fs = require('fs');
const content = fs.readFileSync('src/lib/businessRules.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('microfranqueados')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
