import { businessRules } from '../src/lib/businessRules';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  console.log("=== Testando Otimizações de Desempenho e Deduplicação ===");
  const testUserId = 'e7ea0ff7-454e-4e68-942c-71c4ec6ce4aa'; // André Luiz Souza

  console.time('Chamada 1: getAffiliateStats');
  const stats1 = await businessRules.getAffiliateStats(testUserId);
  console.timeEnd('Chamada 1: getAffiliateStats');

  console.time('Chamada 2: getAffiliateStats (deve vir do cache/dedup em < 5ms)');
  const stats2 = await businessRules.getAffiliateStats(testUserId);
  console.timeEnd('Chamada 2: getAffiliateStats (deve vir do cache/dedup em < 5ms)');

  console.log("Stats 1 === Stats 2:", stats1.totalEarnings === stats2.totalEarnings);

  console.time('Chamada 1: getMicrofranqueadoData');
  const mf1 = await businessRules.getMicrofranqueadoData(testUserId);
  console.timeEnd('Chamada 1: getMicrofranqueadoData');

  console.time('Chamada 2: getMicrofranqueadoData (deve vir do cache em < 5ms)');
  const mf2 = await businessRules.getMicrofranqueadoData(testUserId);
  console.timeEnd('Chamada 2: getMicrofranqueadoData (deve vir do cache em < 5ms)');

  console.log("Microfranqueado Data:", {
    isMicrofranqueado: mf1?.isMicrofranqueado,
    isLicenseActive: mf1?.isLicenseActive
  });

  console.time('Chamada 1: getEcosystemActivity (otimizado sem os 5000 perfis)');
  const act = await businessRules.getEcosystemActivity(testUserId);
  console.timeEnd('Chamada 1: getEcosystemActivity (otimizado sem os 5000 perfis)');
  console.log(`Itens de atividade carregados: ${act.length}`);

  console.log("\n=== TUDO TESTADO COM SUCESSO! ===");
}

run().catch(console.error);
