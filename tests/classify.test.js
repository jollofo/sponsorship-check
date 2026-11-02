import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, sentences } from '../src/classify.js';

// Sentences below are taken from real NYC engineering postings on the speedrun board (2 Nov 2026).
const cases = [
  ['- Authorized to work in the US (we cannot sponsor visas at this time).', 'no_sponsorship'],
  ['- Visa sponsorship is not available for our internship positions', 'no_sponsorship'],
  ['Candidates must be able to work without current or future visa sponsorship.', 'no_sponsorship'],
  ['United States citizenship is required, because it is a condition of eligibility for the clearance the role depends on.', 'citizens_only'],
  ['- US citizenship required; this role supports work subject to US government contract obligations and export control regulations (ITAR/EAR)', 'citizens_only'],
  ['- Applicants must be currently authorized to work in the United States on a full-time basis.', 'authorization_only'],
  ['Other: Must have US work authorization or ability to use OPT during the time of your internship.', 'authorization_only'],
  ['We sponsor visas, including H-1B transfers.', 'sponsors'],
  ['Visa sponsorship is available for this role.', 'sponsors'],
  ['We are happy to sponsor visas for the right candidate.', 'sponsors'],
];

for (const [text, status] of cases) {
  test(`${status}: ${text.slice(0, 50)}`, () => {
    const r = classify(`We build software.\n${text}\nApply below.`);
    assert.equal(r.status, status);
    assert.equal(r.quote, text.replace(/^- /, ''));
  });
}

test('words that only look relevant are ignored', () => {
  for (const text of [
    'We hire regardless of race, color, ancestry, religion, sex, national origin, age, citizenship, or veteran status.',
    'All qualified applicants will receive consideration without regard to race, national origin, citizenship status or disability.',
    '- Commuter benefits; employer-sponsored',
    'You can view the E-Verify poster here and the Right to Work poster here.',
    'Government technology has failed citizens, veterans, public servants, and service members for decades.',
    '- Ensure observability and performance are first-class citizens',
  ]) assert.equal(classify(text).status, 'not_stated', text);
});

test('the strictest statement wins, and the rest are kept as context', () => {
  const r = classify('Applicants must be authorized to work in the U.S. DoorDash does not support students on J-1 visas at this time.');
  assert.equal(r.status, 'authorization_only');
  assert.deepEqual(r.also, ['DoorDash does not support students on J-1 visas at this time.']);

  const both = classify('You must be legally authorized to work in the US. Visa sponsorship is not available for our internship positions.');
  assert.equal(both.status, 'no_sponsorship');
  assert.deepEqual(both.also, ['You must be legally authorized to work in the US.']);
});

test('empty or missing text is not stated', () => {
  assert.deepEqual(classify(''), { status: 'not_stated', quote: null, also: [] });
  assert.deepEqual(classify(undefined), { status: 'not_stated', quote: null, also: [] });
});

test('splits on sentences and list items', () => {
  assert.deepEqual(sentences('One thing. Two things!\n- Three\n• Four'), ['One thing.', 'Two things!', 'Three', 'Four']);
});
