import 'dotenv/config';
import { calculateSubscriptionRepasseCycle } from '../src/lib/businessRules';

console.log('=====================================================');
console.log('TESTE DE VALIDAÇÃO: CICLOS DE REPASSE E RENOVAÇÃO MBM');
console.log('=====================================================\n');

// 1. Cenário Trimestral (Início Setembro/2027)
const trimestral = calculateSubscriptionRepasseCycle('2027-09-15', 'trimestral');
console.log('1. Plano Trimestral (Início Setembro/2027):');
console.log(' - Mês Início:', trimestral.startDisplay, `(${trimestral.startMonthStr})`);
console.log(' - 1º Repasse:', trimestral.firstRepasseDisplay, `(${trimestral.firstRepasseMonthStr})`);
console.log(' - Cobrança Renovação:', trimestral.renewalBillingDisplay, `(${trimestral.renewalBillingMonthStr})`);
console.log(' - Último Repasse:', trimestral.lastRepasseDisplay, `(${trimestral.lastRepasseMonthStr})`);
console.log(' - Meses de Repasse:', trimestral.repasseMonthsList.join(', '));
console.log(' - Fim do Ciclo:', trimestral.cycleEndDate.toISOString().substring(0, 10));
console.log(' - Repasse em Jan/2028?', trimestral.isRepasseMonth('2028-01') ? 'SIM (ERRO)' : 'NÃO (CORRETO)');
console.log(' - Validação Trimestral:', 
  trimestral.firstRepasseMonthStr === '2027-10' &&
  trimestral.renewalBillingMonthStr === '2027-11' &&
  trimestral.lastRepasseMonthStr === '2027-12' &&
  !trimestral.isRepasseMonth('2028-01') ? '✅ APROVADO' : '❌ FALHOU');
console.log('');

// 2. Cenário Semestral (Início Setembro/2027)
const semestral = calculateSubscriptionRepasseCycle('2027-09-15', 'semestral');
console.log('2. Plano Semestral (Início Setembro/2027):');
console.log(' - Mês Início:', semestral.startDisplay, `(${semestral.startMonthStr})`);
console.log(' - 1º Repasse:', semestral.firstRepasseDisplay, `(${semestral.firstRepasseMonthStr})`);
console.log(' - Cobrança Renovação:', semestral.renewalBillingDisplay, `(${semestral.renewalBillingMonthStr})`);
console.log(' - Último Repasse:', semestral.lastRepasseDisplay, `(${semestral.lastRepasseMonthStr})`);
console.log(' - Meses de Repasse:', semestral.repasseMonthsList.join(', '));
console.log(' - Fim do Ciclo:', semestral.cycleEndDate.toISOString().substring(0, 10));
console.log(' - Repasse em Abr/2028?', semestral.isRepasseMonth('2028-04') ? 'SIM (ERRO)' : 'NÃO (CORRETO)');
console.log(' - Validação Semestral:', 
  semestral.firstRepasseMonthStr === '2027-10' &&
  semestral.renewalBillingMonthStr === '2028-02' &&
  semestral.lastRepasseMonthStr === '2028-03' &&
  !semestral.isRepasseMonth('2028-04') ? '✅ APROVADO' : '❌ FALHOU');
console.log('');

// 3. Cenário Anual (Início Setembro/2027)
const anual = calculateSubscriptionRepasseCycle('2027-09-15', 'anual');
console.log('3. Plano Anual (Início Setembro/2027):');
console.log(' - Mês Início:', anual.startDisplay, `(${anual.startMonthStr})`);
console.log(' - 1º Repasse:', anual.firstRepasseDisplay, `(${anual.firstRepasseMonthStr})`);
console.log(' - Cobrança Renovação:', anual.renewalBillingDisplay, `(${anual.renewalBillingMonthStr})`);
console.log(' - Último Repasse:', anual.lastRepasseDisplay, `(${anual.lastRepasseMonthStr})`);
console.log(' - Meses de Repasse:', anual.repasseMonthsList.join(', '));
console.log(' - Fim do Ciclo:', anual.cycleEndDate.toISOString().substring(0, 10));
console.log(' - Repasse em Out/2028?', anual.isRepasseMonth('2028-10') ? 'SIM (ERRO)' : 'NÃO (CORRETO)');
console.log(' - Validação Anual:', 
  anual.firstRepasseMonthStr === '2027-10' &&
  anual.renewalBillingMonthStr === '2028-08' &&
  anual.lastRepasseMonthStr === '2028-09' &&
  !anual.isRepasseMonth('2028-10') ? '✅ APROVADO' : '❌ FALHOU');
console.log('\n=====================================================');
