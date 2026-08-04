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

  // Cat companion — wanders the whole page and teleports wherever you
  // click. Real links/buttons underneath still work: the lane itself is
  // pointer-events:none, and clicks on an actual link/button are left
  // alone rather than moving the cat.
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
    const footerInner = document.querySelector('.site-footer .footer-inner');
    if (!main) return;

    const CAT_W = 42;
    const CAT_H = 28;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The cat only appears once someone opts in by clicking the icon next
    // to the footer's color swatches — after that it's remembered, so it
    // auto-appears (and starts wandering) on every future visit.
    const activateBtn = document.createElement('button');
    activateBtn.type = 'button';
    activateBtn.className = 'cat-activate';
    activateBtn.setAttribute('aria-label', 'Add a cat companion');
    activateBtn.title = 'Click to add a cat companion!';
    activateBtn.innerHTML = '<img src="images/cat-green-walk1.png" alt="" draggable="false">';

    const controls = document.createElement('div');
    controls.className = 'cat-controls';
    controls.innerHTML = Object.keys(CAT_VARIANTS)
      .map((key) => `<button type="button" class="cat-swatch" data-cat="${key}" style="--swatch:${CAT_VARIANTS[key].swatch}" aria-label="${key} cat"></button>`)
      .join('');
    const swatchButtons = Array.from(controls.querySelectorAll('.cat-swatch'));

    // Placed in the footer (normal document flow) rather than fixed to the
    // viewport, so they stay put on the page instead of following scroll.
    const footerHost = footerInner || document.body;
    footerHost.appendChild(activateBtn);
    footerHost.appendChild(controls);

    const activated = localStorage.getItem('catActivated') === '1';
    activateBtn.hidden = activated;
    controls.hidden = !activated;

    const startCat = () => {
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
    // Attached to <body>, not <main>, so the cat can roam the whole page —
    // header and footer included — not just the main content area.
    document.body.appendChild(lane);

    const catImg = cat.querySelector('img');
    const hint = cat.querySelector('.cat-hint');

    let pageWidth = 0;
    let pageHeight = 0;
    let x = 20;
    let y = 20;
    let dir = 1;
    let jumping = false; // true only during the little in-place bounce (self-click)
    let walking = false; // true while actually traveling to a new spot
    let walkToken = 0; // bumped whenever a walk is cancelled (teleport/new walk), so stale rAF loops know to stop
    const WALK_SPEED = 70; // px/sec
    const FRAME_INTERVAL = 0.14; // seconds per leg frame while walking

    // Walk-cycle animation — each color has 4 leg-frame images (cat-{color}-walk1..4.png).
    // We step through them while the cat is actually jumping to a new spot,
    // and hold on the current frame when still.
    let currentCatKey = 'green';
    let walkFrame = 0;

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

    // The sprite art faces left by default, so moving right (dir === 1)
    // needs a horizontal flip to actually face — and walk — forward.
    const render = () => {
      cat.style.transform = `translate(${x}px, ${y}px) scaleX(${-dir})`;
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
      const dist = Math.hypot(dx, dy);
      if (dist > 1) dir = dx < 0 ? -1 : 1;
      const duration = Math.min(900, Math.max(320, dist * 0.5));
      const start = performance.now();
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

    // Actually walk (ground-level, legs cycling the whole way) from wherever
    // the cat is to a target point, instead of arcing through the air. Every
    // walk carries a token so a later teleport/new walk can tell this one's
    // rAF loop to stop touching x/y instead of fighting over the position.
    const walkTo = (targetX, targetY, onDone) => {
      const myToken = ++walkToken;
      if (reduceMotion) {
        x = targetX;
        y = targetY;
        render();
        if (onDone) onDone();
        return;
      }
      const startX = x;
      const startY = y;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        if (onDone) onDone();
        return;
      }
      walking = true;
      dir = dx < 0 ? -1 : 1;
      const duration = Math.max(260, (dist / WALK_SPEED) * 1000);
      const start = performance.now();
      let lastNow = start;
      let frameTimer = 0;

      const animateWalk = (now) => {
        if (myToken !== walkToken) return; // cancelled — a teleport or newer walk took over
        const t = Math.min((now - start) / duration, 1);
        x = startX + dx * t;
        y = startY + dy * t;
        frameTimer += (now - lastNow) / 1000;
        lastNow = now;
        if (frameTimer >= FRAME_INTERVAL) {
          frameTimer -= FRAME_INTERVAL;
          setWalkFrame((walkFrame + 1) % 4);
        }
        render();
        if (t < 1) {
          requestAnimationFrame(animateWalk);
        } else {
          x = targetX;
          y = targetY;
          walking = false;
          render();
          if (onDone) onDone();
        }
      };
      requestAnimationFrame(animateWalk);
    };

    // The cat can stand anywhere in these bounds — no obstacle avoidance,
    // it can walk right up next to (or under) any text or image.
    const randomPoint = () => ({
      x: 8 + Math.random() * Math.max(8, pageWidth - CAT_W - 16),
      y: 8 + Math.random() * Math.max(8, pageHeight - CAT_H - 16),
    });

    // The cat wanders freely anywhere on the page. Most steps just pick a
    // new X on the current row and walk there horizontally (natural
    // walk-cycle motion, never vertical). Every so often it instead hops
    // — an arc, not a walk, since there's no "walking up/down" pose — to a
    // different spot elsewhere on the page.
    let justHopped = false;
    const wanderStep = () => {
      if (reduceMotion) return;
      // Never hop twice in a row — always land somewhere before deciding
      // to hop again, so it doesn't chain into a jarring flurry of jumps.
      const shouldHop = !justHopped && Math.random() < 0.25;
      justHopped = shouldHop;
      if (shouldHop) {
        const spot = randomPoint();
        jumpTo(spot.x, spot.y, wanderStep);
        return;
      }
      const targetX = 8 + Math.random() * Math.max(8, pageWidth - CAT_W - 16);
      walkTo(targetX, y, wanderStep);
    };

    // After a user-initiated move (click), give the cat a moment to just
    // sit at the spot it was sent to before it resumes wandering off on
    // its own — otherwise it can look like it's ignoring the click.
    let wanderResumeTimer = null;
    const resumeWanderingSoon = () => {
      clearTimeout(wanderResumeTimer);
      wanderResumeTimer = setTimeout(wanderStep, 80 + Math.random() * 120);
    };

    // A click teleports the cat there instantly (no travel time), then it
    // pauses briefly before picking wandering back up.
    const teleportTo = (docX, docY) => {
      walkToken++; // cancel whatever walk is in flight
      walking = false;
      justHopped = false;
      x = Math.min(Math.max(docX - CAT_W / 2, 8), Math.max(8, pageWidth - CAT_W - 8));
      y = Math.min(Math.max(docY - CAT_H / 2, 8), Math.max(8, pageHeight - CAT_H - 8));
      render();
      resumeWanderingSoon();
    };

    // The lane itself is pointer-events:none (so hover/clicks on real
    // links and buttons underneath work completely normally — nothing
    // sits on top of them). We listen on the whole page (header and
    // footer included) and only move the cat when the click didn't land
    // on a real interactive element.
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, textarea, select, [role="button"]')) return;
      const rect = lane.getBoundingClientRect();
      hideHint();
      teleportTo(e.clientX - rect.left, e.clientY - rect.top);
    });

    cat.addEventListener('click', (e) => {
      e.stopPropagation();
      hideHint();
      walkToken++; // pause wandering for the bounce
      jumpTo(x, y, resumeWanderingSoon); // a little hop in place, then resume wandering
    });

    swatchButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.cat;
        localStorage.setItem('catVariant', key);
        applyVariant(key);
      });
    });

    const measure = () => {
      pageWidth = document.documentElement.clientWidth;
      pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      x = Math.min(Math.max(x, 8), Math.max(8, pageWidth - CAT_W - 8));
      y = Math.min(Math.max(y, 8), Math.max(8, pageHeight - CAT_H - 8));
      render();
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });
    measure();
    // Start near the bottom-right of the page.
    x = Math.max(8, pageWidth - CAT_W - 20);
    y = Math.max(8, pageHeight - CAT_H - 40);
    render();
    wanderStep();

    // Fonts and images loading late can reflow the page (changing content
    // height/position) after the initial measurement — recheck once
    // everything has actually settled.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    window.addEventListener('load', measure);
    setTimeout(measure, 600);
    setTimeout(measure, 1500);

    if (!localStorage.getItem('catHintSeen')) {
      localStorage.setItem('catHintSeen', '1');
      setTimeout(() => {
        hint.classList.add('is-visible');
        setTimeout(hideHint, 4000);
      }, 1200);
    }
    }; // end startCat

    if (activated) {
      startCat();
    } else {
      activateBtn.addEventListener('click', () => {
        localStorage.setItem('catActivated', '1');
        activateBtn.hidden = true;
        controls.hidden = false;
        startCat();
      });
    }
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
