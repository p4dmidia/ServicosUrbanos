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
    const { items, payer, shippingCost, origin } = await req.json()
    const baseUrl = origin || 'http://localhost:5173'

    // O Token foi passado pelo usuário
    const accessToken = "APP_USR-3578971166847393-033109-ba453cbc6ef8a1b3df237a56cf046e29-1789724143"

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
      }
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
      console.error("Mercado Pago Error:", data)
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
      JSON.stringify({ ok: false, error: error.message, details: error.stack }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  }
})
