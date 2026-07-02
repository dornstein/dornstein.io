---
name: linkedin-sync
description: Interactively sync a LinkedIn profile's Experience section from a structured source of truth (REFERENCE.md or resume.json) using a browser-automation MCP. Drives an attached logged-in browser to diff, propose edits, and apply them one at a time with user confirmation. Use when the user asks to "sync LinkedIn", "update LinkedIn from my site/reference", "check LinkedIn drift", or similar. v1 scope: Experience section only.
---

# LinkedIn Sync (Experience)

Human-in-the-loop workflow to bring a LinkedIn profile's **Experience** section into agreement with an authored source of truth. You (the agent) drive an already-logged-in browser via an MCP server; the user watches, confirms each write, and can abort at any time.

## Non-goals for v1

- **Do NOT** touch Education, Skills, About, Projects, Publications, Patents, Recommendations, or Featured. Only Experience.
- **Do NOT** delete or reorder existing LinkedIn positions the user hasn't explicitly approved for change.
- **Do NOT** post anything to the feed.
- **Do NOT** attempt to run unattended, on a schedule, or without the user actively watching the browser.

## Absolute rules

1. **Every write requires explicit user confirmation immediately before it happens.** No batching writes behind a single "approve all". A batched *plan* is fine; each individual click that mutates LinkedIn is not.
2. **Never invent facts.** Every value written to LinkedIn must come verbatim (or be a clearly-labeled summarization) from the source of truth. If the source is silent, ask — never guess dates, titles, or descriptions.
3. **Log every mutation** to the session DB `linkedin_sync_log` table (schema below) before clicking Save. This is the audit trail and undo aid.
4. **Respect LinkedIn.** No bulk scraping, no parallel sessions, no headless mass edits. Human-paced, one profile, one edit at a time.
5. If any step fails (element not found, unexpected modal, 2FA prompt, session expired) — **pause and ask the user**. Do not retry blindly or navigate away.

## Preflight

Before doing anything else, run these checks in order. Stop with a clear message if any fail.

### 1. Browser MCP available

Look for browser-automation tools in the current toolset. Acceptable providers:

| Preferred | Server | Typical tool names |
|-----------|--------|-------------------|
| ✅ Best   | `@playwright/mcp` | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_press_key`, `browser_wait_for` |
| OK        | `chrome-devtools-mcp` | `navigate_page`, `take_snapshot`, `click`, `fill`, `evaluate_script` |

If none are available, stop and tell the user how to add Playwright MCP to the Copilot app's MCP settings:

```json
{
  "playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp@latest", "--browser=chrome"]
  }
}
```

Recommend Playwright MCP because its snapshot-based accessibility tree is more robust against LinkedIn's frequent DOM churn than CSS selectors.

### 2. Source of truth located

Search in this order:
1. `resume.json` in the current repo root (JSON Resume schema — preferred if present).
2. `REFERENCE.md` in the current repo root (structured markdown — parse the `## Career Timeline` section).
3. Ask the user for a path.

Parse into a canonical in-memory shape (see **Canonical record** below). Show the user a one-line-per-role summary and ask them to confirm it looks right before proceeding.

### 3. Session DB tables

Create the audit + progress tables if they don't exist:

```sql
CREATE TABLE IF NOT EXISTS linkedin_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL,           -- 'add_position' | 'update_position' | 'skip' | 'note'
  company TEXT,
  title TEXT,
  start_date TEXT,
  end_date TEXT,
  field TEXT,                     -- for updates: which field changed
  old_value TEXT,
  new_value TEXT,
  status TEXT,                    -- 'planned' | 'confirmed' | 'applied' | 'failed' | 'aborted'
  notes TEXT
);

CREATE TABLE IF NOT EXISTS linkedin_sync_state (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### 4. Attach to logged-in browser

Navigate to `https://www.linkedin.com/in/me/`. Take a snapshot. If the page shows a login form, stop and tell the user to log in manually in the browser window the MCP opened, then re-invoke the skill. Never handle credentials.

## Canonical record

Every role — from either source or from LinkedIn — normalizes to this shape:

```
{
  company: string,                 // "Microsoft", "INTERSOLV / Sage Software"
  employmentGroupKey: string,      // slug for grouping sub-positions (e.g. "microsoft")
  title: string,                   // "Principal Security Architect"
  location: string | null,         // "Redmond, WA" or null
  startDate: "YYYY-MM",            // month precision; use "-01" for month-only sources
  endDate: "YYYY-MM" | "present",
  description: string,             // ≤ 2000 chars for LinkedIn; multi-paragraph OK
  highlights: string[]             // optional bullet-ready list
}
```

Notes for REFERENCE.md parsing:
- Each `###` heading under `## Career Timeline` = one role. Nested `####` = sub-role at the same employer.
- Date ranges like `1987–1993` parse as `startDate: 1987-01, endDate: 1993-12`. Ask the user for month precision only if they want to tighten it.
- Group by employer for LinkedIn: INTERSOLV's four sub-roles must go under a single "INTERSOLV / Sage Software" company entry; same for Microsoft's multiple eras.

## Diff algorithm

After reading LinkedIn's current Experience via `browser_snapshot`, produce four buckets:

- **missing** — role in source, not on LinkedIn (matched by `(company, title, startDate)` tuple, case-insensitive, ±1 month tolerance on dates).
- **outdated** — role matched but one or more of `title / dates / location / description` differs. Report field-by-field.
- **extra** — role on LinkedIn, not in source. **Never propose deletion.** Just list them and ask the user whether to (a) leave alone, (b) add to REFERENCE.md, or (c) manually remove later.
- **ordering** — LinkedIn auto-orders by date; ignore unless obviously wrong.

Present the diff as a table, then ask the user which buckets and which specific items to work through this session. Default to just **missing** if they say "go".

## Interactive edit loop

For each approved item, follow this loop. Do not skip steps.

```
1. RE-SNAPSHOT the profile edit surface (state may have drifted between edits).
2. SHOW the user the exact record to be written, formatted as it will appear:
     "About to ADD a position:
        Microsoft — Principal Security Architect
        Redmond, WA · Full-time
        2024-01 – Present
        Description (1 847 chars):
          <first 240 chars>…"
3. WAIT for explicit confirmation ("yes" / "y" / "go"). Anything else = skip.
4. LOG the planned mutation with status='planned'.
5. NAVIGATE to the right edit modal (see UI recipes below).
6. FILL fields one at a time, snapshotting between fills to confirm each field committed.
7. CLICK Save. Wait for the modal to close.
8. RE-SNAPSHOT and verify the new/updated entry is present.
9. UPDATE the log row to status='applied'. If verification fails, mark 'failed' and STOP.
10. Ask "next?" before proceeding.
```

Persist current position in `linkedin_sync_state (key='cursor')` so the loop is resumable if interrupted.

## LinkedIn UI recipes (Experience only)

**These change frequently.** Always navigate by accessibility role/name via snapshots, never by CSS class. If the UI has moved, stop and tell the user — do not guess.

See `references/linkedin-ui-notes.md` for current known-good navigation paths, common pitfalls, and field constraints. Consult it before the first edit of a session.

Rough shape (verify each session):

- **Add position:** profile → "Add profile section" → "Add position" → fill Title, Employment type, Company (autocomplete — pick the exact company from the dropdown, never free-text), Location, Start date, End date (or check "I am currently working in this role"), Description → Save.
- **Edit position:** profile → Experience section → pencil icon next to the role → edit fields → Save.
- **Group sub-positions:** when adding a second title at the same company, LinkedIn should auto-group them under one company card. If it doesn't, that's a v2 problem — flag and skip.

## Description formatting

LinkedIn's description field:
- Hard cap: 2 000 characters (verify current limit in `references/linkedin-ui-notes.md`).
- Plain text with newlines. No markdown. Bullets render as literal characters — use `•` or `–` if desired.
- Smart quotes and em-dashes render fine; normalize any weird whitespace.
- If a source description exceeds the cap, propose a truncation to the user (never silently truncate). Show them the diff before applying.

## Special cases you WILL hit with David's data

1. **Nested employers.** INTERSOLV has 4 sub-roles; Microsoft has 5+ across ~25 years. Each sub-role is its own LinkedIn Position under the same Company card. Do NOT create separate top-level company entries.
2. **Concurrent roles.** Open eBook Forum (2000–2003) overlaps NuvoMedia and Microsoft. LinkedIn supports this; just add each with its own date range.
3. **Very old roles (pre-1990).** LinkedIn accepts them but the company autocomplete often can't find defunct companies (Sinclair Research, Heuristics, Multimate). Fall back to free-text company name and warn the user that no logo/verification will attach.
4. **Founder / CEO titles at own companies** (Heuristics, Pragmatica). Employment type = "Self-employed" or "Founder". Confirm with user which they prefer per role.
5. **Patents mentioned in descriptions** — leave them as prose in the description. Patents section is out of scope for v1.

## Final report

After the loop ends (user says "done" or the queue empties), output:

- Counts: proposed / applied / skipped / failed.
- The full `linkedin_sync_log` table for this session.
- A short list of things the user should do manually (e.g., "extra LinkedIn entries you may want to remove", "Patents section not synced — deferred to v2").
- Suggest re-running the diff after LinkedIn indexes the changes (~1 min) to confirm parity.

## When to STOP and hand back to the user

- Any unexpected modal, banner, or interstitial (2FA, "verify it's you", quiz, phone-number capture).
- A snapshot that doesn't contain the expected control after two attempts.
- Any behavior that would require guessing a factual value not present in the source.
- User types anything other than an explicit confirmation.
