# Sponsorship Check

Shows what each startup job posting says about visa sponsorship, with the deciding sentence quoted.

Roles come live from the free [a16z speedrun jobs API](https://speedrun-talent-network.com/developers). Each posting gets one of five labels: **US citizens only**, **Says it doesn't sponsor**, **Says it sponsors**, **Asks for US work authorization** or **Not stated**.

## How it decides

Rules, not AI. A posting only gets a label other than "Not stated" when one of its sentences says so outright, and that sentence is shown next to the label. Anything vague stays "Not stated", because a wrong "yes" costs an applicant weeks.

- When a posting says more than one thing, the strictest wins (citizens only, then doesn't sponsor, then sponsors, then work authorization). Other relevant sentences are shown underneath.
- Sentences that only look relevant are skipped: equal-opportunity lists ("regardless of ... citizenship"), "employer-sponsored" benefits, and E-Verify posters.
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
