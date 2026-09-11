// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the menu after following a link (mobile)
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Photo roll — clicking a cover expands its .roll-gallery inline, right
  // in the contact sheet (an accordion, not a popup). Everything flows in
  // one continuous grid, so expanding a roll never leaves gaps — whatever
  // comes next just flows up to fill the leftover slots.
  const contactSheet = document.querySelector('.contact-sheet');
  const photoGrid = document.querySelector('.photo-grid');
  if (contactSheet && photoGrid) {
    // The sprocket-dot divider between rows can't be a real grid item
    // (a full-width item would force an empty row wherever the current
    // row isn't completely full, right when a roll is expanded). Instead
    // we measure where each row actually falls after every layout change
    // and lay dividers on top, positioned to match.
    const updateRowDividers = () => {
      photoGrid.querySelectorAll(':scope > .row-divider').forEach((el) => el.remove());
      const cells = photoGrid.querySelectorAll('.photo-item, .roll-gallery:not([hidden]) > .photo-frame');
      const rows = [];
      cells.forEach((cell) => {
        const top = cell.offsetTop;
        let row = rows.find((r) => Math.abs(r.top - top) < 1);
        if (!row) {
          row = { top, bottom: top + cell.offsetHeight };
          rows.push(row);
        } else {
          row.bottom = Math.max(row.bottom, top + cell.offsetHeight);
        }
      });
      rows.sort((a, b) => a.top - b.top);
      for (let i = 0; i < rows.length - 1; i++) {
        const gapMid = (rows[i].bottom + rows[i + 1].top) / 2;
        const divider = document.createElement('div');
        divider.className = 'row-divider';
        divider.style.top = `${gapMid - 7}px`;
        photoGrid.appendChild(divider);
      }
    };

    document.querySelectorAll('.photo-item > .photo-frame').forEach((frame) => {
      frame.addEventListener('click', () => {
        const gallery = frame.closest('.photo-item').nextElementSibling;
        if (gallery && gallery.classList.contains('roll-gallery')) {
          gallery.hidden = !gallery.hidden;
          updateRowDividers();
        }
      });
    });

    // Click a thumbnail inside an expanded roll to see it full size,
    // uncropped — handy for vertical shots that get cropped in the
    // fixed 3:2 grid.
    const zoom = document.getElementById('photo-zoom');
    const zoomImg = document.getElementById('photo-zoom-img');
    const openZoom = (img) => {
      zoomImg.src = img.currentSrc || img.src;
      zoomImg.alt = img.alt || '';
      zoom.hidden = false;
    };
    const closeZoom = () => {
      zoom.hidden = true;
      zoomImg.src = '';
    };

    contactSheet.addEventListener('click', (e) => {
      const frame = e.target.closest('.roll-gallery .photo-frame');
      const img = frame && frame.querySelector('img');
      if (img) openZoom(img);
    });

    zoom.querySelectorAll('[data-zoom-close]').forEach((el) => {
      el.addEventListener('click', closeZoom);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !zoom.hidden) closeZoom();
    });

    updateRowDividers();
    let rowDividerResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rowDividerResizeTimer);
      rowDividerResizeTimer = setTimeout(updateRowDividers, 150);
    });
  }

  // Optional cat companion: short walks, quiet perches, and naps.
  (() => {
    const CAT_VARIANTS = {
      orange: {
        frames: ['images/cat-orange-walk1.png', 'images/cat-orange-walk2.png', 'images/cat-orange-walk3.png', 'images/cat-orange-walk4.png'],
        swatch: '#E18732',
      },
      beige: {
        frames: ['images/cat-beige-walk1.png', 'images/cat-beige-walk2.png', 'images/cat-beige-walk3.png', 'images/cat-beige-walk4.png'],
        swatch: '#CAAF8C',
      },
      black: {
        frames: ['images/cat-black-walk1.png', 'images/cat-black-walk2.png', 'images/cat-black-walk3.png', 'images/cat-black-walk4.png'],
        swatch: '#2E2A26',
      },
      green: {
        frames: ['images/cat-green-walk1.png', 'images/cat-green-walk2.png', 'images/cat-green-walk3.png', 'images/cat-green-walk4.png'],
        swatch: '#C7D1B0',
      },
    };

    const footer = document.querySelector('.site-footer');
    const host = footer?.querySelector('.footer-inner');
    if (!host) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const width = 42;
    const height = 28;
    let active = false;
    let variant = localStorage.getItem('catVariant') || 'green';
    if (!CAT_VARIANTS[variant]) variant = 'green';
    let x = 0;
    let y = 0;
    let direction = -1;
    let timer;
    let animation;
    let hintTimer;
    let currentPerch;

    const activate = document.createElement('button');
    activate.type = 'button';
    activate.className = 'cat-activate';
    activate.setAttribute('aria-label', 'Add a cat companion');
    activate.title = 'Add a cat companion';
    activate.innerHTML = '<img src="images/cat-green-walk1.png" alt="" draggable="false">';

    const controls = document.createElement('div');
    controls.className = 'cat-controls';
    controls.hidden = true;
    controls.innerHTML = Object.keys(CAT_VARIANTS).map(key =>
      `<button type="button" class="cat-swatch" data-cat="${key}" style="--swatch:${CAT_VARIANTS[key].swatch}" aria-label="${key} cat"></button>`
    ).join('') + '<button type="button" class="cat-hide">Hide cat</button>';
    host.append(activate, controls);

    const lane = document.createElement('div');
    lane.className = 'cat-lane';
    lane.hidden = true;
    const cat = document.createElement('button');
    cat.type = 'button';
    cat.className = 'cat-sprite';
    cat.setAttribute('aria-label', 'Cat companion — click to play');
    cat.innerHTML = '<img alt="" draggable="false"><span class="cat-sleep" aria-hidden="true">z z z</span><span class="cat-hint">click anywhere to move me!</span>';
    lane.append(cat);
    document.body.append(lane);
    const sprite = cat.querySelector('img');
    const hint = cat.querySelector('.cat-hint');

    const frame = (index = 0) => { sprite.src = CAT_VARIANTS[variant].frames[index]; };
    const render = () => {
      cat.style.transform = `translate(${x}px, ${y}px)`;
      sprite.style.setProperty('--cat-facing', direction === 1 ? -1 : 1);
    };
    const updateVariant = () => {
      frame();
      controls.querySelectorAll('[data-cat]').forEach(button => {
        const selected = button.dataset.cat === variant;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    };
    updateVariant();

    const stop = () => {
      clearTimeout(timer);
      cancelAnimationFrame(animation);
      cat.classList.remove('is-sleeping');
    };

    // Perches live in the whitespace above the footer, below the intro,
    // and beside cards/photos when the page has enough outer margin.
    const perches = () => {
      const origin = lane.getBoundingClientRect();
      const maxX = Math.max(8, document.documentElement.clientWidth - width - 8);
      const result = [];
      const add = (element, side = false) => {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        if (side) {
          if (rect.right + width + 20 > document.documentElement.clientWidth) return;
          result.push({element, side, min: rect.right - origin.left + 8,
            max: Math.min(maxX, rect.right - origin.left + 28),
            y: rect.bottom - origin.top - height});
        } else {
          result.push({element, side, min: Math.max(8, rect.left - origin.left + 16),
            max: Math.min(maxX, rect.right - origin.left - width - 16),
            y: Math.max(0, rect.top - origin.top - height - 6)});
        }
      };
      add(footer);
      document.querySelectorAll('.project-card, .about-photo, .contact-sheet').forEach(el => add(el, true));
      const hero = document.querySelector('.hero');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        result.push({element: hero, min: Math.max(8, rect.left - origin.left + 32),
          max: Math.min(maxX, rect.right - origin.left - width - 32),
          y: rect.bottom - origin.top + 8});
      }
      return result.filter(p => p.max >= p.min);
    };

    const rest = (afterClick = false, allowSleep = true) => {
      if (!active) return;
      frame();
      const sleeping = allowSleep && !afterClick && Math.random() < 0.2;
      cat.classList.toggle('is-sleeping', sleeping);
      if (!motion.matches) {
        timer = setTimeout(wander, afterClick ? 1000 : sleeping ? 8000 + Math.random() * 4000 : 2000 + Math.random() * 2000);
      }
    };

    const travel = (targetX, targetY, hop, done) => {
      stop();
      const startX = x;
      const startY = y;
      const distance = Math.hypot(targetX - x, targetY - y);
      if (targetX !== x) direction = targetX > x ? 1 : -1;
      if (motion.matches) {
        x = targetX; y = targetY; render(); done(); return;
      }
      const duration = hop ? Math.min(850, Math.max(380, distance * 0.8)) : Math.max(300, distance / 55 * 1000);
      const started = performance.now();
      const tick = now => {
        if (!active) return;
        const elapsed = Math.max(0, now - started);
        const t = Math.min(1, elapsed / duration);
        x = startX + (targetX - startX) * t;
        y = startY + (targetY - startY) * t - (hop ? Math.sin(t * Math.PI) * Math.min(60, 20 + distance * 0.12) : 0);
        frame(Math.floor(elapsed / 140) % 4);
        render();
        if (t < 1) animation = requestAnimationFrame(tick);
        else { frame(); done(); }
      };
      animation = requestAnimationFrame(tick);
    };

    function wander() {
      if (!active || motion.matches) return;
      const spots = perches();
      if (!spots.length) return;
      const same = currentPerch?.manual ? currentPerch : spots.find(p => p.element === currentPerch?.element && p.side === currentPerch?.side);
      // A click clears the perch. Take the first walk on that same row,
      // treating the chosen location as a temporary place to hang out.
      const spot = !currentPerch
        ? {manual: true, min: Math.max(8, x - 160), max: Math.min(document.documentElement.clientWidth - width - 8, x + 160), y}
        : same && Math.random() < 0.75 ? same : spots[Math.floor(Math.random() * spots.length)];
      currentPerch = spot;
      const step = 60 + Math.random() * 100;
      let heading = Math.random() < 0.5 ? -1 : 1;
      // Turn around at a perch edge instead of repeatedly choosing the
      // same clamped position and going straight back to rest.
      if (x <= spot.min + 1) heading = 1;
      else if (x >= spot.max - 1) heading = -1;
      const target = Math.max(spot.min, Math.min(spot.max, x + heading * step));
      travel(target, spot.y, Math.abs(y - spot.y) > 2, () => rest());
    }

    const settle = () => {
      if (!active) return;
      stop();
      const spots = perches();
      const spot = spots.find(p => p.element === currentPerch?.element && p.side === currentPerch?.side) || spots[0];
      if (!spot) return;
      currentPerch = spot;
      x = Math.max(spot.min, Math.min(spot.max, x));
      y = spot.y;
      render();
      rest(false, false);
    };

    const setActive = enabled => {
      stop();
      clearTimeout(hintTimer);
      hint.classList.remove('is-visible');
      active = enabled;
      localStorage.setItem('catActivated', enabled ? '1' : '0');
      lane.hidden = !enabled;
      controls.hidden = !enabled;
      activate.hidden = enabled;
      if (enabled) {
        CAT_VARIANTS[variant].frames.forEach(src => { new Image().src = src; });
        settle();
        if (!localStorage.getItem('catHintSeen')) {
          localStorage.setItem('catHintSeen', '1');
          hint.classList.add('is-visible');
          hintTimer = setTimeout(() => hint.classList.remove('is-visible'), 4000);
        }
      }
    };
    activate.addEventListener('click', () => {
      setActive(true);
      controls.querySelector('[data-cat]').focus({preventScroll: true});
    });
    controls.querySelector('.cat-hide').addEventListener('click', () => {
      setActive(false);
      activate.focus({preventScroll: true});
    });
    controls.querySelectorAll('[data-cat]').forEach(button => button.addEventListener('click', () => {
      variant = button.dataset.cat;
      localStorage.setItem('catVariant', variant);
      updateVariant();
    }));
    document.body.addEventListener('click', event => {
      if (!active || event.target.closest('a, button, input, textarea, select, [role="button"], [contenteditable="true"]')) return;
      stop();
      hint.classList.remove('is-visible');
      const rect = lane.getBoundingClientRect();
      x = Math.max(8, Math.min(document.documentElement.clientWidth - width - 8, event.clientX - rect.left - width / 2));
      y = Math.max(0, Math.min(document.documentElement.scrollHeight - height, event.clientY - rect.top - height));
      currentPerch = null;
      render();
      rest(true);
    });
    cat.addEventListener('click', () => {
      hint.classList.remove('is-visible');
      travel(x, y, true, () => rest(true));
    });
    motion.addEventListener('change', settle);
    window.addEventListener('resize', settle);
    window.addEventListener('load', settle);
    if (document.fonts?.ready) document.fonts.ready.then(settle);
    // Expanded photo rolls and late-loading images can move the footer.
    if ('ResizeObserver' in window) new ResizeObserver(settle).observe(document.querySelector('main'));
    if (localStorage.getItem('catActivated') === '1') setActive(true);

  })();

  // Gentle fade-in as sections enter the viewport
  const revealTargets = document.querySelectorAll('.fade-in');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    // No IntersectionObserver support — just show everything
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }
});
