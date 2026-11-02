// Classifies live roles from the speedrun board and prints the counts and every quote.
// Usage: npm run sample -- [metro] [function] [pages]   e.g. npm run sample -- nyc engineering 4
import { searchJobs, getJob, mapLimited } from '../src/api.js';
import { classify, LABELS } from '../src/classify.js';

const [metro = 'nyc', fn = 'engineering', pages = '4'] = process.argv.slice(2);
const jobs = [];
for (let page = 0; page < Number(pages); page++) {
  const r = await searchJobs({ metro, fn, page });
  jobs.push(...r.jobs);
  if (page + 1 >= r.total_pages) break;
}
const results = await mapLimited(jobs, 6, async j => ({ j, ...classify((await getJob(j.id)).description_text) }));

console.log(`${results.length} roles (metro=${metro}, function=${fn}), ${new Date().toISOString().slice(0, 10)}\n`);
for (const [status, label] of Object.entries(LABELS)) {
  const group = results.filter(r => r.status === status);
  console.log(`${label}: ${group.length}`);
  if (status !== 'not_stated') for (const r of group) console.log(`  ${r.j.company} | ${r.j.title.trim()}\n    "${r.quote}"`);
}
