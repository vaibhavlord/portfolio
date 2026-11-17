/* Native scrolling drives the choreography. No scroll hijacking, no dependencies. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pinnedLayout = matchMedia('(min-width: 901px) and (min-height: 740px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const body = document.body;
  const header = $('#header');
  const hero = $('#home');
  const heroCopy = $('.hero-copy');
  const keyTravel = $('.key-travel');
  const keyTilt = $('#keyTilt');
  const key = $('#curiosityKey');
  const caption = $('#keyCaption');
  const ribbon = $('.word-ribbon');
  const ribbonTrack = $('.ribbon-track');
  const about = $('#about');
  const reading = $('#aboutTitle');
  const skills = $('#skills');
  const interests = $('#interests');
  const viewport = $('.interests-viewport');
  const track = $('#interestsTrack');
  const cards = $$('.interest-card');
  const dots = $$('.interest-dots button');
  const journey = $('#exploring');
  const timeline = $('.timeline');
  const timelineItems = $$('.timeline-item');
  const contact = $('#contact');
  const progress = $('.page-progress span');
  const status = $('.scroll-status');
  const motionButton = $('#motionToggle');
  const menuButton = $('#menuToggle');
  const menu = $('#mobileMenu');
  const sections = [hero, about, skills, interests, journey, contact];
  const names = ['INTRO', 'THE HUMAN', 'THE TOOLKIT', 'OFFSCREEN', "WHAT'S NEXT", 'SAY HELLO'];
  let motion = !reducedMotion.matches;
  let geometry;
  let dirty = true;
  let frame = 0;
  let menuOpen = false;
  let currentSection = -1;
  let readCount = -1;
  let activeInterest = -1;
  let keyCount = 0;
  let pressTimer;
  let captionTimer;
  let copyTimer;
  let savedMotion;
  try { savedMotion = sessionStorage.getItem('portfolio-motion'); } catch (_) { /* Storage is optional. */ }
  if (savedMotion === 'off') motion = false;
  $('#year').textContent = new Date().getFullYear();

  // Words stay in reading order and stay visible without JavaScript or motion.
  const fragment = document.createDocumentFragment();
  reading.textContent.trim().split(/\s+/).forEach(word => {
    const span = document.createElement('span');
    span.className = 'read-word' + (/Vaibhav|NST-RU|Python|artificial|intelligence/.test(word) ? ' highlight' : '');
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
    const pinned = motion && pinnedLayout.matches;
    // Only pin the reading scene when all of its content fits the viewport.
    const aboutContent = $('.about-layout');
    const aboutFits = aboutContent.offsetHeight + $('.about .section-kicker').offsetHeight + 250 < height;
    about.classList.toggle('can-pin', pinned && aboutFits);
    const readingPinned = pinned && aboutFits;
    const trackRun = Math.max(0, track.scrollWidth - innerWidth);
    const interestRun = Math.max(height * .8, trackRun * 1.25);
    const desiredHeight = pinned ? `${Math.ceil(height + interestRun)}px` : '';
    if (interests.style.getPropertyValue('--interests-height') !== desiredHeight) {
      if (desiredHeight) interests.style.setProperty('--interests-height', desiredHeight);
      else interests.style.removeProperty('--interests-height');
    }
    geometry = {
      pinned, readingPinned, height, trackRun,
      heroTop: topOf(hero), heroRun: Math.max(1, hero.offsetHeight - height),
      ribbonTop: topOf(ribbon), aboutTop: topOf(about), aboutHeight: about.offsetHeight,
      readingTop: topOf(reading), readingHeight: reading.offsetHeight,
      skillsTop: topOf(skills), skillsHeight: skills.offsetHeight,
      interestsTop: topOf(interests), interestsRun: Math.max(1, interests.offsetHeight - height),
      timelineTop: topOf(timeline), timelineHeight: timeline.offsetHeight,
      timelineItems: timelineItems.map(item => topOf(item)),
      contactTop: topOf(contact),
      cardWidth: cards[0].offsetWidth,
      cardGap: parseFloat(getComputedStyle(track).gap) || 0,
      gutter: parseFloat(getComputedStyle(track).paddingLeft) || 0,
      sections: sections.map(section => topOf(section)),
      pageRun: Math.max(1, document.documentElement.scrollHeight - height)
    };
    dirty = false;
  }

  function updateInterest(index) {
    if (index === activeInterest) return;
    activeInterest = index;
    $('#interestCounter').textContent = String(index + 1).padStart(2, '0');
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function render() {
    frame = 0;
    if (dirty || !geometry) measure();
    const y = window.scrollY;
    const g = geometry;
    progress.style.transform = `scaleX(${clamp(y / g.pageRun)})`;
    $('.status-ring').style.strokeDashoffset = String(44 * (1 - clamp(y / g.pageRun)));
    header.classList.toggle('scrolled', y > 35);
    status.classList.toggle('is-visible', y > g.height * .55 && y < g.pageRun - 90);
    const current = g.sections.reduce((previous, top, i) => y + g.height * .35 >= top ? i : previous, 0);
    if (current !== currentSection) {
      currentSection = current;
      $('.status-number').textContent = String(current + 1).padStart(2, '0');
      $('.status-name').textContent = names[current];
      $$('[data-nav]').forEach(link => {
        if (link.dataset.nav === sections[current].id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    const journeyProgress = clamp((y + g.height * .62 - g.timelineTop) / g.timelineHeight);
    journey.style.setProperty('--journey-progress', motion ? journeyProgress : 1);
    const currentTimeline = g.timelineItems.reduce((previous, top, index) => y + g.height * .65 >= top ? index : previous, -1);
    timelineItems.forEach((item, i) => item.classList.toggle('is-current', i <= currentTimeline));
    if (!motion) return;

    // Opening: the typography and the key slowly separate as you leave the page.
    if (y < g.height * 2) {
      const p = clamp(y / (g.pinned ? g.heroRun : g.height));
      heroCopy.style.transform = `translate3d(${-p * 35}px,${-p * 25}px,0)`;
      heroCopy.style.opacity = String(1 - p * .24);
      keyTravel.style.transform = `translate3d(${p * 44}px,${-p * 28}px,0) rotate(${p * 13}deg)`;
      $('.orbit-two').style.transform = `rotateX(45deg) rotate(${-25 + p * 45}deg)`;
    }
    if (y + g.height > g.ribbonTop && y < g.ribbonTop + 300) {
      ribbonTrack.style.transform = `translate3d(${-(y + g.height - g.ribbonTop) * .24}px,0,0)`;
    }

    const readProgress = g.readingPinned
      ? clamp((y - g.aboutTop + g.height * .22) / (g.aboutHeight - g.height * .65))
      : clamp((y + g.height * .86 - g.readingTop) / (g.readingHeight + g.height * .25));
    const nextReadCount = Math.ceil(readProgress * words.length);
    if (nextReadCount !== readCount) {
      readCount = nextReadCount;
      words.forEach((word, i) => word.classList.toggle('lit', i < nextReadCount));
    }
    about.style.setProperty('--about-rotation', `${readProgress * 120}deg`);

    if (y + g.height > g.skillsTop && y < g.skillsTop + g.skillsHeight) {
      const entered = clamp((y + g.height * .8 - g.skillsTop) / (g.height * .65));
      $('.python-card').style.setProperty('--skill-y', `${(1 - entered) * 50}px`);
      $('.git-card').style.setProperty('--skill-y', `${(1 - entered) * 100}px`);
      skills.style.setProperty('--branch-offset', String(660 * (1 - clamp((y + g.height * .7 - g.skillsTop - 300) / 400))));
    }

    if (g.pinned) {
      const p = clamp((y - g.interestsTop) / g.interestsRun);
      const x = -p * g.trackRun;
      track.style.transform = `translate3d(${x}px,0,0)`;
      updateInterest(Math.min(cards.length - 1, Math.round(p * (cards.length - 1))));
      if (y + g.height > g.interestsTop && y < g.interestsTop + g.interestsRun + g.height) {
        cards.forEach((card, i) => {
          const center = g.gutter + i * (g.cardWidth + g.cardGap) + g.cardWidth / 2 + x;
          const distance = clamp((center - innerWidth / 2) / innerWidth, -1, 1);
          card.style.transform = `translate3d(0,${Math.abs(distance) * 12}px,0) rotate(${distance * 1.7}deg)`;
        });
      }
    }
    if (y + g.height > g.contactTop) {
      const p = clamp((y + g.height - g.contactTop) / (g.height * .8));
      $('.contact-inner').style.transform = `translate3d(0,${(1 - p) * 55}px,0)`;
    }
  }

  function clearTransforms() {
    [heroCopy, keyTravel, ribbonTrack, track, $('.contact-inner'), ...cards].forEach(element => {
      element.style.transform = '';
    });
    heroCopy.style.opacity = '';
    $$('.skill-card').forEach(card => {
      card.style.setProperty('--skill-y', '0px');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
    skills.style.setProperty('--branch-offset', '0');
    about.style.setProperty('--about-rotation', '0deg');
    words.forEach(word => word.classList.add('lit'));
    $('.orbit-two').style.transform = '';
    keyTilt.style.transform = '';
  }

  function setMotion(enabled, retainPosition = false) {
    let relativePosition;
    if (retainPosition && geometry) {
      const index = geometry.sections.reduce((previous, top, i) => window.scrollY + 100 >= top ? i : previous, 0);
      const element = sections[index];
      relativePosition = { element, fraction: clamp((window.scrollY - geometry.sections[index]) / Math.max(1, element.offsetHeight)) };
    }
    motion = enabled;
    viewport.scrollLeft = 0;
    activeInterest = -1;
    body.classList.toggle('motion-on', enabled);
    body.classList.toggle('motion-off', !enabled);
    motionButton.setAttribute('aria-pressed', String(!enabled));
    motionButton.setAttribute('aria-label', enabled ? 'Pause animations' : 'Resume animations');
    motionButton.title = enabled ? 'Pause animations' : 'Resume animations';
    $('.motion-label').textContent = enabled ? 'Motion on' : 'Motion off';
    document.documentElement.style.scrollBehavior = enabled ? '' : 'auto';
    if (!enabled) {
      clearTransforms();
      $$('.magnetic').forEach(element => { element.style.translate = ''; });
    }
    readCount = -1;
    measure();
    if (relativePosition) {
      const target = topOf(relativePosition.element) + relativePosition.fraction * relativePosition.element.offsetHeight;
      window.scrollTo({ top: target, behavior: 'instant' });
    }
    schedule(true);
  }

  // Only animate elements after their observers are in place.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .14, rootMargin: '0px 0px -10px 0px' });
    $$('.reveal, .split-reveal').forEach(element => revealObserver.observe(element));
  } else motion = false;

  // Physical key: pointer tilt, a short press, and a new thought. Also keyboard accessible.
  const thoughts = [
    'Curiosity successfully increased. Again.',
    'One question answered. Seven new tabs opened.',
    'Error 404: off switch not found.',
    'Currently debugging my understanding of everything.',
    'My comfort zone has filed a missing person report.',
    'Yes, the button works. So does asking “why?”.'
  ];
  key.addEventListener('click', () => {
    clearTimeout(pressTimer);
    clearTimeout(captionTimer);
    keyCount += 1;
    key.classList.add('is-pressed');
    key.style.setProperty('--key-spin', `${keyCount * 90}deg`);
    if (motion) caption.classList.add('changing');
    captionTimer = setTimeout(() => {
      caption.textContent = thoughts[(keyCount - 1) % thoughts.length];
      caption.classList.remove('changing');
    }, motion ? 120 : 0);
    pressTimer = setTimeout(() => key.classList.remove('is-pressed'), 170);
  });

  if (finePointer.matches) {
    $('#heroArt').addEventListener('pointermove', event => {
      if (!motion) return;
      const rect = $('#heroArt').getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      keyTilt.style.transform = `perspective(1000px) rotateX(${22 - y * 13}deg) rotateY(${-21 + x * 17}deg) rotateZ(-15deg)`;
    }, { passive: true });
    $('#heroArt').addEventListener('pointerleave', () => { keyTilt.style.transform = ''; });
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        if (!motion) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--tilt-x', `${-((event.clientY - rect.top) / rect.height - .5) * 4}deg`);
        card.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
    $$('.magnetic').forEach(element => {
      element.addEventListener('pointermove', event => {
        if (!motion) return;
        const rect = element.getBoundingClientRect();
        element.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .12}px ${(event.clientY - rect.top - rect.height / 2) * .12}px`;
      }, { passive: true });
      element.addEventListener('pointerleave', () => { element.style.translate = ''; });
    });
  }

  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    if (dirty || !geometry) measure();
    if (geometry.pinned) {
      window.scrollTo({ top: geometry.interestsTop + geometry.interestsRun * index / (cards.length - 1), behavior: motion ? 'smooth' : 'instant' });
    } else {
      viewport.scrollTo({ left: Math.min(geometry.trackRun, cards[index].offsetLeft - geometry.gutter), behavior: motion ? 'smooth' : 'instant' });
      updateInterest(index);
    }
  }));
  viewport.addEventListener('scroll', () => {
    if (geometry?.pinned) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const index = max > 0 ? Math.round(viewport.scrollLeft / max * (cards.length - 1)) : 0;
    updateInterest(index);
  }, { passive: true });

  function setMenu(open, restoreFocus = true) {
    menuOpen = open;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    body.classList.toggle('menu-open', open);
    $('main').inert = open;
    $('.brand').inert = open;
    $('.hello-link').inert = open;
    motionButton.inert = open;
    if (open) menu.querySelector('a').focus();
    else if (restoreFocus) menuButton.focus({ preventScroll: true });
    schedule(true);
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen));
  $$('#mobileMenu a').forEach(link => link.addEventListener('click', () => setMenu(false, false)));
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') setMenu(false);
    if (event.key === 'Tab') {
      const focusable = [menuButton, ...$$('#mobileMenu a')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  $('#copyEmail').addEventListener('click', async () => {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText('vaibhavchaudhary767@gmail.com');
      $('#copyFeedback').textContent = 'Copied. Your next great email starts here.';
      $('#copyEmail').classList.add('copied');
      $('#copyEmail').setAttribute('aria-label', 'Email address copied');
    } catch (_) {
      $('#copyFeedback').textContent = 'Select the email address to copy it.';
    }
    copyTimer = setTimeout(() => {
      $('#copyFeedback').textContent = '';
      $('#copyEmail').classList.remove('copied');
      $('#copyEmail').setAttribute('aria-label', 'Copy email address');
    }, 3500);
  });

  motionButton.addEventListener('click', () => {
    setMotion(!motion, true);
    try { sessionStorage.setItem('portfolio-motion', motion ? 'on' : 'off'); } catch (_) { /* Optional. */ }
  });
  reducedMotion.addEventListener('change', event => setMotion(!event.matches, true));
  pinnedLayout.addEventListener('change', () => {
    track.style.transform = '';
    viewport.scrollLeft = 0;
    cards.forEach(card => { card.style.transform = ''; });
    schedule(true);
  });
  addEventListener('scroll', () => schedule(), { passive: true });
  addEventListener('resize', () => {
    if (innerWidth > 640 && menuOpen) setMenu(false);
    schedule(true);
  }, { passive: true });
  addEventListener('pageshow', () => schedule(true));
  if (document.fonts) document.fonts.ready.then(() => schedule(true));
  if ('ResizeObserver' in window) new ResizeObserver(() => schedule(true)).observe($('main'));
  setMotion(motion);
  updateInterest(0);
})();
