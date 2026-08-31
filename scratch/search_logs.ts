import * as fs from 'fs';
import * as path from 'path';

const logPath = 'C:\\Users\\eu\\.gemini\\antigravity-ide\\brain\\44018971-245d-4b67-b306-5b56e649ca9e\\.system_generated\\logs\\transcript.jsonl';

function run() {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`Total lines: ${lines.length}`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      
      // Look for tool calls or specific command lines
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'run_command') {
            const cmd = tc.arguments?.CommandLine || tc.args?.CommandLine || '';
            if (cmd.includes('.sql') || cmd.includes('supabase') || cmd.includes('ts-node') || cmd.includes('tsx') || cmd.includes('node')) {
              console.log(`[Step ${obj.step_index}] Tool: ${tc.name}`);
              console.log(`Args:`, JSON.stringify(tc.arguments || tc.args));
            }
          } else if (tc.name?.includes('mcp')) {
            console.log(`[Step ${obj.step_index}] Tool: ${tc.name}`);
            console.log(`Args:`, JSON.stringify(tc.arguments || tc.args));
          }
        }
      }
    } catch (e) {
      // ignore parse error
    }
  }
}

run();
