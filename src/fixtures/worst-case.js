// Dev-only fixtures for break-ui testing. app.js loads this file only on localhost with ?data=<mode>; the live page never does.
// Every value is either real (copied from the speedrun board on 2 Nov 2026) or a realistic shape for it.
// Modes: worst (one hard case per row), one (a single role), empty (no roles), error (API fails), huge (1,284 matches).

const LONG_LOCATION = 'Austin, Texas, United States; New York, New York, United States; Remote (US); San Francisco, California, United States';

const ROWS = [
  {
    title: 'Senior Supplier Industrialization Engineering, Mechanical, Intelligence Systems', // longest real title on the board
    company: 'The Better Money Company',
    location: LONG_LOCATION, // longest real location on the board
    text: 'We will sponsor H-1B visas and transfers for this role. Candidates on OPT or STEM OPT are welcome. Students on CPT can apply for the summer cohort. We support green card processing after one year. Immigration counsel is provided.',
  },
  {
    title: '🦾 Head of Engineering', // real: emoji-first title
    company: 'Benachrichtigungsplattformgesellschaft', // unbreakable compound name
    location: 'Remote (US)',
    // One "sentence" with no full stop: legal boilerplate pasted as a single paragraph.
    text: 'Applicants must be authorized to work in the United States on a full-time basis without the need for current or future visa sponsorship including but not limited to H-1B TN E-3 O-1 or any other employment-based immigration status and the company is not able to sponsor or take over sponsorship of an employment visa at this time or in the future for this position or any other position',
  },
  {
    title: 'IT Systems Engineer — Identity & Automation <Contract>', // real dash and ampersand, plus markup-like text
    company: 'Kaizen & Co.',
    location: 'Washington, DC',
    text: 'US citizenship is required (see https://careers.example.com/legal/export-control/itar-ear-eligibility-requirements-for-all-applicants?region=us-only&ref=job-posting-2026).',
  },
  {
    title: 'Software Engineer, New Grad',
    company: 'Northwind',
    location: 'New York, NY',
    text: 'Applicants must be currently authorized to work in the United States. Visa questions? Email us. We do not support students on J-1 visas. H-1B transfers are reviewed case by case. Immigration status is verified via E-Verify. Candidates on OPT should note their end date.',
  },
  { title: 'Engineer', company: 'J', location: '', text: 'We build software.' }, // shortest values, empty location
  { title: 'Founding Engineer\n(Backend)', company: 'Partiful', location: 'New York, NY', text: null }, // newline in title, no description
  // Three identical rows from one company: policy is per company, the list repeats it.
  ...['Sr. Full Stack Software Engineer', 'Full Stack Engineer', 'Founding Security Engineer'].map(title => ({
    title, company: 'Odyssey', location: 'New York, NY',
    text: '- Applicants must be currently authorized to work in the United States on a full-time basis.',
  })),
];

const toJob = (row, i) => ({ id: `fixture-${i}`, title: row.title, company: row.company, location: row.location, url: `https://jobs.example.com/${i}` });

function dataset(mode) {
  if (mode === 'one') return [ROWS[0]];
  if (mode === 'empty' || mode === 'error') return [];
  if (mode === 'huge') return Array.from({ length: 1284 }, (_, i) => ({ title: `Software Engineer ${i + 1}`, company: `Company ${i % 97}`, location: 'New York, NY', text: 'We build software.' }));
  return ROWS;
}

/** Stands in for src/api.js: same functions, fixture data. */
export function fixtureApi(mode) {
  const rows = dataset(mode);
  const jobs = rows.map(toJob);
  return {
    async searchJobs({ page = 0 }) {
      if (mode === 'error') throw new Error('Jobs API returned 503');
      return { jobs: jobs.slice(page * 50, page * 50 + 50), total: jobs.length, total_pages: Math.max(1, Math.ceil(jobs.length / 50)) };
    },
    async getJob(id) {
      const i = Number(id.split('-')[1]);
      return { ...jobs[i], description_text: rows[i].text };
    },
  };
}

/** The Demo / Worst case switch, fixed at the bottom of the page. Dev-only chrome. */
export function mountToggle(current) {
  const modes = { '': 'Live', worst: 'Worst case', one: 'One', empty: 'Empty', error: 'Error', huge: '1,284 rows' };
  const bar = document.createElement('nav');
  bar.setAttribute('aria-label', 'Test data');
  bar.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:2px;padding:3px;background:#ddd;border-radius:999px;font:12px system-ui;z-index:10;max-width:calc(100vw - 16px);overflow-x:auto';
  for (const [mode, label] of Object.entries(modes)) {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = mode ? `?data=${mode}` : '?';
    a.style.cssText = `padding:4px 10px;border-radius:999px;color:#222;text-decoration:none;white-space:nowrap;${mode === current ? 'background:#fff' : ''}`;
    bar.append(a);
  }
  document.body.append(bar);
}
