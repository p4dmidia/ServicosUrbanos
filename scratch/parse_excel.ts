import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function main() {
    const url = 'https://docs.google.com/spreadsheets/d/1KGWcFc9QdRmcjaeDTfEuGaFWQkn0iSxTvDcc4wPD9lQ/export?format=xlsx';
    console.log('Downloading spreadsheet from:', url);
    
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer));
    
    console.log('Workbook loaded. Sheet names:');
    workbook.eachSheet((sheet, id) => {
        console.log(`- Sheet ID: ${id}, Name: ${sheet.name}, rows: ${sheet.rowCount}`);
    });

    // Let's print the first 25 rows and 20 columns of each sheet
    for (const sheet of workbook.worksheets) {
        console.log(`\n================== SHEET: ${sheet.name} ==================`);
        for (let r = 1; r <= Math.min(sheet.rowCount, 40); r++) {
            const row = sheet.getRow(r);
            const rowValues = [];
            for (let c = 1; c <= Math.min(row.cellCount, 25); c++) {
                const cell = row.getCell(c);
                let val = '';
                if (cell.value && typeof cell.value === 'object' && 'result' in cell.value) {
                    val = `[Formula: ${cell.value.formula} => ${cell.value.result}]`;
                } else if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
                    val = `[Formula: ${cell.value.formula}]`;
                } else {
                    val = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
                }
                rowValues.push(val);
            }
            // Check if row is not empty
            if (rowValues.some(v => v !== '')) {
                console.log(`Row ${r}:`, rowValues.join(' | '));
            }
        }
    }
}

main().catch(err => {
    console.error('Error in script:', err);
});
