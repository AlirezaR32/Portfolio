/* ══════════════════════════════════════════════════════════
   admin.js
   ══════════════════════════════════════════════════════════ */
const TOKEN_KEY = 'portfolio_admin_secret';
const getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

function authedFetch(url, opts = {}) {
  opts.headers = Object.assign({}, opts.headers, { Authorization: `Bearer ${getToken()}` });
  return fetch(url, opts);
}

/* ── Boot: try to resume a session, else show login ───────── */
(async function boot() {
  if (getToken()) {
    const ok = await verifyToken();
    if (ok) return enterApp();
    clearToken();
  }
  document.getElementById('loginScreen').style.display = 'flex';
})();

async function verifyToken() {
  try {
    const r = await authedFetch('/api/stats');
    return r.ok;
  } catch { return false; }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  setToken(pw);
  const ok = await verifyToken();
  if (!ok) {
    clearToken();
    errEl.textContent = '✕ Access denied — check ADMIN_SECRET and try again.';
    return;
  }
  enterApp();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  location.reload();
});

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'block';
  loadStats();
  loadContent();
}

/* ── Tabs ───────────────────────────────────────────────── */
document.querySelectorAll('.admin-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

/* ── STATS ──────────────────────────────────────────────── */
async function loadStats() {
  let data;
  try {
    const r = await authedFetch('/api/stats');
    if (!r.ok) throw new Error();
    data = await r.json();
  } catch {
    document.getElementById('statTotal').textContent = 'ERR';
    return;
  }

  document.getElementById('statTotal').textContent = data.total;
  document.getElementById('stat30d').textContent = data.last30Days;
  document.getElementById('statUnique').textContent = data.uniqueVisitors;
  document.getElementById('statTopCountry').textContent = (data.byCountry[0] && data.byCountry[0][0]) || '—';

  renderBarChart(data.byDay);
  renderBreakdown('bkCountry', data.byCountry);
  renderBreakdown('bkCity', data.byCity);
  renderBreakdown('bkModel', data.byModel);
  renderBreakdown('bkLanguage', data.byLanguage);
  renderRecentTable(data.recent);
}

function renderBarChart(byDay) {
  const entries = Object.entries(byDay || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const chart = document.getElementById('barchart');
  chart.innerHTML = entries.map(([date, val]) => {
    const h = Math.max(2, Math.round((val / max) * 100));
    return `<div class="bar" style="height:${h}%" title="${date}: ${val} visit(s)"></div>`;
  }).join('');
  document.getElementById('chartStart').textContent = entries[0] ? entries[0][0] : '';
  document.getElementById('chartEnd').textContent = entries.length ? entries[entries.length - 1][0] : '';
}

function renderBreakdown(containerId, pairs) {
  const el = document.getElementById(containerId);
  if (!pairs || !pairs.length) {
    el.innerHTML = `<div style="font-size:11px; color:var(--muted)">// no data yet</div>`;
    return;
  }
  const max = pairs[0][1] || 1;
  el.innerHTML = pairs.map(([name, count]) => `
    <div class="bk-row">
      <span class="bk-name">${escapeHTML(name)}</span>
      <div class="bk-bar-wrap"><div class="bk-bar" style="width:${Math.round((count / max) * 100)}%"></div></div>
      <span class="bk-count">${count}</span>
    </div>`).join('');
}

function renderRecentTable(rows) {
  const body = document.getElementById('recentBody');
  if (!rows || !rows.length) {
    body.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">// no visits logged yet</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((r) => `
    <tr>
      <td>${new Date(r.t).toLocaleString()}</td>
      <td>${escapeHTML(r.country || '—')}</td>
      <td>${escapeHTML(r.city || '—')}</td>
      <td>${escapeHTML(r.model || '—')}</td>
      <td>${escapeHTML(r.screen || '—')}</td>
      <td>${escapeHTML(r.language || '—')}</td>
      <td>${escapeHTML(r.page || '—')}</td>
    </tr>`).join('');
}

/* ── CONTENT EDITOR ─────────────────────────────────────── */
let CONTENT = null;

async function loadContent() {
  try {
    const r = await fetch('/api/content');
    CONTENT = await r.json();
  } catch {
    CONTENT = { about: {}, skills: { frontend: [], backend: [], devops: [] }, experience: [], contact: {} };
  }
  fillAboutForm(CONTENT.about || {});
  renderSkillList('skillsFrontendList', 'frontend', CONTENT.skills?.frontend || []);
  renderSkillList('skillsBackendList', 'backend', CONTENT.skills?.backend || []);
  renderSkillList('skillsDevopsList', 'devops', CONTENT.skills?.devops || []);
  renderExperienceList(CONTENT.experience || []);
  fillContactForm(CONTENT.contact || {});
}

function fillAboutForm(a) {
  document.getElementById('fName').value = a.name || '';
  document.getElementById('fHeadline').value = a.headline || '';
  document.getElementById('fFocus').value = a.focus || '';
  document.getElementById('fExpYears').value = a.experienceYears || '';
  document.getElementById('fLocation').value = a.location || '';
  document.getElementById('fEducation').value = a.education || '';
  document.getElementById('fLanguages').value = (a.languages || []).join(', ');
  document.getElementById('fOpenTo').value = (a.openTo || []).join(', ');
  document.getElementById('fPassion').value = a.passion || '';
  document.getElementById('fAvailable').checked = Boolean(a.available);
  document.getElementById('fBio').value = a.bioFa || '';
}

function fillContactForm(c) {
  document.getElementById('fEmail').value = c.email || '';
  document.getElementById('fLinkedin').value = c.linkedin || '';
  document.getElementById('fGithub').value = c.github || '';
}

/* -- Skills: dynamic rows -- */
function renderSkillList(containerId, key, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach((item) => el.appendChild(skillRow(item.name, item.pct)));
  if (!items.length) el.appendChild(skillRow('', 50));
}

function skillRow(name, pct) {
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML = `
    <div class="field"><label>Skill</label><input class="sk-name-input" value="${escapeAttr(name)}" placeholder="e.g. React" /></div>
    <div class="field pct"><label>%</label><input class="sk-pct-input" type="number" min="0" max="100" value="${pct ?? 50}" /></div>
    <button type="button" class="btn-mini danger remove-row">✕</button>
  `;
  row.querySelector('.remove-row').addEventListener('click', () => row.remove());
  return row;
}

document.querySelectorAll('[data-add-skill]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.addSkill;
    const containerId = { frontend: 'skillsFrontendList', backend: 'skillsBackendList', devops: 'skillsDevopsList' }[key];
    document.getElementById(containerId).appendChild(skillRow('', 50));
  });
});

function collectSkillList(containerId) {
  return Array.from(document.getElementById(containerId).children).map((row) => ({
    name: row.querySelector('.sk-name-input').value.trim(),
    pct: Math.max(0, Math.min(100, parseInt(row.querySelector('.sk-pct-input').value, 10) || 0)),
  })).filter((s) => s.name);
}

/* -- Experience: dynamic blocks -- */
function renderExperienceList(items) {
  const el = document.getElementById('experienceList');
  el.innerHTML = '';
  items.forEach((item) => el.appendChild(experienceBlock(item)));
}

function experienceBlock(item = {}) {
  const block = document.createElement('div');
  block.className = 'exp-block';
  block.innerHTML = `
    <div class="editor-row">
      <div class="field period"><label>Period (e.g. "2024 — Present")</label><input class="exp-period" value="${escapeAttr(item.period)}" /></div>
      <div class="field"><label>Role / Title</label><input class="exp-role" value="${escapeAttr(item.role)}" /></div>
    </div>
    <div class="editor-row">
      <div class="field"><label>Company / Project</label><input class="exp-company" value="${escapeAttr(item.company)}" /></div>
      <div class="field"><label>Type (e.g. "Internship", "Freelance")</label><input class="exp-type" value="${escapeAttr(item.type)}" /></div>
    </div>
    <div class="field" style="margin-top:6px;">
      <label>Highlights (one per line)</label>
    </div>
    <div class="bullets-list"></div>
    <div style="display:flex; gap:10px; margin-top:10px;">
      <button type="button" class="btn-mini add-bullet">+ Add line</button>
      <button type="button" class="btn-mini danger remove-exp">✕ Remove this entry</button>
    </div>
  `;
  const bulletsList = block.querySelector('.bullets-list');
  (item.bullets && item.bullets.length ? item.bullets : ['']).forEach((b) => bulletsList.appendChild(bulletRow(b)));

  block.querySelector('.add-bullet').addEventListener('click', () => bulletsList.appendChild(bulletRow('')));
  block.querySelector('.remove-exp').addEventListener('click', () => block.remove());
  return block;
}

function bulletRow(text) {
  const row = document.createElement('div');
  row.className = 'bullet-row';
  row.innerHTML = `<input value="${escapeAttr(text)}" placeholder="e.g. Built X that did Y, resulting in Z" />
    <button type="button" class="btn-mini danger remove-bullet">✕</button>`;
  row.querySelector('.remove-bullet').addEventListener('click', () => row.remove());
  return row;
}

document.getElementById('addExpBtn').addEventListener('click', () => {
  document.getElementById('experienceList').appendChild(experienceBlock({}));
});

function collectExperience() {
  return Array.from(document.getElementById('experienceList').children).map((block) => {
    const bullets = Array.from(block.querySelectorAll('.bullet-row input')).map((i) => i.value.trim()).filter(Boolean);
    return {
      period: block.querySelector('.exp-period').value.trim(),
      role: block.querySelector('.exp-role').value.trim(),
      company: block.querySelector('.exp-company').value.trim(),
      type: block.querySelector('.exp-type').value.trim(),
      bullets,
    };
  }).filter((e) => e.role);
}

/* -- Save -- */
document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('saveStatus');
  const payload = {
    about: {
      name: document.getElementById('fName').value.trim(),
      headline: document.getElementById('fHeadline').value.trim(),
      focus: document.getElementById('fFocus').value.trim(),
      experienceYears: document.getElementById('fExpYears').value.trim(),
      location: document.getElementById('fLocation').value.trim(),
      education: document.getElementById('fEducation').value.trim(),
      languages: splitCSV(document.getElementById('fLanguages').value),
      openTo: splitCSV(document.getElementById('fOpenTo').value),
      passion: document.getElementById('fPassion').value.trim(),
      available: document.getElementById('fAvailable').checked,
      bioFa: document.getElementById('fBio').value,
    },
    skills: {
      frontend: collectSkillList('skillsFrontendList'),
      backend: collectSkillList('skillsBackendList'),
      devops: collectSkillList('skillsDevopsList'),
    },
    experience: collectExperience(),
    contact: {
      email: document.getElementById('fEmail').value.trim(),
      linkedin: document.getElementById('fLinkedin').value.trim(),
      github: document.getElementById('fGithub').value.trim(),
    },
  };

  status.textContent = 'Saving...';
  status.className = 'save-status';
  try {
    const r = await authedFetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error();
    status.textContent = '✓ Saved — live on the site now.';
    status.className = 'save-status ok';
  } catch {
    status.textContent = '✕ Failed to save. Check your connection and try again.';
    status.className = 'save-status err';
  }
});

/* ── helpers ────────────────────────────────────────────── */
function splitCSV(str) { return str.split(',').map((s) => s.trim()).filter(Boolean); }
function escapeHTML(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
function escapeAttr(v) { return escapeHTML(v); }
