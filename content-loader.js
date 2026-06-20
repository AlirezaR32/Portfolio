/* ══════════════════════════════════════════════════════════
   content-loader.js
   Pulls editable site content (about/skills/experience/contact)
   from /api/content and renders it into the page.
   If the API isn't deployed yet (or fails), the page silently
   keeps whatever is already hardcoded in index.html — nothing
   ever breaks because this script ran.
   ══════════════════════════════════════════════════════════ */
(function () {
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    }[c]));
  }

  function hashOf(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(7, '0').slice(0, 7);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el && val != null) el.textContent = val;
  }

  /* ── HERO ───────────────────────────── */
  function applyHero(a) {
    if (!a) return;
    const nameEl = document.getElementById('heroName');
    if (nameEl && a.name) { nameEl.textContent = a.name; nameEl.setAttribute('data-text', a.name); }
    setText('heroRoleText', a.headline);
    setText('statYears', a.experienceYears);
  }

  /* ── ABOUT (about.json terminal block) ─ */
  function applyAboutTbody(a) {
    const el = document.getElementById('aboutTbody');
    if (!el || !a) return;
    const langs = (a.languages || []).map(l => `<span style="color:var(--cyan)">"${esc(l)}"</span>`).join(',&nbsp;');
    const openTo = (a.openTo || []).map(l => `<span style="color:var(--cyan)">"${esc(l)}"</span>`).join(',&nbsp;');
    el.innerHTML = `
      <div><span class="p">$&nbsp;</span><span style="color:#fff">cat about.json</span></div>
      <div style="color:var(--text); padding-left:4px; margin-top:4px; line-height:2.2; font-size:12px;">
        {<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"name"</span>:&nbsp;<span style="color:var(--cyan)">"${esc(a.name)}"</span>,<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"focus"</span>:&nbsp;<span style="color:var(--cyan)">"${esc(a.focus)}"</span>,<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"location"</span>:&nbsp;<span style="color:var(--cyan)">"${esc(a.location)}"</span>,<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"education"</span>:&nbsp;<span style="color:var(--cyan)">"${esc(a.education)}"</span>,<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"languages"</span>:&nbsp;[${langs}],<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"passion"</span>:&nbsp;<span style="color:var(--cyan)">"${esc(a.passion)}"</span>,<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"open_to"</span>:&nbsp;[${openTo}],<br>
        &nbsp;&nbsp;<span style="color:var(--muted)">"available"</span>:&nbsp;<span style="color:${a.available ? 'var(--green)' : '#ff5555'}">${a.available ? 'true' : 'false'}</span><br>
        }
      </div>
      <div style="margin-top:14px"><span class="p">$&nbsp;</span><span style="color:#fff">uptime</span></div>
      <div style="color:var(--muted); padding-left:4px; font-size:12px;">${esc(a.experienceYears)} years of learning and building projects</div>
      <div style="margin-top:10px; font-size:12px; color:var(--muted)"><span class="p">$&nbsp;</span><span style="color:var(--border)"># I automate things so I can automate more things</span></div>
    `;
  }

  function applyInfoGrid(a) {
    const el = document.getElementById('infoGrid');
    if (!el || !a) return;
    el.innerHTML = `
      <div class="info-cell"><div class="info-key">Status</div><div class="info-val g">${a.available ? '● Open to Work' : '○ Not Available'}</div></div>
      <div class="info-cell"><div class="info-key">Location</div><div class="info-val">${esc(a.location)}</div></div>
      <div class="info-cell"><div class="info-key">Focus</div><div class="info-val c">${esc(a.focus)}</div></div>
      <div class="info-cell"><div class="info-key">Education</div><div class="info-val">${esc(a.education)}</div></div>
      <div class="info-cell"><div class="info-key">Experience</div><div class="info-val">${esc(a.experienceYears)} Years</div></div>
      <div class="info-cell"><div class="info-key">Work Mode</div><div class="info-val">${(a.openTo || []).map(esc).join(' / ')}</div></div>
    `;
  }

  function applyBio(a) {
    const el = document.getElementById('aboutBio');
    if (!el || !a || !a.bioFa) return;
    el.innerHTML = esc(a.bioFa).replace(/\n/g, '<br>');
  }

  /* ── SKILLS ─────────────────────────── */
  function renderSkillBlock(title, icon, items, titleClass, fillClass) {
    const rows = (items || []).map(s => `
      <div class="sk-item">
        <div class="sk-head"><span class="sk-name">${esc(s.name)}</span><span class="sk-pct">${esc(s.pct)}%</span></div>
        <div class="sk-track"><div class="sk-fill ${fillClass}" data-w="${esc(s.pct)}"></div></div>
      </div>`).join('');
    return `<div class="skill-section-title${titleClass ? ' ' + titleClass : ''}">${icon} ${esc(title)}</div>${rows}`;
  }

  function applySkills(skills) {
    if (!skills) return;
    const fe = document.getElementById('tbodyFrontend');
    const be = document.getElementById('tbodyBackend');
    const de = document.getElementById('tbodyDevops');
    if (fe) fe.innerHTML = renderSkillBlock('Frontend Development', '⚛', skills.frontend, '', 'g');
    if (be) be.innerHTML = renderSkillBlock('Backend Development', '⚙', skills.backend, '', 'c');
    if (de) de.innerHTML = renderSkillBlock('DevOps & Tools', '🐳', skills.devops, '', 'c');
    // re-trigger the scroll-fill animation on the freshly injected bars
    if (window.initSkillBars) window.initSkillBars();
  }

  /* ── EXPERIENCE ─────────────────────── */
  function applyExperience(exp) {
    const log = document.getElementById('gitlogTbody');
    const tl = document.getElementById('timelineContainer');
    if (!log || !tl) return;
    exp = exp || [];

    if (!exp.length) {
      log.innerHTML = `<div>// no commits yet — add experience from the admin panel</div>`;
      tl.innerHTML = `<div style="color:var(--muted); font-size:13px;">// هنوز سابقه‌ای ثبت نشده. از پنل ادمین یه ردیف اضافه کن.</div>`;
      return;
    }

    log.innerHTML = exp.map((e, i) => {
      const hash = hashOf((e.role || '') + (e.company || '') + i);
      const head = i === 0 ? `&nbsp;<span style="color:var(--green)">(HEAD → main)</span>` : '';
      return `<div><span style="color:var(--amber)">* ${hash}</span>${head}&nbsp;feat: ${esc(e.role)}${e.company ? ' @ ' + esc(e.company) : ''}</div>`;
    }).join('');

    tl.innerHTML = exp.map((e, i) => {
      const hash = hashOf((e.role || '') + (e.company || '') + i);
      const duties = (e.bullets || []).filter(Boolean).map(b => `<li>${esc(b)}</li>`).join('');
      return `
        <div class="exp-item reveal vis">
          <div class="exp-hash"><span>${hash}</span>&nbsp;${esc(e.period)}</div>
          <div class="exp-role">${esc(e.role)}</div>
          <div class="exp-co">${esc(e.company)}${e.type ? ' &nbsp;·&nbsp; ' + esc(e.type) : ''}</div>
          <ul class="exp-duties">${duties}</ul>
        </div>`;
    }).join('');
  }

  /* ── CONTACT ────────────────────────── */
  function applyContact(c) {
    if (!c) return;
    const set = (id, url, label) => {
      const a = document.getElementById(id);
      if (!a) return;
      if (url) a.href = url.startsWith('mailto:') || url.startsWith('http') ? url : 'https://' + url;
      const v = a.querySelector('.clink-val');
      if (v && label) v.textContent = label;
    };
    if (c.email) set('contactEmailLink', 'mailto:' + c.email, c.email);
    if (c.linkedin) set('contactLinkedinLink', c.linkedin, c.linkedin.replace(/^https?:\/\//, ''));
    if (c.github) set('contactGithubLink', c.github, c.github.replace(/^https?:\/\//, ''));
    const form = document.getElementById('contactForm');
    if (form && c.email) form.action = 'https://formsubmit.co/' + c.email;
  }

  /* ── MAIN ───────────────────────────── */
  fetch('/api/content')
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (!data) return;
      applyHero(data.about);
      applyAboutTbody(data.about);
      applyInfoGrid(data.about);
      applyBio(data.about);
      applySkills(data.skills);
      applyExperience(data.experience);
      applyContact(data.contact);
    })
    .catch(() => {
      /* API not deployed yet, or offline — keep the static fallback content as-is */
    });
})();
