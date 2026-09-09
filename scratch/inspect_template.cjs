const ExcelJS = require('exceljs');
const fs = require('fs');

async function inspect() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/mbm_template.xlsx');
  
  console.log('Worksheets count:', wb.worksheets.length);
  for (const ws of wb.worksheets) {
    console.log('\n==============================');
    console.log('WORKSHEET NAME:', ws.name, 'state:', ws.state);
    console.log('Dimensions: rowCount =', ws.rowCount, 'colCount =', ws.columnCount);
    console.log('PageSetup:', JSON.stringify(ws.pageSetup));
    console.log('Views:', JSON.stringify(ws.views));
    console.log('Merges:', JSON.stringify(ws.model.merges));
    
    // Column properties
    const cols = [];
    for (let c = 1; c <= 15; c++) {
      const col = ws.getColumn(c);
      if (col && (col.width || col.hidden || col.values.length > 0)) {
        cols.push({ col: c, width: col.width, hidden: col.hidden });
      }
    }
    console.log('Columns:', JSON.stringify(cols));

    // Non-empty rows up to 30
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 30) {
        const rowData = {
          row: rowNumber,
          height: row.height,
          cells: []
        };
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          rowData.cells.push({
            col: colNumber,
            address: cell.address,
            value: cell.value,
            numFmt: cell.numFmt,
            font: cell.font,
            fill: cell.fill,
            alignment: cell.alignment,
            border: cell.border
          });
        });
        console.log(`Row ${rowNumber}:`, JSON.stringify(rowData, null, 2));
      }
    });
  }
}

inspect().catch(console.error);
