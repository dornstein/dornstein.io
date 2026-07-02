# LinkedIn UI notes (Experience section)

> **This file rots quickly.** LinkedIn ships UI changes constantly. Treat everything below as a
> starting hypothesis, not a spec. Always verify against a fresh `browser_snapshot` before clicking.
> When you discover the current UI diverges, either (a) update this file in the same session, or
> (b) stop and tell the user rather than guessing.
>
> **Last verified:** never — populate this on first successful run.

## Ground rules

- Navigate by **accessibility role and name** from the snapshot, e.g. `button "Add position"`, not by CSS selectors or class names. LinkedIn's class names are hashed and rotate.
- Prefer typing into fields via `browser_type` on the labeled input, not by focusing coordinates.
- After every mutation click, `browser_wait_for` a stable state (modal closed, new item visible) before the next action.
- Snapshots can be large. Scope to the modal or section when the MCP supports it.

## Field constraints (verify at first use, then record actual values here)

| Field | Known/assumed limit | Notes |
|-------|---------------------|-------|
| Title | ~100 chars | Free text |
| Company | autocomplete | Prefer picking from dropdown so the company logo/page attaches |
| Employment type | enum | Full-time / Part-time / Self-employed / Freelance / Contract / Internship / Apprenticeship / Seasonal |
| Location | ~100 chars | City, State/Region, Country — autocomplete offered |
| Location type | enum | On-site / Hybrid / Remote (may be optional / hidden for old roles) |
| Start date | month + year | Required |
| End date | month + year or "Present" checkbox | "I am currently working in this role" toggles it |
| Description | ~2000 chars | Plain text; newlines OK; no markdown |
| Profile headline / industry | leave alone in v1 | Even when the "update headline" prompt appears at save time — always answer No |

## Navigation recipes (starting hypotheses)

### Add a new position

1. `browser_navigate` → `https://www.linkedin.com/in/me/`
2. Snapshot. Find `button "Add profile section"`. Click.
3. Snapshot. Find `button "Add position"` (usually inside a "Core" group). Click.
4. Wait for the "Add experience" modal. Snapshot inside modal.
5. Fill in order: Title → Employment type → Company (wait for autocomplete, pick match) → Is this a current position (checkbox) → Start date (month, year) → End date if applicable → Location → Location type → Description.
6. **Answer NO** to any "Notify network" toggle.
7. **Answer NO** to any "Update headline / industry to match" prompt.
8. Click `button "Save"`.
9. Wait for modal to close. Re-snapshot the profile and verify the new entry appears in Experience.

### Edit an existing position

1. Navigate to profile. Scroll to Experience section.
2. Snapshot. Find the position's `button "Edit ..."` (aria-label usually includes the role title).
3. Click. Wait for edit modal. Snapshot.
4. Change only the fields specified by the current diff item. Leave everything else untouched — do not "clean up" other fields.
5. Save. Verify.

### Add a sub-position at an existing employer

1. If the employer already has a position card on Experience, use its Edit button and look for `button "Add position"` inside the modal. Some layouts expose this only inside the company detail view.
2. If the flow instead creates a duplicate company entry: **stop, do not save**, and tell the user this is a v2 gap.

## Common pitfalls

- **The "Notify network" toggle defaults to ON for new positions.** Always turn it OFF before Save unless the user explicitly says otherwise.
- **The "Update headline / industry" prompt appears AFTER Save.** Dismiss it. Do not let it silently change the headline.
- **Company autocomplete lag.** Type the company name, then `browser_wait_for` the dropdown before pressing Enter or clicking. If no match appears within ~2s, free-text is acceptable but note it in the log.
- **Old / defunct companies** (Sinclair Research, Heuristics, Multimate, Pragmatica, NuvoMedia) may not autocomplete. Free-text them.
- **Date pickers vary** between a dropdown and a text input depending on A/B bucket. The snapshot will show which is present — handle both.
- **Session expiry / re-auth interstitial** — LinkedIn periodically injects a "verify it's you" step. Never attempt to solve; hand back to the user.
- **Rate-limit / cool-down banner** ("You've reached the weekly limit for..."). Stop immediately and report.

## Verification after each write

After Save, before moving to the next item:

1. Re-snapshot the Experience section.
2. Confirm the new/updated entry is present with the expected title + date range.
3. If not visible within 5s of the modal closing, reload the profile page and re-snapshot once. If still not visible, mark the log entry `failed` and stop.
