# Résumé rework — change audit

> Branch `claude/resume-rework`. This implements feedback **#1** (lead with the
> AI-native story; anchor on outcomes, not lines-of-code) and **#2** (restructure
> for a top-lab screen) from the recruiter + hiring-manager reviews.
>
> **Guiding rule for this pass:** no invented facts, no rewritten prose. Every
> sentence shown on the résumé is **verbatim** from your existing `resume.yaml`.
> All changes are either *format/structure* or *selection/reordering* of your own
> words, expressed as additive data flags. The portfolio view is untouched.

## What changed (all mechanical / selection-only)

| # | Change | How it's implemented | Substantive? |
|---|--------|----------------------|--------------|
| 1 | **Metrics strip** under the résumé header | Featured 6 existing stats via a `resume: true` flag on `basics.stats[]` | No — your numbers, I only chose which to show |
| 2 | **Dropped the "150K+ lines / past 60 days" stat** from the résumé | That stat simply has no `resume: true` flag (still in the data + portfolio) | No — a de-selection (this was the HM's #1 credibility risk) |
| 3 | Also left **"$250M budget"** out of the strip | Same — no flag | No — kept the strip tight/outcome-focused |
| 4 | **Summary now leads with Indra**, then Microsoft, then pre-MS | `basics.resumeSummaryOrder: [3, 1, 2]` — indices into your `summary[]` | No — reorder of verbatim paragraphs |
| 5 | **Dropped the generic opener + the "craft" closer** from the résumé summary | They're just not in `resumeSummaryOrder` (still in the portfolio About) | No — de-selection of your own paragraphs |
| 6 | **Two-tier Experience**: 9 recent roles full, 1979–1998 collapsed | `resume: full \| brief \| omit` flag per `work[]` entry | No — the "Earlier career" lines are derived from data (org, years, your actual titles) |
| 7 | **Dropped the two "Details not fully recalled" roles** + the eBookNet sub-role from the résumé | `resume: omit` (still LinkedIn-visible in the data) | No — removal |
| 8 | **Added a GitHub link** to the contact line | `basics.profiles: [{ network: GitHub, url: github.com/dornstein }]` | Mild — factual (you own it); verify it's the right handle |

**Tiering is fully tunable** — the `resume:` flag on each `work[]` entry decides
full/brief/omit, and `resume: true` on each stat decides the strip. Move a role
between tiers by changing one word.

### The full/brief/omit split I chose (please sanity-check)
- **Full (9):** Indra · Liquid (DSR) · Liquid (CST) · Chief of Staff TwC · Compliance Engineering · Metro/XPS · eBooks & FlexWiki · Open eBook Forum · NuvoMedia CTO.
- **Brief → "Earlier career (1979–1998)" (grouped by employer):** Pragmatica · Independent Consultant · LongView · INTERSOLV (4 roles → 1 line) · Access Technology · Multimate · Timex · Heuristics · Sinclair.
- **Omit from résumé:** Applied Intelligence, Applied Systems Technologies (placeholders), eBookNet.com (subsumed by the NuvoMedia CTO entry).

---

## Deliberately NOT done — needs your words or facts (I did not fabricate)

These are the parts of the feedback that require real information or a judgment
call in your voice. I left them for you rather than risk inventing:

1. **LinkedIn URL** — `basics.profiles` has a `TODO(David)`. I won't invent a link.
2. **Rewrite the Indra bullets around rigor/evals/adoption** (the hiring manager's
   single biggest point). This needs facts I don't have: eval coverage, how many
   SIGMA engineers built on Indra, actual dCISO adoption, whether MCP is in the
   stack, how you spec/version/review agent output. **Your current Indra bullets
   are shown unchanged.** Give me the specifics and I'll wire them in.
3. **A tight 2–3 line positioning headline** (recruiter). I reordered your existing
   paragraphs instead of writing a new opener. If you want a crisper headline, I
   can draft *candidates for your approval* — say the word.
4. **Framing the Director → Principal Architect move as a deliberate choice** (both
   flagged the "reads like a step down" risk). That's a sentence in your voice; I
   didn't write it. Draft on request.
5. **Trim "…a startup CEO, and an individual contributor — sometimes in the same
   year"** (recruiter suggested cutting). I kept your paragraph verbatim; flagging
   only.
6. **"…the throughput of a full engineering org"** in the Indra paragraph — kept
   verbatim (it's yours), but noting it since the HM was wary of throughput framing.

## Not touched
- No facts changed. No portfolio changes. No LinkedIn-sync data changed (omitted
  roles keep `linkedin` visibility). `#3` from the review (security→AI-safety
  bridge; a public verifiable artifact) is intentionally left for the next pass.
