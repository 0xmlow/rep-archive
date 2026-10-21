/* The Eisman Playbook Decoded. Renders entirely from data/*.json. */

const D = {};
const root = document.documentElement;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const bl = n => `assets/blossom-${n}-${root.getAttribute('data-theme')==='dark'?'white':'black'}.png`;
const fmtDate = d => {
  const [y, m, dd] = d.split('-');
  return new Date(+y, +m - 1, +dd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ---------------- theme ---------------- */
const saved = (() => { try { return localStorage.getItem('eis-theme'); } catch { return null; } })();
if (saved) root.setAttribute('data-theme', saved);
else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');

function isDark(){ return root.getAttribute('data-theme') === 'dark'; }
function syncLogos() {
  const v = isDark() ? 'white' : 'black';
  $$('img[src*="mlow-logo"]').forEach(i => { i.setAttribute('src', `assets/mlow-logo-${v}.png`); });
  $$('img[src*="blossom-"]').forEach(i => {
    i.setAttribute('src', i.getAttribute('src').replace(/-(black|white)\.png/, `-${v}.png`));
  });
}
$('#theme-toggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('eis-theme', next); } catch {}
  syncLogos();
});

/* ---------------- tabs ---------------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.setAttribute('aria-selected', 'false'));
  t.setAttribute('aria-selected', 'true');
  $$('.panel').forEach(p => p.classList.remove('active'));
  $('#panel-' + t.dataset.panel).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}));

/* ---------------- block renderer ---------------- */
function block(b) {
  switch (b.t) {
    case 'p': return `<p>${b.v}</p>`;
    case 'h': return `<h3>${esc(b.v)}</h3>`;
    case 'ul': return `<ul>${b.v.map(x => `<li>${x}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.v.map(x => `<li>${x}</li>`).join('')}</ol>`;
    case 'rules':
      if (b.posters === 'method' && D.posters) return rulesIllustrated(b.v);
      return `<ol class="rules">${b.v.map(x => `<li>${x}</li>`).join('')}</ol>`;
    case 'quote': return `<blockquote class="q"><p>${esc(b.v)}</p><cite>${esc(b.cite || '')}</cite></blockquote>`;
    case 'pair': return `<div class="grid2">${b.v.map(c => `
        <div class="card"><span class="pill k">${esc(c.label)}</span>
        <h4 style="margin-top:12px">${esc(c.h)}</h4><p>${esc(c.p)}</p></div>`).join('')}</div>`;
    case 'cards': return `<div class="grid3" style="margin:24px 0">${b.v.map(c => `
        <div class="card"><h4>${esc(c.h)}</h4><p>${esc(c.p)}</p></div>`).join('')}</div>`;
    case 'cards2': return `<div class="grid2" style="margin:24px 0">${b.v.map(c => `
        <div class="card"><h4>${esc(c.h)}</h4><ul style="font-size:15px;padding-left:1.1em">${c.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`;
    case 'ksplit': return `<div class="ksplit">
        <div class="kleg up"><h4>&uarr; ${esc(b.up.h)}</h4><ul>${b.up.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
        <div class="kleg down"><h4>&darr; ${esc(b.down.h)}</h4><ul>${b.down.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div></div>`;
    case 'timeline': return `<ul class="tl">${b.v.map(i => `<li><span class="when">${esc(i.when)}</span><p>${esc(i.p)}</p></li>`).join('')}</ul>`;
    case 'table': return `<div class="tw"><table><thead><tr>${b.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'holdings': return `<div class="hold">${b.v.map(c => `
        <div class="hold-col ${c.tone}"><h4>${esc(c.label)}</h4>
        <ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    default: return '';
  }
}

/* ---------------- report ---------------- */
/* The fourth edition arranges the report in six parts and adds an editorial layer
   (data/guide.json): the playbook on one page, an In brief for every chapter, dated
   "where he stands" boxes, four new chapters, a reading list and a glossary. */
const SITE_TERMS = [[/in Appendix B/g, 'in the Episodes tab'], [/in Part VI/g, 'on the Posters tab']];
const siteText = s => SITE_TERMS.reduce((a, [re, to]) => a.replace(re, to), s);
const NEW_CH = { stocklens: 'STOCKLENS', sectors: 'SECTORS', frameworks: 'FRAMEWORKS', ledger: 'LEDGER' };
const NEW_BL = { stocklens: '06', sectors: '02', frameworks: '03', ledger: '07' };
const CH = {};

function chTitle(id) { const s = D.report.sections.find(x => x.id === id); return s ? s.title : D.guide[NEW_CH[id]].title; }
function chEyebrow(id) { const s = D.report.sections.find(x => x.id === id); return s ? s.eyebrow : D.guide[NEW_CH[id]].eyebrow; }
const tbl = (cols, rows) => `<div class="tw"><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i === 0 ? `<b>${esc(c)}</b>` : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function briefHtml(id) {
  const t = D.guide.IN_BRIEF[id];
  return t ? `<div class="brief"><p class="eyebrow">In brief</p><p>${esc(siteText(t))}</p></div>` : '';
}
function standsHtml(id) {
  const rows = D.guide.STANDS[id];
  if (!rows) return '';
  return `<div class="stands"><p class="stands-h">Where he stands, as of ${esc(D.guide.AS_OF)}</p>
    <dl>${rows.map(([t, x, w]) => `<div><dt>${esc(t)}</dt><dd>${esc(x)}<span class="when">${esc(w)}</span></dd></div>`).join('')}</dl></div>`;
}

function newChapterBody(id) {
  const g = D.guide;
  if (id === 'stocklens') {
    const L = g.STOCKLENS;
    return L.intro.map(x => `<p>${esc(x)}</p>`).join('') +
      `<blockquote class="q"><p>${esc(L.quote[0])}</p><cite>${esc(L.quote[1])}</cite></blockquote>
      <h3>The long checklist, in the order he applies it</h3>
      <ol class="rules">${L.checklist.map(([q, a, d]) => `<li><b>${esc(q)}</b> ${esc(a)}<span class="when">${esc(d)}</span></li>`).join('')}</ol>
      <h3>Red flags that end the conversation</h3>${tbl(['Red flag', 'His example', 'Date'], L.red_flags)}
      <h3>Selling, sizing and owning mistakes</h3><ul>${L.selling.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>The nine verdicts he lands on</h3>
      <p class="sub">When he sums up a stock he lands in one of these categories. They are his, not a rating system.</p>
      ${tbl(['Verdict', 'What it means', 'His example'], L.verdicts)}`;
  }
  if (id === 'sectors') {
    const S = g.SECTORS;
    return S.intro.map(x => `<p>${esc(x)}</p>`).join('') +
      `<h3>Valuation, on the sector's own terms</h3><ul>${S.valuation.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>The playbooks</h3><div class="grid2 playbooks">${S.playbooks.map(([n, items]) => `
        <div class="card"><h4>${esc(n)}</h4><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  }
  if (id === 'frameworks') {
    const F = g.FRAMEWORKS;
    return `<p class="lead">${esc(F.intro)}</p><div class="fw">${F.items.map(([n, t, w]) => `
      <div class="fw-row"><div><h4>${esc(n)}</h4><span class="when">${esc(w)}</span></div><p>${esc(t)}</p></div>`).join('')}</div>`;
  }
  if (id === 'ledger') {
    const L = g.LEDGER;
    return `<p class="lead">${esc(L.intro)}</p>
      <h3>Standing calls</h3>${tbl(['Topic', 'His position', 'As of'], L.calls)}
      <h3>The tripwires he watches</h3>
      <p class="sub">The numbers and events he has said would change his view or move the market.</p>
      ${tbl(['Tripwire', 'What he said', 'Status, ' + g.AS_OF], L.tripwires)}
      <h3>The four conditions that would change his book</h3>
      <p class="sub">Named in the portfolio episode of 1 July 2026. Failing these, he would rather hold and not pay the capital gains.</p>
      <ol class="rules">${L.conditions.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      <h3>His own scorecard</h3>${tbl(['Call', 'What happened'], L.scorecard)}`;
  }
  return '';
}

function chapterHtml(id) {
  const s = D.report.sections.find(x => x.id === id);
  const blos = s ? s.blossom : NEW_BL[id];
  const body = s ? siteText(s.blocks.map(block).join('')) : newChapterBody(id);
  return `<section class="sec" id="s-${id}">
      <div class="sec-head">
        <img class="bl" src="${bl(blos)}" alt="" aria-hidden="true">
        <div><p class="eyebrow">Chapter ${pad2(CH[id])} <span class="sep">/</span> ${esc(chEyebrow(id))}</p><h2>${esc(chTitle(id))}</h2></div>
      </div>
      ${pinHtml(id)}
      ${briefHtml(id)}
      ${body}
      ${standsHtml(id)}
    </section>`;
}

function partHtml(part) {
  const hit = posterByKey(part.poster);
  const fig = hit ? `<figure class="part-poster"><button data-lb-rule="${hit.p.rule}" data-lb-i="${hit.i}">
      <img src="${hit.p.src}" alt="${esc(posterAlt(hit.p))}" loading="lazy" width="540" height="810"></button>
      <figcaption>${esc(hit.p.title)}</figcaption></figure>` : '';
  return `<div class="part-head" id="part-${part.n}">
      <div><p class="eyebrow">Part ${part.n}</p><h2>${esc(part.title)}</h2><p>${esc(part.blurb)}</p>
        <ol class="part-list">${part.chapters.map(c => `<li><a href="#s-${c}"><span>${pad2(CH[c])}</span>${esc(chTitle(c))}</a></li>`).join('')}</ol></div>
      ${fig}</div>`;
}

function onePageHtml() {
  const byNum = {}; Object.entries(CH).forEach(([id, n]) => { byNum[n] = id; });
  return `<section class="sec" id="s-onepage">
      <div class="sec-head"><img class="bl" src="${bl('01')}" alt="" aria-hidden="true">
        <div><p class="eyebrow">Fourth edition <span class="sep">/</span> current to ${esc(D.guide.AS_OF)}</p><h2>The playbook on one page</h2></div></div>
      <ol class="onepage">${D.guide.ONE_PAGE.map(([lead, text, ch]) => `
        <li><p><b>${esc(lead)}</b> ${esc(text)}</p><a class="lnk" href="#s-${byNum[ch]}">Chapter ${ch}</a></li>`).join('')}</ol>
    </section>`;
}

function startHereHtml() {
  return `<section class="sec" id="s-start">
      <div class="sec-head"><img class="bl" src="${bl('05')}" alt="" aria-hidden="true">
        <div><p class="eyebrow">Reading list</p><h2>Start here: sixteen essential episodes</h2></div></div>
      <p>Between them, these carry most of the show's arguments. Listen in this order and the rest of the corpus will make sense.
         Every episode has a full synopsis in the Episodes tab.</p>
      <div class="tw"><table><thead><tr><th>Date</th><th>Episode</th><th>Why it matters</th></tr></thead><tbody>
      ${D.guide.START_HERE.map(([d, t, g, why, paid]) => `<tr><td class="nowrap">${fmtDate(d)}</td>
        <td><b>${esc(t)}</b><br><small>${esc(g)}</small>${paid ? ' <span class="pill paid">Paid</span>' : ''}</td><td>${esc(why)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
}

function glossaryHtml() {
  return `<section class="sec" id="s-glossary">
      <div class="sec-head"><img class="bl" src="${bl('07')}" alt="" aria-hidden="true">
        <div><p class="eyebrow">Reference</p><h2>Glossary</h2></div></div>
      <dl class="gloss">${D.guide.GLOSSARY.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
    </section>`;
}

function renderReport() {
  const r = D.report, g = D.guide;
  $('#hero-dek').textContent = r.meta.subtitle;
  $('#foot-updated').textContent = 'Corpus last updated ' + fmtDate(r.meta.updated);
  let n = 0;
  g.PARTS.forEach(p => p.chapters.forEach(c => { CH[c] = ++n; }));
  $('#report').innerHTML = onePageHtml() +
    g.PARTS.map(p => partHtml(p) + p.chapters.map(chapterHtml).join('')).join('') +
    startHereHtml() + glossaryHtml();
  $('#toc').innerHTML = `<a href="#s-onepage">The playbook on one page</a>` +
    g.PARTS.map(p => `<p class="toc-part">Part ${p.n}</p>` +
      p.chapters.map(c => `<a href="#s-${c}"><span>${pad2(CH[c])}</span> ${esc(chTitle(c))}</a>`).join('')).join('') +
    `<p class="toc-part">Reference</p><a href="#s-start">Start here</a><a href="#s-glossary">Glossary</a>`;

  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      $$('#toc a').forEach(a => a.classList.remove('on'));
      const a = $(`#toc a[href="#${e.target.id}"]`);
      if (a) a.classList.add('on');
    }
  }), { rootMargin: '-80px 0px -70% 0px' });
  $$('.sec').forEach(s => obs.observe(s));
}

/* ---------------- posters ---------------- */
/* MLow's Eisman method posters. One manifest, keyed by rule, feeds four
   surfaces: the method rules, section pins, the marquee and the Posters tab. */
const pad2 = n => String(n).padStart(2, '0');
const ruleOf = n => D.posters.rules.find(r => r.n === n);
const posterAlt = p => `Poster, ${p.title}: ${ruleOf(p.rule).rule}`;
function posterByKey(key) {
  for (const r of D.posters.rules) {
    const i = r.posters.findIndex(p => p.key === key);
    if (i > -1) return { p: r.posters[i], i };
  }
  return null;
}

function rulesIllustrated(items) {
  return `<ol class="rules rules-ill">${items.map((x, i) => {
    const r = D.posters.rules[i];
    if (!r) return `<li>${x}</li>`;
    const lead = r.posters[0], n = r.posters.length;
    return `<li><div class="rule-txt">${x}</div>
      <button class="rule-poster" data-lb-rule="${r.n}" data-lb-i="0">
        <img src="${lead.src}" alt="${esc(posterAlt(lead))}" loading="lazy" width="540" height="810">
        <span class="rule-count">${n === 1 ? 'Poster' : n + ' posters'}</span>
      </button></li>`;
  }).join('')}</ol>`;
}

function pinHtml(id) {
  const key = D.posters?.pins?.[id] || D.guide?.NEW_PINS?.[id];
  const hit = key && posterByKey(key);
  if (!hit) return '';
  const { p, i } = hit;
  return `<figure class="pin">
      <button data-lb-rule="${p.rule}" data-lb-i="${i}">
        <img src="${p.src}" alt="${esc(posterAlt(p))}" loading="lazy" width="540" height="810"></button>
      <figcaption>${esc(p.title)}<span>${esc(ruleOf(p.rule).rule)}</span></figcaption>
    </figure>`;
}

function renderMarquee() {
  if (!D.posters) return;
  // interleave the rules so neighbouring posters make different points
  const order = [], deep = Math.max(...D.posters.rules.map(r => r.posters.length));
  for (let k = 0; k < deep; k++)
    D.posters.rules.forEach(r => { if (r.posters[k]) order.push([r.posters[k], k]); });
  const items = order.map(([p, i]) =>
    `<button class="mq-item" tabindex="-1" data-lb-rule="${p.rule}" data-lb-i="${i}">
       <img src="${p.src}" alt="" loading="lazy" width="540" height="810"></button>`).join('');
  // the strip is decorative and repeated for a seamless loop; the Posters tab is the accessible route
  $('#marquee').innerHTML = `<div class="mq-track" aria-hidden="true">${items}${items}</div>`;
}

function renderPosters() {
  if (!D.posters) return;
  const P = D.posters, total = P.rules.reduce((a, r) => a + r.posters.length, 0);
  $('#posters').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('04')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">The method, illustrated</p><h2>${P.rules.length} rules, ${total} posters</h2></div></div>
    <p style="max-width:70ch;color:var(--fg-muted)">Every rule in The Eisman method, drawn as a poster. Open one to see it
       full size, then use the arrow keys to move through that rule's set. ${esc(P.credit)}.</p>
    <nav class="pg-jump" aria-label="Jump to a rule">${P.rules.map(r =>
      `<a class="f" href="#pg-${r.n}" title="${esc(r.rule)}">${pad2(r.n)}</a>`).join('')}</nav>
    ${P.rules.map(r => `<section class="pg" id="pg-${r.n}">
      <h3><span class="pg-n">${pad2(r.n)}</span>${esc(r.rule)}</h3>
      <div class="pg-grid">${r.posters.map((p, i) => `
        <button class="pg-card" data-lb-rule="${r.n}" data-lb-i="${i}">
          <img src="${p.src}" alt="${esc(posterAlt(p))}" loading="lazy" width="540" height="810">
          <span>${esc(p.title)}</span></button>`).join('')}</div>
    </section>`).join('')}`;
}

/* lightbox */
const LB = { list: [], i: 0, back: null };
function showLB() {
  const p = LB.list[LB.i];
  $('#lb-img').src = p.src;
  $('#lb-img').alt = posterAlt(p);
  $('#lb-cap').innerHTML = `<b>${esc(p.title)}</b><span>${esc(ruleOf(p.rule).rule)}</span>
    <small>${LB.list.length > 1 ? `${LB.i + 1} of ${LB.list.length} &middot; ` : ''}${esc(D.posters.credit)}</small>`;
  // a class, not [hidden]: the buttons keep their grid cells so the poster stays centred
  ['#lb-prev', '#lb-next'].forEach(id => $(id).classList.toggle('off', LB.list.length < 2));
}
function openLB(list, i) {
  LB.list = list; LB.i = i; LB.back = document.activeElement;
  $('#lb').hidden = false;
  document.body.classList.add('lb-open');
  showLB();
  $('#lb-x').focus();
}
function closeLB() {
  $('#lb').hidden = true;
  document.body.classList.remove('lb-open');
  if (LB.back && LB.back.focus) LB.back.focus();
}
const stepLB = d => { LB.i = (LB.i + d + LB.list.length) % LB.list.length; showLB(); };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lb-rule]');
  if (!t || !D.posters) return;
  const r = ruleOf(+t.dataset.lbRule);
  if (r) { e.preventDefault(); openLB(r.posters, +t.dataset.lbI || 0); }
});
$('#lb-x').addEventListener('click', closeLB);
$('#lb-prev').addEventListener('click', () => stepLB(-1));
$('#lb-next').addEventListener('click', () => stepLB(1));
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') closeLB(); });
document.addEventListener('keydown', e => {
  if ($('#lb').hidden) return;
  if (e.key === 'Escape') closeLB();
  else if (e.key === 'ArrowLeft' && LB.list.length > 1) stepLB(-1);
  else if (e.key === 'ArrowRight' && LB.list.length > 1) stepLB(1);
  else if (e.key === 'Tab') {            // keep focus inside the dialog
    const f = $$('#lb button').filter(b => !b.classList.contains('off'));
    const at = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});

/* ---------------- stats ---------------- */
function renderStats() {
  const s = D.stats;
  const cells = [
    ['episodes', s.episodes, 'Episodes'],
    ['transcripts', s.transcripts, 'Transcripts'],
    ['words', (s.words / 1000).toFixed(0) + 'k', 'Words read'],
    ['hours', s.hours, 'Hours of audio'],
    ['paid', s.paidExclusive, 'Paid episodes read'],
    ['guests', s.guests, 'Guests indexed'],
  ];
  $('#stats').innerHTML = cells.map(([k, v, l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');
  if (s.first && s.last) {
    const f = new Date(s.first), l = new Date(s.last);
    const o = { month: 'short', year: 'numeric' };
    $('#hero-range').textContent = f.toLocaleDateString('en-GB', o) + ' to ' + l.toLocaleDateString('en-GB', o);
  }
}

/* ---------------- episodes ---------------- */
const state = { q: '', kind: 'all', theme: 'all' };
const KINDS = [['all', 'All'], ['deep-dive', 'Deep dive'], ['wrap', 'Weekly wrap'], ['masterclass', 'Masterclass'], ['paidx', 'Paid exclusive']];

function renderFilters() {
  $('#kind-filters').innerHTML = KINDS.map(([k, l]) =>
    `<button class="f ${k === 'all' ? 'on' : ''}" data-kind="${k}">${l}</button>`).join('');
  $('#theme-filters').innerHTML = `<button class="f on" data-theme-f="all">All themes</button>` +
    Object.entries(D.themes).map(([k, v]) => `<button class="f" data-theme-f="${k}">${esc(v.label)}</button>`).join('');
  $$('[data-kind]').forEach(b => b.addEventListener('click', () => {
    state.kind = b.dataset.kind;
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x === b));
    renderEpisodes();
  }));
  $$('[data-theme-f]').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.themeF;
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x === b));
    renderEpisodes();
  }));
  $('#q').addEventListener('input', e => { state.q = e.target.value.toLowerCase().trim(); renderEpisodes(); });
}

function synFor(e) { return D.synByDate ? D.synByDate[e.date] : null; }
function dosFor(e) { return D.dosByDate ? D.dosByDate[e.date] : null; }

function dosHtml(d) {
  if (!d) return '';
  const quotes = (d.quotes || []).map(q =>
    `<blockquote class="dos-q"><p>${esc(q.q)}</p><cite>${esc(q.who)}</cite></blockquote>`).join('');
  return `<details class="syn dos">
    <summary>Dossier</summary>
    <div class="syn-body">
      <p class="syn-lbl">The thesis</p>
      <p>${esc(d.thesis)}</p>
      <p class="syn-lbl">Where Eisman pushed</p>
      <p>${esc(d.pushback)}</p>
      <p class="syn-lbl">The numbers</p>
      <ul>${d.evidence.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <p class="syn-lbl">What moved</p>
      <p>${esc(d.shift)}</p>
      <p class="syn-lbl">In the arc</p>
      <p>${esc(d.context)}</p>
      ${quotes}
      <p class="syn-lbl">Open questions</p>
      <ul>${d.questions.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
  </details>`;
}

function synHtml(s) {
  if (!s) return '';
  const notable = s.notable ? `<p class="syn-notable">${esc(s.notable)}</p>` : '';
  return `<details class="syn">
    <summary>Synopsis</summary>
    <div class="syn-body">
      <p>${esc(s.summary)}</p>
      <p class="syn-lbl">Discussed</p>
      <ul>${s.discussed.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <p class="syn-lbl">What can be learned</p>
      <ul>${s.learned.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      ${notable}
    </div>
  </details>`;
}

function renderEpisodes() {
  const list = D.episodes.filter(e => {
    if (state.kind === 'paidx') { if (!e.paidExclusive) return false; }
    else if (state.kind !== 'all' && e.kind !== state.kind) return false;
    if (state.theme !== 'all' && !(e.themes || []).includes(state.theme)) return false;
    if (state.q) {
      const s = synFor(e);
      const synText = s ? s.summary + ' ' + s.discussed.join(' ') + ' ' + s.learned.join(' ') + ' ' + (s.notable || '') : '';
      const dd = dosFor(e);
      const dosText = dd ? dd.thesis + ' ' + dd.pushback + ' ' + dd.evidence.join(' ') + ' ' + dd.shift + ' ' + dd.context : '';
      const hay = (e.title + ' ' + (e.desc || '') + ' ' + (e.guests || []).join(' ') + ' ' + synText + ' ' + dosText).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }).slice().reverse();

  $('#count').textContent = `${list.length} of ${D.episodes.length}`;
  $('#eplist').innerHTML = list.length ? list.map(e => {
    const links = [
      e.youtube  ? `<a class="lnk" href="${e.youtube}" target="_blank" rel="noopener">YouTube</a>` : '',
      e.substack ? `<a class="lnk" href="${e.substack}" target="_blank" rel="noopener">Substack</a>` : '',
      e.audio    ? `<a class="lnk" href="${e.audio}" target="_blank" rel="noopener">Audio</a>` : '',
    ].filter(Boolean).join('');
    const themes = (e.themes || []).map(t => `<span class="pill th">${esc(D.themes[t]?.label || t)}</span>`).join('');
    const guests = (e.guests || []).length ? `<span class="pill">${esc(e.guests.join(', '))}</span>` : '';
    return `<article class="ep">
      <div class="when"><b>${fmtDate(e.date)}</b>${e.num ? 'Ep ' + e.num : e.kind === 'wrap' ? 'Wrap' : ''}${e.minutes ? '<br>' + e.minutes + ' min' : ''}</div>
      <div>
        <h4>${esc(e.title)}</h4>
        <p class="desc">${esc((e.desc || '').split('\n')[0])}</p>
        <div class="meta">${guests}${themes}${e.paidExclusive ? '<span class="pill paid">Paid exclusive</span>' : e.paid ? '<span class="pill paid">Paid tier</span>' : ''}</div>
        ${synHtml(synFor(e))}
        ${dosHtml(dosFor(e))}
      </div>
      <div class="acts">${links}</div>
    </article>`;
  }).join('') : `<div class="empty">Nothing blooming here yet.</div>`;
}

function renderBonus() {
  if (!D.bonus?.length) return;
  $('#bonus-block').innerHTML = `
    <h3 style="margin-top:48px">Bonus videos, not in the podcast feed</h3>
    <p style="color:var(--fg-muted);font-size:15px;max-width:70ch">
      The YouTube channel carries material that never reached the RSS feed, including panels and reaction episodes.</p>
    <div class="eplist">${D.bonus.map(b => `<article class="ep">
      <div class="when"><b>Bonus</b>${b.words ? Math.round(b.words / 130) + ' min' : ''}</div>
      <div><h4>${esc(b.title)}</h4></div>
      <div class="acts"><a class="lnk" href="${b.youtube}" target="_blank" rel="noopener">YouTube</a></div>
    </article>`).join('')}</div>`;
}

/* ---------------- themes ---------------- */
function renderThemes() {
  const counts = {};
  Object.keys(D.themes).forEach(k => counts[k] = D.episodes.filter(e => (e.themes || []).includes(k)));
  const order = Object.keys(D.themes).sort((a, b) => counts[b].length - counts[a].length);
  const max = Math.max(...order.map(k => counts[k].length), 1);

  $('#themes').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('05')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">Coverage map</p><h2>What the show actually talks about</h2></div></div>
    <p style="max-width:70ch;color:var(--fg-muted)">Each theme counts the episodes where its vocabulary appears heavily,
       measured across every transcript. Click a theme to read its episodes in order.</p>
    <div class="grid3" style="margin-top:32px">
      ${order.map(k => {
        const t = D.themes[k], eps = counts[k];
        const pct = Math.round(eps.length / max * 100);
        const first = eps[0], last = eps[eps.length - 1];
        return `<div class="card">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            <img src="${bl(t.blossom)}" alt="" style="width:26px;height:26px">
            <h4 style="margin:0">${esc(t.label)}</h4>
          </div>
          <div style="height:6px;background:var(--bg-muted);border-radius:999px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${pct}%;background:var(--accent)"></div>
          </div>
          <p style="font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-dim);margin:0">
            ${eps.length} episodes${first ? ' &middot; ' + first.date.slice(0, 7) + ' to ' + last.date.slice(0, 7) : ''}
          </p>
          <button class="f" style="margin-top:14px" data-jump="${k}">Show episodes</button>
        </div>`;
      }).join('')}
    </div>`;

  $$('[data-jump]').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.jump; state.kind = 'all'; state.q = ''; $('#q').value = '';
    $('.tab[data-panel="episodes"]').click();
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x.dataset.themeF === state.theme));
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x.dataset.kind === 'all'));
    renderEpisodes();
  }));
}

/* ---------------- guests ---------------- */
function renderGuests() {
  const count = g => D.episodes.filter(e => (e.guests || []).includes(g.name)).length;
  const rec = D.guests.filter(g => g.recurring).sort((a, b) => count(b) - count(a));
  const one = D.guests.filter(g => !g.recurring).sort((a, b) => a.name.localeCompare(b.name));
  const card = g => {
    const n = count(g);
    return `<div class="gcard">
      <h4>${esc(g.name)}</h4>
      <span class="firm">${esc(g.firm)}</span>
      <p class="beat">${esc(g.beat)}</p>
      <p>${esc(g.note)}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${n ? `<span class="pill">${n} episode${n > 1 ? 's' : ''}</span>` : ''}
        ${g.link ? `<a class="lnk" href="${g.link}" target="_blank" rel="noopener">Profile</a>` : ''}
        <button class="lnk" data-guest="${esc(g.name)}">Episodes</button>
      </div></div>`;
  };
  $('#guests').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('06')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">The bench</p><h2>Who comes on</h2></div></div>
    <p style="max-width:70ch;color:var(--fg-muted)">Eisman states the booking philosophy outright. He prefers boutique
       research to bulge bracket, and analysts to celebrities. The list runs heavy on people who cover one sector for a
       living and light on macro pundits.</p>
    <h3>Recurring cast</h3><div class="grid3">${rec.map(card).join('')}</div>
    <h3 style="margin-top:48px">Notable one-offs</h3><div class="grid3">${one.map(card).join('')}</div>`;

  $$('[data-guest]').forEach(b => b.addEventListener('click', () => {
    state.q = b.dataset.guest.toLowerCase(); state.kind = 'all'; state.theme = 'all';
    $('.tab[data-panel="episodes"]').click();
    $('#q').value = b.dataset.guest;
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x.dataset.themeF === 'all'));
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x.dataset.kind === 'all'));
    renderEpisodes();
  }));
}

/* ---------------- update panel ---------------- */
function renderAbout() {
  const s = D.stats;
  const eps = D.episodes || [];
  const pub = eps.filter(e => !e.paidExclusive).length;
  const px = eps.filter(e => e.paidExclusive).length;
  const dos = D.dosByDate ? Object.keys(D.dosByDate).length : 0;
  $('#about').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('07')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">About this report</p><h2>What this is, and how to read it</h2></div></div>
    ${(D.guide?.ABOUT || []).slice(1).map(x => `<p style="max-width:70ch">${esc(x)}</p>`).join('')}
    <p style="max-width:70ch">An independent reading of every episode of <i>The Real Eisman Playbook</i>, Steve
       Eisman's podcast, from its launch on ${fmtDate(s.first)} to ${fmtDate(s.last)}. It is commentary and analysis.
       It is not affiliated with the show, and nothing here is investment advice.</p>
    <div class="tw"><table><thead><tr><th>What was read</th><th>Count</th></tr></thead><tbody>
      <tr><td>Public episodes</td><td>${pub}</td></tr>
      <tr><td>Paid subscriber episodes</td><td>${px}</td></tr>
      <tr><td>Words of transcript</td><td>${s.words.toLocaleString('en-GB')}</td></tr>
      <tr><td>Hours of audio</td><td>${s.hours}</td></tr>
      <tr><td>Guests indexed</td><td>${s.guests}</td></tr>
      <tr><td>Episodes with a full interview dossier</td><td>${dos}</td></tr>
    </tbody></table></div>
    <h3>How it was made</h3>
    <ol class="rules">
      <li><b>Every episode was transcribed.</b> Public episodes from their captions or the podcast audio, paid
          episodes from the subscriber feed, all scored for transcription loops and dropout before use.</li>
      <li><b>Every episode was summarised.</b> Each carries a synopsis: what was discussed and what can be learned.</li>
      <li><b>Every interview and lecture was reconstructed.</b> The dossiers set out the guest's argument, where
          Eisman pushed back, the numbers cited, what changed by the end, and what stays open.</li>
      <li><b>The report was written across the whole run.</b> Its sections track how his positions moved, which
          single episodes cannot show.</li>
    </ol>
    <h3>Reading it well</h3>
    <p style="max-width:70ch">Positions are dated because they change. His portfolio, his rate threshold and his
       calls on private credit and AI all moved inside this period, and the report says when. Read a view as of its
       date, not as of today.</p>
    <p class="note">Quotations come from machine transcripts. They are kept short and dated, and are paraphrased
       where the transcript is unclear. Check the wording against the source audio before quoting any of them
       elsewhere.</p>`;
}

/* ---------------- boot ---------------- */
Promise.all(['report', 'episodes', 'stats', 'themes', 'guests', 'bonus', 'extras', 'synopses', 'dossiers', 'posters', 'guide']
  .map(n => fetch(`data/${n}.json`).then(r => r.ok ? r.json() : null).catch(() => null)))
  .then(([report, episodes, stats, themes, guests, bonus, extras, synopses, dossiers, posters, guide]) => {
    (episodes || []).forEach(e => { e.paidExclusive = !!e.paid && !e.youtube; });
    Object.assign(D, { report, episodes, stats, themes, guests, bonus, extras, posters, guide });
    D.synByDate = {};
    (synopses || []).forEach(s => { D.synByDate[s.date] = s; });
    D.dosByDate = {};
    (dossiers || []).forEach(d => { D.dosByDate[d.date] = d; });
    renderStats(); renderReport(); renderFilters(); renderEpisodes();
    renderBonus(); renderThemes(); renderGuests(); renderAbout();
    renderMarquee(); renderPosters();
    syncLogos();
  })
  .catch(err => {
    $('#report').innerHTML = `<div class="empty">Could not load the data files. Serve this folder over http, for example <code>python3 -m http.server</code>.</div>`;
    console.error(err);
  });
