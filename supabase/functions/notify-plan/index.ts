// Envia notificação push a um atleta quando o treinador lhe define o plano.
// Autenticação própria: valida o JWT do chamador e confirma a relação
// treinador→atleta antes de enviar.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(jwt)
    const caller = userData?.user
    if (!caller) return json({ error: 'unauthorized' }, 401)

    const { athleteId } = await req.json().catch(() => ({}))
    if (!athleteId) return json({ error: 'missing athleteId' }, 400)

    // Só o treinador ligado ao atleta pode notificá-lo.
    const { data: link } = await admin
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', caller.id)
      .eq('athlete_id', athleteId)
      .maybeSingle()
    if (!link) return json({ error: 'not_coach' }, 403)

    const { data: cfgRows } = await admin
      .from('app_config')
      .select('key,value')
      .in('key', ['vapid_public', 'vapid_private', 'vapid_subject'])
    const cfg = Object.fromEntries((cfgRows ?? []).map((r) => [r.key, r.value]))
    webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private)

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', athleteId)

    const payload = JSON.stringify({
      title: 'Novo plano de treino 💪',
      body: 'O teu treinador enviou o plano desta semana. Bora!',
      url: '/jessifit/',
    })

    let sent = 0
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
    return json({ ok: true, sent })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
