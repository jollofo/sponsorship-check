import { searchJobs, getJob, mapLimited } from './api.js';
import { classify, LABELS } from './classify.js';

const MAX_PAGES = 6; // 50 roles a page
const form = document.getElementById('search');
const summary = document.getElementById('summary');
const status = document.getElementById('status');
const list = document.getElementById('results');

let results = [];
let shown = new Set(Object.keys(LABELS).filter(s => s !== 'not_stated'));

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === 'class' ? (node.className = v) : node.setAttribute(k, v);
  node.append(...children.filter(c => c != null));
  return node;
};

function render() {
  summary.replaceChildren(...Object.entries(LABELS).map(([s, label]) => {
    const chip = el('button', { type: 'button', class: `chip s-${s}`, 'aria-pressed': String(shown.has(s)) },
      label, el('b', {}, String(results.filter(r => r.status === s).length)));
    chip.onclick = () => { shown.has(s) ? shown.delete(s) : shown.add(s); render(); };
    return el('li', {}, chip);
  }));
  const visible = results.filter(r => shown.has(r.status));
  list.replaceChildren(...visible.map(({ job, status: s, quote, also }) => el('li', { class: 'role' },
    el('div', { class: 'top' },
      el('div', {},
        el('a', { class: 'title', href: job.url, target: '_blank', rel: 'noopener' }, job.title.trim()),
        el('div', { class: 'meta' }, [job.company, job.location].filter(Boolean).join(' · '))),
      el('span', { class: `badge s-${s}` }, LABELS[s])),
    quote && el('blockquote', {}, `“${quote}”`),
    ...also.map(a => el('blockquote', { class: 'also' }, `Also: “${a}”`)))));
  if (results.length && !visible.length) list.replaceChildren(el('li', { class: 'empty' }, 'Nothing in the selected groups. Tap a count above to show it.'));
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  const [key, value] = data.get('where').split(':');
  const params = { [key]: value, fn: data.get('fn'), q: data.get('q').trim() };
  const button = form.querySelector('button');
  button.disabled = true;
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
    results = await mapLimited(jobs, 6, async job => {
      const text = (await getJob(job.id)).description_text;
      status.textContent = `Reading postings… ${++done} of ${jobs.length}`;
      return { job, ...classify(text) };
    });
    const order = Object.keys(LABELS);
    results.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    const stated = results.filter(r => r.status !== 'not_stated').length;
    status.textContent = jobs.length
      ? `Checked ${jobs.length}${total > jobs.length ? ` of ${total}` : ''} roles. ${stated} say something about sponsorship or work authorization.`
      : 'No roles match. Try another location or keyword.';
  } catch (err) {
    status.textContent = `Couldn't load roles: ${err.message}`;
  } finally {
    button.disabled = false;
    render();
  }
});

render();
form.requestSubmit();
