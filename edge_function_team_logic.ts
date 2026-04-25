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
    console.log('Payload received:', JSON.stringify(payload))
    const { mode, cpf, email, name, password, branchId, commissionRate, userId, merchantId } = payload

    // Helper to sanitize branchId
    const sanitizedBranchId = branchId === '' || branchId === 'matriz' ? null : branchId

    if (mode === 'search') {
      const { data, error } = await supabaseAdmin.rpc('search_profile_by_cpf', { search_cpf: cpf })
      if (error) throw error
      return new Response(JSON.stringify(data?.[0] || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (mode === 'create') {
      console.log('Creating new manager auth account...')
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, cpf }
      })
      if (authError) {
        console.error('Auth creation error:', authError)
        throw authError
      }

      console.log('Updating profile for new manager...')
      const { error: profError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: name,
          cpf,
          role: 'manager',
          branch_id: sanitizedBranchId,
          merchant_id: merchantId,
          commission_rate: commissionRate
        })
        .eq('id', authUser.user.id)
      
      if (profError) {
        console.error('Profile update error:', profError)
        throw profError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (mode === 'link' || mode === 'update') {
      console.log(`Mode ${mode}: Updating profile ${userId}...`)
      const updates: any = {
        role: 'manager',
        branch_id: sanitizedBranchId,
        merchant_id: merchantId,
        commission_rate: commissionRate
      }
      
      if (name) updates.full_name = name

      const { error: linkError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
      
      if (linkError) {
        console.error('Link/Update profile error:', linkError)
        throw linkError
      }

      // Update Auth Email/Password if provided and not empty
      if (mode === 'update') {
        const authUpdates: any = {}
        if (email && email.trim() !== '') authUpdates.email = email
        if (password && password.trim() !== '') authUpdates.password = password
        
        if (Object.keys(authUpdates).length > 0) {
          console.log('Updating auth credentials...')
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            authUpdates
          )
          if (authError) {
            console.error('Auth update error:', authError)
            throw authError
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (mode === 'unlink') {
      console.log('Unlinking manager:', userId)
      const { error: unlinkError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: 'affiliate',
          branch_id: null,
          commission_rate: 0
        })
        .eq('id', userId)
      
      if (unlinkError) {
        console.error('Unlink error:', unlinkError)
        throw unlinkError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Modo inválido')
  } catch (error) {
    console.error('Fatal error in edge function:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
