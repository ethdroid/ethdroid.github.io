/* =======================================================================
   Market Recap — Year-to-Date Scoreboard
   -----------------------------------------------------------------------
   Renders a performance table from scoreboard.json. To update the numbers,
   edit scoreboard.json and redeploy. If the file is missing or empty, the
   scoreboard section is hidden gracefully.

   JSON shape:
     {
       eyebrow:  "Year-to-Date Scoreboard",
       title:    "Index Tracking ETFs",
       columns:  ["1Q26", "Apr-26", "Thru 05/18/26", "2026 YTD"],
       rows: [
         { name: "S&P 500", ticker: "SPY", values: [-4.4, 10.5, 2.8, 8.6] },
         ...
       ],
       footnote: "Returns depicted are…",
       sources:  "Standard & Poor's, …"
     }
   ======================================================================= */

(function () {
  'use strict';

  const HOST_ID = 'scoreboard';

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPct(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    // Use proper minus sign (−) instead of hyphen for cleaner numerals
    const abs = Math.abs(n).toFixed(1);
    if (n < 0)      return '\u2212' + abs + '%';
    return abs + '%';
  }

  function cellClass(n) {
    if (typeof n !== 'number' || !isFinite(n)) return 'num';
    if (n < 0) return 'num neg';
    if (n > 0) return 'num pos';
    return 'num zero';
  }

  function render(data) {
    const host = document.getElementById(HOST_ID);
    if (!host || !data || !Array.isArray(data.rows) || data.rows.length === 0) {
      if (host) host.style.display = 'none';
      const section = document.querySelector('.scoreboard-section');
      if (section) section.style.display = 'none';
      return;
    }

    const headerCells = (data.columns || [])
      .map(c => `<th scope="col">${escapeHTML(c)}</th>`)
      .join('');

    const bodyRows = data.rows.map(r => {
      const dataCells = (r.values || [])
        .map(v => `<td class="${cellClass(v)}">${formatPct(v)}</td>`)
        .join('');
      return `
        <tr>
          <th scope="row" class="name">
            <span class="name__label">${escapeHTML(r.name)}</span>
            <span class="ticker">(${escapeHTML(r.ticker)})</span>
          </th>
          ${dataCells}
        </tr>`;
    }).join('');

    host.innerHTML = `
      <div class="scoreboard">
        <header class="scoreboard__head">
          ${data.eyebrow ? `<span class="eyebrow">${escapeHTML(data.eyebrow)}</span>` : ''}
          ${data.title ? `<h2 class="scoreboard__title">${escapeHTML(data.title)}</h2>` : ''}
        </header>
        <div class="scoreboard__wrap">
          <table class="scoreboard__table">
            <thead>
              <tr>
                <th scope="col"></th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </div>
        <footer class="scoreboard__foot">
          ${data.footnote ? `<p class="scoreboard__footnote">${escapeHTML(data.footnote)}</p>` : ''}
          ${data.sources  ? `<p class="scoreboard__sources">Sources: ${escapeHTML(data.sources)}</p>` : ''}
        </footer>
      </div>
    `;
  }

  async function load() {
    if (!document.getElementById(HOST_ID)) return;
    try {
      const res = await fetch('scoreboard.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('scoreboard.json not found');
      const data = await res.json();
      render(data);
    } catch (err) {
      // Hide silently if anything goes wrong — page still works
      const host = document.getElementById(HOST_ID);
      const section = document.querySelector('.scoreboard-section');
      if (host) host.style.display = 'none';
      if (section) section.style.display = 'none';
      console.warn('[scoreboard]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
