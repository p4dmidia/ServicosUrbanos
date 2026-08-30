import exceljs from 'exceljs';
import * as path from 'path';

async function run() {
  const filePath = path.resolve('public/templates/modelo_mbm.xlsx');
  
  // @ts-ignore
  const WorkbookConstructor = exceljs.Workbook || (exceljs.default && exceljs.default.Workbook);
  const workbook = new WorkbookConstructor();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('INSTRUÇÕES');
  if (sheet) {
    console.log("\nInspecting first 30 rows of 'INSTRUÇÕES'...");
    for (let i = 1; i <= 30; i++) {
      const row = sheet.getRow(i);
      const values = [];
      for (let j = 1; j <= 5; j++) {
        values.push(row.getCell(j).value);
      }
      console.log(`Row ${i}:`, JSON.stringify(values));
    }
  } else {
    console.log("\n'INSTRUÇÕES' sheet not found!");
  }
}

run().catch(console.error);
