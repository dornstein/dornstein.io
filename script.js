// ============================================
// David Ornstein — Portfolio Site Scripts
// ============================================

(function () {
  'use strict';

  // --- Nav scroll effect ---
  const nav = document.getElementById('nav');
  function updateNav() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // --- Mobile nav toggle ---
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  toggle.addEventListener('click', function () {
    links.classList.toggle('open');
    const isOpen = links.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile nav when a link is clicked
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
    });
  });

  // --- Timeline animation on scroll ---
  const timelineItems = document.querySelectorAll('.timeline-era');

  function revealTimeline() {
    timelineItems.forEach(function (item) {
      var rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        item.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', revealTimeline, { passive: true });
  // Run once on load
  revealTimeline();

  // --- Active nav link highlighting ---
  const sections = document.querySelectorAll('.section, #hero');
  const navLinks = document.querySelectorAll('.nav-links a');

  function updateActiveLink() {
    var scrollPos = window.scrollY + window.innerHeight / 3;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var bottom = top + section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < bottom) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  // --- Timeline filter (multi-select, driven by skills taxonomy) ---
  var eras = document.querySelectorAll('.timeline-era');
  var cards = document.querySelectorAll('.timeline-card[data-skill-slugs]');
  var countNum = document.getElementById('filterCountNum');
  var filterSummary = document.getElementById('filterSummary');
  var groupsEl = document.getElementById('filterGroups');
  var clearBtn = document.getElementById('filterClearBtn');

  // Load taxonomy from embedded JSON.
  var taxonomy = { categories: [] };
  var taxonomyEl = document.getElementById('skills-taxonomy');
  if (taxonomyEl) {
    try { taxonomy = JSON.parse(taxonomyEl.textContent); } catch (e) { /* ignore */ }
  }

  var categoryBySlug = {};
  taxonomy.categories.forEach(function (c) { categoryBySlug[c.slug] = c; });

  // Compute which skills are actually used on cards so we can hide empty ones.
  var usedSkills = new Set();
  var usedCategories = new Set();
  cards.forEach(function (card) {
    (card.getAttribute('data-skill-slugs') || '').split(/\s+/).forEach(function (s) {
      if (s) usedSkills.add(s);
    });
    (card.getAttribute('data-skill-cat-slugs') || '').split(/\s+/).forEach(function (s) {
      if (s) usedCategories.add(s);
    });
  });

  // Selection state.
  var selectedCategories = new Set();
  var selectedSkills = new Set();

  function renderGroups() {
    if (!groupsEl) return;
    groupsEl.innerHTML = '';
    taxonomy.categories.forEach(function (cat) {
      if (!usedCategories.has(cat.slug)) return;
      var group = document.createElement('div');
      group.className = 'filter-group';
      group.setAttribute('data-cat-slug', cat.slug);

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'filter-chip filter-chip-category';
      head.setAttribute('data-filter-type', 'category');
      head.setAttribute('data-filter-slug', cat.slug);
      head.textContent = cat.name;
      group.appendChild(head);

      var skillList = document.createElement('div');
      skillList.className = 'filter-group-skills';
      cat.skills.forEach(function (s) {
        if (!usedSkills.has(s.slug)) return;
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip filter-chip-skill';
        chip.setAttribute('data-filter-type', 'skill');
        chip.setAttribute('data-filter-slug', s.slug);
        chip.setAttribute('data-cat-slug', cat.slug);
        chip.textContent = s.name;
        skillList.appendChild(chip);
      });
      group.appendChild(skillList);
      groupsEl.appendChild(group);
    });
  }

  function updateChipStates() {
    var chips = groupsEl.querySelectorAll('.filter-chip');
    chips.forEach(function (chip) {
      var type = chip.getAttribute('data-filter-type');
      var slug = chip.getAttribute('data-filter-slug');
      var active = false;
      if (type === 'category') active = selectedCategories.has(slug);
      else if (type === 'skill') active = selectedSkills.has(slug);
      chip.classList.toggle('active', active);
    });
    if (clearBtn) clearBtn.hidden = selectedCategories.size === 0 && selectedSkills.size === 0;
  }

  function cardMatches(card) {
    if (selectedCategories.size === 0 && selectedSkills.size === 0) return true;
    var cats = (card.getAttribute('data-skill-cat-slugs') || '').split(/\s+/);
    for (var i = 0; i < cats.length; i++) {
      if (cats[i] && selectedCategories.has(cats[i])) return true;
    }
    var skills = (card.getAttribute('data-skill-slugs') || '').split(/\s+/);
    for (var j = 0; j < skills.length; j++) {
      if (skills[j] && selectedSkills.has(skills[j])) return true;
    }
    return false;
  }

  function applyFilter() {
    var visibleCount = 0;
    cards.forEach(function (card) {
      var matches = cardMatches(card);
      card.classList.toggle('card-filtered-out', !matches);
      if (matches) visibleCount++;
    });

    eras.forEach(function (era) {
      var visibleCards = era.querySelectorAll('.timeline-card:not(.card-filtered-out)');
      var show = visibleCards.length > 0;
      era.classList.toggle('filtered-out', !show);
      era.classList.toggle('filtered-in', show && (selectedCategories.size > 0 || selectedSkills.size > 0));
    });

    updateChipStates();

    if (countNum) {
      countNum.textContent = visibleCount;
      countNum.classList.add('bounce');
      setTimeout(function () { countNum.classList.remove('bounce'); }, 350);
    }

    var existing = document.querySelector('.filter-empty-msg');
    if (existing) existing.remove();
    if (visibleCount === 0) {
      var msg = document.createElement('div');
      msg.className = 'filter-empty-msg';
      msg.innerHTML = '<span class="filter-empty-icon">🔍</span>No roles match the selected filters.';
      document.querySelector('.timeline').appendChild(msg);
    }

    if (filterSummary) {
      var totalSelected = selectedCategories.size + selectedSkills.size;
      if (totalSelected === 0) {
        filterSummary.classList.remove('visible');
        setTimeout(function () {
          if (!filterSummary.classList.contains('visible')) filterSummary.innerHTML = '';
        }, 400);
      } else {
        var parts = [];
        selectedCategories.forEach(function (slug) {
          var c = categoryBySlug[slug];
          parts.push('<span class="filter-summary-tag filter-summary-tag-cat">' + (c ? c.name : slug) + '</span>');
        });
        selectedSkills.forEach(function (slug) {
          var name = slug;
          for (var i = 0; i < taxonomy.categories.length; i++) {
            var found = taxonomy.categories[i].skills.find(function (s) { return s.slug === slug; });
            if (found) { name = found.name; break; }
          }
          parts.push('<span class="filter-summary-tag">' + name + '</span>');
        });
        var noun = visibleCount === 1 ? 'role' : 'roles';
        filterSummary.innerHTML = '<div class="filter-summary-inner"><strong>' + visibleCount + '</strong> ' + noun + ' match: ' + parts.join(' ') + '</div>';
        filterSummary.offsetHeight;
        filterSummary.classList.add('visible');
      }
    }
  }

  function toggleSelection(type, slug) {
    var set = type === 'category' ? selectedCategories : selectedSkills;
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    applyFilter();
  }

  function clearAll() {
    selectedCategories.clear();
    selectedSkills.clear();
    applyFilter();
  }

  function handleChipClick(e) {
    var chip = e.target.closest('.filter-chip');
    if (!chip || !groupsEl.contains(chip)) return;

    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    var rect = chip.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - 20) + 'px';
    ripple.style.top = (e.clientY - rect.top - 20) + 'px';
    chip.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 500);

    var type = chip.getAttribute('data-filter-type');
    var slug = chip.getAttribute('data-filter-slug');
    toggleSelection(type, slug);
  }

  if (groupsEl) {
    renderGroups();
    groupsEl.addEventListener('click', handleChipClick);
  }
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  applyFilter();

  // --- Scroll-reveal for value cards ---
  var revealEls = document.querySelectorAll('.value-card, .value-cta');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) {
      el.classList.add('reveal-on-scroll');
      revealObserver.observe(el);
    });
  }

  // Chip click handling is wired above via delegated listeners on
  // #filterCategoryChips and #filterSkillChips; nothing to do here.

  // --- Hero Featured Testimonial Rotator ---
  // Populated dynamically from the #testimonials carousel so we rotate through
  // every endorsement rather than a hand-picked subset.
  (function initHeroQuotes() {
    var stack = document.querySelector('.hero-quote-stack');
    if (!stack) return;
    var sourceSlides = document.querySelectorAll('#testimonials .testimonial-slide');
    if (!sourceSlides.length) return;

    // Build a hero-quote for each source slide.
    for (var s = 0; s < sourceSlides.length; s++) {
      var slide = sourceSlides[s];
      var text = slide.querySelector('.testimonial-text');
      var author = slide.querySelector('.testimonial-author');
      var role = slide.querySelector('.testimonial-role');
      if (!text) continue;
      var q = document.createElement('blockquote');
      q.className = 'hero-quote' + (s === 0 ? ' is-active' : '');
      var p = document.createElement('p');
      p.className = 'hero-quote-text';
      // Keep original punctuation; testimonial-text already omits quotes.
      p.textContent = '\u201C' + text.textContent.trim() + '\u201D';
      q.appendChild(p);
      if (author || role) {
        var f = document.createElement('footer');
        f.className = 'hero-quote-footer';
        if (author) {
          var a = document.createElement('span');
          a.className = 'hero-quote-author';
          a.textContent = author.textContent;
          f.appendChild(a);
        }
        if (role) {
          var r = document.createElement('span');
          r.className = 'hero-quote-role';
          r.textContent = role.textContent;
          f.appendChild(r);
        }
        q.appendChild(f);
      }
      stack.appendChild(q);
    }

    var quotes = stack.querySelectorAll('.hero-quote');
    if (quotes.length <= 1) return;
    var dotsContainer = document.querySelector('.hero-quote-dots');
    var idx = 0;
    var timer = null;
    var ROTATE_MS = 14000;

    var dots = [];
    if (dotsContainer) {
      for (var i = 0; i < quotes.length; i++) {
        (function (n) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'hero-quote-dot' + (n === 0 ? ' is-active' : '');
          dot.setAttribute('aria-label', 'Show quote ' + (n + 1));
          dot.addEventListener('click', function () { goTo(n, true); });
          dotsContainer.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function goTo(n, userInitiated) {
      idx = ((n % quotes.length) + quotes.length) % quotes.length;
      for (var i = 0; i < quotes.length; i++) {
        quotes[i].classList.toggle('is-active', i === idx);
        if (dots[i]) dots[i].classList.toggle('is-active', i === idx);
      }
      if (userInitiated) restart();
    }

    function advance() { goTo(idx + 1, false); }
    function start() { timer = setInterval(advance, ROTATE_MS); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    start();
    stack.addEventListener('mouseenter', stop);
    stack.addEventListener('mouseleave', start);
  })();

  // --- Testimonial Carousel ---
  (function initCarousel() {
    var track = document.querySelector('.carousel-track');
    var slides = document.querySelectorAll('.testimonial-slide');
    var prevBtn = document.querySelector('.carousel-prev');
    var nextBtn = document.querySelector('.carousel-next');
    var dotsContainer = document.querySelector('.carousel-dots');
    var currentEl = document.querySelector('.carousel-current');
    var totalEl = document.querySelector('.carousel-total');

    if (!track || slides.length === 0) return;

    var current = 0;
    var total = slides.length;
    var autoplayInterval;
    var autoplayDelay = 8000;

    // Update total count
    if (totalEl) totalEl.textContent = total;

    // Create dots
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.setAttribute('data-index', i);
      dot.addEventListener('click', function () {
        goTo(parseInt(this.getAttribute('data-index')));
      });
      dotsContainer.appendChild(dot);
    }

    var dots = dotsContainer.querySelectorAll('.carousel-dot');

    function goTo(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      current = index;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';

      // Update dots
      dots.forEach(function (d, di) {
        d.classList.toggle('active', di === current);
      });

      // Update counter
      if (currentEl) currentEl.textContent = current + 1;
    }

    prevBtn.addEventListener('click', function () {
      goTo(current - 1);
      resetAutoplay();
    });

    nextBtn.addEventListener('click', function () {
      goTo(current + 1);
      resetAutoplay();
    });

    // Autoplay
    function startAutoplay() {
      autoplayInterval = setInterval(function () {
        goTo(current + 1);
      }, autoplayDelay);
    }

    function resetAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }

    // Pause on hover
    var carousel = document.querySelector('.testimonial-carousel');
    carousel.addEventListener('mouseenter', function () {
      clearInterval(autoplayInterval);
    });
    carousel.addEventListener('mouseleave', function () {
      startAutoplay();
    });

    // Keyboard navigation
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); resetAutoplay(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoplay(); }
    });

    // Touch/swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    var viewport = document.querySelector('.carousel-viewport');

    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) { goTo(current + 1); }
        else { goTo(current - 1); }
        resetAutoplay();
      }
    }, { passive: true });

    startAutoplay();
  })();

})();
