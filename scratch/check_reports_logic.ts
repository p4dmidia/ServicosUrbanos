import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: orders, error } = await supabase.from('orders').select('*');
  if (error) {
    console.error(error);
    return;
  }

  const startDateStr = '2026-05-03';
  const endDateStr = '2026-06-02';
  
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  console.log(`Start date filter: ${start.toISOString()}`);
  console.log(`End date filter: ${end.toISOString()}`);

  const reportRecords = orders.map(o => {
    const saleDate = o.order_date ? new Date(o.order_date) : new Date();
    return {
      orderId: o.id,
      amount: Number(o.amount),
      orderStatus: o.status === 'Concluído' ? 'Pago' : o.status,
      orderDateRaw: saleDate
    };
  });

  const filteredRecords = reportRecords.filter(r => {
    const orderDate = r.orderDateRaw;
    return orderDate >= start && orderDate <= end;
  });

  console.log('Filtered records:', filteredRecords.map(r => ({ id: r.orderId, amount: r.amount, status: r.orderStatus, date: r.orderDateRaw.toISOString() })));

  const activeRecords = filteredRecords.filter(r => r.orderStatus !== 'Cancelado');
  console.log('Active records:', activeRecords.map(r => ({ id: r.orderId, amount: r.amount, status: r.orderStatus })));

  const totalSales = activeRecords.reduce((acc, r) => acc + r.amount, 0);
  console.log('Total sales:', totalSales);
}

check();
