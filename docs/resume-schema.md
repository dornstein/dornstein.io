# Résumé Data Schema (`resume.yaml`)

> **Status:** proposal for review. This document specifies the schema; the data
> lives in [`/resume.yaml`](../resume.yaml). No renderer consumes it yet — wiring
> the site, the linear résumé, and the LinkedIn-sync skill to this file is the
> next phase.

## Why this exists

Today the résumé "facts" live in three places that drift apart:

- **`index.html`** — the presentation (21 hand-coded timeline cards, skill badges, stats).
- **`REFERENCE.md`** — the prose source of truth (~25 atomic career roles).
- **`glossary.js`** — term definitions, stat explanations, project write-ups.

`resume.yaml` collapses these into **one presentation-independent source of truth**.
Everything that is a *fact* (dates, titles, orgs, skills, numbers, definitions)
lives here exactly once. Each consumer renders its own *view*:

| Consumer | Reads | Produces |
|---|---|---|
| Interactive site (`index.html`) | everything | the current rich, grouped, filterable page |
| **Linear résumé** (new) | `work`, `skills`, `basics`, `patents` | a clean one/two-page document → PDF |
| `linkedin-sync` skill | `work` (+ `basics`, `skills`) | LinkedIn Experience/Skills parity |

### Format decision (locked)

- **Authoring + runtime format is YAML**, parsed **client-side** via `js-yaml` from a
  CDN. The data is small (tens of KB), so there is **no build step** — the site
  fetches `resume.yaml`, parses it in the browser, and renders. This preserves the
  repo's "no build" property.
- The schema is a **superset of [JSON Resume](https://jsonresume.org)**. The
  standard sections (`basics`, `work`, `skills`, `references`, `meta`) keep their
  JSON-Resume field names so the data stays interoperable and the LinkedIn skill
  (which already looks for a résumé source) gets a semantic feed. Everything
  presentation-only is quarantined so a pure-JSON-Resume export is a mechanical
  drop of a few keys (see [Exporting](#exporting-pure-json-resume)).

## Design principles

1. **Atomic facts, derived views.** `work[]` holds one entry per *real role* (at
   `REFERENCE.md` granularity). Site "eras", résumé entries, and LinkedIn positions
   are all **derived** — never authored a second time.
2. **One prose per role.** Each role has a single plain-text `summary` (+
   `highlights`). No parallel "site copy" vs "résumé copy". Written in an
   achievement-oriented voice that reads well on all three surfaces.
3. **No presentation markup in prose.** `summary` is plain text. Inline glossary
   links are expressed as a separate `terms:` list of slugs; the site auto-links
   them, the résumé/LinkedIn render plain text. (Glossary *definitions* are the one
   deliberate exception — they stay HTML, see [`glossary`](#glossary).)
4. **Presentation is quarantined.** Site-only fields live under a nested `display:`
   object on each role, and in the top-level `timeline:` block. Drop those and you
   have clean JSON Resume.
5. **Visibility, not duplication, controls surfaces.** A role carries a
   `visibility: [site, resume, linkedin]` list. The full career (including roles the
   site deliberately omits) stays in one place; each surface filters.

## File layout

```
meta            provenance + schema version
basics          identity, contact, hero tagline, About prose, stats
work[]          atomic career roles — THE core. drives timeline, résumé, LinkedIn
timeline        site-only: era headings, ordering, grouping of work[] into cards
skills[]        taxonomy: categories → skills; the top-3 pinned
references[]    testimonials / hero quotes
patents         patent list + narrative + OPC legacy (patents.html)
standards[]     standards led / co-authored
valueProps[]    "What I Bring" cards
interests[]     "Beyond Work"
glossary[]      term definitions (HTML bodies) — the flyout content
organizations[] reference table (what each org is) — optional tooltip data
people[]        named people referenced in prose
```

---

## `meta`

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | string | this schema's version (e.g. `"1.0"`) |
| `lastModified` | string | ISO date, hand-maintained |
| `canonical` | string | site URL |
| `sources` | string[] | provenance note (e.g. REFERENCE.md, glossary.js) |

## `basics`

JSON-Resume `basics`, extended.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `label` | string | hero tagline |
| `image` | string | portrait path |
| `email` | string | |
| `url` | string | |
| `summary` | string[] | About-section paragraphs (plain text) |
| `summaryTerms` | string[] | glossary slugs referenced by `summary`, for auto-linking |
| `location` | object | `{ city, region, countryCode }` |
| `profiles` | object[] | JSON-Resume `{ network, url }`; empty until a public LinkedIn URL is added |
| `stats` | object[] | hero number tiles — see below |

**`basics.stats[]`**

| Field | Type | Notes |
|---|---|---|
| `slug` | string | matches a `glossary` entry for the long explanation |
| `value` | string | e.g. `"40+"`, `"$200M"` |
| `label` | string | e.g. `"Professional Years"` |

## `work[]`

The heart of the schema. **One entry per real role.** Ordered newest-first.

### Semantic fields (JSON-Resume-compatible; feed résumé + LinkedIn)

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable slug; referenced by tooling/logs |
| `organization` | string | employer (JSON-Resume calls this `name`; alias kept in exporter) |
| `group` | string | employer-grouping key; multiple roles at one employer share it (LinkedIn company card, résumé grouping) |
| `position` | string | canonical title (LinkedIn/résumé) |
| `location` | string \| null | |
| `startDate` | string | `YYYY-MM` (month precision; the LinkedIn skill's canonical form) |
| `endDate` | string \| null | `YYYY-MM`, or `"present"`, or `null` |
| `url` | string \| null | |
| `summary` | string | plain-text description; the one prose field |
| `highlights` | string[] | outcome/achievement bullets (plain text) |
| `skills` | string[] | skill **slugs** into `skills[]` taxonomy → renders badges + drives the timeline filter |
| `terms` | string[] | glossary **slugs** referenced by this role's prose (site auto-links) |
| `employmentType` | string | `full-time` \| `self-employed` \| `founder` \| … (LinkedIn field) |
| `concurrent` | bool | optional; true for overlapping roles (e.g. OEBF) |
| `visibility` | string[] | any of `site`, `resume`, `linkedin` |
| `linkedinPositions` | object[] | optional. Finer split when LinkedIn wants more granularity than the site card shows (see [merges](#the-one-real-tension-merges)). Each: `{ position, startDate, endDate, note? }` |

### `work[].display` (site-only presentation; drop for JSON Resume)

| Field | Type | Notes |
|---|---|---|
| `era` | string | which `timeline.eras[].slug` this card groups under |
| `cardTitle` | string \| null | site card `<h4>` — often a *project* name (e.g. "Rocket eBook & Platform"), distinct from `position`. Null → use `position` |
| `roleLine` | string \| null | the site's exact role line (may fold in org sub-unit) |
| `dateLabel` | string | human display string (e.g. `"2015 – 2025 (10 yrs)"`). **Authored, not computed** — the "22 yrs" figures are editorial and shouldn't drift yearly |
| `image` | string \| null | `media/…` illustration for the card |

> **Machine dates vs. display dates.** `startDate`/`endDate` are the true,
> sortable, LinkedIn-precision dates. `display.dateLabel` is the editorial string
> the site shows. They can legitimately differ (the site rounds; the record
> doesn't).

## `timeline`

Site-only. Groups `work[]` into the curated era view. **Cards are derived** — a
card is a `work` entry whose `display.era` matches; order within an era is by
`startDate` descending.

**`timeline.eras[]`**

| Field | Type | Notes |
|---|---|---|
| `slug` | string | referenced by `work[].display.era` |
| `heading` | string | e.g. `"Microsoft · Security & Compliance"` |
| `dateLabel` | string | era span string |
| `summary` | string \| null | era lead-in (plain text); null when the site shows none |
| `terms` | string[] | glossary slugs in the era heading/summary |
| `order` | number | explicit display order (the site groups Microsoft eras first, not strictly by date) |
| `tags` | string[] | the timeline filter tags (`data-tags` today) |

## `skills[]`

JSON-Resume `skills` shape (category = a skill "area"), extended with slugs.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | category slug (matches today's `data-cat-slug`) |
| `name` | string | category name |
| `keywords` | object[] | the skills: `{ slug, name, pinned? }` |

- `pinned: <n>` marks the Top-3 featured skills (ordinal). Everything a `work`
  entry references by slug must exist here.
- Category **array order is display order** (AI-Native first, etc.).

## `references[]`

JSON-Resume `references` — the testimonials (hero rotator source).

| Field | Type | Notes |
|---|---|---|
| `reference` | string | quote text |
| `name` | string | attribution (initials, as today) |
| `role` | string | attributed role/title |

## `patents`

Feeds `patents.html`.

| Field | Type | Notes |
|---|---|---|
| `summary` | string | headline count/scope line |
| `story` | string[] | "The Story" paragraphs |
| `list` | object[] | each: `{ number, title, url, filed, granted, description }` (dates ISO) |
| `legacy` | object | `{ intro, sections[], summary[] }` — the OPC legacy write-up; each section `{ heading, body?, items[]? }` |

## `standards[]`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `role` | string | e.g. "Chairman of ANSI/EIA committee" |
| `terms` | string[] | glossary slugs |

## `valueProps[]`

The "What I Bring" cards.

| Field | Type | Notes |
|---|---|---|
| `icon` | string | icon key (site maps to an inline SVG; the SVGs stay in the template) |
| `title` | string | |
| `body` | string | plain text |
| `terms` | string[] | glossary slugs referenced |

There is also `basics`-adjacent CTA copy; kept as `valuePropsCta` (string).

## `interests[]`

"Beyond Work".

| Field | Type | Notes |
|---|---|---|
| `icon` | string | icon key |
| `title` | string | |
| `body` | string | plain text |
| `image` | string \| null | |
| `terms` | string[] | glossary slugs |

## `glossary`

The flyout definitions. **Bodies stay HTML** (rich multi-paragraph, `<strong>`,
`<code>`, `<em>`) — this is the one deliberate exception to the plain-text rule,
because the definitions are genuinely rich content and the panel injects them as
HTML today.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | the `data-term` key |
| `title` | string | |
| `category` | string | `stat` \| `project` \| `org` \| `person` \| `tech` \| `concept` — lets consumers filter (e.g. résumé might pull `project` blurbs) |
| `html` | string | the definition body (HTML) |
| `image` | string \| null | |
| `imageAlt` | string \| null | |
| `links` | object[] | `{ label, url }` "Learn more" links |

Every slug appearing in any `terms:`/`summaryTerms:`/`stats[].slug` list must
resolve to a `glossary` entry. (A validator should enforce this.)

## `organizations[]` and `people[]`

Reference tables carried over from `REFERENCE.md`, useful for tooltips and for the
LinkedIn skill's company matching. Optional to render.

- `organizations[]`: `{ slug?, name, what }`
- `people[]`: `{ name, context }`

---

## The one real tension: merges

The site is a **curated view** and occasionally coarser than LinkedIn wants. The
only genuine case today: the **Liquid** era. The site shows it as *one* card
(2015–2025); LinkedIn (and `REFERENCE.md`) split it into two Senior-Director
positions as the surrounding org was renamed (Customer Security & Trust →
Digital Security & Resilience).

This is handled **without duplicating the role**: the single `work` entry carries
the site-faithful dates/prose, and an optional `linkedinPositions[]` list gives the
LinkedIn-sync skill the finer split. The site ignores it; LinkedIn uses it.

Roles the site omits entirely (e.g. *Applied Intelligence*, *Applied Systems
Technologies* — thin LinkedIn-only entries) are present with
`visibility: [resume, linkedin]` (or `[linkedin]`) and no `display.era`.

## Term auto-linking

Prose is plain text; `terms:` lists the glossary slugs it mentions. The site
renderer wraps the **first occurrence** of each referenced term's trigger text in a
`.term` span. This is a deliberate simplification of today's hand-placed spans —
good enough for v1, and it means résumé/LinkedIn get clean text for free. Where the
first-occurrence heuristic mislinks, a future `termText` override per slug can pin
the exact phrase.

## Exporting pure JSON Resume

Drop these and the remainder validates as JSON Resume:

- top-level: `timeline`, `valueProps`, `valuePropsCta`, `interests`, `glossary`,
  `organizations`, `people`, `standards`, `patents` (JSON Resume has no patents
  section; could map to `publications`), and the `*Terms` helper arrays.
- per-`work`/`basics`: the `display` object, `terms`, `visibility`, `skills`
  slugs (JSON Resume expects free-text keywords — trivially derivable from the
  taxonomy).

## Open questions for review

1. **Term auto-linking fidelity** — is first-occurrence wrapping acceptable, or do
   you want to preserve today's exact hand-placed spans (which would mean allowing
   limited inline markup in `summary`)?
2. **Glossary category taxonomy** — the `stat|project|org|person|tech|concept`
   buckets are my proposal; adjust freely.
3. **`valueProps`/`interests` icons** — kept as opaque `icon` keys with the SVGs
   staying in the HTML template. OK, or do you want the SVG paths in the data?
4. **Patents in JSON-Resume export** — leave as a custom `patents` section, or also
   mirror into `publications` for interop?
