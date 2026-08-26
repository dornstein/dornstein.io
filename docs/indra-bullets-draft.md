# Indra bullets — fill-in-the-blanks (for David)

> This is the highest-leverage remaining item both reviewers named: reframe the
> Indra experience from *throughput* ("150K lines", "throughput of a full
> engineering org") to **rigor + adoption + outcomes**. That's what a Principal/Staff
> screen at a frontier lab probes first, and it's the one thing that turns the
> AI-native lead from an assertion into evidence.
>
> **Rules I followed:** everything below the line comes from facts already in
> `resume.yaml` / the glossary. Every number or unverified specific is a
> `[FILL: …]` blank. **Do not estimate — if you can't substantiate a figure, delete
> that clause rather than guess.** Fill these in (or edit freely) and I'll wire the
> result into `work[] > id: indra` (highlights + summary) verbatim.

---

## A. Orchestration & the harness (how, not how-much)

> Conceived and built Indra, an AI-first application platform inside Microsoft's
> CISO organization, as its sole human architect — directing a team of eight
> specialized GitHub Copilot custom agents (engineering lifecycle, strategy,
> security review, narrative, advocacy, demos, editorial), each owning a distinct
> domain. `[FILL: how the agents are coordinated — e.g., plan lifecycle / task
> hand-offs / shared context / MCP tools — one concrete mechanism]`, with
> `[FILL: how you keep their output correct — human review gates / CI checks /
> the security-sentinel agent reviewing every change / prompt versioning]`.

## B. Rigor / evaluation (the part that's currently missing)

> `[FILL: your evaluation approach — what you measure and how. Candidates, use only
> what's real: eval-suite coverage %, number of eval cases, regression-catch rate,
> the review/CI gates each agent's output passes before merge, how you version and
> test prompts.]` — keeping platform output reliable and architecturally coherent
> across `[FILL: scope — e.g., a ~150K-line TypeScript codebase]`.
> *(Note: keep the codebase size only as scope/context, never as a lines-per-day
> productivity claim — that framing was the top credibility risk both reviewers hit.)*

## C. Adoption & outcomes (what shipped and who uses it)

> Deployed across development, pre-production, and production environments.
> `[FILL: adoption — e.g., N SIGMA engineers have built N apps on the platform;
> N deputy CISOs use the Unified Security Reporting dashboards in production;
> N security domains onboarded.]` Delivered `[FILL: a concrete capability outcome —
> e.g., natural-language querying over security data via Kusto under real user
> identity; Power BI embedding with pass-through permissions; a cross-domain
> posture view that previously required N manual queries/dashboards.]`

## D. (Optional) the model, stated as proof not throughput

> `[FILL: one line on the AI-native super-IC model — but anchored to an outcome,
> not volume. e.g., "one architect sustaining a production platform — architecture,
> code, evals, docs, and ops — that N engineers now build on," rather than
> lines-per-day.]`

---

## Two facts I also need from you (I won't guess these)
1. ~~**Indra start date.**~~ **RESOLVED: 2026.** Role `startDate: 2026-01`; label now "2026 – Present".
2. ~~**LinkedIn URL.**~~ **RESOLVED:** https://www.linkedin.com/in/dornstein/ — live on both views.

---

## Answers captured (serial walkthrough, 2026-08) — raw, before drafting into prose

> David's own words, verbatim-ish, as source facts. Bullets get assembled from these
> only after all 7 items are collected. No estimates.

**A1 — coordination mechanism:** Agents store and manage state in the project repo.
Plans and specs are artifacts that are also exposed to humans (dual-purpose — legible
governance, not a black box). Work is often manually invoked, but there's also genuine
cross-agent coordination — e.g., a "chief of staff" agent runs recurring meetings with
the agent team, and a systematic ROB (rhythm of business) drives recurring activities
across the team.

**A2 — correctness gates:** ALL FIVE are real in Indra: (1) human review gate — David
reviews/approves every change before merge; (2) a dedicated security-review / "sentinel"
agent reviews every change; (3) CI checks — tests, linters, static analysis, build gates
(⚠️ confirm whether the static-analysis tool is CodeQL specifically before naming it);
(4) prompt/spec versioning — agent prompts and specs are version-controlled and reviewed,
so behavior is reproducible; (5) branch-protection / PR-based flow — nothing lands without
passing the gates.
**B1 — evaluation approach:** HONEST STATE: the AI features are strategic and present
but NOT the primary thing Indra is; they are still tested relatively informally/manually.
**No automated evals / eval suite today.** => Do NOT manufacture an eval story. The rigor
half of the bullets rests on the REAL A2 engineering gates (human review, security-sentinel
agent, CI tests/linters/static-analysis, prompt/spec versioning, PR branch-protection) and
on architectural coherence — not on AI evaluation. Frame AI as one strategic capability of a
broader app platform, and if evals are mentioned at all, say "manual today" (no rounding up).
**B2 — codebase scope:** REAL CENSUS (Indra Codebase Census, as of 2026-08-26, commit
d87aff51a38d):
- Physical source LOC 508,081 · nonblank 461,128 · **non-test source LOC 342,906** ·
  test LOC 118,222 across 735 test files.
- **95.6% TypeScript/TSX.** 10 workspace packages (monorepo).
- 69 apps (65 with client code, 32 with backends); 97 public UI component modules
  (93 gallery-registered) = a real design system; 1,056 markdown docs.
- Largest apps by non-test runtime LOC: Design System 18,248 · Unified Security
  Reporting 15,120 · Engage 11,339.
- LOC = tracked TS/TSX/JS/CSS/Bicep/scripting, excludes deps & build output.
=> **Scope figure to use (rounded DOWN, defensible):** "~340K non-test lines of
TypeScript" or "a ~340K-line, 10-package TypeScript monorepo of ~69 apps." NEVER as
lines-per-day. The 735 test files / ~118K test LOC give the A2 "CI tests" gate real
substance. NOTE: this supersedes the old portfolio stat "150K+ Lines (Past 60 Days)" —
consider swapping that stat for a scope-framed number later (separate decision).
(Open Q for C1: are the 69 apps platform/sample apps, or apps built by SIGMA engineers?
that determines the adoption story.)
**C1 — adoption:** Of the 69 apps, ~40 are samples + platform management/operations apps
(built by David/the platform); the **remaining ~29 are built by real users — 5–6 teams,
10–15 engineers across them.** CISO leaders (incl. dCISOs) use the Unified Security
Reporting dashboards. **Dozens of security domains / verticals.**
⚠️ **Do NOT expose Indra user counts** (proprietary + early). For "can build systems that
scale" proof, use LIQUID instead: **10K+ MAU sustained for many years** (new datapoint —
also a candidate to strengthen the Liquid role/stat later). So: Indra = production platform
with real teams building on it (early), architecture/rigor proof; Liquid = proven-scale
proof. OK-to-state (David volunteered): team/engineer counts, domain count, dCISO usage,
Liquid MAU. NOT OK: Indra user/MAU numbers.
**C2 — a concrete capability shipped:** _[pending]_
**D — super-IC model as proof:** _[pending]_
