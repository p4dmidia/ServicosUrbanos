import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const payload = await req.json()
    const { mode, cpf, email, name, password, branchId, commissionRate, userId } = payload

    if (mode === 'search') {
      const { data, error } = await supabaseAdmin.rpc('search_profile_by_cpf', { search_cpf: cpf })
      if (error) throw error
      return new Response(JSON.stringify(data?.[0] || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (mode === 'create') {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, cpf }
      })
      if (authError) throw authError

      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: name,
          cpf,
          role: 'manager',
          branch_id: branchId,
          commission_rate: commissionRate
        })
        .eq('id', authUser.user.id)
      
      if (profError) throw profError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (mode === 'link') {
      const { error: linkError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: 'manager',
          branch_id: branchId,
          commission_rate: commissionRate
        })
        .eq('id', userId)
      
      if (linkError) throw linkError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Modo inválido')
  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
