const REDIS_URL = process.env.ADMIN_SECRET_KV_REST_API_URL;
const REDIS_TOKEN = process.env.ADMIN_SECRET_KV_REST_API_TOKEN;

// Shown on the live site until the admin panel saves real content for
// the first time. Edit these directly here, or just use /admin.html.
const DEFAULTS = {
  about: {
    name: 'Alireza Rafie',
    headline: 'Frontend Developer',
    focus: 'Frontend',
    location: 'Yazd, Iran',
    education: 'Computer Engineering Student',
    experienceYears: '2+',
    languages: ['Farsi', 'English'],
    openTo: ['internship', 'remote', 'on-site'],
    available: true,
    passion: 'shipping reliable software',
    bioFa: 'مهندس نرم‌افزاری که هم طراحی UI می‌کنه هم مطمئن می‌شه با خیال راحت دیپلوی بشه.\nاز کامپوننت‌سازی تا پایپ‌لاین CI/CD، همه‌جای چرخه توسعه رو می‌پوشونم.',
  },
  skills: {
    frontend: [
      { name: 'HTML / CSS', pct: 70 },
      { name: 'JavaScript', pct: 40 },
      { name: 'TypeScript', pct: 20 },
      { name: 'React', pct: 15 },
      { name: 'Tailwind / Bootstrap', pct: 60 },
    ],
    backend: [
      { name: 'Node.js', pct: 20 },
      { name: 'Express.js', pct: 20 },
      { name: 'REST API', pct: 25 },
      { name: 'MongoDB', pct: 25 },
    ],
    devops: [
      { name: 'Linux', pct: 70 },
      { name: 'Git / GitHub', pct: 60 },
      { name: 'Docker', pct: 30 },
      { name: 'CI/CD Basics', pct: 25 },
    ],
  },
  experience: [],
  contact: {
    email: 'alireza.rafie.dev@proton.me',
    linkedin: 'https://www.linkedin.com/in/AlirezaR32',
    github: 'https://github.com/AlirezaR32',
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(200).json(DEFAULTS);
  try {
    const r = await redis(['GET', 'site:content']);
    const stored = r.result ? JSON.parse(r.result) : null;
    return res.status(200).json(stored || DEFAULTS);
  } catch (e) {
    return res.status(200).json(DEFAULTS);
  }
}

async function handlePost(req, res) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({ error: 'Storage not configured. Add KV_REST_API_URL / KV_REST_API_TOKEN env vars in Vercel.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  try {
    await redis(['SET', 'site:content', JSON.stringify(body)]);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save content' });
  }
  return res.status(200).json({ ok: true });
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
