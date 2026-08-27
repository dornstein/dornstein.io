---
name: linkedin-sync
description: Idempotently sync a LinkedIn profile from resume.yaml (the single source of truth) using a browser-automation MCP. Fully replaces LinkedIn's Headline, About, Experience, and Skills to match the YAML, and is safe to re-run whenever the YAML changes (a run against an already-synced profile makes zero writes). Use when the user asks to "sync LinkedIn", "update LinkedIn from resume.yaml", "push my resume to LinkedIn", or "get LinkedIn up to date".
---

# LinkedIn Sync (from resume.yaml)

Bring a LinkedIn profile fully into agreement with `resume.yaml`. **The YAML is the single source of truth; LinkedIn is a pure follower.** The user does not edit LinkedIn by hand, so this skill may **add, update, AND delete** LinkedIn content to match the YAML. It is designed to be **idempotent**: run it any time the YAML changes; a run against an already-synced profile detects that everything matches and makes **zero writes**.

## Modes

- **dry-run** (read-only): read the *complete* current LinkedIn state, diff it against the YAML-derived desired state, and report exactly what WOULD change (add / update / delete, field by field). Makes no writes. Use it to preview a sync and to **verify idempotency** (a healthy synced profile yields an empty diff).
- **apply** (default): perform the diff's writes, verifying each via the DOM.

Always run **dry-run first** when the YAML has changed materially, or to confirm a no-op. The user picks the mode; if unspecified, default to a dry-run and show the diff before applying.

## Sections synced (and their YAML source)

| LinkedIn field | YAML source | Transform |
|---|---|---|
| **Headline** | `basics.headline` | trim to ≤ 220 chars (LinkedIn cap), minimally, preserving meaning |
| **About** | `basics.summary` (array) | join paragraphs with a blank line; ≤ 2 600 chars |
| **Experience** | `work[]` where `visibility` contains `linkedin` | see **Canonical record** |
| **Skills (list)** | `skills[].keywords[]` | map each to LinkedIn's canonical vocabulary (see skill map) |
| **Top skills (order)** | `skills[].keywords[].pinned` (1,2,3…) | reorder those to the top |

**Out of scope — never touched:** per-experience skill tags, Education, Licenses & Certifications, Recommendations, Featured, Projects, Publications, Patents, profile photo, contact info.

## Core principles (read before every run)

1. **YAML is authoritative; full replacement.** Never merge a fact from LinkedIn into the plan. If a role/skill left the YAML, the skill removes it from LinkedIn.
2. **Idempotent = diff, then write only differences.** For each item compute the *already-transformed* desired value (trimmed headline, mapped skill name, formatted description) and compare to the current LinkedIn value. Equal → do nothing.
3. **Read the COMPLETE current state first.** LinkedIn lazy-loads / virtualizes long lists (Experience, Skills). You MUST scroll to load **every** entry before diffing. **An incomplete read is the #1 cause of DUPLICATES** — an unseen existing role gets re-added. (This happened; see below.)
4. **Verify with JS (the DOM), not screenshots.** Screenshots lag behind the DOM (form values render stale) and require the Browser pane to be *visible*; `javascript_tool` eval reflects true state and works even when the pane is hidden. Reserve screenshots for drag-and-drop and layout checks.
5. **Order of operations: Experience → Headline → About → Skills.** Headline comes *after* Experience because **adding a position silently overwrites the profile headline** on LinkedIn (a real quirk observed in production) — so set the headline *after* any Experience writes.
6. **Log every mutation** to an audit trail, and never invent a value — everything written comes from the YAML.

## Preflight

1. **Browser MCP** exposing an accessibility/DOM snapshot **and JS eval** (e.g. the built-in Browser pane: `navigate` / `read_page` / `computer` / `javascript_tool`, or `@playwright/mcp`). If none is attached, stop and tell the user to attach one.
2. **Source of truth**: `resume.yaml` at the repo root (preferred). Fallbacks in order: `resume.json`, then `REFERENCE.md`, then ask. Never fall through silently — state which source was used. Parse:
   - `basics.headline`, `basics.summary`
   - `work[]` (keep only items whose `visibility` includes `linkedin`)
   - `skills[]` (categories → `keywords[]`, each `{slug, name, pinned?}`)
3. **Audit log**: append-only JSONL file (or a DB table if the host provides one), one row per mutation: `{ts, section, action, key, field, old, new, status, notes}`.
4. **Attach to the logged-in browser**: navigate to `https://www.linkedin.com/in/me/`. If a login/join form appears, **STOP** and ask the user to log in manually in the pane, then resume. Never handle credentials.
5. Announce the **mode** and the **source** before doing anything.

---

## Canonical record — Experience

Each in-scope `work[]` item maps to:

```
company        = organization
title          = position
location       = location           # single geo. If YAML lists two cities, use the primary and note it.
startDate      = startDate          # "YYYY-MM"
endDate        = endDate            # "YYYY-MM" | "present"
employmentType = employmentType     # map to a LinkedIn type (table below)
description    = summary
                 + ""               # blank line
                 + "• " + each highlight on its own line   # only if highlights present
```

Employment-type map (LinkedIn's fixed set): `full-time`→**Full-time**, `part-time`→**Part-time**, `contract`→**Contract**, `self-employed`/`founder`→**Self-employed** (LinkedIn has no "Founder"), `board`→**leave unset** (no LinkedIn equivalent). Ignore `display:` and card-level overrides (site-only).

**Grouped employers:** several sub-roles at one employer (e.g. multiple Microsoft roles, multiple INTERSOLV roles) each remain their **own** Position under the shared **Company card**. Match and write per role; never merge them into one entry. LinkedIn groups them automatically when the Company name matches.

---

## Diff algorithm

Read the **complete** current state (see principle 3), then compute a per-section diff. In **dry-run**, print the diff and stop. In **apply**, execute it.

**Experience** — match a YAML role to a LinkedIn role by `(company, title, startDate)` (case-insensitive, ±1 month on dates); fall back to `(company, startDate)` when only the title changed.
- **missing** (in YAML, not on LinkedIn) → **ADD**.
- **outdated** (matched but a field differs) → **UPDATE** only the differing fields.
- **extra** (on LinkedIn, not in YAML) → **DELETE** (YAML is sole truth). Always surface these in dry-run; in apply, delete after logging.
- Duplicates (two LinkedIn entries for the same role, e.g. from an earlier bad run) → keep the one matching YAML exactly; delete the other.

### Field equality (idempotency tolerances) — critical

To stay a true no-op on re-runs, compare fields **tolerantly**, so states that are equivalent-in-effect don't churn:
- **Dates:** equal if the **years** match AND (months match **OR** the YAML month is a year-boundary placeholder — `-01` start / `-12` end). Rationale: for old roles the YAML months are placeholders and LinkedIn displays year-only anyway; don't rewrite a role just to flip an unshown month. Only treat a date as *outdated* when a **year** differs (or a real, non-placeholder month differs).
- **Employment type:** when the YAML type has **no exact LinkedIn equivalent** (`founder`, `board`), set it on ADD but **do not diff/churn** it on UPDATE. Otherwise compare normally.
- **Location:** compare case-insensitively and treat well-known equivalents as equal ("Redmond, WA" ≡ "Redmond, Washington, United States", "Greater Seattle Area" is *not* equal to a specific city). Only flag a real change.
- **Company name:** don't rewrite a linked company just because the YAML string differs cosmetically (e.g. "Intersolv" vs "INTERSOLV / Sage Software") — changing it can break the company-page link. Match on the company, don't churn the label.
- **Description:** compare on normalized text (collapse runs of whitespace; treat `•`/`–` bullet markers and single vs. double blank lines as equal). Rewrite only on a real content change.
- **Skills:** an **unmapped** YAML keyword (no canonical in `references/linkedin-skill-map.md`) is **excluded**, not perpetually re-attempted. Compare by canonical name.

**Headline / About** — normalized string compare (trim, collapse whitespace, treat `'`≡`'` and `-`≡`—` as rendered) of current vs. transformed-desired; write only if different.

**Skills** — desired set = YAML keywords mapped to canonical names (see skill map). Current set = every skill on the profile (scroll to load all). ADD desired-not-present; DELETE present-not-desired; then set Top-skills order from `pinned`.

---

## UI recipes (verify each session — LinkedIn's DOM changes)

Navigate by accessibility role/name and stable text, never CSS classes. Prefer `javascript_tool` for reading and for clicking buttons/options (`el.click()` fires React handlers reliably); use coordinate clicks only with a fresh screenshot cached, and only when a JS click won't do.

### Reading the full Experience list
Go to `/in/me/details/experience/`. **Scroll to the very bottom with real scroll events** (the list virtualizes — programmatic `window.scrollTo` alone often won't load older entries; the pane must be visible for rendering). Collect every role's edit-form id via `a[href*="/edit/forms/"]` plus its title/company/dates/description. Confirm you reached the footer ("LinkedIn Corporation ©") so you know the list is fully loaded.

### Edit an existing position
Open `https://www.linkedin.com/in/me/details/experience/edit/forms/{id}/`. Fields: Role title, Organization, Location, Employment type (`<select>`), "I currently work here" (checkbox), Start/End month+year (`<select>`s), Description (a **contenteditable div**, not a textarea).
- **Dates / title / type**: set via the form-input mechanism, then **verify the underlying `<select>.value` / `input.value` via JS** — the styled UI renders the change a beat late, so trust the DOM value, not a screenshot.
- **Description** (contenteditable): to preserve paragraph + bullet line breaks, focus the field, select-all, delete, then **type** the summary, press Enter twice, type each `• ` bullet on its own line (Enter between). Setting `.value`/innerHTML collapses newlines — type real keystrokes. Verify via `document.querySelector('[contenteditable="true"]').innerText`.
- Save (bottom-right). Confirm the modal closed via JS (`!document.querySelector('[role="dialog"]')`).

### Add a position
Experience section → **+** → "Add role". **"I currently work here" defaults CHECKED — uncheck it** for any past role (that reveals End month/year). Company field is an autocomplete: pick the matching company from the dropdown to link its page/logo and to group sub-roles; for **defunct companies with no page** (pre-~1990), free-text is fine (no logo — expected). Fill type, dates, description, Save.

### Headline
`/in/me/edit/intro/` → **Headline** field. Replace with the trimmed `basics.headline` (≤220). **Set this AFTER any Experience adds** (adding a position overwrites the headline). Save; verify via the top-card text.

### About
Profile → About → pencil. Replace the contenteditable with `basics.summary` paragraphs (type with blank lines between). ≤2 600 chars. Save; verify via `main` innerText.

### Skills — the fiddliest surface (read carefully)
LinkedIn skills come from a **fixed canonical vocabulary** via a typeahead — most YAML names won't exist verbatim, so map each to its closest canonical (maintain the mapping for stability — see `references/linkedin-skill-map.md`).

**Read current skills:** `/in/me/details/skills/`, pane **visible** (the list won't render while the pane is hidden), scroll to load all; collect `a[aria-label^="Edit "][aria-label$=" skill"]` labels.

**Add a skill (corruption-proof loop):**
1. Click **Add a skill** (or "Add more skills"); if a "Discard changes" dialog appears, click **No thanks**.
2. **Clear the field with the React-safe setter before typing** — the modal *retains the previous skill's text*, and typing onto it creates a merged/corrupt skill (observed: a real "ScalabilityContinuous Integration" garbage entry). Clear via:
   `const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(input,''); input.dispatchEvent(new Event('input',{bubbles:true}));`
3. Focus the field (a real click is more reliable than `.focus()`), **type the name once**, wait for the dropdown.
4. **Verify `input.value` equals exactly what you typed** (abort if not — do not proceed on a polluted field). Pick the option whose text exactly matches your target canonical (else the top suggestion). **Guard:** reject any option text that looks merged (a lowercase→uppercase transition outside parentheses). Click it, click **Save**, dismiss the "added" screen.
5. Re-read and confirm the new skill's name is clean.
**Delete a skill:** Edit `{skill}` → **Delete skill** → confirm **Delete**.
**Cap:** LinkedIn limits the list (historically 50; may be higher). If an add is blocked, stop adding and report which didn't fit.
**Top skills (pinning):** ⋯ (Skills section) → **Reorder** → drag the `pinned` skills to the top in `pinned` order. Drag-and-drop across a long virtualized list is unreliable to automate; attempt it, and if it won't cooperate, **surface it for the user** (a 20-second manual drag) rather than thrashing.

---

## Idempotency & verification

A correct run leaves the profile such that an immediate **dry-run reports an empty diff**. To keep runs stable:
- Map every field deterministically (same YAML → same LinkedIn value every time), including the headline trim and the skill-name mapping (persist the skill map).
- Compare *transformed* desired values against current (don't compare raw YAML to LinkedIn).
- After an `apply` run, immediately run a **dry-run** and confirm the diff is empty (allowing for documented, deliberately-excluded fields). Report the result as the idempotency check.

Known deliberate exclusions that must NOT show up as diffs (either sync them or exclude them consistently): per-experience skill tags; Education/etc. (out of scope); the exact Top-skills drag order if the user maintains it.

---

## Known gotchas (hard-won)

- **Duplicates from partial reads** — always scroll Experience/Skills to the footer before diffing.
- **Headline overwrite** — set headline after Experience.
- **Stale screenshots** — verify writes via the DOM.
- **Skills field retains prior text** — React-clear before each type.
- **Pane must be visible** for screenshots and for the Skills list to render; JS works regardless.
- **Contenteditable collapses set values** — type keystrokes for multi-line descriptions/About.

## Final report

Emit: per-section counts (added / updated / deleted / unchanged), the audit log for the run, any skill-map approximations used, anything deferred to the user (e.g. Top-skills drag), and the **idempotency-check result** (dry-run diff after apply — ideally empty).

## When to STOP and ask

- Login / 2FA / "verify it's you" interstitials.
- A source value missing where the YAML is silent (never guess).
- An expected control absent after two attempts, or any unexpected modal.
- A destructive delete count that looks wrong (e.g. the read found far fewer LinkedIn roles than expected — likely an incomplete load, not real "extras").
