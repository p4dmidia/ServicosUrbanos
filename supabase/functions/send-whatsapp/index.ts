import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Instanciar Cliente Admin do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Variáveis de ambiente do Supabase (URL ou SERVICE_ROLE_KEY) não estão configuradas.")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 2. Extrair dados da requisição
    const { message_id } = await req.json()
    if (!message_id) {
      throw new Error("Parâmetro 'message_id' é obrigatório.")
    }

    console.log(`[WhatsApp Service] Iniciando envio para message_id: ${message_id}`)

    // 3. Buscar a mensagem na fila
    const { data: messageRow, error: msgError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('id', message_id)
      .single()

    if (msgError || !messageRow) {
      throw new Error(`Mensagem não encontrada na fila: ${msgError?.message || 'Erro desconhecido'}`)
    }

    // Incrementar tentativas
    const newAttempts = (messageRow.attempts || 0) + 1

    // 4. Buscar configurações da Z-API
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      const errMsg = `Erro ao carregar configurações da Z-API: ${configError?.message || 'Configurações vazias'}`
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'failed', error_message: errMsg, attempts: newAttempts })
        .eq('id', message_id)
      throw new Error(errMsg)
    }

    // Se Z-API estiver desativada globalmente
    if (config.is_enabled === false) {
      const errMsg = "Z-API está desativada nas configurações globais."
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'failed', error_message: errMsg, attempts: newAttempts })
        .eq('id', message_id)
      return new Response(JSON.stringify({ ok: false, message: errMsg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const { zapi_instance_id, zapi_token, zapi_client_token } = config

    if (!zapi_instance_id || !zapi_token || !zapi_client_token) {
      const errMsg = "Credenciais Z-API incompletas. Verifique a aba WhatsApp nas configurações do sistema."
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'failed', error_message: errMsg, attempts: newAttempts })
        .eq('id', message_id)
      throw new Error(errMsg)
    }

    // 5. Sanetizar/Formatar número de telefone
    // Remove qualquer caractere não numérico
    let cleanedPhone = messageRow.phone.replace(/\D/g, '')

    // Regras de número brasileiro
    if (cleanedPhone.length === 10 || cleanedPhone.length === 11) {
      // Se tiver 10 ou 11 dígitos, adiciona o DDI Brasil (55)
      cleanedPhone = `55${cleanedPhone}`
    }

    if (cleanedPhone.length < 10) {
      const errMsg = `Número de telefone inválido ou incompleto: ${messageRow.phone}`
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'failed', error_message: errMsg, attempts: newAttempts })
        .eq('id', message_id)
      return new Response(JSON.stringify({ ok: false, error: errMsg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log(`[WhatsApp Service] Enviando mensagem para ${cleanedPhone}`)

    // 6. Chamar a API da Z-API
    const zapiUrl = `https://api.z-api.io/instances/${zapi_instance_id}/token/${zapi_token}/send-text`
    
    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": zapi_client_token
      },
      body: JSON.stringify({
        phone: cleanedPhone,
        message: messageRow.message
      })
    })

    const responseData = await response.json()
    console.log("[WhatsApp Service] Resposta Z-API:", JSON.stringify(responseData))

    // 7. Atualizar o status da mensagem na fila
    if (response.ok && (responseData.zapId || responseData.messageId || responseData.id)) {
      // Sucesso no envio
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempts: newAttempts,
          error_message: null
        })
        .eq('id', message_id)

      console.log(`[WhatsApp Service] Mensagem ${message_id} enviada com sucesso para ${cleanedPhone}!`)
      
      return new Response(JSON.stringify({ ok: true, data: responseData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } else {
      // Erro retornado pela Z-API
      const zapiErrorMsg = responseData.message || responseData.error || JSON.stringify(responseData)
      const errorDetail = `Erro Z-API (HTTP ${response.status}): ${zapiErrorMsg}`
      
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          error_message: errorDetail,
          attempts: newAttempts
        })
        .eq('id', message_id)

      console.error(`[WhatsApp Service] Erro no envio da mensagem ${message_id}:`, errorDetail)

      return new Response(JSON.stringify({ ok: false, error: errorDetail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

  } catch (error) {
    console.error("[WhatsApp Service] Erro fatal:", error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
