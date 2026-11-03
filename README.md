# Sponsorship Check

Shows what each startup job posting says about visa sponsorship, with the deciding sentence quoted. Live at https://jollofo.github.io/sponsorship-check/

## The problem

If you need a visa, the first question about any job is "will they sponsor?", and the posting almost never says. Applications ask whether *you* will need sponsorship, not whether the company offers it, so applicants often find out only after applying.

## Why it matters

Sponsorship is a yes/no gate. A role that can't sponsor is a dead end however good the fit, so every application to one is time an applicant on a visa doesn't get back. On a job board, checking means opening each posting and searching it by hand, and most of the time that turns up nothing.

## Why this approach

- **Quotes, not summaries.** Every label shows the sentence it came from, so anyone can check it in a second.
- **Rules, not AI.** A model can read a vague line as a "yes", and a wrong yes costs an applicant weeks. Rules only label what a sentence says outright; anything else stays "Not stated".
- **Smarter than a keyword search.** Searching postings for "sponsor" or "citizen" mostly finds equal-opportunity lists ("regardless of ... citizenship"), "employer-sponsored" benefits and E-Verify posters. Those are skipped.
- **This role, not past filings.** Public H-1B records show whether a company sponsored someone before, not whether this role will. They're a good second check, not an answer.
- **Honest about the limit.** Most postings say nothing (see below), and no reading of the text can fix that. The real fix is asking companies one "do you sponsor?" question when they post a role. Until then, this covers what postings do say.

## How it decides

Roles come live from the free [a16z speedrun jobs API](https://speedrun-talent-network.com/developers). Each posting gets one of five labels: **Says it sponsors**, **Asks for US work authorization**, **Says it doesn't sponsor**, **US citizens only** or **Not stated**. A label other than "Not stated" needs a sentence that says so outright, and that sentence is shown next to it.

- When a posting says more than one thing, the strictest wins (citizens only, then doesn't sponsor, then sponsors, then work authorization). Other relevant sentences are shown underneath.
- Roles whose posting mentions OPT or CPT get an extra tag, since that's good news for students on F-1 visas.
- The rules live in [`src/classify.js`](src/classify.js), and the tests use wording from real postings.

## What it found

On 2 Nov 2026, across all 268 New York engineering roles on the board:

| Label | Roles |
|---|---|
| US citizens only | 3 |
| Says it doesn't sponsor | 2 |
| Says it sponsors | 0 |
| Asks for US work authorization | 5 |
| Not stated | 258 |

So 96% of postings don't answer the question. Reading the text gets you the clear no's. The rest needs the company to say it.

## Run it

Needs Node 24+. No dependencies.

```bash
npm start          # http://localhost:4173
npm test
npm run sample -- nyc engineering 6   # print counts and quotes for a metro and function
```

On localhost, `?data=worst` (or `one`, `empty`, `error`, `huge`) swaps the live API for test data with the hardest real-world values: the longest titles and locations on the board, legal boilerplate, unbreakable URLs. A switch at the bottom of the page flips between them. The live site never loads it.
