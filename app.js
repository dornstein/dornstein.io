// ============================================================================
// app.js — renders dornstein.io from resume.yaml (the single source of truth).
//
// Flow: fetch resume.yaml -> jsyaml.load -> render each section into its
// placeholder -> initGlossary(data.glossary) -> initBehaviors().
// Behaviors (filter, carousels, nav) live in script.js and must run AFTER the
// content exists, so they are exposed as window.initBehaviors and called here.
// ============================================================================

(function () {
  'use strict';

  // ---- small helpers -------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Inner SVG markup keyed by icon name (the SVG wrapper is added by svg()).
  var ICONS = {
    // value props
    network: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="12" cy="8.5" r="2.5"/><circle cx="12" cy="15.5" r="2.5"/><line x1="7" y1="12" x2="9.8" y2="9.8"/><line x1="7" y1="12" x2="9.8" y2="14.2"/><line x1="14.2" y1="9" x2="17" y2="7"/><line x1="14.2" y1="15" x2="17" y2="17"/><line x1="12" y1="11" x2="12" y2="13"/>',
    'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    terminal: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8l3 3-3 3M13 14h4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    rocket: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>',
    // interests
    music: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
    clock: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path><path d="M12 6v6l4 2"></path>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
    globe: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>',
    // contact modes
    workflow: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    shield: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
  };
  function svg(key, round) {
    var inner = ICONS[key] || '';
    var extra = round ? ' stroke-linecap="round" stroke-linejoin="round"' : '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"' + extra + '>' + inner + '</svg>';
  }

  // ---- term auto-linking ---------------------------------------------------
  // Prose is plain text; each block lists the glossary slugs it references.
  // We wrap the first occurrence of a term's trigger phrase in a .term span.
  // Aliases map a slug to the phrase(s) that actually appear in prose.
  var TERM_ALIASES = {
    indra: ['Indra'], sigma: ['SIGMA'], liquid: ['Liquid'], sdl: ['SDL'],
    codeql: ['CodeQL Central', 'CodeQL'], twc: ['Trustworthy Computing', 'TwC'],
    metro: ['Metro'], drm: ['digital rights management', 'Rights Management', 'DRM'],
    flexwiki: ['FlexWiki'], csharp: ['C#'], dotnet: ['.NET'],
    oebf: ['Open eBook Forum'], 'oeb-pub-structure': ['Open eBook Publication Structure'],
    'rocket-ebook': ['Rocket eBook'], nuvomedia: ['NuvoMedia'], pragmatica: ['Pragmatica'],
    'object-oriented': ['object-oriented'], sgml: ['SGML'], xml: ['XML'],
    'angel-investment': ['angel investment'], ebooknet: ['eBookNet.com'],
    smalltalk: ['Smalltalk'], 'design-patterns': ['design pattern'],
    'derivatives-trading': ['derivatives trading'], visualworks: ['VisualWorks'],
    gemstone: ['GemStone'], excelerator: ['Excelerator II'], os2: ['OS/2'],
    case: ['CASE'], lan: ['LAN'], 'entity-relationship': ['entity-relationship', 'ER data model', 'ER'],
    cdif: ['CDIF'], ansi: ['ANSI'], eia: ['EIA'], multimate: ['Multimate'],
    'rom-cartridges': ['ROM cartridges'], 'timex-sinclair': ['Timex/Sinclair 2000'],
    'bank-switching': ['memory bank-switching', 'bank-switching', 'bank switching'],
    sinclair: ['Sinclair'], zx80: ['ZX-80', 'ZX80'],
    'consent-decree': ['DOJ antitrust consent decree', 'DOJ consent decree', 'consent decree'],
    apiscan: ['APIscan'], 'checkpoint-express': ['CheckPoint Express'],
    'molecular-gastronomy': ['molecular gastronomy'],
    'stat-years': [], 'stat-patents': []
  };
  function reEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // Link terms in already-escaped text. `seen` (optional Set) dedupes across
  // a multi-paragraph block so each term links at most once.
  function linkTerms(escaped, terms, seen) {
    if (!terms || !terms.length) return escaped;
    seen = seen || new Set();
    terms.forEach(function (slug) {
      if (seen.has(slug)) return;
      var aliases = TERM_ALIASES[slug] || [slug];
      for (var i = 0; i < aliases.length; i++) {
        var phrase = esc(aliases[i]);
        var re = new RegExp('(^|[^\\w>])(' + reEscape(phrase) + ')(?![\\w])');
        if (re.test(escaped)) {
          escaped = escaped.replace(re, function (m, pre, hit) {
            return pre + '<span class="term" data-term="' + slug + '">' + hit + '</span>';
          });
          seen.add(slug);
          break;
        }
      }
    });
    return escaped;
  }
  // plain text -> escaped + term-linked HTML
  function prose(text, terms, seen) { return linkTerms(esc(text), terms, seen); }

  function setHTML(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
  function present(id) { return !!document.getElementById(id); }

  // ---- skill badges --------------------------------------------------------
  function badgeGroups(skillSlugs, cats) {
    var set = {}; skillSlugs.forEach(function (s) { set[s] = true; });
    var out = '';
    cats.forEach(function (cat) {
      var chips = cat.keywords.filter(function (k) { return set[k.slug]; });
      if (!chips.length) return;
      out += '<div class="skill-badge-group"><span class="skill-badge-label" data-cat-slug="' +
        cat.slug + '">' + esc(cat.name) + '</span><div class="skill-badge-group-chips">' +
        chips.map(function (k) { return '<span class="skill-badge">' + esc(k.name) + '</span>'; }).join('') +
        '</div></div>';
    });
    return out;
  }
  function catSlugsFor(skillSlugs, cats) {
    var set = {}; skillSlugs.forEach(function (s) { set[s] = true; });
    return cats.filter(function (cat) {
      return cat.keywords.some(function (k) { return set[k.slug]; });
    }).map(function (c) { return c.slug; });
  }

  // ---- sections ------------------------------------------------------------
  function renderHero(d) { setHTML('heroTagline', esc(d.basics.label)); }

  function renderAbout(d) {
    var seen = new Set();
    var paras = d.basics.summary.map(function (p, i) {
      return '<p' + (i === 0 ? ' class="about-lead"' : '') + '>' +
        prose(p, d.basics.summaryTerms, seen) + '</p>';
    }).join('\n');
    setHTML('aboutText', paras);
    var stats = d.basics.stats.map(function (s) {
      return '<div class="stat" data-term="' + esc(s.slug) + '">' +
        '<span class="stat-number">' + esc(s.value) + '</span>' +
        '<span class="stat-label">' + esc(s.label) + '</span></div>';
    }).join('\n');
    setHTML('aboutStats', stats);
  }

  function renderValue(d) {
    var cards = d.valueProps.map(function (v) {
      return '<div class="value-card"><div class="value-icon">' + svg(v.icon, true) + '</div>' +
        '<h3>' + esc(v.title) + '</h3><p>' + prose(v.body, v.terms) + '</p></div>';
    }).join('\n');
    setHTML('valueGrid', cards);
    setHTML('valueCtaText', prose(d.valuePropsCta, []));
  }

  function renderTimeline(d) {
    var cats = d.skills;
    setHTML('careerSubtitle', prose(d.timeline.subtitle, d.timeline.subtitleTerms));

    // group site-visible work by era, then by card key
    var byEra = {};
    d.work.forEach(function (w) {
      if (w.visibility.indexOf('site') < 0 || !w.display) return;
      var era = w.display.era; if (!era) return;
      (byEra[era] = byEra[era] || []).push(w);
    });

    var eras = d.timeline.eras.slice().sort(function (a, b) { return a.order - b.order; });
    var html = eras.map(function (era) {
      var roles = byEra[era.slug] || [];
      // collapse roles sharing a display.card into one card group
      var groups = [], byCard = {};
      roles.forEach(function (w) {
        var key = w.display.card || w.id;
        if (!byCard[key]) { byCard[key] = { key: key, roles: [] }; groups.push(byCard[key]); }
        byCard[key].roles.push(w);
      });
      // order cards within era by startDate descending
      groups.forEach(function (g) {
        g.roles.sort(function (a, b) { return (b.startDate || '').localeCompare(a.startDate || ''); });
        g.lead = g.roles.filter(function (r) { return r.display && r.display.cardLead; })[0] || g.roles[0];
      });
      groups.sort(function (a, b) {
        return (b.lead.startDate || '').localeCompare(a.lead.startDate || '');
      });

      var cardsHtml = groups.map(function (g) { return renderCard(g, cats); }).join('\n');
      var headingHtml = linkTerms(esc(era.heading), era.terms);
      var summaryHtml = era.summary ? '<p class="timeline-era-summary">' + prose(era.summary, era.terms) + '</p>' : '';
      return '<div class="timeline-era" data-tags="' + esc((era.tags || []).join(' ')) + '">' +
        '<div class="timeline-era-marker"></div>' +
        '<div class="timeline-era-header"><h3>' + headingHtml + '</h3>' +
        '<span class="timeline-era-dates">' + esc(era.dateLabel) + '</span></div>' +
        summaryHtml +
        '<div class="timeline-cards">' + cardsHtml + '</div></div>';
    }).join('\n');
    setHTML('careerTimeline', html);
  }

  function renderCard(group, cats) {
    var lead = group.lead, disp = lead.display;
    // union skills/terms across all roles in the (possibly merged) card
    var skills = [], terms = [];
    group.roles.forEach(function (r) {
      (r.skills || []).forEach(function (s) { if (skills.indexOf(s) < 0) skills.push(s); });
      (r.terms || []).forEach(function (t) { if (terms.indexOf(t) < 0) terms.push(t); });
    });
    var seen = new Set();
    var title = disp.cardTitle || lead.position;
    var body = disp.summary != null ? disp.summary : lead.summary;
    var highs = disp.highlights != null ? disp.highlights : lead.highlights;

    var h = '<div class="timeline-card" data-skill-slugs="' + esc(skills.join(' ')) +
      '" data-skill-cat-slugs="' + esc(catSlugsFor(skills, cats).join(' ')) + '">';
    h += '<div class="timeline-card-header"><h4>' + linkTerms(esc(title), terms, seen) + '</h4>';
    if (disp.dateLabel) h += '<span class="timeline-card-dates">' + esc(disp.dateLabel) + '</span>';
    h += '</div>';
    if (disp.roleLine) h += '<p class="timeline-card-role">' + linkTerms(esc(disp.roleLine), terms, seen) + '</p>';
    if (disp.image) h += '<img class="timeline-img" src="' + esc(disp.image) + '" alt="' + esc(title) + '" loading="lazy">';
    if (lead.context) h += '<p class="timeline-card-note">' + linkTerms(esc(lead.context), terms, seen) + '</p>';
    if (body) h += '<p>' + linkTerms(esc(body), terms, seen) + '</p>';
    if (highs && highs.length) {
      h += '<p class="timeline-card-outcome">' +
        highs.map(function (x) { return linkTerms(esc(x), terms, seen); }).join(' ') + '</p>';
    }
    h += '<div class="skill-badges" data-skills-generated="1">' + badgeGroups(skills, cats) + '</div>';
    h += '</div>';
    return h;
  }

  function renderSkills(d) {
    setHTML('skillsBody', '<div class="skill-badges" data-skills-generated="1">' +
      d.skills.map(function (cat) {
        return '<div class="skill-badge-group"><span class="skill-badge-label" data-cat-slug="' +
          cat.slug + '">' + esc(cat.name) + '</span><div class="skill-badge-group-chips">' +
          cat.keywords.map(function (k) { return '<span class="skill-badge">' + esc(k.name) + '</span>'; }).join('') +
          '</div></div>';
      }).join('') + '</div>');
  }

  function renderPatentsSummary(d) {
    setHTML('patentsSummary', '<p>' + prose(d.patents.summary, ['bank-switching']) + '</p>' +
      '<p style="margin-top: 12px;"><a href="patents.html" class="btn btn-outline" ' +
      'style="padding: 10px 24px; font-size: 0.88rem;">View All Patents &rarr;</a></p>');
    var seen = new Set();
    setHTML('standardsList', d.standards.map(function (s) {
      return '<li><strong>' + linkTerms(esc(s.name), s.terms, seen) + '</strong> &mdash; ' + esc(s.role) + '</li>';
    }).join(''));
  }

  function renderInterests(d) {
    setHTML('interestsGrid', d.interests.map(function (it) {
      var img = it.image ? '<img class="interest-img" src="' + esc(it.image) + '" alt="' + esc(it.title) + '" loading="lazy">' : '';
      return '<div class="interest-item"><span class="interest-icon">' + svg(it.icon, true) + '</span>' +
        '<h3>' + esc(it.title) + '</h3>' + img + '<p>' + prose(it.body, it.terms) + '</p></div>';
    }).join('\n'));
  }

  function renderTestimonials(d) {
    setHTML('testimonialTrack', d.references.map(function (r) {
      return '<blockquote class="testimonial-slide"><div class="testimonial-quote-mark">&ldquo;</div>' +
        '<p class="testimonial-text">' + esc(r.reference) + '</p>' +
        '<footer class="testimonial-footer"><span class="testimonial-author">' + esc(r.name) + '</span>' +
        '<span class="testimonial-role">' + esc(r.role) + '</span></footer></blockquote>';
    }).join('\n'));
  }

  // Brand marks for profile links (fill-based logos, not the stroke icon set).
  var BRAND_ICONS = {
    github: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
    linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>'
  };
  function brandSvg(key) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + (BRAND_ICONS[key] || '') + '</svg>';
  }

  function renderContact(d) {
    var c = d.contact;
    setHTML('contactModes', c.modes.map(function (m) {
      return '<li>' + svg(m.icon, false) + '<div><strong>' + esc(m.title) + '</strong>' +
        '<span>' + esc(m.body) + '</span></div></li>';
    }).join('\n'));
    var profiles = (d.basics.profiles || []).filter(function (p) { return p.url; }).map(function (p) {
      var key = (p.network || '').toLowerCase();
      return '<a href="' + esc(p.url) + '" class="contact-profile-link" target="_blank" rel="noopener">' +
        (BRAND_ICONS[key] ? brandSvg(key) : '') + '<span>' + esc(p.network) + '</span></a>';
    }).join('');
    setHTML('contactProfiles', profiles);
  }

  // ---- patents.html --------------------------------------------------------
  function renderPatentsPage(d) {
    var p = d.patents;
    setHTML('patentHeroSubtitle', esc(p.heroSubtitle));
    setHTML('patentStory', p.story.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join(''));
    setHTML('patentListSubtitle', esc(p.listSubtitle));
    setHTML('patentList', p.list.map(function (pt) {
      return '<div class="patent-entry"><div class="patent-number-col">' +
        '<a href="' + esc(pt.url) + '" target="_blank" rel="noopener">' + esc(pt.number) + '</a></div>' +
        '<div class="patent-detail-col"><h3>' + esc(pt.title) + '</h3>' +
        '<div class="patent-meta">Filed ' + fmtDate(pt.filed) + ' &middot; Granted ' + fmtDate(pt.granted) + '</div>' +
        '<p>' + esc(pt.description) + '</p></div></div>';
    }).join('\n'));
    var lg = p.legacy;
    setHTML('legacyTitle', esc(lg.title));
    setHTML('legacySubtitle', esc(lg.subtitle));
    var story = '<p>' + esc(lg.intro) + '</p>' + lg.sections.map(function (s) {
      var out = '<h3 class="legacy-heading">' + esc(s.heading) + '</h3>';
      if (s.body) out += '<p>' + esc(s.body) + '</p>';
      if (s.items) out += '<ul class="legacy-list">' + s.items.map(function (i) {
        return '<li>' + esc(i) + '</li>';
      }).join('') + '</ul>';
      return out;
    }).join('');
    setHTML('legacyStory', story);
    setHTML('legacySummary', lg.summary.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join(''));
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return esc(iso);
    return MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ', ' + m[1];
  }

  // ---- boot ----------------------------------------------------------------
  function fail(msg) {
    var main = document.querySelector('main') || document.body;
    var box = document.createElement('div');
    box.style.cssText = 'max-width:640px;margin:120px auto;padding:24px;text-align:center;font-family:sans-serif';
    box.innerHTML = '<p>Sorry — this page could not load its content.</p>' +
      '<p style="opacity:.7;font-size:.9em">' + esc(msg) + '</p>';
    main.appendChild(box);
  }

  // ---- views + router ------------------------------------------------------
  // Every view is a renderer over the same window.RESUME data, mounted into
  // #view-root. The active view is chosen from ?view=; switching is a normal
  // navigation (the switcher links carry ?view=<key>), so each load is a clean
  // mount with no cross-view listener leaks. Add a view here and it appears in
  // the switcher automatically.

  function linearDates(w) {
    var s = (w.startDate || '').slice(0, 4);
    var e = (w.endDate == null || w.endDate === 'present') ? 'Present' : (w.endDate || '').slice(0, 4);
    return s ? (s + ' – ' + e) : '';
  }

  function startYear(w) { return (w.startDate || '').slice(0, 4); }
  function endYear(w) { return (w.endDate == null || w.endDate === 'present') ? 'Present' : (w.endDate || '').slice(0, 4); }
  function spanYears(list) {
    var starts = list.map(startYear).filter(Boolean).sort();
    var ends = list.map(endYear);
    var lo = starts[0] || '';
    var hi = ends.indexOf('Present') >= 0 ? 'Present' : ends.filter(Boolean).sort().slice(-1)[0] || '';
    return lo && hi ? (lo + '–' + hi) : (lo || hi);
  }
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }

  function buildLinear(d) {
    var b = d.basics;
    var loc = b.location ? [b.location.city, b.location.region].filter(Boolean).join(', ') : '';
    var profileLinks = (b.profiles || []).filter(function (p) { return p.url; })
      .map(function (p) { return '<a href="' + esc(p.url) + '">' + esc(p.network) + '</a>'; }).join(' &middot; ');
    var contactParts = [b.email, (b.url || '').replace(/^https?:\/\//, ''), loc].filter(Boolean).map(esc);
    var contact = contactParts.join(' &nbsp;&middot;&nbsp; ') + (profileLinks ? ' &nbsp;&middot;&nbsp; ' + profileLinks : '');

    // Metrics strip — featured stats (basics.stats[].resume === true), in the
    // canonical array order from resume.yaml, which is deliberately outcome-first
    // and tenure-last (the "40+ years" age signal comes last in every view).
    var stripStats = (b.stats || []).filter(function (s) { return s.resume; });
    var strip = stripStats.map(function (s) {
      return '<div class="linear-stat"><span class="linear-stat-val">' + esc(s.value) + '</span>' +
        '<span class="linear-stat-label">' + esc(s.label) + '</span></div>';
    }).join('');
    var metrics = strip ? '<div class="linear-metrics">' + strip + '</div>' : '';

    // Summary — reordered/selected paragraphs (verbatim). resumeSummaryOrder is
    // indices into basics.summary[]; falls back to the full summary.
    var order = b.resumeSummaryOrder;
    var paras = (order && order.length)
      ? order.map(function (i) { return b.summary[i]; }).filter(Boolean)
      : (b.summary || []);
    var summary = paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');

    // Experience — résumé-visible roles, tiered: full = detailed, brief = collapsed
    // into an "Earlier career" block, omit = dropped entirely.
    var resumeRoles = d.work
      .filter(function (w) { return (w.visibility || []).indexOf('resume') >= 0 && w.resume !== 'omit'; })
      .slice().sort(function (a, b) { return (b.startDate || '').localeCompare(a.startDate || ''); });

    var full = resumeRoles.filter(function (w) { return w.resume !== 'brief'; });
    var brief = resumeRoles.filter(function (w) { return w.resume === 'brief'; });

    var exp = full.map(function (w) {
      var highs = (w.highlights || []).length
        ? '<ul>' + w.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '';
      var org = esc(w.organization) + (w.location ? ' &middot; <span class="linear-role-loc">' + esc(w.location) + '</span>' : '');
      return '<div class="linear-role">' +
        '<div class="linear-role-head"><span class="linear-role-title">' + esc(w.position) + '</span>' +
        '<span class="linear-role-dates">' + esc(linearDates(w)) + '</span></div>' +
        '<div class="linear-role-org">' + org + '</div>' +
        (w.context ? '<p class="linear-role-note">' + esc(w.context) + '</p>' : '') +
        (w.summary ? '<p>' + esc(w.summary) + '</p>' : '') + highs + '</div>';
    }).join('');

    // Earlier career — brief roles grouped by employer, one line each (derived
    // from data: organization, year span, and the actual titles held).
    var earlier = '';
    if (brief.length) {
      var byGroup = {}, groupOrder = [];
      brief.forEach(function (w) {
        var g = w.group || w.id;
        if (!byGroup[g]) { byGroup[g] = { org: w.organization, roles: [] }; groupOrder.push(g); }
        byGroup[g].roles.push(w);
      });
      groupOrder.sort(function (a, x) {
        var ma = byGroup[a].roles.map(startYear).sort().slice(-1)[0] || '';
        var mx = byGroup[x].roles.map(startYear).sort().slice(-1)[0] || '';
        return mx.localeCompare(ma);
      });
      var rows = groupOrder.map(function (g) {
        var grp = byGroup[g];
        var positions = uniq(grp.roles.map(function (r) { return r.position; })).join('; ');
        return '<div class="linear-earlier-row"><div class="linear-earlier-head">' +
          '<span class="linear-earlier-org">' + esc(grp.org) + '</span>' +
          '<span class="linear-role-dates">' + esc(spanYears(grp.roles)) + '</span></div>' +
          '<div class="linear-earlier-pos">' + esc(positions) + '</div></div>';
      }).join('');
      earlier = '<h3 class="linear-subhead">Earlier career (' + esc(spanYears(brief)) + ')</h3>' + rows;
    }

    var skills = d.skills.map(function (c) {
      return '<p class="linear-skillrow"><span class="linear-skillcat">' + esc(c.name) + ':</span> ' +
        c.keywords.map(function (k) { return esc(k.name); }).join(' · ') + '</p>';
    }).join('');

    var standards = (d.standards || []).map(function (s) {
      return '<li><strong>' + esc(s.name) + '</strong> — ' + esc(s.role) + '</li>';
    }).join('');

    return '<div class="linear">' +
      '<div class="linear-topbar">' +
        '<a class="linear-home" href="?view=portfolio">← Portfolio</a>' +
        '<div class="view-switcher" data-switcher></div>' +
        '<button type="button" class="btn btn-primary linear-print" data-print>Print / Save PDF</button>' +
      '</div>' +
      '<article class="linear-doc">' +
        '<header class="linear-head">' +
          '<h1>' + esc(b.name) + '</h1>' +
          ((b.headline || b.label) ? '<p class="linear-tagline">' + esc(b.headline || b.label) + '</p>' : '') +
          '<p class="linear-contact">' + contact + '</p>' +
          metrics +
        '</header>' +
        '<section class="linear-section"><h2>Summary</h2>' + summary + '</section>' +
        '<section class="linear-section"><h2>Experience</h2>' + exp + earlier + '</section>' +
        '<section class="linear-section"><h2>Skills</h2>' + skills + '</section>' +
        '<section class="linear-section"><h2>Patents &amp; Standards</h2>' +
          '<p>' + esc((d.patents && d.patents.summary) || '') + '</p>' +
          (standards ? '<ul>' + standards + '</ul>' : '') +
        '</section>' +
      '</article>' +
    '</div>';
  }

  var VIEWS = {
    portfolio: {
      label: 'Portfolio',
      render: function (d, root) {
        var tmpl = document.getElementById('tmpl-portfolio');
        root.appendChild(tmpl.content.cloneNode(true));
        renderHero(d); renderAbout(d); renderValue(d); renderTimeline(d);
        renderSkills(d); renderPatentsSummary(d); renderInterests(d);
        renderTestimonials(d); renderContact(d);
      },
      init: function () { if (window.initBehaviors) window.initBehaviors(); }
    },
    linear: {
      label: 'Résumé',
      render: function (d, root) { root.innerHTML = buildLinear(d); },
      init: function (d, root) {
        var btn = root.querySelector('[data-print]');
        if (btn) btn.addEventListener('click', function () { window.print(); });
      }
    }
  };
  var DEFAULT_VIEW = 'portfolio';

  function currentViewKey() {
    try {
      var p = new URLSearchParams(location.search).get('view');
      if (p && VIEWS[p]) return p;
    } catch (e) { /* ignore */ }
    return DEFAULT_VIEW;
  }

  function fillSwitchers(active) {
    var tabs = Object.keys(VIEWS).map(function (k) {
      return '<a class="view-tab' + (k === active ? ' is-active' : '') + '" href="?view=' + k + '"' +
        (k === active ? ' aria-current="page"' : '') + '>' + esc(VIEWS[k].label) + '</a>';
    }).join('');
    document.querySelectorAll('[data-switcher]').forEach(function (el) { el.innerHTML = tabs; });
  }

  function mountView(d) {
    var root = document.getElementById('view-root');
    var key = currentViewKey();
    root.innerHTML = '';
    document.body.setAttribute('data-view', key);
    VIEWS[key].render(d, root);
    fillSwitchers(key);
    if (VIEWS[key].init) VIEWS[key].init(d, root);
  }

  function boot() {
    if (typeof jsyaml === 'undefined') { fail('YAML parser failed to load.'); return; }
    fetch('resume.yaml', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (txt) {
        var d = jsyaml.load(txt);
        window.RESUME = d;
        if (present('view-root')) mountView(d);
        else if (present('patentList')) renderPatentsPage(d);
        if (window.initGlossary) window.initGlossary(d.glossary);
      })
      .catch(function (e) { fail(String(e && e.message || e)); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
