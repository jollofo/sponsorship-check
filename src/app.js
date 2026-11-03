import * as liveApi from './api.js';
import { mapLimited } from './api.js';
import { classify, LABELS } from './classify.js';

// On localhost only, ?data=worst|one|empty|error|huge swaps the jobs API for test fixtures.
const testData = location.hostname === 'localhost' ? new URLSearchParams(location.search).get('data') : null;
const fixtures = location.hostname === 'localhost' ? await import('./fixtures/worst-case.js') : null;
fixtures?.mountToggle(testData ?? '');
const { searchJobs, getJob } = testData ? fixtures.fixtureApi(testData) : liveApi;

const MAX_PAGES = 6; // 50 roles a page
const form = document.getElementById('search');
const results$ = document.getElementById('results-area');
const headline = document.getElementById('headline');
const summary = document.getElementById('summary');
const status = document.getElementById('status');
const list = document.getElementById('results');

let results = [];
const shown = new Set(Object.keys(LABELS).filter(s => s !== 'not_stated'));

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === 'class' ? (node.className = v) : node.setAttribute(k, v);
  node.append(...children.filter(c => c != null && c !== false));
  return node;
};
const num = n => n.toLocaleString('en-US');
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
const count = s => results.filter(r => r.status === s).length;

// Wraps the visa words in a quote with <mark>, so the reason for the label is visible at a glance.
const KEY_TERMS = /\b(sponsor\w*|citizenship|citizens?|authori[sz]ed to work|work authori[sz]ation|eligible to work|visas?|OPT|CPT|H-?1B)\b/gi;
function highlight(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(KEY_TERMS)) {
    parts.push(text.slice(last, m.index), el('mark', {}, m[0]));
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

// The filter buttons are built once and updated in place, so keyboard focus stays on the button you pressed.
const chips = Object.fromEntries(Object.entries(LABELS).map(([s, label]) => {
  const n = el('span', { class: 'n' });
  const chip = el('button', { type: 'button', class: `chip s-${s}` }, el('span', {}, label), ' ', n);
  chip.onclick = () => { shown.has(s) ? shown.delete(s) : shown.add(s); render(); };
  summary.append(el('li', {}, chip));
  return [s, { chip, n }];
}));

function renderSummary() {
  results$.hidden = summary.hidden = !results.length;
  if (!results.length) return;
  const ruledOut = count('citizens_only') + count('no_sponsorship');
  headline.textContent = `${num(results.length - ruledOut)} of ${plural(results.length, 'role', 'roles')} ${results.length - ruledOut === 1 ? "doesn't" : "don't"} rule out sponsorship.`;
  for (const [s, { chip, n }] of Object.entries(chips)) {
    const c = count(s);
    n.textContent = String(c);
    chip.setAttribute('aria-pressed', String(shown.has(s)));
    chip.disabled = c === 0;
  }
}

function roleCard({ job, status: s, quote, also, student_visa }) {
  return el('li', { class: 'role' },
    el('div', { class: 'top' },
      el('div', {},
        el('a', { class: 'title', href: job.url, target: '_blank', rel: 'noopener' }, job.title.trim()),
        el('div', { class: 'meta' }, [job.company, job.location].filter(Boolean).join(' · '))),
      el('div', { class: 'tags' },
        student_visa && el('span', { class: 'badge opt' }, 'Mentions OPT/CPT'),
        el('span', { class: `badge s-${s}` }, LABELS[s]))),
    quote
      ? el('blockquote', {}, '“', ...highlight(quote), '”')
      : el('p', { class: 'silent' }, 'No mention of visas or work authorization.'),
    ...also.map(a => el('blockquote', { class: 'also' }, 'Also: “', ...highlight(a), '”')));
}

function render() {
  renderSummary();
  const visible = results.filter(r => shown.has(r.status));
  const items = visible.map(roleCard);
  const hidden = results.filter(r => !shown.has(r.status) && r.status === 'not_stated').length;
  if (hidden) {
    const show = el('button', { type: 'button', class: 'link' }, 'Show them');
    show.onclick = () => { shown.add('not_stated'); render(); };
    items.push(el('li', { class: 'more' }, `${plural(hidden, 'more role doesn’t', 'more roles don’t')} mention sponsorship. `, show));
  }
  if (results.length && !items.length) items.push(el('li', { class: 'more' }, 'Nothing in the selected groups. Turn a group on above.'));
  list.replaceChildren(...items);
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  const [key, value] = data.get('where').split(':');
  const params = { [key]: value, fn: data.get('fn'), q: data.get('q').trim() };
  const button = form.querySelector('button');
  button.disabled = true;
  list.setAttribute('aria-busy', 'true');
  results = [];
  render();
  try {
    status.textContent = 'Finding roles…';
    let jobs = [], total = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const r = await searchJobs({ ...params, page });
      jobs.push(...r.jobs); total = r.total;
      if (page + 1 >= r.total_pages) break;
    }
    let done = 0;
    const checked = await mapLimited(jobs, 6, async job => {
      const text = (await getJob(job.id)).description_text;
      status.textContent = `Reading postings… ${++done} of ${jobs.length}`;
      return { job, ...classify(text) };
    });
    const order = Object.keys(LABELS);
    results = checked.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    status.textContent = jobs.length
      ? total > jobs.length ? `Checked the first ${num(jobs.length)} of ${num(total)} live roles just now.` : `Checked ${jobs.length === 1 ? 'the only matching live role' : `all ${num(jobs.length)} live roles`} just now.`
      : 'No roles match. Try another location or keyword.';
  } catch (err) {
    status.textContent = `Couldn't load roles from the jobs API (${err.message}). Press Check roles to try again.`;
  } finally {
    button.disabled = false;
    list.removeAttribute('aria-busy');
    render();
  }
});

render();
form.requestSubmit();
