/* ══════════════════════════════════════════════════════════
   track.js — lightweight visit logger
   Sends a small, anonymous-ish snapshot of the visit to
   /api/track. The server adds country/city (from Vercel's
   edge geo headers) and a hashed (non-reversible) visitor id
   — the raw IP address is never stored. See api/track.js.
   ══════════════════════════════════════════════════════════ */
(function () {
  const data = {
    page: location.pathname,
    referrer: document.referrer || null,
    screen: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  function send() {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  }

  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion'])
      .then((hints) => {
        data.model = hints.model || null;
        data.platformVersion = hints.platformVersion || null;
        send();
      })
      .catch(send);
  } else {
    send();
  }
})();
