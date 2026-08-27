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

---

## Follow-up pass (after the reviewers re-validated)

Both reviewers confirmed **#2 landed** and **#1's lead landed** (evidence half is the
deferred Indra rewrite). Two refinements they surfaced:

- **Metrics strip reordered** so it leads with outcomes, not tenure — now
  `8K+ Services Secured · $200M Exit · 12+ Patents · 50+ Engineers Led ·
  3 Companies Founded · 40+ Professional Years` (age moved last). Pure ordering,
  no new data. *(Note: the strip is still all-legacy until a real AI-native number
  from Indra can join it — see `docs/indra-bullets-draft.md`.)*
- **"Demote 1–2 older roles to `brief`" — DONE via option (b) (David chose).** Demoted
  `ebooks-flexwiki` (Architect, Emerging Technologies, 1999–2001) and `oebf-president`
  (OEBF President, 2000–2003) to `resume: brief`, and renamed the collapsed block from
  "Earlier career (1979–1998)" to **"Additional experience"** (heading now carries no
  overall date range, since brief roles can post-date 1998; each row still shows its own
  accurate span). Full résumé roles: 9 → 7. The two demoted roles' key facts survive in
  the summary (FlexWiki and Open eBook Forum are named there), so nothing is lost — only
  the detailed cards collapse to one compact line each.

The single highest-leverage remaining item (both agree): the **Indra rewrite** —
skeleton for you to fill is in `docs/indra-bullets-draft.md`.

---

## Résumé reference links (view-independent, no new content)

The linear résumé now hyperlinks proper nouns (Metro/OOXML, FlexWiki, SDL, CodeQL,
Rocket eBook, NuvoMedia, Open eBook Forum/EPUB, DRM, C#, .NET, DOJ consent decree, …)
to their **public** reference pages. **No résumé-specific link data was added** — this
renders the *same* `terms:` arrays + `glossary[].links` the portfolio already uses:

- Portfolio renders a tagged term as a glossary-popup trigger (`.term` span).
- Résumé renders the same term as a real `<a>` to its glossary entry's first **public**
  link — new `linkRefs()` in `app.js`, deduped so each term links once. Print/PDF-friendly.
- **Internal links are skipped.** Added `internal: true` to the two `*.microsoft.com`
  glossary links (`indra`, `liquid`) — a fact about the link (not publicly reachable),
  view-neutral, so no view treats them as references. A recruiter never gets a dead link.
- Add a term to any block's `terms:` array and it enriches BOTH views at once.

---

## Post-launch review pass (recruiter + hiring-manager re-scan of the live site)

Re-ran both specialist reviews on the shipped content. Both independently named the same
top gaps. Actions taken (all data/presentation; no fabrication):

- **Date correctness (David-confirmed).** Chief of Staff actually started 2009 (not 2008)
  and the Compliance Engineering role ended then. Corrected machine dates + labels so both
  views read Compliance **2004–2009** and Chief of Staff **2009–2014**, sequential — fixing
  a cross-view inconsistency (résumé had shown raw 2004–2010 vs the portfolio's rounded
  2004–2008) that a reviewer flagged as looking like padding.
- **Group A (mechanical polish):**
  - Replaced the **"340K+ Lines of TypeScript"** stat tile (LOC-as-headline = volume-brag)
    with **"Dozens · Security Domains"** (adoption). Slug `stat-lines` → `stat-domains`;
    340K kept as supporting scope in the popup + résumé bullet.
  - Trimmed **"sole human architect"** from 6 uses → 2 (hero + Indra role summary).
  - Dropped the **"40+ Professional Years"** tile from both views (David's call) — depth
    still shows via the timeline back to 1979, not as a headline number.

**Still open (both reviewers' highest-leverage items, not yet done):**
- **Group B (prose, to be drafted for approval):** a security→AI-safety thesis line, and
  expanding the security-review agent into its own concrete bullet.
- **Group C (only David can do):** one public, clickable artifact (agent-harness write-up,
  sanitized PR trail, or sample repo) — the single biggest remaining gap for a top-lab bar.

---

## Cross-view pass — presentation insights that aren't résumé-only

You flagged that some of the résumé presentation insights apply to **any view a
hiring audience sees** — recruiters and hiring managers may open the portfolio (or
a future view), so "lead with outcomes, not the 40+-year tenure" is valid there too.
I reviewed the portfolio for that class of issue. Same standing rule: reorder/select
only; no prose invented or rewritten.

**Changed (presentation/ordering only):**

- **Stats block reordered at the source, so every view inherits it.** I moved the
  ordering into `basics.stats[]` in `resume.yaml` itself (outcome-first, `40+
  Professional Years` LAST) and made both renderers read that array order. The
  portfolio "About" tiles now lead `8K+ Services Secured · $200M Startup Exit · 12+
  Patents · 50+ Engineers Led · 3 Companies Founded · $250M Largest Budget · 150K+
  Lines (Past 60 Days) · 40+ Professional Years`. The résumé strip (its 6 flagged
  stats) reads the same order — so the two views can no longer drift, and the
  résumé's separate hardcoded `STRIP_ORDER` array is gone (redundant now). Values
  and labels unchanged; pure reorder.

**Reviewed and already fine (no change needed):**

- **Value props** already lead with `AI-Native Super-IC` → `Security at Scale` (present/outcome-forward).
- **Career timeline** is newest-first, so it opens on Indra — not the 1979 roles.
- **Skills** lead with the `AI-Native Development` category.

**Flagged — prose, so I did NOT touch it (your call):**

- **Hero tagline** (`basics.label`): *"Software leader, architect, founder, and
  standards author with 40+ years building products and platforms people depend
  on."* This is the one remaining spot where a view leads with the generic
  title-stack + the "40+ years" age signal, and it's the largest text on the site.
  Rewriting it to lead with the AI-native present would be a **prose change**, which
  I won't fabricate. If you want it, I'll draft *candidates for your approval* (same
  as the résumé headline offer). Left verbatim for now.
- **"150K+ Lines Shipped (Past 60 Days)"** stays on the portfolio (you keep it there
  deliberately — it's the AI-native throughput signal on your personal site). I only
  demoted its *position*; it's no longer near the top. The résumé still omits it
  entirely (the HM's #1 credibility risk), so the two views diverge here on purpose.

---

## Newly-authored prose — David-approved (2026-08)

> ⚠️ **These are the ONLY places in this whole rework where the visible text is not a
> verbatim carry-over from your prior copy.** They are new positioning sentences I
> drafted as *candidates*, and you approved specific ones. Recording them here so the
> "no slop / track every substantive change" rule is honored — audit the exact wording.

- **Portfolio hero tagline** (`basics.label`) — replaced *"Software leader, architect,
  founder, and standards author with 40+ years building products and platforms people
  depend on."* with approved candidate **1A**: *"Software architect and engineering
  leader building AI-native platforms — most recently Indra, a security platform I run
  as its sole human architect alongside a team of AI agents."* Leads with the AI-native
  present; drops the "40+ years" opener. Facts used: Indra, sole human architect, AI-agent
  team — all already in your data.
- **Positioning statement** (`basics.headline`, new field) — approved candidate **2A**:
  *"Principal architect and engineering leader. I've founded companies, shaped industry
  standards, and secured software at Microsoft scale — and I now build AI-native
  platforms as a single architect working with a team of AI agents."* Gives a screener
  the shape in one glance. Facts used: founder (3 companies), standards author, Microsoft
  security work, Indra — all in data.
  - **View-independence note:** an earlier draft named this field `resumeHeadline`, which
    baked a view name into the schema — a violation of the "core data is view-neutral"
    principle. Renamed to `basics.headline`, one of three length-based positioning tiers
    (`label` → `headline` → `summary`). No tier is owned by a view; each view renders the
    tier that fits (portfolio hero = `label`, linear résumé = `headline`).
- **Indra role rewrite** (`work[id: indra]` summary + highlights) — David-approved after a
  7-item fact-gathering walkthrough (captured in `docs/indra-bullets-draft.md`). Summary
  trimmed (dropped the redundant agent-domain enumeration); both hype highlights ("Proving
  the AI-native super-IC model… throughput of a full engineering org" and the generic
  "deployed across dev/preprod/prod") **replaced** by four fact-sourced highlights on
  discipline (5 real merge gates), scope (~340K non-test LOC census), adoption (real teams
  building), and shipped capabilities. Humble framing: no "super-IC" label, no throughput
  claim, scale stated as scope only. Every clause traces to a captured answer; no estimates.
- **Liquid 10K+ MAU** (`work[id: liquid-cst]` highlights + card override) — added David-
  supplied stat "Sustained 10,000+ monthly active users for years." to both the résumé and
  portfolio-card highlight lists. Proven-scale proof point.
- **Residual-hype cleanup (consistency pass).** After the humble Indra rewrite, four other
  spots still carried the pre-humble framing (throughput / "super-IC" / "150K lines in 60
  days" / "2,500 lines per day"). All reconciled to match the decision (David-approved):
  1. `basics.summary[3]` — dropped "…the throughput of a full engineering org"; now "one
     architect and a crew of AI collaborators, held together by real engineering discipline."
  2. `valueProps` — retitled "AI-Native Super-IC" → **"AI-Native Engineering"**; softened
     "I've proven…" → "I build…"; added the concrete discipline (review/security/CI/prompts).
  3. `stat-lines` — **replaced** the "150K+ Lines (Past 60 Days)" tile (HM's #1 credibility
     risk; census supersedes it) with **"340K+ Lines of TypeScript"**, and rewrote the popup
     to census-based scope (no lines-per-day, no super-IC). *(Decision: "replace w/ scope stat.")*
  4. `glossary[indra]` — dropped "throughput of a full engineering org / working proof of the
     AI-native super-IC concept"; replaced with the real merge-gate discipline.
  Also updated the stale "150K-line" number in the "Architect Who Codes" value prop → "~340K".
  Verified: `grep` for 150K/2,500/super-IC/throughput now returns nothing across all files.
- **Director → Principal Architect framing** (`work[id: indra].context`, new view-neutral
  field) — approved candidate **3-B**: *"I've stayed close to the code and architecture
  throughout my career, including my Senior Director years; moving to principal architect
  for Indra was a deliberate choice to make hands-on system-building the whole job."*
  Frames the move as a deliberate shift in *degree* (hands-on part → whole), not a return
  from absence (you were already ~30% hands-on as a Senior Director). Rendered as a short
  italic framing note on the Indra role in **both** views; the descriptive summary is left
  untouched. Facts used: your Senior Director roles + the current Principal Architect role
  — all in data; the "deliberate choice" / "stayed close" characterization is yours,
  confirmed by you.
