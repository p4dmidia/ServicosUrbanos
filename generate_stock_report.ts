import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching products...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, stock, sales, category, branch_id')
    .order('name');

  if (prodErr) {
    console.error('Error fetching products:', prodErr.message);
    return;
  }

  console.log('Fetching branch stocks...');
  const { data: branchStocks, error: stocksErr } = await supabase
    .from('product_stocks')
    .select(`
      product_id,
      stock,
      branch_id,
      branches (
        name
      )
    `);

  if (stocksErr) {
    console.error('Error fetching branch stocks:', stocksErr.message);
    return;
  }

  // Map stocks by product_id
  const stocksMap = new Map<string, any[]>();
  if (branchStocks) {
    branchStocks.forEach((item: any) => {
      const list = stocksMap.get(item.product_id) || [];
      list.push(item);
      stocksMap.set(item.product_id, list);
    });
  }

  console.log('Fetching orders...');
  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select(`
      id, 
      customer_name, 
      amount, 
      status, 
      items, 
      order_date, 
      branch_id,
      branches (
        name
      )
    `)
    .order('order_date', { ascending: false });

  if (orderErr) {
    console.error('Error fetching orders:', orderErr.message);
    return;
  }

  // Generate Report
  let markdown = `# Relatório de Estoque e Vendas por Pedido\n\n`;
  markdown += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
  
  // Section 1: Stock Summary
  markdown += `## 1. Resumo de Estoque dos Produtos\n\n`;
  markdown += `| Produto | Categoria | Vendas Totais | Estoque Total | Detalhamento por Local |\n`;
  markdown += `| :--- | :--- | :---: | :---: | :--- |\n`;
  
  for (const p of products) {
    const pStocks = stocksMap.get(p.id) || [];
    
    // Calculate matriz stock (total stock minus sum of branch stocks)
    const branchesSum = pStocks.reduce((acc, curr) => acc + curr.stock, 0);
    const matrizStock = Math.max(0, (p.stock || 0) - branchesSum);

    const locationsList: string[] = [];
    
    if (matrizStock > 0 || pStocks.length === 0) {
      locationsList.push(`LOJA MATRIZ: ${matrizStock} un.`);
    }
    
    pStocks.forEach(bs => {
      const branchName = bs.branches?.name || 'Filial Sem Nome';
      locationsList.push(`${branchName}: ${bs.stock} un.`);
    });

    markdown += `| ${p.name} | ${p.category || 'Geral'} | ${p.sales || 0} | ${p.stock || 0} | ${locationsList.join('<br>')} |\n`;
  }
  markdown += `\n`;

  // Section 2: Order Details (how many units left per order)
  markdown += `## 2. Unidades Vendidas por Pedido\n\n`;
  markdown += `Este relatório detalha a saída de estoque de cada produto individualizado por pedido realizado.\n\n`;
  markdown += `| Pedido | Data | Cliente | Status | Local de Retirada | Produtos / Quantidade | Total de Unidades |\n`;
  markdown += `| :---: | :--- | :--- | :---: | :--- | :--- | :---: |\n`;

  for (const o of orders) {
    let itemsDescription: string[] = [];
    let totalQuantity = 0;
    
    if (o.items && Array.isArray(o.items)) {
      for (const item of o.items) {
        const qty = item.quantity || 1;
        const name = item.name || 'Produto';
        itemsDescription.push(`${name} (**x${qty}**)`);
        totalQuantity += qty;
      }
    } else {
      itemsDescription.push('Nenhum item');
    }

    const dateStr = new Date(o.order_date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const branchesData = o.branches as any;
    const pickupLocationName = (Array.isArray(branchesData) ? branchesData[0]?.name : branchesData?.name) || 'LOJA MATRIZ (Sede)';

    markdown += `| #${o.id} | ${dateStr} | ${o.customer_name || 'Cliente'} | ${o.status} | **${pickupLocationName}** | ${itemsDescription.join(', ')} | ${totalQuantity} |\n`;
  }

  // Write to workspace
  const workspacePath = path.resolve('relatorio_estoque.md');
  fs.writeFileSync(workspacePath, markdown, 'utf8');
  console.log('Report updated in workspace at:', workspacePath);

  // Write to artifacts folder
  const artifactPath = 'C:\\Users\\eu\\.gemini\\antigravity-ide\\brain\\067cad6f-8f58-4379-a616-2de12347e6ed\\stock_and_order_report.md';
  fs.writeFileSync(artifactPath, markdown, 'utf8');
  console.log('Report generated at:', artifactPath);
}

run().catch(console.error);
