# dornstein.io

Personal portfolio site for David Ornstein, served via GitHub Pages from this
repository on the custom domain **dornstein.io**.

## How it works

- Static site — no build step. Pages: `index.html` (home) and `patents.html`.
- **Content is data-driven.** Both pages are thin HTML shells; their content is
  rendered in the browser from `resume.yaml` by `app.js`, which parses the YAML
  with a vendored copy of `js-yaml` (`vendor/js-yaml.min.js`).
- Styling lives in `styles.css`. Interactive behavior (nav, timeline filter,
  carousels) is in `script.js`, exposed as `window.initBehaviors()`; the glossary
  flyout is in `glossary.js`, exposed as `window.initGlossary()`. `app.js` renders
  the page from data, then calls both.
- Images are under `media/`.
- GitHub Pages publishes the default branch automatically on every push.
- `CNAME` binds the site to the apex domain `dornstein.io`.
- `.nojekyll` disables Jekyll processing so all files are served as-is.

## Source of truth

- **`resume.yaml` — the single, presentation-independent source of truth for all
  résumé content** (career, skills, stats, patents, testimonials, glossary, etc.).
  Edit content here; the site, and a future linear résumé, render from it. Schema
  spec: `docs/resume-schema.md`.
- `REFERENCE.md` — authoritative factual reference / provenance notes. Not
  published or linked from any page; consult it before editing facts.
- `FEEDBACK.md` — collected feedback used to inform site copy. Not published.

## Local preview

The pages `fetch()` `resume.yaml`, so opening `index.html` directly over `file://`
will not work (the fetch is blocked). Serve over HTTP instead:

```sh
python -m http.server 8000
```
