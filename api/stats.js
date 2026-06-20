const REDIS_URL = process.env.ADMIN_SECRET_KV_REST_API_URL;
const REDIS_TOKEN = process.env.ADMIN_SECRET_KV_REST_API_TOKEN;
const DAY_MS = 86400000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({ error: 'Storage not configured. Add KV_REST_API_URL / KV_REST_API_TOKEN env vars in Vercel.' });
  }

  let raw;
  try {
    raw = await redis(['LRANGE', 'analytics:events', '0', '-1']);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read events' });
  }

  const events = (raw.result || [])
    .map((s) => { try { return JSON.parse(s); } catch { return null; } })
    .filter(Boolean);

  const now = Date.now();
  const last30 = events.filter((e) => now - e.t < 30 * DAY_MS);

  const byDay = {};
  for (let i = 29; i >= 0; i--) {
    byDay[new Date(now - i * DAY_MS).toISOString().slice(0, 10)] = 0;
  }
  last30.forEach((e) => {
    const key = new Date(e.t).toISOString().slice(0, 10);
    if (key in byDay) byDay[key]++;
  });

  const topCount = (arr, field, limit = 10) => {
    const m = {};
    arr.forEach((e) => {
      const v = e[field] || 'Unknown';
      m[v] = (m[v] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, limit);
  };

  res.status(200).json({
    total: events.length,
    last30Days: last30.length,
    uniqueVisitors: new Set(events.map((e) => e.visitor).filter(Boolean)).size,
    byDay,
    byCountry: topCount(last30, 'country'),
    byCity: topCount(last30, 'city'),
    byModel: topCount(last30, 'model'),
    byLanguage: topCount(last30, 'language'),
    byScreen: topCount(last30, 'screen'),
    recent: events.slice(-50).reverse(),
  });
}

function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return Boolean(process.env.ADMIN_SECRET) && token === process.env.ADMIN_SECRET;
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
