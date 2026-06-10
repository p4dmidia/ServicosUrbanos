import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TESTING Z-API TRIGGERS AND QUEUE ---');

  // 1. Get an existing active profile
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, role, whatsapp')
    .limit(5);

  if (profError || !profiles || profiles.length === 0) {
    console.error('Error fetching profiles or no profiles found:', profError?.message);
    return;
  }

  console.log('Found profiles:', profiles.map(p => ({ id: p.id, name: p.full_name, role: p.role, whatsapp: p.whatsapp })));

  const targetProfile = profiles[0];
  const oldWhatsapp = targetProfile.whatsapp;

  console.log(`\nUsing profile: ${targetProfile.full_name} (${targetProfile.id})`);

  // 2. Clear old messages from whatsapp_messages if any (we will just query for new ones)
  const startTime = new Date().toISOString();
  console.log(`Test start time: ${startTime}`);

  // 3. Update the profile's whatsapp field to trigger update (Wait, our trigger is AFTER INSERT on profiles, but let's test if we can insert or check another trigger)
  // Let's check: in migration_zapi.sql, we created:
  // - on_profile_created_whatsapp: AFTER INSERT on public.profiles
  // - on_order_paid_whatsapp: AFTER UPDATE on public.orders
  // - on_order_status_change_whatsapp: AFTER UPDATE on public.orders
  // - on_product_stock_low_whatsapp: AFTER UPDATE on public.products
  // - on_mmn_config_change_whatsapp: AFTER UPDATE on public.mmn_config

  // Let's test by inserting a message directly into the queue:
  console.log('\nTesting direct queue insert...');
  const { data: queueMessage, error: queueError } = await supabase
    .from('whatsapp_messages')
    .insert([{
      phone: '5511999999999',
      message: 'Mensagem de teste de inserção direta'
    }])
    .select()
    .single();

  if (queueError) {
    console.error('Error inserting directly into whatsapp_messages:', queueError.message);
  } else {
    console.log('Successfully inserted message directly into queue:', {
      id: queueMessage.id,
      phone: queueMessage.phone,
      message: queueMessage.message,
      status: queueMessage.status
    });
  }

  // 4. Test MMN Config trigger (Alteração nos termos/cashback)
  console.log('\nTesting MMN Config trigger...');
  // We fetch the current config first
  const { data: mmnConfig, error: configError } = await supabase
    .from('mmn_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (configError || !mmnConfig) {
    console.error('Error fetching MMN config:', configError?.message);
  } else {
    // We update the monthly cashback rate to trigger the terms changed WhatsApp broadcast
    const newRate = Number(mmnConfig.cashback_mensal) === 2.75 ? 2.80 : 2.75;
    console.log(`Updating monthly cashback from ${mmnConfig.cashback_mensal}% to ${newRate}%...`);
    
    const { error: updateConfigError } = await supabase
      .from('mmn_config')
      .update({ cashback_mensal: newRate })
      .eq('id', 1);

    if (updateConfigError) {
      console.error('Error updating MMN config:', updateConfigError.message);
    } else {
      console.log('MMN config updated successfully. Checking if broadcast messages were queued...');
      
      // Let's wait 1.5 seconds for the triggers to fire
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: messages, error: fetchMsgsError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (fetchMsgsError) {
        console.error('Error fetching queued messages:', fetchMsgsError.message);
      } else {
        console.log('Recent messages in queue:');
        messages?.forEach(m => {
          console.log(`- ID: ${m.id}, Phone: ${m.phone}, Message: "${m.message}", Status: ${m.status}, Error: ${m.error_message}`);
        });
      }
    }

    // Restore old value
    console.log(`Restoring old monthly cashback value to ${mmnConfig.cashback_mensal}%...`);
    await supabase
      .from('mmn_config')
      .update({ cashback_mensal: mmnConfig.cashback_mensal })
      .eq('id', 1);
  }

  console.log('\n--- TEST FLOW COMPLETED ---');
}

run().catch(console.error);
