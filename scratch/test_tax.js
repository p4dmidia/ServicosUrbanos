const TAX_CONSTANTS_2026 = {
  INSS_ALIQUOTA: 0.11,
  INSS_TETO: 8475.55,
  DESCONTO_SIMPLIFICADO: 607.20,
  DEDUCAO_DEPENDENTE: 189.59,
  REDUTOR_PARCELA_FIXA: 978.62,
  REDUTOR_COEFICIENTE: 0.133145,
  LIMITE_ISENCAO_TOTAL: 5000.00,
  LIMITE_SUPERIOR_REDUCAO: 7350.00,
  PROGRESSIVE_TABLE: [
    { limit: 2428.80, rate: 0.0, deduction: 0.0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15, deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.73 }
  ]
};

function calculateProgressiveIRRF(baseCalculoIR) {
  if (baseCalculoIR <= 0) return { imposto: 0, rate: 0, deduction: 0 };
  for (const tier of TAX_CONSTANTS_2026.PROGRESSIVE_TABLE) {
    if (baseCalculoIR <= tier.limit) {
      const imposto = Math.max(0, (baseCalculoIR * tier.rate) - tier.deduction);
      return { imposto, rate: tier.rate, deduction: tier.deduction };
    }
  }
  const lastTier = TAX_CONSTANTS_2026.PROGRESSIVE_TABLE[TAX_CONSTANTS_2026.PROGRESSIVE_TABLE.length - 1];
  const imposto = Math.max(0, (baseCalculoIR * lastTier.rate) - lastTier.deduction);
  return { imposto, rate: lastTier.rate, deduction: lastTier.deduction };
}

function calculateRedutorLei15270(valorBruto, impostoTabela) {
  if (valorBruto <= 0 || impostoTabela <= 0) return 0;
  if (valorBruto <= TAX_CONSTANTS_2026.LIMITE_ISENCAO_TOTAL) {
    return impostoTabela;
  }
  if (valorBruto <= TAX_CONSTANTS_2026.LIMITE_SUPERIOR_REDUCAO) {
    const redutorCalc = TAX_CONSTANTS_2026.REDUTOR_PARCELA_FIXA - (TAX_CONSTANTS_2026.REDUTOR_COEFICIENTE * valorBruto);
    return Math.min(impostoTabela, Math.max(0, redutorCalc));
  }
  return 0;
}

function calculateTax(payoutBruto, dependentsCount = 0, alimonyAmount = 0) {
  const totalMonthBruto = Number(payoutBruto) || 0;
  const inssCalculadoApuracao = Math.min(totalMonthBruto, TAX_CONSTANTS_2026.INSS_TETO) * TAX_CONSTANTS_2026.INSS_ALIQUOTA;
  const legalDeductions = inssCalculadoApuracao + (dependentsCount * TAX_CONSTANTS_2026.DEDUCAO_DEPENDENTE) + (alimonyAmount || 0);
  const deducaoAplicada = Math.max(legalDeductions, TAX_CONSTANTS_2026.DESCONTO_SIMPLIFICADO);
  const totalMonthIrrfBase = Math.max(0, parseFloat((totalMonthBruto - deducaoAplicada).toFixed(2)));
  const tableResult = calculateProgressiveIRRF(totalMonthIrrfBase);
  const impostoTabela = parseFloat(tableResult.imposto.toFixed(2));
  const redutorLei = parseFloat(calculateRedutorLei15270(totalMonthBruto, impostoTabela).toFixed(2));
  const totalMonthIrrf = Math.max(0, parseFloat((impostoTabela - redutorLei).toFixed(2)));
  const liquido = Math.max(0, parseFloat((totalMonthBruto - totalMonthIrrf).toFixed(2)));

  return {
    bruto: totalMonthBruto,
    inssApurado: parseFloat(inssCalculadoApuracao.toFixed(2)),
    deducaoAplicada: parseFloat(deducaoAplicada.toFixed(2)),
    baseIR: totalMonthIrrfBase,
    aliquota: (tableResult.rate * 100) + '%',
    parcelaDeduzir: tableResult.deduction,
    impostoTabela,
    redutorLei,
    irrfFinal: totalMonthIrrf,
    liquido
  };
}

console.log('Caso da Foto (R$ 8.475,55):', calculateTax(8475.55));
console.log('Caso R$ 6.001,44:', calculateTax(6001.44));
console.log('Caso R$ 3.004,58:', calculateTax(3004.58));
