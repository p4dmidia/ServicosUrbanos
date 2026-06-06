import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulação da função do businessRules
async function getProfileById(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return profile;
}

async function getMerchantId(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, branch_id, merchant_id')
    .eq('id', userId)
    .single();

  if (!profile) return null;
  if (profile.role === 'owner') return profile.id;

  if (profile.role === 'manager') {
    if (profile.merchant_id) return profile.merchant_id;
    
    if (profile.branch_id) {
      const { data: branch } = await supabase
        .from('branches')
        .select('merchant_id')
        .eq('id', profile.branch_id)
        .maybeSingle();
      
      return branch?.merchant_id || null;
    }
  }

  return null;
}

async function checkMerchantAccess(userId: string, userEmail?: string): Promise<boolean> {
  let emailNormalized = userEmail?.trim().toLowerCase();
  
  const profile = await getProfileById(userId);
  if (!profile) return false;

  if (!emailNormalized) {
    emailNormalized = profile.email?.trim().toLowerCase();
  }

  if (emailNormalized === 'xipsdapraia23@gmail.com') {
    return true;
  }

  if (profile.role === 'manager') {
    const ownerId = await getMerchantId(userId);
    if (ownerId) {
      const ownerProfile = await getProfileById(ownerId);
      if (ownerProfile && ownerProfile.email?.trim().toLowerCase() === 'xipsdapraia23@gmail.com') {
        return true;
      }
    }
  }

  return false;
}

async function run() {
  console.log("=== Testing Merchant Access Control (Specific Target) ===");
  
  // Buscar o perfil xipsdapraia23@gmail.com
  const { data: targetOwner, error: err1 } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('email', 'xipsdapraia23@gmail.com')
    .maybeSingle();

  if (err1) {
    console.error("Error looking up owner:", err1);
  }

  if (targetOwner) {
    console.log(`Found owner: ${targetOwner.full_name} (${targetOwner.email}) | Role: ${targetOwner.role}`);
    const allowed = await checkMerchantAccess(targetOwner.id, targetOwner.email);
    console.log(`-> checkMerchantAccess allowed status: ${allowed}`);

    // Buscar filiais do proprietário
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('merchant_id', targetOwner.id);

    if (branches && branches.length > 0) {
      console.log(`Found ${branches.length} branches for this owner:`);
      for (const b of branches) {
        console.log(`  Branch: ${b.name} (${b.id})`);
        
        // Buscar gerentes desta filial
        const { data: managers } = await supabase
          .from('profiles')
          .select('id, email, role, full_name')
          .eq('branch_id', b.id)
          .eq('role', 'manager');

        if (managers && managers.length > 0) {
          for (const m of managers) {
            const mAllowed = await checkMerchantAccess(m.id, m.email);
            console.log(`    Manager: ${m.full_name} (${m.email || 'no email'}) | Role: ${m.role} | Allowed: ${mAllowed}`);
          }
        } else {
          console.log("    No managers found in this branch.");
        }
      }
    } else {
      console.log("No branches found for this owner.");
    }
  } else {
    console.log("xipsdapraia23@gmail.com is not in the profiles table yet.");
  }
}

run().catch(console.error);
