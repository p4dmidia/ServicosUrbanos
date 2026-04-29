import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Webhook received:", body)

    // Mercado Pago envia o ID do recurso no campo data.id ou id dependendo do tópico
    const resourceId = body.data?.id || body.id
    const topic = body.type || body.topic

    if (topic === 'payment' && resourceId) {
      const accessToken = "APP_USR-3578971166847393-033109-ba453cbc6ef8a1b3df237a56cf046e29-1789724143"

      // 1. Consultar detalhes do pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      })

      if (!mpResponse.ok) {
        throw new Error(`Erro ao consultar pagamento no Mercado Pago: ${mpResponse.statusText}`)
      }

      const paymentData = await mpResponse.json()
      console.log("Payment details:", paymentData)

      // 2. Verificar se o pagamento foi aprovado
      if (paymentData.status === 'approved') {
        const orderId = paymentData.external_reference

        if (!orderId) {
          throw new Error("ID do pedido (external_reference) não encontrado no pagamento")
        }

        // 3. Atualizar o status do pedido no Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'Pago, Aguardando Retirada' })
          .eq('id', orderId)

        if (updateError) {
          throw updateError
        }

        console.log(`Pedido ${orderId} atualizado para Pago com sucesso!`)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
