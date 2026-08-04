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

  // Cat companion — click anywhere in the main content area and it
  // hops over to that spot. Real links/buttons underneath still work:
  // we detect them (with the lane briefly out of the way) and forward
  // the click, rather than actually breaking site navigation.
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

    // Preload every frame of every color so switching variants or
    // advancing the walk cycle never shows a blank/flickering frame.
    Object.values(CAT_VARIANTS).forEach((v) => v.frames.forEach((src) => { new Image().src = src; }));

    const main = document.querySelector('main');
    if (!main) return;

    const CAT_W = 66;
    const CAT_H = 44;
    const PACE_RADIUS = 70;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lane = document.createElement('div');
    lane.className = 'cat-lane';

    const cat = document.createElement('button');
    cat.type = 'button';
    cat.className = 'cat-sprite';
    cat.setAttribute('aria-label', 'Cat companion');
    cat.innerHTML = `
      <img src="images/cat-green-walk1.png" alt="" draggable="false">
      <span class="cat-hint">click anywhere to move me!</span>
    `;

    lane.appendChild(cat);
    main.appendChild(lane);

    const controls = document.createElement('div');
    controls.className = 'cat-controls';
    controls.innerHTML = Object.keys(CAT_VARIANTS)
      .map((key) => `<button type="button" class="cat-swatch" data-cat="${key}" style="--swatch:${CAT_VARIANTS[key].swatch}" aria-label="${key} cat"></button>`)
      .join('');
    document.body.appendChild(controls);

    const catImg = cat.querySelector('img');
    const hint = cat.querySelector('.cat-hint');
    const swatchButtons = Array.from(controls.querySelectorAll('.cat-swatch'));

    let laneWidth = 0;
    let laneHeight = 0;
    let x = 20;
    let y = 20;
    let dir = 1;
    const speed = 34; // px/sec
    let bounds = { min: 8, max: 8 };
    let jumping = false;
    let lastTime = null;

    // Walk-cycle animation — each color has 4 leg-frame images (cat-{color}-walk1..4.png).
    // We step through them while the cat is actually moving (pacing or jumping to a
    // click), and hold on the current frame when still.
    let currentCatKey = 'green';
    let walkFrame = 0;
    let walkTimer = 0;
    const FRAME_INTERVAL = 0.11; // seconds per leg frame while pacing

    const setWalkFrame = (idx) => {
      walkFrame = idx;
      catImg.src = CAT_VARIANTS[currentCatKey].frames[walkFrame];
    };

    const applyVariant = (key) => {
      currentCatKey = CAT_VARIANTS[key] ? key : 'green';
      setWalkFrame(walkFrame);
      swatchButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.cat === currentCatKey));
    };
    applyVariant(localStorage.getItem('catVariant') || 'green');

    const paceBounds = (centerX) => ({
      min: Math.max(8, centerX - PACE_RADIUS),
      max: Math.min(Math.max(8, laneWidth - CAT_W - 8), centerX + PACE_RADIUS),
    });

    const render = () => {
      cat.style.transform = `translate(${x}px, ${y}px) scaleX(${dir})`;
    };

    const hideHint = () => hint.classList.remove('is-visible');

    const jumpTo = (targetX, targetY, onDone) => {
      if (reduceMotion) {
        x = targetX;
        y = targetY;
        render();
        if (onDone) onDone();
        return;
      }
      jumping = true;
      const startX = x;
      const startY = y;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const duration = 420;
      const start = performance.now();
      const dist = Math.hypot(dx, dy);
      const arc = Math.max(24, dist * 0.25);

      const animateJump = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        x = startX + dx * ease;
        y = startY + dy * ease - Math.sin(t * Math.PI) * arc;
        const frame = Math.min(3, Math.floor(t * 4));
        if (frame !== walkFrame) setWalkFrame(frame);
        render();
        if (t < 1) {
          requestAnimationFrame(animateJump);
        } else {
          x = targetX;
          y = targetY;
          jumping = false;
          render();
          if (onDone) onDone();
        }
      };
      requestAnimationFrame(animateJump);
    };

    const goToPoint = (targetX, targetY) => {
      const clampedX = Math.min(Math.max(targetX - CAT_W / 2, 8), Math.max(8, laneWidth - CAT_W - 8));
      const clampedY = Math.min(Math.max(targetY - CAT_H / 2, 8), Math.max(8, laneHeight - CAT_H - 8));
      dir = clampedX < x ? -1 : 1;
      jumpTo(clampedX, clampedY, () => {
        bounds = paceBounds(clampedX);
      });
    };

    // The lane itself is pointer-events:none (so hover/clicks on real
    // links and buttons underneath work completely normally — nothing
    // sits on top of them). We just listen on <main> and only move the
    // cat when the click didn't land on a real interactive element.
    main.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, textarea, select, [role="button"]')) return;
      const rect = lane.getBoundingClientRect();
      hideHint();
      goToPoint(e.clientX - rect.left, e.clientY - rect.top);
    });

    cat.addEventListener('click', (e) => {
      e.stopPropagation();
      hideHint();
      jumpTo(x, y); // a little hop in place
    });

    swatchButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.cat;
        localStorage.setItem('catVariant', key);
        applyVariant(key);
      });
    });

    const measure = () => {
      laneWidth = lane.clientWidth;
      laneHeight = lane.clientHeight;
      const clampedX = Math.min(Math.max(x, 8), Math.max(8, laneWidth - CAT_W - 8));
      const clampedY = Math.min(Math.max(y, 8), Math.max(8, laneHeight - CAT_H - 8));
      x = clampedX;
      y = clampedY;
      bounds = paceBounds(x);
      render();
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });
    measure();
    // Start near the bottom-right of the content — right above the
    // footer, since that's exactly where <main> ends.
    x = Math.max(8, laneWidth - CAT_W - 20);
    y = Math.max(8, laneHeight - CAT_H - 20);
    bounds = paceBounds(x);
    render();

    // Web fonts loading late can reflow the page (changing content
    // height) after the initial measurement — recheck once they land.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    setTimeout(measure, 600);

    if (!localStorage.getItem('catHintSeen')) {
      localStorage.setItem('catHintSeen', '1');
      setTimeout(() => {
        hint.classList.add('is-visible');
        setTimeout(hideHint, 4000);
      }, 1200);
    }

    const step = (now) => {
      if (!jumping && !reduceMotion) {
        if (lastTime === null) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        x += dir * speed * dt;
        if (x <= bounds.min) { x = bounds.min; dir = 1; }
        if (x >= bounds.max) { x = bounds.max; dir = -1; }
        walkTimer += dt;
        if (walkTimer >= FRAME_INTERVAL) {
          walkTimer -= FRAME_INTERVAL;
          setWalkFrame((walkFrame + 1) % 4);
        }
        render();
      } else {
        lastTime = null;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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
