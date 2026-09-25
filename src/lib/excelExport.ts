import ExcelJS from 'exceljs';

interface ExportExcelOptions {
  fileName: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  periodLabel?: string;
  summaryCards?: { label: string; value: string | number; color?: string }[];
  columns: { header: string; key: string; width?: number; align?: 'left' | 'center' | 'right'; isCurrency?: boolean }[];
  data: any[];
  totals?: { [key: string]: number | string };
}

/**
 * Utilitário de Exportação de Planilhas Excel (.xlsx) com Design Profissional,
 * Cores Harmoniosas, Bordas, Formatação de Moeda Nativa e Linha de Totais.
 */
export async function exportStyledExcel({
  fileName,
  sheetName,
  title,
  subtitle,
  periodLabel,
  summaryCards = [],
  columns,
  data,
  totals
}: ExportExcelOptions) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Serviços Urbanos - Tecnologia e Economia';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName.substring(0, 31), {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  const totalColCount = Math.max(columns.length, 6);

  // 1. BANNER DE CABEÇALHO (Linhas 1 a 3)
  worksheet.mergeCells(1, 1, 1, totalColCount);
  const titleRow = worksheet.getRow(1);
  titleRow.height = 32;
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `SERVIÇOS URBANOS — ${title.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells(2, 1, 2, totalColCount);
  const subRow = worksheet.getRow(2);
  subRow.height = 20;
  const subCell = worksheet.getCell(2, 1);
  const nowStr = new Date().toLocaleString('pt-BR');
  subCell.value = `${subtitle ? `${subtitle} • ` : ''}${periodLabel ? `Período: ${periodLabel} • ` : ''}Gerado em: ${nowStr}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } }; // Slate 400
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };

  let currentRowIndex = 4;

  // 2. CARDS DE RESUMO (Se houver)
  if (summaryCards.length > 0) {
    const cardRow = worksheet.getRow(currentRowIndex);
    cardRow.height = 28;

    summaryCards.forEach((card, idx) => {
      const colIdx = idx + 1;
      if (colIdx <= totalColCount) {
        const cell = worksheet.getCell(currentRowIndex, colIdx);
        cell.value = `${card.label}: ${typeof card.value === 'number' ? `R$ ${card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : card.value}`;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    currentRowIndex += 2;
  }

  // 3. CABEÇALHO DA TABELA
  const headerRowIndex = currentRowIndex;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header.toUpperCase();
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Navy Blue #1E3A8A
    cell.alignment = { vertical: 'middle', horizontal: col.align || (col.isCurrency ? 'right' : 'left'), wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  currentRowIndex++;

  // 4. LINHAS DE DADOS
  data.forEach((item, rowIdx) => {
    const row = worksheet.getRow(currentRowIndex);
    row.height = 22;
    const isEven = rowIdx % 2 === 0;

    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const val = item[col.key];

      if (col.isCurrency) {
        const numVal = typeof val === 'number' ? val : parseFloat(String(val || 0).replace(',', '.'));
        cell.value = isNaN(numVal) ? 0 : numVal;
        cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00';
      } else {
        cell.value = val !== undefined && val !== null ? String(val) : '';
      }

      cell.font = {
        name: 'Segoe UI',
        size: 9,
        bold: col.key.includes('liquido') || col.key.includes('total'),
        color: {
          argb: col.key.includes('liquido') 
            ? 'FF047857' // Green
            : col.key.includes('irrf') || col.key.includes('adiantamento')
              ? 'FFB45309' // Amber
              : 'FF1E293B' // Slate 800
        }
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: col.align || (col.isCurrency ? 'right' : 'left')
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    currentRowIndex++;
  });

  // 5. LINHA DE TOTAIS (Se fornecida)
  if (totals) {
    const totalRow = worksheet.getRow(currentRowIndex);
    totalRow.height = 26;

    columns.forEach((col, colIdx) => {
      const cell = totalRow.getCell(colIdx + 1);
      const totVal = totals[col.key];

      if (colIdx === 0 && !totVal) {
        cell.value = 'TOTAL GERAL';
      } else if (totVal !== undefined) {
        if (col.isCurrency) {
          const numVal = typeof totVal === 'number' ? totVal : parseFloat(String(totVal || 0).replace(',', '.'));
          cell.value = isNaN(numVal) ? 0 : numVal;
          cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00';
        } else {
          cell.value = totVal;
        }
      }

      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.alignment = { vertical: 'middle', horizontal: col.align || (col.isCurrency ? 'right' : 'left') };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    currentRowIndex += 2;
  }

  // 6. AJUSTE DINÂMICO DE LARGURA DAS COLUNAS
  columns.forEach((col, idx) => {
    const colObj = worksheet.getColumn(idx + 1);
    if (col.width) {
      colObj.width = col.width;
    } else {
      let maxLen = col.header.length + 4;
      data.forEach(d => {
        const v = String(d[col.key] || '');
        if (v.length > maxLen) maxLen = v.length;
      });
      colObj.width = Math.min(Math.max(maxLen + 3, 12), 40);
    }
  });

  // 7. GERAÇÃO DO BUFFER E DOWNLOAD NO NAVEGADOR
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Exportar Folha Oficial de Pagamentos PIX - Dia 10 (Excel Formatado Pro)
 */
export async function exportMonthlyPixExcel(records: any[], refMonthStr: string) {
  const totCashback = records.reduce((acc, c) => acc + (c.cashbackMensal || 0), 0);
  const totAnual = records.reduce((acc, c) => acc + (c.cashbackAnualAcumulado || 0), 0);
  const totBruto = records.reduce((acc, c) => acc + (c.totalBruto || 0), 0);
  const totInss = records.reduce((acc, c) => acc + (c.inss || 0), 0);
  const totIrrf = records.reduce((acc, c) => acc + (c.irrf || 0), 0);
  const totAdiantamentos = records.reduce((acc, c) => acc + (c.adiantamentos || 0), 0);
  const totLiquido = records.reduce((acc, c) => acc + (c.liquidoPix || 0), 0);

  await exportStyledExcel({
    fileName: `relatorio_pagamento_pix_dia_10_${refMonthStr}.xlsx`,
    sheetName: `Folha PIX ${refMonthStr}`,
    title: 'Folha Oficial de Pagamentos PIX — Dia 10',
    subtitle: 'Remessa oficial para pagamento bancário/PIX em lote com deduções de IRRF e abatimento de adiantamentos',
    periodLabel: `Competência ${refMonthStr}`,
    summaryCards: [
      { label: 'Cashback Mensal Total', value: totCashback },
      { label: 'Retenção IRRF', value: totIrrf },
      { label: '(-) Adiantamentos Pagos', value: totAdiantamentos },
      { label: '(=) Líquido a Pagar PIX', value: totLiquido }
    ],
    columns: [
      { header: 'Nome do Afiliado', key: 'userName', width: 26 },
      { header: 'CPF/CNPJ', key: 'cpfCnpj', width: 18, align: 'center' },
      { header: 'Chave PIX', key: 'pixKey', width: 22 },
      { header: 'Dados Bancários', key: 'bankDetails', width: 30 },
      { header: 'Período', key: 'period', width: 12, align: 'center' },
      { header: 'Previsão Pgto', key: 'paymentForecast', width: 14, align: 'center' },
      { header: 'Cashback Mensal', key: 'cashbackMensal', width: 16, isCurrency: true },
      { header: 'Cashback Anual Acum.', key: 'cashbackAnualAcumulado', width: 18, isCurrency: true },
      { header: 'Total Bruto', key: 'totalBruto', width: 16, isCurrency: true },
      { header: 'INSS (0%)', key: 'inss', width: 12, isCurrency: true },
      { header: 'IRRF (Retenção)', key: 'irrf', width: 16, isCurrency: true },
      { header: '(-) Adiantamentos', key: 'adiantamentos', width: 18, isCurrency: true },
      { header: 'Líquido a Pagar PIX', key: 'liquidoPix', width: 18, isCurrency: true },
      { header: 'Status', key: 'status', width: 12, align: 'center' }
    ],
    data: records,
    totals: {
      userName: 'TOTAL GERAL',
      cashbackMensal: totCashback,
      cashbackAnualAcumulado: totAnual,
      totalBruto: totBruto,
      inss: totInss,
      irrf: totIrrf,
      adiantamentos: totAdiantamentos,
      liquidoPix: totLiquido
    }
  });
}

/**
 * 2. Exportar Relatório Oficial de Cashback Anual (Excel Formatado Pro)
 */
export async function exportAnnualCashbackExcel(records: any[], cycleLabel: string = '01.11.25 A 30.11.26') {
  const totAfiliado = records.reduce((acc, c) => acc + (c.cashAfiliado || 0), 0);
  const totRevendedor = records.reduce((acc, c) => acc + (c.cashRevendedor || 0), 0);
  const totBruto = records.reduce((acc, c) => acc + (c.totalBruto || 0), 0);
  const totInss = records.reduce((acc, c) => acc + (c.inss || 0), 0);
  const totBaseIrpf = records.reduce((acc, c) => acc + (c.baseIrpf || 0), 0);
  const totDescontoIrpf = records.reduce((acc, c) => acc + (c.descontoIrpf || 0), 0);
  const totLiquido = records.reduce((acc, c) => acc + (c.liquidoReceber || 0), 0);

  await exportStyledExcel({
    fileName: `relatorio_cashback_anual_${Date.now()}.xlsx`,
    sheetName: 'Cashback Anual 10.Dez',
    title: 'CASHBACK ANUAL A PAGAR (10 DE DEZEMBRO)',
    subtitle: 'Ciclo Vigente: 01/11/2025 a 30/11/2026 — Pagamento Oficial em 10 de Dezembro',
    periodLabel: `Ciclo ${cycleLabel}`,
    summaryCards: [
      { label: 'Cash Afiliado (MMN)', value: totAfiliado },
      { label: 'Cash Revendedor', value: totRevendedor },
      { label: 'Total Bruto Anual', value: totBruto },
      { label: 'Líquido a Receber', value: totLiquido }
    ],
    columns: [
      { header: 'ID', key: 'id', width: 10, align: 'center' },
      { header: 'NOME', key: 'name', width: 28 },
      { header: 'CASH AFILIADO', key: 'cashAfiliado', width: 16, isCurrency: true },
      { header: 'CASH REVENDEDOR', key: 'cashRevendedor', width: 16, isCurrency: true },
      { header: 'TOTAL BRUTO', key: 'totalBruto', width: 16, isCurrency: true },
      { header: 'INSS (11%)', key: 'inss', width: 14, isCurrency: true },
      { header: 'BASE IRPF', key: 'baseIrpf', width: 16, isCurrency: true },
      { header: 'DESCONTO IRPF', key: 'descontoIrpf', width: 16, isCurrency: true },
      { header: 'LÍQUIDO A RECEBER', key: 'liquidoReceber', width: 18, isCurrency: true },
      { header: 'MÊS DE REFERÊNCIA', key: 'mesReferencia', width: 18, align: 'center' },
      { header: 'CHAVE PIX', key: 'chavePix', width: 22 }
    ],
    data: records,
    totals: {
      name: 'TOTAL',
      cashAfiliado: totAfiliado,
      cashRevendedor: totRevendedor,
      totalBruto: totBruto,
      inss: totInss,
      baseIrpf: totBaseIrpf,
      descontoIrpf: totDescontoIrpf,
      liquidoReceber: totLiquido
    }
  });
}

/**
 * 3. Exportar Pendentes (Rede MMN ou Revendedores)
 */
export async function exportBalancesExcel(records: any[], category: 'network' | 'reseller') {
  const isReseller = category === 'reseller';
  const totMonthly = records.reduce((acc, c) => acc + (c.monthlyLiquid || 0), 0);
  const totAnnual = records.reduce((acc, c) => acc + (c.annualPending || 0), 0);
  const totTotal = records.reduce((acc, c) => acc + (c.totalLiquid || 0), 0);

  await exportStyledExcel({
    fileName: `relatorio_pendentes_${category}_${Date.now()}.xlsx`,
    sheetName: isReseller ? 'Revendedores' : 'Afiliados MMN',
    title: isReseller ? 'Repasses Pendentes — Revendedores Regionais' : 'Comissões Pendentes — Rede MMN',
    subtitle: 'Saldos apurados para quitação de comissões e repasses',
    summaryCards: [
      { label: 'Mensal Líquido', value: totMonthly },
      { label: 'Anual Acumulado', value: totAnnual },
      { label: 'Total Líquido', value: totTotal }
    ],
    columns: [
      { header: 'Nível', key: 'level', width: 10, align: 'center' },
      { header: 'Nome', key: 'userName', width: 26 },
      { header: 'CPF/CNPJ', key: 'cpf', width: 18, align: 'center' },
      { header: 'E-mail', key: 'userEmail', width: 24 },
      { header: 'Chave PIX', key: 'pixKey', width: 22 },
      { header: 'Dados Bancários', key: 'bankDetails', width: 28 },
      { header: 'Mensal Líquido', key: 'monthlyLiquid', width: 16, isCurrency: true },
      { header: 'Anual (Provisão)', key: 'annualPending', width: 16, isCurrency: true },
      { header: 'Total Líquido', key: 'totalLiquid', width: 18, isCurrency: true },
      { header: 'Status Fiscal', key: 'statusLabel', width: 18, align: 'center' }
    ],
    data: records,
    totals: {
      userName: 'TOTAL',
      monthlyLiquid: totMonthly,
      annualPending: totAnnual,
      totalLiquid: totTotal
    }
  });
}

/**
 * 4. Exportar Solicitações de Adiantamento
 */
export async function exportAdvancesExcel(records: any[]) {
  const totAmount = records.reduce((acc, c) => acc + (c.amount || 0), 0);

  await exportStyledExcel({
    fileName: `relatorio_adiantamentos_${Date.now()}.xlsx`,
    sheetName: 'Adiantamentos',
    title: 'Solicitações de Adiantamento Mensal de Rendimentos',
    subtitle: 'Histórico de pedidos de antecipação de saldo apurado',
    summaryCards: [
      { label: 'Total Solicitado', value: totAmount },
      { label: 'Total Pedidos', value: records.length }
    ],
    columns: [
      { header: 'Data Solicitação', key: 'created_at', width: 16, align: 'center' },
      { header: 'Afiliado', key: 'user_name', width: 26 },
      { header: 'CPF', key: 'cpf', width: 18, align: 'center' },
      { header: 'Competência', key: 'ref_month', width: 14, align: 'center' },
      { header: 'Valor Solicitado', key: 'amount', width: 18, isCurrency: true },
      { header: 'Chave PIX', key: 'pix_key', width: 22 },
      { header: 'Tipo PIX', key: 'pix_type', width: 12, align: 'center' },
      { header: 'Status', key: 'status', width: 14, align: 'center' },
      { header: 'Data Baixa', key: 'paid_at', width: 16, align: 'center' }
    ],
    data: records,
    totals: {
      user_name: 'TOTAL',
      amount: totAmount
    }
  });
}

/**
 * 5. Exportar Histórico de Auditoria Fiscal
 */
export async function exportHistoryExcel(records: any[]) {
  const totBruto = records.reduce((acc, c) => acc + (c.bruto || c.amount || 0), 0);
  const totInss = records.reduce((acc, c) => acc + (c.inss || 0), 0);
  const totIrrf = records.reduce((acc, c) => acc + (c.irrf || 0), 0);
  const totLiquido = records.reduce((acc, c) => acc + (c.liquido !== undefined ? c.liquido : (c.amount || 0)), 0);

  await exportStyledExcel({
    fileName: `relatorio_historico_auditoria_${Date.now()}.xlsx`,
    sheetName: 'Auditoria Fiscal',
    title: 'Histórico de Pagamentos Liquidados (Auditoria Fiscal)',
    subtitle: 'Registros oficiais de transferências liquidadas com retenções fiscais',
    summaryCards: [
      { label: 'Rendimento Bruto', value: totBruto },
      { label: 'INSS (0%)', value: totInss },
      { label: 'IRRF Retido', value: totIrrf },
      { label: 'Total Líquido Liquidado', value: totLiquido }
    ],
    columns: [
      { header: 'Data / Hora', key: 'date', width: 18, align: 'center' },
      { header: 'Beneficiário', key: 'userName', width: 26 },
      { header: 'CPF/CNPJ', key: 'cpf', width: 18, align: 'center' },
      { header: 'Tipo', key: 'isPJ', width: 10, align: 'center' },
      { header: 'Categoria', key: 'categoryLabel', width: 18 },
      { header: 'Ciclo', key: 'cycleLabel', width: 14, align: 'center' },
      { header: 'Rendimento Bruto', key: 'bruto', width: 16, isCurrency: true },
      { header: 'INSS (0%)', key: 'inss', width: 14, isCurrency: true },
      { header: 'Imposto Retido', key: 'irrf', width: 16, isCurrency: true },
      { header: 'Valor Líquido', key: 'liquido', width: 18, isCurrency: true },
      { header: 'Chave PIX', key: 'pixKey', width: 22 },
      { header: 'Status', key: 'status', width: 12, align: 'center' }
    ],
    data: records,
    totals: {
      userName: 'TOTAL',
      bruto: totBruto,
      inss: totInss,
      irrf: totIrrf,
      liquido: totLiquido
    }
  });
}

/**
 * 6. Exportar Pasta de Pagamentos Mensais Arquivados
 */
export async function exportMonthlyFolderExcel(records: any[], refMonthStr: string) {
  const totBruto = records.reduce((acc, c) => acc + (c.totalBruto || 0), 0);
  const totInss = records.reduce((acc, c) => acc + (c.inss || 0), 0);
  const totIrrf = records.reduce((acc, c) => acc + (c.irrf || 0), 0);
  const totLiquido = records.reduce((acc, c) => acc + (c.liquido || 0), 0);

  await exportStyledExcel({
    fileName: `pasta_pagamentos_mensais_${refMonthStr}.xlsx`,
    sheetName: `Arquivo ${refMonthStr}`,
    title: `Pasta de Pagamentos Mensais Arquivados — ${refMonthStr}`,
    subtitle: 'Histórico consolidado definitivo com demonstrativos fiscais',
    periodLabel: `Mês de Referência: ${refMonthStr}`,
    summaryCards: [
      { label: 'Total Bruto', value: totBruto },
      { label: 'INSS Retido', value: totInss },
      { label: 'IRRF Retido', value: totIrrf },
      { label: 'Total Líquido Liquidado', value: totLiquido }
    ],
    columns: [
      { header: 'Período', key: 'periodLabel', width: 24, align: 'center' },
      { header: 'Data Pagamento', key: 'paymentDateLabel', width: 16, align: 'center' },
      { header: 'Beneficiário', key: 'userName', width: 26 },
      { header: 'CPF', key: 'userCpf', width: 18, align: 'center' },
      { header: 'Chave PIX', key: 'userPixKey', width: 22 },
      { header: 'Total Bruto', key: 'totalBruto', width: 16, isCurrency: true },
      { header: 'INSS Retido', key: 'inss', width: 14, isCurrency: true },
      { header: 'IRRF Retido', key: 'irrf', width: 14, isCurrency: true },
      { header: 'Valor Líquido', key: 'liquido', width: 18, isCurrency: true },
      { header: 'Status', key: 'status', width: 12, align: 'center' }
    ],
    data: records,
    totals: {
      userName: 'TOTAL',
      totalBruto: totBruto,
      inss: totInss,
      irrf: totIrrf,
      liquido: totLiquido
    }
  });
}
