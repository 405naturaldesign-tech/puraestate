// Supabase Edge Function: Composio WhatsApp Integration
// Deployed via: supabase functions deploy composio-whatsapp
// Environment variables (set in Supabase dashboard):
//   COMPOSIO_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const COMPOSIO_API_URL = "https://backend.composio.dev/api"

serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": Deno.env.get("COMPOSIO_API_KEY") || "",
  }

  const { method, path, body } = await req.json().catch(() => ({}))

  try {
    switch (method || "GET") {
      case "SEND_MESSAGE":
        // Send WhatsApp message via Composio
        const msgRes = await fetch(`${COMPOSIO_API_URL}/v1/whatsapp/send`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            to: body?.to,
            message: body?.message,
            mediaUrl: body?.mediaUrl,
          }),
        })
        const msgData = await msgRes.json()
        return new Response(JSON.stringify({ success: true, data: msgData }), {
          headers: { "Content-Type": "application/json" },
        })

      case "GET_CONVERSATIONS":
        const convRes = await fetch(
          `${COMPOSIO_API_URL}/v1/whatsapp/conversations`,
          { headers }
        )
        const convData = await convRes.json()
        return new Response(JSON.stringify({ success: true, data: convData }), {
          headers: { "Content-Type": "application/json" },
        })

      case "HEALTH":
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "composio-whatsapp",
            timestamp: new Date().toISOString(),
          }),
          { headers: { "Content-Type": "application/json" } }
        )

      default:
        return new Response(
          JSON.stringify({ error: "Unknown method" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})