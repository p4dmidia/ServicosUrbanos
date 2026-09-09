const ExcelJS = require('exceljs');
const fs = require('fs');

async function generateMBMWorkbook(options) {
  const {
    policyNumber = '',
    subGroup = '1',
    competence = '09/2026',
    activeSubs = []
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Serviços Urbanos';
  workbook.created = new Date();

  // 1. ABA INSTRUÇÕES
  const wsInstrucoes = workbook.addWorksheet('INSTRUÇÕES', {
    pageSetup: { orientation: 'landscape', fitToPage: false }
  });
  wsInstrucoes.views = [
    { state: 'normal', showGridLines: true, zoomScale: 100 }
  ];

  wsInstrucoes.getColumn(1).width = 2.75;
  wsInstrucoes.getColumn(2).width = 131.75;
  wsInstrucoes.getColumn(3).width = 2.75;

  wsInstrucoes.mergeCells('A1:C2');
  const titleInst = wsInstrucoes.getCell('A1');
  titleInst.value = 'PLANILHA DE MOVIMENTAÇÕES DE SEGURADOS';
  titleInst.font = { name: 'Trebuchet MS', size: 28, bold: true, italic: true, color: { argb: 'FF0066CC' } };
  titleInst.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  
  // Row 2 border bottom
  ['A2', 'B2', 'C2'].forEach(addr => {
    wsInstrucoes.getCell(addr).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  });

  wsInstrucoes.mergeCells('A3:C3');
  const subtitleInst = wsInstrucoes.getCell('A3');
  subtitleInst.value = 'INSTRUÇÕES:';
  subtitleInst.font = { name: 'Trebuchet MS', size: 16, bold: true, color: { argb: 'FFFFFF00' } };
  subtitleInst.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
  subtitleInst.alignment = { horizontal: 'left', vertical: 'middle' };
  wsInstrucoes.getRow(3).height = 21;

  const instLines = [
    { row: 4, height: 31.5, text: '- Este modelo de planilha deverá ser usado APENAS para envio de relações de BASE ATIVA. Relações enviadas no modelo de planilha não correspondente serão IMEDIATAMENTE DEVOLVIDAS.' },
    { row: 6, height: 31.5, text: '- Deverão ser inseridas as informações obrigatórias, sendo elas: Número da Apólice, Sub, Vigência, CPF, Nome, Data de Nascimento, Sexo e Capital (se necessário).' },
    { row: 8, height: 31.5, text: '- Os campos "Observações" deverão ser utilizados em casos de movimentações que necessitem de informações complementares para emissão do faturamento.' },
    { row: 10, height: 47.25, text: '- Após inseridas as informações, as mesmas deverão ser validadas para que sejam realizadas as verificações de CPFs, Nomes e Datas de Nascimento. Para realizar validação, basta clicar no botão "VALIDAR DADOS". Se houverem inconsistências na relação, as mesmas ficarão destacadas em vermelho e/ou amarelo, devendo ser corrigidas antes do envio para faturamento.' },
    { row: 12, height: 31.5, text: 'ATENÇÃO: Se a relação contiver muitos segurados, a validação poderá demorar algum tempo. Durante a validação não será possível utilizar qualquer outra planilha do Excel, caso contrário poderá ocorrer o travamento total do Excel.' },
    { row: 14, height: 31.5, text: 'IMPORTANTE: Caso estejam faltando informações ou as infomações inseridas na planilha não estejam de acordo, a mesma será devolvida para regularização das informações.' }
  ];

  instLines.forEach(item => {
    const r = wsInstrucoes.getRow(item.row);
    r.height = item.height;
    const c = wsInstrucoes.getCell(`B${item.row}`);
    c.value = item.text;
    c.font = { name: 'Calibri', size: 12, bold: item.row === 12 || item.row === 14 };
    c.alignment = { vertical: 'bottom', wrapText: true };
  });

  // 2. ABA BASE ATIVA
  const wsBase = workbook.addWorksheet('BASE ATIVA', {
    pageSetup: { orientation: 'landscape', fitToPage: false }
  });
  wsBase.views = [
    { state: 'normal', showGridLines: true, zoomScale: 100 }
  ];

  // Column widths
  const colWidths = [2.13, 18.88, 35.0, 22.13, 11.25, 24.0, 23.63, 23.63, 2.13];
  colWidths.forEach((w, idx) => {
    wsBase.getColumn(idx + 1).width = w;
  });

  // Header rows 1-3 merged
  wsBase.mergeCells('A1:I3');
  const baseTitle = wsBase.getCell('A1');
  baseTitle.value = 'RELAÇÃO DE BASE ATIVA';
  baseTitle.font = { name: 'Trebuchet MS', size: 28, bold: true, italic: true, color: { argb: 'FF0066CC' } };
  baseTitle.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  wsBase.getRow(1).height = 30;
  wsBase.getRow(2).height = 30;
  wsBase.getRow(3).height = 30;

  // Row 4: version
  wsBase.getRow(4).height = 18.75;
  const cV = wsBase.getCell('B4');
  cV.value = 'v 1.7.1';
  cV.font = { name: 'Trebuchet MS', size: 11, bold: true, italic: true, color: { argb: 'FFA5A5A5' } };

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // Row 5: Apólice & Sub
  wsBase.getRow(5).height = 23.25;
  const cB5 = wsBase.getCell('B5');
  cB5.value = 'Apólice:';
  cB5.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
  cB5.alignment = { horizontal: 'right', vertical: 'middle' };

  const cC5 = wsBase.getCell('C5');
  cC5.value = policyNumber || '';
  cC5.font = { name: 'Calibri', size: 18 };
  cC5.alignment = { horizontal: 'center', vertical: 'middle' };
  cC5.border = thinBorder;

  const cD5 = wsBase.getCell('D5');
  cD5.value = 'Sub';
  cD5.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
  cD5.alignment = { horizontal: 'right', vertical: 'middle' };

  const cE5 = wsBase.getCell('E5');
  cE5.value = subGroup || '';
  cE5.font = { name: 'Calibri', size: 18 };
  cE5.alignment = { horizontal: 'center', vertical: 'middle' };
  cE5.border = thinBorder;

  wsBase.getRow(6).height = 9.75;

  // Row 7: Vigência
  wsBase.getRow(7).height = 23.25;
  const cB7 = wsBase.getCell('B7');
  cB7.value = 'Vigência:';
  cB7.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
  cB7.alignment = { horizontal: 'right', vertical: 'middle' };

  const cC7 = wsBase.getCell('C7');
  cC7.value = competence;
  cC7.font = { name: 'Calibri', size: 18 };
  cC7.alignment = { horizontal: 'center', vertical: 'middle' };
  cC7.border = thinBorder;

  wsBase.getRow(8).height = 9.75;

  // Row 9: Data de verificação
  wsBase.getRow(9).height = 9.75;
  const cB9 = wsBase.getCell('B9');
  cB9.value = `Dados verificados em ${new Date().toLocaleDateString('pt-BR')}`;
  cB9.font = { name: 'Trebuchet MS', size: 9, color: { argb: 'FFBFBFBF' } };
  cB9.alignment = { horizontal: 'left', vertical: 'middle' };

  // Row 10: Colunas Principais (Cabeçalho da Tabela)
  wsBase.getRow(10).height = 16.5;
  const tableHeaders = [
    { col: 'B', text: 'CPF' },
    { col: 'C', text: 'NOME' },
    { col: 'D', text: 'DATA NASCIMENTO' },
    { col: 'E', text: 'SEXO' },
    { col: 'F', text: 'CAPITAL' },
    { col: 'G', text: 'OBSERVAÇÕES' },
    { col: 'H', text: 'OBSERVAÇÕES' }
  ];

  tableHeaders.forEach(th => {
    const cell = wsBase.getCell(`${th.col}10`);
    cell.value = th.text;
    cell.font = { name: 'Trebuchet MS', size: 11, bold: true, color: { argb: 'FFFFFF00' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  // Linhas de dados a partir da linha 11
  let currentRow = 11;
  activeSubs.forEach(sub => {
    wsBase.getRow(currentRow).height = 18;

    // Coluna B: CPF
    const cB = wsBase.getCell(`B${currentRow}`);
    const cleanCpf = (sub.cpf || '').replace(/\D/g, '');
    cB.value = sub.cpf || '';
    cB.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
    cB.alignment = { horizontal: 'center', vertical: 'middle' };
    cB.border = thinBorder;

    // Coluna C: NOME
    const cC = wsBase.getCell(`C${currentRow}`);
    cC.value = (sub.name || '').toUpperCase();
    cC.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
    cC.alignment = { horizontal: 'left', vertical: 'middle' };
    cC.border = thinBorder;

    // Coluna D: DATA NASCIMENTO
    const cD = wsBase.getCell(`D${currentRow}`);
    cD.value = sub.birth_date || '';
    cD.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
    cD.alignment = { horizontal: 'center', vertical: 'middle' };
    cD.border = thinBorder;

    // Coluna E: SEXO
    const cE = wsBase.getCell(`E${currentRow}`);
    cE.value = (sub.gender || 'M').toUpperCase().charAt(0);
    cE.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
    cE.alignment = { horizontal: 'center', vertical: 'middle' };
    cE.border = thinBorder;

    // Coluna F: CAPITAL
    const cF = wsBase.getCell(`F${currentRow}`);
    cF.value = 10000;
    cF.numFmt = '_-"R$ "* #,##0.00_-;\\"-R$ \\"* #,##0.00_-;_-"R$ "* -??_-;_-@';
    cF.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
    cF.alignment = { horizontal: 'right', vertical: 'middle' };
    cF.border = thinBorder;

    // Coluna G: OBSERVAÇÕES (Plano)
    const cG = wsBase.getCell(`G${currentRow}`);
    cG.value = sub.plan ? `PLANO ${sub.plan.toUpperCase()}` : '';
    cG.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
    cG.alignment = { horizontal: 'center', vertical: 'middle' };
    cG.border = thinBorder;

    // Coluna H: OBSERVAÇÕES (Empresa / PJ / Nota)
    const cH = wsBase.getCell(`H${currentRow}`);
    cH.value = sub.obs || '';
    cH.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
    cH.alignment = { horizontal: 'left', vertical: 'middle' };
    cH.border = thinBorder;

    currentRow++;
  });

  // Conditional Formatting para C5, E5, C7 (aviso em vermelho se em branco, idêntico à MBM)
  wsBase.addConditionalFormatting({
    ref: 'C5',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['""'],
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
      }
    ]
  });
  wsBase.addConditionalFormatting({
    ref: 'E5',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['""'],
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
      }
    ]
  });
  wsBase.addConditionalFormatting({
    ref: 'C7',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['""'],
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
      }
    ]
  });

  await workbook.xlsx.writeFile('scratch/test_output.xlsx');
  console.log('Workbook generated successfully! Size:', fs.statSync('scratch/test_output.xlsx').size, 'bytes');
}

// Test with mock data matching the screenshot
generateMBMWorkbook({
  policyNumber: '123456',
  subGroup: '1',
  competence: '09/2026',
  activeSubs: [
    { name: 'Serviços Urbanos Tecnologia Ltda.', cpf: '54.795.377/0001-03', birth_date: '03/06/2007', gender: 'M', plan: 'ANUAL', obs: 'PJ' },
    { name: 'Emerson Mines Antunes', cpf: '856.683.976-53', birth_date: '15/06/1973', gender: 'M', plan: 'TRIMESTRAL' },
    { name: 'Weider de Oliveira', cpf: '015.653.776-13', birth_date: '14/11/1993', gender: 'M', plan: 'ANUAL' }
  ]
}).catch(console.error);
