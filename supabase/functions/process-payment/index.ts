import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, payer, shippingCost, orderId, method } = await req.json()
    
    // O Token foi passado pelo usuário
    const accessToken = "APP_USR-3578971166847393-033109-ba453cbc6ef8a1b3df237a56cf046e29-1789724143"

    // Se o método for PIX, criamos um pagamento direto
    if (method === 'pix') {
      const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * Number(item.quantity)), 0) + (Number(shippingCost) || 0)

      const paymentData: any = {
        transaction_amount: Number(totalAmount.toFixed(2)),
        description: `Pedido ${orderId} - UrbaShop`,
        payment_method_id: 'pix',
        payer: {
          email: payer.email,
          first_name: payer.name ? payer.name.split(' ')[0] : 'Cliente',
          last_name: payer.name && payer.name.split(' ').length > 1 ? payer.name.split(' ').slice(1).join(' ') : 'UrbaShop',
          identification: payer.cpf ? {
            type: 'CPF',
            number: payer.cpf.replace(/\D/g, '')
          } : undefined
        },
        external_reference: orderId,
        notification_url: "https://ioslywxfppswfuzxzwkn.supabase.co/functions/v1/mercadopago-webhook"
      }

      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": orderId.toString()
        },
        body: JSON.stringify(paymentData)
      })


      const data = await response.json()
      console.log("Mercado Pago Response:", JSON.stringify(data))

      if (!response.ok) {
        console.error("Mercado Pago PIX Error Details:", data)
        const errorMessage = data.message || data.cause?.[0]?.description || JSON.stringify(data)
        throw new Error(`Mercado Pago PIX erro: ${errorMessage}`)
      }

      if (!data.point_of_interaction?.transaction_data?.qr_code) {
        console.error("Missing QR Code in MP response:", data)
        throw new Error("QR Code não retornado pela API do Mercado Pago")
      }

      return new Response(
        JSON.stringify({ 
          id: data.id,
          qr_code: data.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
          status: data.status
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      )
    }


    // Fallback para checkout normal (preferência) se necessário, mas o usuário quer apenas PIX
    // Manteremos a lógica de preferência apenas como backup ou se o método não for especificado
    const preferenceData: any = {
      items: items.map((item: any) => ({
        title: item.title.substring(0, 250),
        quantity: Number(item.quantity),
        currency_id: 'BRL',
        unit_price: Number(item.unit_price)
      })),
      payer: {
        email: payer.email,
        name: payer.name ? payer.name.split(' ')[0] : 'Usuário',
        surname: payer.name && payer.name.split(' ').length > 1 ? payer.name.split(' ').slice(1).join(' ') : 'UrbaShop'
      },
      external_reference: orderId,
      notification_url: "https://ioslywxfppswfuzxzwkn.supabase.co/functions/v1/mercadopago-webhook"
    }

    if (shippingCost && Number(shippingCost) > 0) {
      preferenceData.shipments = {
        cost: Number(shippingCost),
        mode: 'not_specified'
      }
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Mercado Pago erro: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify({ init_point: data.init_point, id: data.id }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Payment error:", error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  }
})

