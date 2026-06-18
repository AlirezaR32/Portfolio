/* ── Matrix Rain ────────────────────── */
(function(){
  const c = document.getElementById('matrix-canvas');
  const x = c.getContext('2d');
  let w,h,cols,drops;
  const chars = 'アイウエオカキクケコ01サシスセソABCDEFGH0123456789@#$%&';
  function init(){
    w = c.width = innerWidth; h = c.height = innerHeight;
    cols = Math.floor(w/14); drops = Array(cols).fill(1);
  }
  function draw(){
    x.fillStyle='rgba(6,8,16,.05)'; x.fillRect(0,0,w,h);
    x.fillStyle='#00ff41'; x.font='13px JetBrains Mono';
    drops.forEach((y,i)=>{
      x.fillText(chars[Math.floor(Math.random()*chars.length)],i*14,y*14);
      if(y*14>h && Math.random()>.975) drops[i]=0;
      drops[i]++;
    });
  }
  init(); window.addEventListener('resize',init); setInterval(draw,50);
})();

/* ── Boot Sequence ──────────────────── */
(function(){
  const lines = [
    {t:'BIOS v4.2.1 — INITIALIZING SYSTEM HARDWARE...', d:0,   c:'dim'},
    {t:'CPU : Intel Core i9-14900K @ 5.8GHz ........... OK', d:280, c:'ok'},
    {t:'RAM : 64GB DDR5-6400 ECC ...................... OK', d:450, c:'ok'},
    {t:'DISK: 2TB Samsung 990 Pro NVMe ............... OK', d:620, c:'ok'},
    {t:'GPU : RTX 4080 16GB VRAM ..................... OK', d:790, c:'ok'},
    {t:'', d:950},
    {t:'Booting PORTFOLIO_OS 2026.6 (kernel 6.8.0-amd64)', d:1050, c:'cyan'},
    {t:'', d:1150},
    {t:'  [  OK  ] module: frontend-engine.ko', d:1300, c:'ok'},
    {t:'  [  OK  ] module: devops-core.ko',     d:1450, c:'ok'},
    {t:'  [  OK  ] module: ui-renderer.ko',     d:1580, c:'ok'},
    {t:'  [  OK  ] module: animation.ko',       d:1700, c:'ok'},
    {t:'  [  OK  ] module: matrix-rain.ko',     d:1820, c:'ok'},
    {t:'', d:1950},
    {t:'  [  OK  ] Started: react-renderer.service',  d:2050, c:'ok'},
    {t:'  [  OK  ] Started: asset-pipeline.service',  d:2180, c:'ok'},
    {t:'  [  OK  ] Started: cdn-cache.service',       d:2300, c:'ok'},
    {t:'  [  OK  ] Started: skills-db.service',       d:2420, c:'ok'},
    {t:'  [  OK  ] Started: project-index.service',   d:2540, c:'ok'},
    {t:'  [ WARN ] coffee-supply: LOW — refill recommended', d:2650, c:'amber'},
    {t:'', d:2800},
    {t:'✓ All modules loaded. Portfolio online.', d:2900, c:'cyan'},
  ];

  const wrap = document.getElementById('boot-lines');
  const prog = document.getElementById('boot-prog');
  const bar  = document.getElementById('boot-bar');
  const pct  = document.getElementById('boot-pct');
  const boot = document.getElementById('boot');

  lines.forEach(({t,d,c})=>{
    setTimeout(()=>{
      const el = document.createElement('div');
      el.className = 'boot-line' + (c ? ' '+c : '');
      el.textContent = t;
      el.style.opacity = '1';
      wrap.appendChild(el);
      wrap.scrollTop = wrap.scrollHeight;
    }, d);
  });

  setTimeout(()=>{
    prog.style.display = 'block';
    let p = 0;
    const iv = setInterval(()=>{
      p += 1.4;
      if(p >= 100){ p = 100; clearInterval(iv);
        setTimeout(()=>{
          boot.style.transition = 'opacity .7s ease';
          boot.style.opacity = '0';
          setTimeout(()=> boot.remove(), 700);
        }, 300);
      }
      bar.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
    }, 28);
  }, 3100);
})();

/* ── Scroll Reveal ──────────────────── */
(function(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('vis'); obs.unobserve(e.target); } });
  },{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
})();

/* ── Skill Bars ─────────────────────── */
(function(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        setTimeout(()=>{ e.target.style.width = e.target.dataset.w + '%'; },200);
        obs.unobserve(e.target);
      }
    });
  },{threshold:.3});
  document.querySelectorAll('.sk-fill').forEach(b=>obs.observe(b));
})();

/* ── Nav active highlight ───────────── */
(function(){
  const secs  = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll',()=>{
    let cur = '';
    secs.forEach(s=>{ if(scrollY >= s.offsetTop - 120) cur = s.id; });
    links.forEach(l=>{
      l.style.color = l.getAttribute('href')==='#'+cur ? 'var(--cyan)' : '';
    });
  });
})();

/* ── Contact form ───────────────────── */
function handleSend(btn){
  btn.textContent = '⬡  Sending...';
  btn.disabled = true;
  setTimeout(()=>{
    btn.textContent = '✓  Message Sent';
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
  }, 1400);
}