/* Native scrolling, original reference artwork, and a little choreography. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (min-height: 820px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const body = document.body;
  const header = $('#header');
  const hero = $('#home');
  const heroSticky = $('.hero-sticky');
  const heroTitle = $('#heroTitle');
  const ink = $('.hero-ink');
  const flameCanvas = $('.ink-flame');
  const connection = $('#connection');
  const connectionSticky = $('.connection-sticky');
  const leftHand = $('.hand-left');
  const rightHand = $('.hand-right');
  const handsStage = $('.hands-stage');
  const about = $('#about');
  const reading = $('#aboutTitle');
  const skills = $('#skills');
  const skillCards = $$('.skill-card');
  const interests = $('#interests');
  const interestsSticky = $('.interests-sticky');
  const viewport = $('.interests-viewport');
  const track = $('#interestsTrack');
  const cards = $$('.interest-card');
  const previousButton = $('[data-gallery="previous"]');
  const nextButton = $('[data-gallery="next"]');
  const journey = $('#exploring');
  const timeline = $('.timeline');
  const timelineItems = $$('.timeline-item');
  const contact = $('#contact');
  const cursor = $('.cursor-aura');
  const motionButton = $('#motionToggle');
  const menuButton = $('#menuToggle');
  const menu = $('#mobileMenu');
  const sections = [hero, connection, about, skills, interests, journey, contact];
  const interestNames = ['Cinema', 'Film Direction', 'Storytelling', 'Production', 'Playing with AI'];

  let motion = !reducedMotion.matches;
  let geometry;
  let dirty = true;
  let frame = 0;
  let menuOpen = false;
  let previousFocus;
  let activeSection = -1;
  let activeInterest = -1;
  let readCount = -1;
  let copyTimer;
  let pointerX = 0;
  let pointerY = 0;
  let pointerInsideHero = false;
  let pendingInterest = null;
  try {
    if (sessionStorage.getItem('portfolio-motion') === 'off') motion = false;
  } catch (_) { /* The portfolio also works with browser storage disabled. */ }
  $('#year').textContent = new Date().getFullYear();

  const fragment = document.createDocumentFragment();
  reading.textContent.trim().split(/\s+/).forEach(word => {
    const span = document.createElement('span');
    span.className = 'read-word' + (/Vaibhav|BTech|Computer|Science|AI/.test(word) ? ' highlight' : '');
    span.textContent = word;
    fragment.append(span, document.createTextNode(' '));
  });
  reading.replaceChildren(fragment);
  const words = [...reading.children];
  const topOf = element => element.getBoundingClientRect().top + window.scrollY;

  function schedule(remeasure = false) {
    dirty ||= remeasure;
    if (!frame) frame = requestAnimationFrame(render);
  }

  function measure() {
    const height = innerHeight;
    const width = document.documentElement.clientWidth;
    const spacious = motion && desktop.matches;
    hero.classList.toggle('is-pinned', spacious);
    if (spacious && heroSticky.scrollHeight > height + 2) hero.classList.remove('is-pinned');
    connection.classList.toggle('is-pinned', spacious && height >= 850);
    if (connection.classList.contains('is-pinned') && connectionSticky.scrollHeight > height + 2) connection.classList.remove('is-pinned');
    const trackRun = Math.max(0, track.offsetWidth - viewport.clientWidth);
    // Pin the heading and cards together. Use the actual remaining space for
    // artwork so the title stays visible even in shorter laptop windows.
    interests.classList.toggle('is-pinned', motion && trackRun > 1);
    const stickyTop = Math.max(0, parseFloat(getComputedStyle(interestsSticky).top) || 0);
    if (interests.classList.contains('is-pinned')) {
      const art = cards[0].querySelector('.interest-art');
      const textAndHeading = interestsSticky.offsetHeight - art.offsetHeight;
      const availableArt = Math.floor(height - stickyTop - 12 - textAndHeading);
      if (availableArt >= 80) {
        const artHeight = Math.min(300, availableArt);
        interests.style.setProperty('--gallery-art-height', `${artHeight}px`);
        interests.style.setProperty('--gallery-art-scale', String(Math.min(1, Math.max(.35, artHeight / 260))));
        interests.classList.toggle('gallery-compact', artHeight < 180);
      } else {
        interests.classList.remove('is-pinned');
      }
    }
    const laneHeight = interestsSticky.offsetHeight;
    if (laneHeight + stickyTop + 12 > height) interests.classList.remove('is-pinned');
    const galleryPinned = interests.classList.contains('is-pinned');
    const galleryLead = parseFloat(getComputedStyle(interests).paddingTop) || 0;
    if (!galleryPinned) {
      interests.classList.remove('gallery-compact');
      interests.style.removeProperty('--gallery-art-height');
      interests.style.removeProperty('--gallery-art-scale');
    }
    if (galleryPinned && !geometry?.galleryPinned) viewport.scrollLeft = 0;
    if (!galleryPinned && geometry?.galleryPinned) {
      track.style.transform = '';
      cards.forEach(card => { card.style.transform = ''; });
      viewport.scrollLeft = trackRun * Math.max(0, activeInterest) / (cards.length - 1);
    }
    const galleryRun = Math.max(height * .85, trackRun * 1.1);
    if (galleryPinned) interests.style.setProperty('--gallery-height', `${Math.ceil(galleryLead + laneHeight + galleryRun)}px`);
    else interests.style.removeProperty('--gallery-height');
    geometry = {
      width, height, galleryPinned, trackRun,
      heroTop: topOf(hero), heroHeight: hero.offsetHeight,
      heroRun: Math.max(1, hero.offsetHeight - height),
      heroPinned: hero.classList.contains('is-pinned'),
      connectionTop: topOf(connection), connectionHeight: connection.offsetHeight,
      connectionRun: Math.max(1, connection.offsetHeight - height),
      connectionPinned: connection.classList.contains('is-pinned'),
      handWidth: handsStage.offsetWidth,
      readingTop: topOf(reading), readingHeight: reading.offsetHeight,
      galleryTop: topOf(interests) + galleryLead - stickyTop,
      galleryRun,
      cardWidth: cards[0].offsetWidth,
      cardGap: parseFloat(getComputedStyle(track).gap) || 0,
      gutter: parseFloat(getComputedStyle(track).paddingLeft) || 0,
      timelineTop: topOf(timeline), timelineHeight: timeline.offsetHeight,
      timelineTops: timelineItems.map(item => topOf(item)),
      contactTop: topOf(contact),
      pageRun: Math.max(1, document.documentElement.scrollHeight - height),
      sections: sections.map(section => topOf(section))
    };
    dirty = false;
  }

  function updateGallery(index, fraction = 0) {
    if (index !== activeInterest) {
      activeInterest = index;
      $('#interestCounter').textContent = interestNames[index];
      previousButton.disabled = index === 0;
      nextButton.disabled = index === cards.length - 1;
    }
  }

  function render() {
    frame = 0;
    if (dirty || !geometry) measure();
    const y = window.scrollY;
    const g = geometry;
    header.classList.toggle('scrolled', y > 35);
    const current = g.sections.reduce((previous, top, i) => y + g.height * .3 >= top ? i : previous, 0);
    if (current !== activeSection) {
      activeSection = current;
      $$('[data-nav]').forEach(link => {
        if (link.dataset.nav === sections[current].id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    const timelineIndex = g.timelineTops.reduce((previous, top, i) => y + g.height * .67 >= top ? i : previous, -1);
    timelineItems.forEach((item, i) => item.classList.toggle('is-current', i <= timelineIndex));

    if (!motion) return;

    if (y < g.heroTop + g.heroHeight + 100) {
      const p = clamp((y - g.heroTop) / (g.heroPinned ? g.heroRun : g.height));
      heroTitle.style.transform = `translate3d(${-p * 48}px,${-p * 32}px,0) scale(${1 - p * .035})`;
      heroTitle.style.opacity = String(1 - p * .3);
      const px = pointerInsideHero ? pointerX * 12 : 0;
      const py = pointerInsideHero ? pointerY * 12 : 0;
      ink.style.transform = `translate3d(${p * 22 + px}px,${-p * 24 + py}px,0) scale(${1.035 + p * .04})`;
      flameCanvas.style.transform = ink.style.transform;
      $('.hero-eyebrow').style.opacity = String(1 - p * .7);
    }

    if (y + g.height > g.connectionTop && y < g.connectionTop + g.connectionHeight + 100) {
      const p = g.connectionPinned
        ? clamp((y - g.connectionTop) / (g.connectionRun * .85))
        : clamp((y + g.height * .55 - g.connectionTop) / (g.connectionHeight * .85));
      const eased = p * p * (3 - 2 * p);
      // Both image containers stop OUTSIDE the center, independent of viewport width.
      // x is always negative: left.right <= center - gap, right.left >= center + gap.
      // Horizontal motion only keeps this bound valid at every scroll position.
      const spread = Math.max(25, Math.min(130, g.handWidth * .12));
      const halfGap = Math.max(8, g.handWidth * .004);
      const x = -spread + (spread - halfGap) * eased;
      leftHand.style.transform = `translate3d(${x}px,0,0)`;
      rightHand.style.transform = `translate3d(${-x}px,0,0)`;
      $('#connectionTitle').style.transform = `translate3d(0,${(1 - p) * 18}px,0)`;
      $('.connection-word').style.opacity = String(.25 + .75 * p);
    }

    const readProgress = clamp((y + g.height * .88 - g.readingTop) / (g.readingHeight + g.height * .3));
    const count = Math.ceil(readProgress * words.length);
    if (count !== readCount) {
      readCount = count;
      words.forEach((word, i) => word.classList.toggle('lit', i < count));
    }
    about.style.setProperty('--about-turn', `${readProgress * 135}deg`);

    if (g.galleryPinned) {
      const p = clamp((y - g.galleryTop) / g.galleryRun);
      const x = -p * g.trackRun;
      track.style.transform = `translate3d(${x}px,0,0)`;
      const index = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
      updateGallery(index, p);
      if (y + g.height > g.galleryTop && y < g.galleryTop + g.galleryRun + g.height) {
        cards.forEach((card, i) => {
          const center = g.gutter + i * (g.cardWidth + g.cardGap) + g.cardWidth / 2 + x;
          const distance = clamp((center - g.width / 2) / g.width, -1, 1);
          card.style.transform = `translate3d(0,${Math.abs(distance) * 11}px,0) rotate(${distance * 1.3}deg)`;
        });
      }
    }
    if (y + g.height > g.contactTop) {
      const p = clamp((y + g.height - g.contactTop) / (g.height * .85));
      $('.contact-content').style.transform = `translate3d(0,${(1 - p) * 50}px,0)`;
      $('.contact-ink img').style.transform = `translate3d(0,${(1 - p) * 45}px,0) scale(1.08)`;
    }
  }

  function clearMotionStyles() {
    [heroTitle, ink, flameCanvas, leftHand, rightHand, track, $('#connectionTitle'), $('.contact-content'), $('.contact-ink img'), ...cards].forEach(element => { element.style.transform = ''; });
    heroTitle.style.opacity = '';
    $('.hero-eyebrow').style.opacity = '';
    $('.connection-word').style.opacity = '';
    about.style.setProperty('--about-turn', '0deg');
    words.forEach(word => word.classList.add('lit'));
    $$('.magnetic').forEach(element => { element.style.translate = ''; });
  }

  function setMotion(enabled, retainPosition = false) {
    let location;
    if (retainPosition && geometry) {
      const index = geometry.sections.reduce((previous, top, i) => window.scrollY + 90 >= top ? i : previous, 0);
      location = { element: sections[index], fraction: clamp((window.scrollY - geometry.sections[index]) / Math.max(1, sections[index].offsetHeight)) };
    }
    motion = enabled;
    body.classList.toggle('motion-on', enabled);
    body.classList.toggle('motion-off', !enabled);
    window.portfolioInkFlame?.setEnabled(enabled);
    motionButton.setAttribute('aria-pressed', String(!enabled));
    motionButton.setAttribute('aria-label', enabled ? 'Pause animations' : 'Resume animations');
    motionButton.title = enabled ? 'Pause animations' : 'Resume animations';
    $('.motion-label').textContent = enabled ? 'Motion on' : 'Motion off';
    document.documentElement.style.scrollBehavior = enabled ? '' : 'auto';
    viewport.scrollLeft = 0;
    clearMotionStyles();
    readCount = -1;
    measure();
    if (location) window.scrollTo({ top: topOf(location.element) + location.fraction * location.element.offsetHeight, behavior: 'instant' });
    updateGallery(0, 0);
    schedule(true);
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -12px 0px' });
    $$('.reveal').forEach(element => revealObserver.observe(element));
  } else motion = false;

  function goToInterest(index) {
    if (dirty || !geometry) measure();
    index = clamp(index, 0, cards.length - 1);
    const p = index / (cards.length - 1);
    pendingInterest = index;
    $('#liveMessage').textContent = `Showing ${interestNames[index]}.`;
    if (geometry.galleryPinned) {
      window.scrollTo({ top: geometry.galleryTop + geometry.galleryRun * p, behavior: motion ? 'smooth' : 'instant' });
    } else {
      viewport.scrollTo({ left: geometry.trackRun * p, behavior: motion ? 'smooth' : 'instant' });
      updateGallery(index, p);
    }
  }
  previousButton.addEventListener('click', () => goToInterest((pendingInterest ?? activeInterest) - 1));
  nextButton.addEventListener('click', () => goToInterest((pendingInterest ?? activeInterest) + 1));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goToInterest((pendingInterest ?? activeInterest) + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToInterest((pendingInterest ?? activeInterest) - 1); }
    if (event.key === 'Home') { event.preventDefault(); goToInterest(0); }
    if (event.key === 'End') { event.preventDefault(); goToInterest(cards.length - 1); }
  });
  viewport.addEventListener('scroll', () => {
    if (geometry?.galleryPinned) return;
    const run = viewport.scrollWidth - viewport.clientWidth;
    const p = run > 0 ? clamp(viewport.scrollLeft / run) : 0;
    updateGallery(Math.round(p * (cards.length - 1)), p);
  }, { passive: true });
  // A scrollend listener avoids stale targets after repeated gallery navigation.
  const finishGalleryNavigation = () => { pendingInterest = null; };
  addEventListener('scrollend', finishGalleryNavigation);
  viewport.addEventListener('scrollend', finishGalleryNavigation);
  addEventListener('wheel', finishGalleryNavigation, { passive: true });
  addEventListener('touchstart', finishGalleryNavigation, { passive: true });

  function setMenu(open, restoreFocus = true) {
    menuOpen = open;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuButton.textContent = open ? 'Close' : 'Menu';
    body.classList.toggle('menu-open', open);
    $('main').inert = open;
    $('.brand').inert = open;
    $('.nav-contact').inert = open;
    motionButton.inert = open;
    if (open) { previousFocus = document.activeElement; menu.querySelector('a').focus(); }
    else if (restoreFocus && previousFocus) previousFocus.focus({ preventScroll: true });
    schedule(true);
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen));
  $$('#mobileMenu a').forEach(link => link.addEventListener('click', () => setMenu(false, false)));
  document.addEventListener('keydown', event => {
    if (['PageDown', 'PageUp', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) pendingInterest = null;
    if (!menuOpen) return;
    if (event.key === 'Escape') setMenu(false);
    if (event.key === 'Tab') {
      const focusable = [menuButton, ...$$('#mobileMenu a')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  if (finePointer.matches) {
    document.addEventListener('pointermove', event => {
      if (!motion || event.pointerType === 'touch') return;
      cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      cursor.classList.add('is-seen');
    }, { passive: true });
    document.addEventListener('pointerout', event => { if (!event.relatedTarget) cursor.classList.remove('is-seen'); });
    $$('a, button, .interest-art, .skill-card').forEach(element => {
      element.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
      element.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
    skillCards.forEach(card => {
      card.addEventListener('pointermove', event => {
        if (!motion) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--spot-x');
        card.style.removeProperty('--spot-y');
      });
    });
    hero.addEventListener('pointermove', event => {
      if (!motion) return;
      const rect = heroSticky.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      pointerInsideHero = true;
      schedule();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointerInsideHero = false; schedule(); });
    $$('.magnetic').forEach(element => {
      element.addEventListener('pointermove', event => {
        if (!motion) return;
        const rect = element.getBoundingClientRect();
        element.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .1}px ${(event.clientY - rect.top - rect.height / 2) * .1}px`;
      }, { passive: true });
      element.addEventListener('pointerleave', () => { element.style.translate = ''; });
    });
  }

  $('#copyEmail').addEventListener('click', async () => {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText('vaibhavchaudhary767@gmail.com');
      $('#copyFeedback').textContent = 'Copied. A good conversation is one paste away.';
      $('#copyEmail').classList.add('copied');
      $('#copyEmail').setAttribute('aria-label', 'Email address copied');
    } catch (_) {
      $('#copyFeedback').textContent = 'Select the email address to copy it.';
    }
    copyTimer = setTimeout(() => {
      $('#copyFeedback').textContent = '';
      $('#copyEmail').classList.remove('copied');
      $('#copyEmail').setAttribute('aria-label', 'Copy email address');
    }, 4000);
  });

  motionButton.addEventListener('click', () => {
    setMotion(!motion, true);
    try { sessionStorage.setItem('portfolio-motion', motion ? 'on' : 'off'); } catch (_) { /* Optional. */ }
  });
  reducedMotion.addEventListener('change', event => setMotion(!event.matches, true));
  desktop.addEventListener('change', () => {
    track.style.transform = '';
    cards.forEach(card => { card.style.transform = ''; });
    viewport.scrollLeft = 0;
    pendingInterest = null;
    schedule(true);
  });
  addEventListener('scroll', () => schedule(), { passive: true });
  addEventListener('resize', () => {
    if (innerWidth > 640 && menuOpen) setMenu(false);
    schedule(true);
  }, { passive: true });
  addEventListener('pageshow', () => schedule(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) cursor.classList.remove('is-seen'); });
  if (document.fonts) document.fonts.ready.then(() => schedule(true));
  if ('ResizeObserver' in window) new ResizeObserver(() => schedule(true)).observe($('main'));
  $$('img').forEach(image => {
    if (!image.complete) image.addEventListener('load', () => schedule(true), { once: true });
  });
  updateGallery(0, 0);
  setMotion(motion);
})();
