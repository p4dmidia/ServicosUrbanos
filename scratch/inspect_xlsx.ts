import exceljs from 'exceljs';
import * as path from 'path';

async function run() {
  console.log("exceljs object:", typeof exceljs, Object.keys(exceljs || {}));
  
  // @ts-ignore
  const WorkbookConstructor = exceljs.Workbook || (exceljs.default && exceljs.default.Workbook);
  if (!WorkbookConstructor) {
    throw new Error("Could not find Workbook constructor on exceljs import");
  }

  const filePath = path.resolve('public/templates/modelo_mbm.xlsx');
  const workbook = new WorkbookConstructor();
  await workbook.xlsx.readFile(filePath);

  console.log("Worksheets in workbook:");
  workbook.worksheets.forEach((sheet: any) => {
    console.log(`- Sheet name: "${sheet.name}"`);
    console.log(`  Row count: ${sheet.rowCount}`);
    console.log(`  Column count: ${sheet.columnCount}`);
  });

  const baseAtiva = workbook.getWorksheet('BASE ATIVA');
  if (baseAtiva) {
    console.log("\nInspecting first 25 rows of 'BASE ATIVA'...");
    for (let i = 1; i <= 25; i++) {
      const row = baseAtiva.getRow(i);
      const values = [];
      for (let j = 1; j <= 12; j++) {
        values.push(row.getCell(j).value);
      }
      console.log(`Row ${i}:`, JSON.stringify(values));
    }
  } else {
    console.log("\n'BASE ATIVA' sheet not found!");
  }
}

run().catch(console.error);
