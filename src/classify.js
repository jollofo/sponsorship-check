// Reads a job posting and reports what it says about visa sponsorship, quoting the sentence.
// A status other than "not_stated" is only given when a sentence says it outright. Anything vague stays "not_stated".

/** @typedef {'citizens_only' | 'no_sponsorship' | 'sponsors' | 'authorization_only' | 'not_stated'} Status */

// Checked in this order; the first rule with a matching sentence wins.
const RULES = [
  {
    status: 'citizens_only',
    test: s =>
      /\b(u\.?s\.?|united states)\s+citizenship\s+(is\s+)?(required|needed|mandatory)\b/i.test(s) ||
      /\bcitizenship\s+(is\s+)?required\b/i.test(s) ||
      /\bmust\s+be\s+an?\s+(u\.?s\.?|united states)\s+citizen\b/i.test(s) ||
      /\b(u\.?s\.?|united states)\s+citizens\s+only\b/i.test(s),
  },
  {
    status: 'no_sponsorship',
    test: s =>
      /\b(cannot|can't|can not|unable to|not able to|do not|don't|does not|doesn't|will not|won't|are not|aren't|is not|isn't|not)\b[^.;]{0,40}\bsponsor/i.test(s) ||
      /\bsponsorship\b[^.;]{0,40}\b(is\s+not|isn't|not|unavailable)\b/i.test(s) ||
      /\bno\s+(visa\s+)?sponsorship\b/i.test(s) ||
      /\bwithout\s+(the\s+need\s+for\s+)?(current\s+or\s+future\s+)?(visa\s+)?sponsorship\b/i.test(s),
  },
  {
    status: 'sponsors',
    test: s =>
      /\b(will|can|could|are able to|is able to|happy to|glad to|open to|we|do|does)\s+(also\s+)?(provide\s+|offer\s+)?(visa\s+)?sponsor(ship|ing)?\b/i.test(s) ||
      /\b(visa\s+)?sponsorship\s+(is\s+)?(available|provided|offered|possible)\b/i.test(s),
  },
  {
    status: 'authorization_only',
    test: s => /\b(authori[sz]ed\s+to\s+work|work\s+authori[sz]ation|eligible\s+to\s+work)\b/i.test(s),
  },
];

// Sentences that use the words without saying anything about this role's sponsorship.
const IGNORE = [
  /\bregardless\s+of\b/i, // equal-opportunity lists ("...national origin, citizenship...")
  /\bwithout\s+regard\s+to\b/i,
  /\bemployer[- ]sponsored\b/i, // benefits
  /\bposter\b/i, // E-Verify / Right to Work posters
];

const mentionsVisa = s => RULES.some(r => r.test(s)) || /\b([Vv]isas?|OPT|CPT|H-?1B|[Ii]mmigration)\b/.test(s);

/** Splits posting text into sentences and list items. */
export function sentences(text) {
  return (text || '')
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z(])/)
    .map(s => s.replace(/^[\s\-*•·]+/, '').trim())
    .filter(Boolean);
}

/**
 * @param {string} text posting description
 * @returns {{status: Status, quote: string | null, also: string[]}}
 *   quote: the sentence that decided the status; also: other sentences that mention visas or work authorization.
 */
export function classify(text) {
  const relevant = sentences(text).filter(s => !IGNORE.some(r => r.test(s)));
  for (const rule of RULES) {
    const quote = relevant.find(rule.test);
    if (quote) {
      const also = relevant.filter(s => s !== quote && mentionsVisa(s));
      return { status: rule.status, quote, also };
    }
  }
  return { status: 'not_stated', quote: null, also: [] };
}

export const LABELS = {
  citizens_only: 'US citizens only',
  no_sponsorship: "Says it doesn't sponsor",
  sponsors: 'Says it sponsors',
  authorization_only: 'Asks for US work authorization',
  not_stated: 'Not stated',
};
