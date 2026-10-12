// Backward-compatible loader. New pages load /nw-events.js directly.
if (!window.__NOELWISH_EVENTS_LOADED__) {
  const script = document.createElement('script');
  script.src = '/nw-events.js';
  document.head.appendChild(script);
}
