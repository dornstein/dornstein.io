// ============================================
// Glossary — term definitions and flyout panel
// Definitions come from resume.yaml (glossary[]); app.js calls
// window.initGlossary(data.glossary) after the page content is rendered.
// ============================================

(function () {
  'use strict';

  window.initGlossary = function (glossaryList) {
    // Build the slug -> entry map from the data.
    var defined = {};
    (glossaryList || []).forEach(function (g) {
      defined[g.slug] = {
        title: g.title,
        text: g.html,
        image: g.image || null,
        imageAlt: g.imageAlt || null,
        links: g.links || []
      };
    });

    // --- Panel elements ---
    var overlay = document.getElementById('glossary-overlay');
    var panel = document.getElementById('glossary-panel');
    var titleEl = document.getElementById('glossary-title');
    var textEl = document.getElementById('glossary-text');
    var linksEl = document.getElementById('glossary-links');
    var imageEl = document.getElementById('glossary-image');
    if (!panel) return;
    var closeBtn = panel.querySelector('.glossary-close');

    function openGlossary(key) {
      var entry = defined[key];
      if (!entry) return;

      titleEl.textContent = entry.title;

      if (entry.image) {
        imageEl.innerHTML = '<img src="' + entry.image + '" alt="' + (entry.imageAlt || entry.title) + '" loading="lazy">';
        imageEl.style.display = '';
      } else {
        imageEl.innerHTML = '';
        imageEl.style.display = 'none';
      }

      textEl.innerHTML = entry.text;

      if (entry.links && entry.links.length > 0) {
        var html = '<span class="glossary-links-label">Learn more</span>';
        entry.links.forEach(function (link) {
          html += '<a href="' + link.url + '" target="_blank" rel="noopener noreferrer">' +
            link.label +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' +
            '</a>';
        });
        linksEl.innerHTML = html;
        linksEl.style.display = '';
      } else {
        linksEl.innerHTML = '';
        linksEl.style.display = 'none';
      }

      overlay.classList.add('active');
      panel.classList.add('active');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeGlossary() {
      overlay.classList.remove('active');
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // --- Event delegation for .term elements ---
    document.addEventListener('click', function (e) {
      var term = e.target.closest('.term');
      if (term) {
        e.preventDefault();
        e.stopPropagation();
        openGlossary(term.getAttribute('data-term'));
        return;
      }
    });

    // --- Direct click handlers for stat tiles ---
    document.querySelectorAll('.stat[data-term]').forEach(function (el) {
      el.addEventListener('click', function () {
        openGlossary(el.getAttribute('data-term'));
      });
    });

    closeBtn.addEventListener('click', closeGlossary);
    overlay.addEventListener('click', closeGlossary);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('active')) {
        closeGlossary();
      }
    });
  };
})();
