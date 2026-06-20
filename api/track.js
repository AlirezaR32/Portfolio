const REDIS_URL = process.env.ADMIN_SECRET_KV_REST_API_URL;
const REDIS_TOKEN = process.env.ADMIN_SECRET_KV_REST_API_TOKEN;
const MAX_EVENTS = 3000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    // Storage isn't configured yet — fail silently so the site never breaks.
    return res.status(204).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const ip =
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    '';
  const visitor = ip ;

  const event = {
    t: Date.now(),
    page: body.page || null,
    referrer: body.referrer || null,
    screen: body.screen || null,
    pixelRatio: body.pixelRatio || null,
    language: body.language || null,
    timezone: body.timezone || null,
    model: body.model || null,
    platformVersion: body.platformVersion || null,
    country: req.headers['x-vercel-ip-country'] || null,
    region: req.headers['x-vercel-ip-country-region'] || null,
    city: req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null,
    visitor,
  };

  try {
    await redis(['RPUSH', 'analytics:events', JSON.stringify(event)]);
    await redis(['LTRIM', 'analytics:events', String(-MAX_EVENTS), '-1']);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to store event' });
  }

  return res.status(204).end();
}

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error('Redis error ' + r.status);
  return r.json();
}
