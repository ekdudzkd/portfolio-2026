const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

if (menuButton && navigation) {
  const mobileQuery = window.matchMedia('(max-width: 600px)');
  const setMenu = (expanded) => {
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.textContent = expanded ? '닫기' : '메뉴';
    navigation.classList.toggle('is-collapsed', mobileQuery.matches && !expanded);
  };
  const syncMenu = () => {
    menuButton.hidden = !mobileQuery.matches;
    setMenu(!mobileQuery.matches);
  };
  menuButton.addEventListener('click', () =>
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true'),
  );
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a') && mobileQuery.matches) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      mobileQuery.matches &&
      menuButton.getAttribute('aria-expanded') === 'true'
    ) {
      setMenu(false);
      menuButton.focus();
    }
  });
  mobileQuery.addEventListener('change', syncMenu);
  syncMenu();
}
document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const heroStage = document.querySelector('.hero-stage');
if (heroStage) {
  const playground = heroStage.querySelector('.hero-playground');
  const typography = heroStage.querySelector('.hero-type');
  const tokens = [...heroStage.querySelectorAll('.skill-token')];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const targets = [
    0.14, 0.36, 0.54, 0.75, 0.9, 0.27, 0.48, 0.68, 0.83, 0.32, 0.61, 0.22, 0.78, 0.42, 0.87,
  ];
  const angles = tokens.map(() => (Math.random() - 0.5) * 24);
  const arrangeTokens = () => {
    const width = playground.clientWidth;
    const typeStyle = getComputedStyle(typography);
    if (context) {
      context.font = `${typeStyle.fontWeight} ${typeStyle.fontSize} ${typeStyle.fontFamily}`;
      const bounds = context.measureText(typography.textContent);
      if (Number.isFinite(bounds.fontBoundingBoxDescent)) {
        const leading =
          (parseFloat(typeStyle.lineHeight) -
            bounds.fontBoundingBoxAscent -
            bounds.fontBoundingBoxDescent) /
          2;
        document.documentElement.style.setProperty(
          '--hero-background-trim',
          `${parseFloat(typeStyle.fontSize) * 0.08 + bounds.fontBoundingBoxDescent + leading - bounds.actualBoundingBoxDescent}px`,
        );
      }
    }
    const typeRect = typography.getBoundingClientRect();
    const stageRect = playground.getBoundingClientRect();
    let floor = stageRect.bottom - typeRect.top;
    if (context) {
      context.font = `${typeStyle.fontWeight} ${typeStyle.fontSize} ${typeStyle.fontFamily}`;
      const metrics = context.measureText(typography.textContent);
      if (Number.isFinite(metrics.fontBoundingBoxAscent)) {
        const leading =
          (parseFloat(typeStyle.lineHeight) -
            metrics.fontBoundingBoxAscent -
            metrics.fontBoundingBoxDescent) /
          2;
        floor -= leading + metrics.fontBoundingBoxAscent - metrics.actualBoundingBoxAscent;
      }
    }
    const placed = [];
    tokens.forEach((token, index) => {
      const angle = angles[index];
      const radians = (Math.abs(angle) * Math.PI) / 180;
      const tokenWidth = token.offsetWidth;
      const tokenHeight = token.offsetHeight;
      const boxWidth = tokenWidth * Math.cos(radians) + tokenHeight * Math.sin(radians);
      const boxHeight = tokenHeight * Math.cos(radians) + tokenWidth * Math.sin(radians);
      const preferred = width * targets[index];
      let best;
      for (let step = 0; step <= 32; step += 1) {
        const x = boxWidth / 2 + 12 + ((width - boxWidth - 24) * step) / 32;
        let rise = 2;
        placed.forEach((box) => {
          if (Math.abs(x - box.x) < (boxWidth + box.width) / 2 + 3) {
            rise = Math.max(rise, box.top + 1);
          }
        });
        const score = rise + Math.abs(x - preferred) * 0.32;
        if (!best || score < best.score) best = { x, rise, score };
      }
      token.style.setProperty('--x', `${best.x}px`);
      token.style.setProperty('--tilt', `${angle.toFixed(1)}deg`);
      token.style.setProperty(
        '--landing-bottom',
        `${floor + best.rise + (boxHeight - tokenHeight) / 2}px`,
      );
      token.style.setProperty('--delay', `${index * 85}ms`);
      placed.push({ x: best.x, width: boxWidth, top: best.rise + boxHeight });
    });
    const pileHeight = Math.max(...placed.map((box) => box.top));

    let glyphHeight = parseFloat(typeStyle.fontSize) * 0.75;
    if (context) {
      const metrics = context.measureText(typography.textContent);
      glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
    const trim =
      parseFloat(document.documentElement.style.getPropertyValue('--hero-background-trim')) || 0;
    const viewportHeight = document.documentElement.clientHeight;
    playground.style.minHeight = '0px';
    playground.style.height = `${Math.max(200, viewportHeight - (stageRect.top + window.scrollY) + glyphHeight * 0.4 + trim)}px`;
  };
  let simulationFrame;
  let resizeFrame;
  let bodies = [];
  let currentWorld;
  let wake = () => {};
  let drag;
  let interactionReady = false;
  const setInteractionReady = (ready) => {
    interactionReady = ready;
    heroStage.classList.toggle('is-interactive', ready);
    tokens.forEach((token) => {
      token.tabIndex = ready ? 0 : -1;
      token.setAttribute('aria-disabled', String(!ready));
    });
  };
  const stop = () => cancelAnimationFrame(simulationFrame);
  const showStatic = () => {
    stop();
    tokens.forEach((token) => {
      token.style.removeProperty('transform');
      token.style.removeProperty('top');
      token.style.removeProperty('bottom');
      token.style.removeProperty('left');
      token.style.removeProperty('visibility');
    });
    arrangeTokens();
    heroStage.classList.remove('is-preparing');
  };
  const startDrop = (staticOnly = motionQuery.matches) => {
    drag = undefined;
    tokens.forEach((token) => token.classList.remove('is-dragging', 'is-landing-flash'));
    showStatic();
    setInteractionReady(staticOnly);
    const rect = playground.getBoundingClientRect();
    const firstToken = tokens[0];
    const radians = (Math.abs(angles[0]) * Math.PI) / 180;
    const boundsHeight =
      firstToken.offsetHeight * Math.cos(radians) + firstToken.offsetWidth * Math.sin(radians);
    const floor =
      rect.height -
      parseFloat(firstToken.style.getPropertyValue('--landing-bottom')) +
      (boundsHeight - firstToken.offsetHeight) / 2 -
      2;
    const world = new PillPhysics(rect.width, floor, 460);
    const playgroundPageTop = rect.top + window.scrollY;
    world.top = Math.min(
      floor - 120,
      -playgroundPageTop +
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
    );
    currentWorld = world;
    bodies = tokens.map((token, index) => {
      const landing = parseFloat(token.style.getPropertyValue('--landing-bottom'));
      const y = staticOnly
        ? rect.height - landing - token.offsetHeight / 2
        : -playgroundPageTop - token.offsetHeight - 100 - Math.random() * 80;
      const width = token.offsetWidth;
      const x = staticOnly
        ? parseFloat(token.style.getPropertyValue('--x'))
        : Math.max(
            width / 2 + 12,
            Math.min(rect.width - width / 2 - 12, rect.width * (0.2 + Math.random() * 0.6)),
          );
      token.style.left = '0';
      token.style.top = '0';
      token.style.bottom = 'auto';
      token.style.visibility = 'hidden';
      return world.add({
        element: token,
        width,
        height: token.offsetHeight,
        x,
        y,
        startY: y,
        vx: staticOnly ? 0 : (Math.random() - 0.5) * 65,
        angle: staticOnly ? (angles[index] * Math.PI) / 180 : 0,
        active: staticOnly,
        landed: staticOnly,
        turned: staticOnly,
        initialSpin: (Math.random() - 0.5) * 0.8,
        release: staticOnly ? 0 : index * 0.17 + Math.random() * 0.08,
      });
    });
    let previous;
    let accumulator = 0;
    let quietTime = 0;
    let running = false;
    let runningTime = 0;
    const render = () =>
      bodies.forEach((body) => {
        body.element.style.visibility = body.active ? 'visible' : 'hidden';
        body.element.style.transform = `translate(${body.x - body.width / 2}px, ${body.y - body.height / 2}px) rotate(${body.angle}rad)`;
      });
    const tick = (now) => {
      if (document.hidden) {
        previous = now;
        simulationFrame = requestAnimationFrame(tick);
        return;
      }
      const elapsed = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      accumulator += elapsed;
      while (accumulator >= 1 / 120) {
        world.step(1 / 120);
        accumulator -= 1 / 120;
      }
      runningTime += elapsed;
      if (!staticOnly && !motionQuery.matches) {
        bodies.forEach((body) => {
          if (body.landed && body.landingFlashAt === undefined) {
            body.landingFlashAt = world.time;
            body.element.classList.add('is-landing-flash');
          }
          if (body.landingFlashAt !== undefined && world.time - body.landingFlashAt >= 0.24) {
            body.element.classList.remove('is-landing-flash');
          }
        });
      }
      if (!interactionReady && bodies.every((body) => body.active && body.landed)) {
        setInteractionReady(true);
      }
      render();
      const quiet =
        !drag &&
        bodies.every(
          (body) => body.active && Math.hypot(body.vx, body.vy) < 4 && Math.abs(body.spin) < 0.035,
        );
      quietTime = quiet ? quietTime + elapsed : 0;
      if (drag || (quietTime < 0.7 && runningTime < 16))
        simulationFrame = requestAnimationFrame(tick);
      else {
        running = false;
        bodies.forEach((body) => {
          body.vx = 0;
          body.vy = 0;
          body.spin = 0;
        });
        setInteractionReady(true);
      }
    };
    wake = () => {
      quietTime = 0;
      runningTime = 0;
      if (!running) {
        running = true;
        previous = undefined;
        simulationFrame = requestAnimationFrame(tick);
      }
    };
    render();
    if (!staticOnly) wake();
  };
  arrangeTokens();
  if (!motionQuery.matches) heroStage.classList.add('is-preparing');
  document.fonts.ready.then(() => requestAnimationFrame(() => startDrop(motionQuery.matches)));
  motionQuery.addEventListener('change', () => {
    if (motionQuery.matches) startDrop(true);
  });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => startDrop(interactionReady || motionQuery.matches));
  });
  const pointerPosition = (event, body) => {
    const rect = playground.getBoundingClientRect();
    return {
      x: Math.max(
        body.width / 2,
        Math.min(currentWorld.width - body.width / 2, event.clientX - rect.left),
      ),
      y: Math.max(
        currentWorld.top + body.height / 2,
        Math.min(currentWorld.floor - body.height / 2, event.clientY - rect.top),
      ),
    };
  };
  const finishDrag = (event, cancelled = false) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const { body, samples } = drag;
    if (!cancelled) {
      const recent = samples.filter((sample) => event.timeStamp - sample.time < 100);
      if (recent.length >= 2) {
        const first = recent[0],
          last = recent[recent.length - 1];
        const dt = Math.max(0.016, (last.time - first.time) / 1000);
        const vx = (last.x - first.x) / dt,
          vy = (last.y - first.y) / dt;
        const scale = Math.max(1, Math.hypot(vx, vy) / 850);
        body.vx = vx / scale;
        body.vy = vy / scale;
      } else {
        body.vx = 0;
        body.vy = 0;
      }
    }
    body.grab = undefined;
    body.element.classList.remove('is-dragging');
    drag = undefined;
    if (body.element.hasPointerCapture(event.pointerId))
      body.element.releasePointerCapture(event.pointerId);
    wake();
  };
  tokens.forEach((token, index) => {
    token.tabIndex = -1;
    token.setAttribute('aria-disabled', 'true');
    token.setAttribute('role', 'button');
    token.setAttribute(
      'aria-label',
      `${token.dataset.tokenLabel || token.textContent}, 드래그로 던지기. 방향키로 이동`,
    );
    token.addEventListener('pointerdown', (event) => {
      if (!interactionReady || drag || event.button !== 0 || !bodies[index]?.active) return;
      event.preventDefault();
      const body = bodies[index];
      const position = pointerPosition(event, body);
      const dx = position.x - body.x,
        dy = position.y - body.y;
      body.grab = {
        ...position,
        localX: dx * Math.cos(body.angle) + dy * Math.sin(body.angle),
        localY: -dx * Math.sin(body.angle) + dy * Math.cos(body.angle),
      };
      body.turned = true;
      drag = {
        body,
        pointerId: event.pointerId,
        samples: [{ ...position, time: event.timeStamp }],
      };
      token.setPointerCapture(event.pointerId);
      token.classList.add('is-dragging');
      token.focus({ preventScroll: true, focusVisible: false });
      wake();
    });
    token.addEventListener('pointermove', (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const position = pointerPosition(event, drag.body);
      Object.assign(drag.body.grab, position);
      drag.samples.push({ ...position, time: event.timeStamp });
      drag.samples = drag.samples.filter((sample) => event.timeStamp - sample.time < 120);
    });
    token.addEventListener('pointerup', (event) => finishDrag(event));
    token.addEventListener('pointercancel', (event) => finishDrag(event, true));
    token.addEventListener('lostpointercapture', (event) => finishDrag(event, true));
    token.addEventListener('keydown', (event) => {
      const directions = {
        ArrowLeft: [-160, -70],
        ArrowRight: [160, -70],
        ArrowUp: [0, -240],
        ArrowDown: [0, 100],
      };
      const direction = directions[event.key];
      if (!interactionReady || !direction || !bodies[index]?.active) return;
      event.preventDefault();
      bodies[index].vx += direction[0];
      bodies[index].vy += direction[1];
      wake();
    });
  });
}

const aboutSection = document.querySelector('#about');
if (aboutSection) {
  const fadeLayer = document.createElement('div');
  fadeLayer.className = 'section-scroll-fade';
  fadeLayer.setAttribute('aria-hidden', 'true');
  document.body.append(fadeLayer);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let fadeFrame;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const smooth = (value) => value * value * (3 - 2 * value);
  const updateSectionFade = () => {
    fadeFrame = undefined;
    const rect = aboutSection.getBoundingClientRect();
    const viewport = window.innerHeight;
    const entering = smooth(clamp((viewport * 0.7 - rect.top) / (viewport * 0.65)));
    const leaving = smooth(clamp((rect.bottom + 100) / (viewport * 0.4)));
    fadeLayer.style.setProperty(
      '--section-fade-opacity',
      reducedMotion.matches ? 0 : (entering * leaving).toFixed(3),
    );
  };
  const scheduleSectionFade = () => {
    if (fadeFrame === undefined) fadeFrame = requestAnimationFrame(updateSectionFade);
  };
  window.addEventListener('scroll', scheduleSectionFade, { passive: true });
  window.addEventListener('resize', scheduleSectionFade);
  reducedMotion.addEventListener('change', scheduleSectionFade);
  document.fonts.ready.then(scheduleSectionFade);
  updateSectionFade();
}

const timelineEntries = document.querySelector('.timeline-entries');
if (timelineEntries) {
  const layoutTimeline = () => {
    const width = timelineEntries.clientWidth;
    const occupied = [];
    const starts = [20, 34, 100, 150, 164, 100, 150, 220, 260, 240, 300];
    [...timelineEntries.children].forEach((row, index) => {
      const label = row.querySelector('.timeline-label');
      const left = label.offsetLeft;
      const labelWidth = label.offsetWidth;
      const labelHeight = label.offsetHeight;
      const start = (parseFloat(row.style.getPropertyValue('--start')) / 100) * width;
      const duration = (parseFloat(row.style.getPropertyValue('--duration')) / 100) * width;
      let top = starts[index] * 0.48;
      let collision;
      do {
        collision = occupied.find((item) => {
          const labelOverlap =
            left < item.right + 12 &&
            left + labelWidth + 12 > item.left &&
            top + 31 < item.bottom + 3 &&
            top + 31 + labelHeight + 3 > item.top;
          const barOverText =
            start < item.right &&
            start + duration > item.left &&
            top < item.bottom + 3 &&
            top + 24 > item.top - 3;
          const textOverBar =
            left < item.barRight &&
            left + labelWidth > item.barLeft &&
            top + 31 < item.barTop + 24 &&
            top + 31 + labelHeight > item.barTop;
          return labelOverlap || barOverText || textOverBar;
        });
        if (collision) top = Math.max(top + 8, collision.bottom + 3);
      } while (collision);
      row.style.top = `${top}px`;
      occupied.push({
        left,
        right: left + labelWidth,
        top: top + 31,
        bottom: top + 31 + labelHeight,
        barLeft: start,
        barRight: start + duration,
        barTop: top,
      });
    });
    timelineEntries.style.minHeight = `${Math.ceil(Math.max(...occupied.map((item) => item.bottom)) + 16)}px`;
  };
  new ResizeObserver(layoutTimeline).observe(timelineEntries);
  document.fonts.ready.then(layoutTimeline);
  layoutTimeline();
}

const timelineHighlights = document.querySelectorAll('.timeline-bar, .timeline-event');
if (timelineHighlights.length && 'IntersectionObserver' in window) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const highlightObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-filled');
          entry.target.parentElement.querySelector('.timeline-label')?.classList.add('is-revealed');
          highlightObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -50px 0px', threshold: 0.1 },
  );
  if (!motionPreference.matches) {
    timelineHighlights.forEach((highlight) => {
      highlight.classList.add('is-fill-ready');
      highlight.parentElement.querySelector('.timeline-label')?.classList.add('is-reveal-ready');
      highlightObserver.observe(highlight);
    });
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      highlightObserver.disconnect();
      timelineHighlights.forEach((highlight) => {
        highlight.classList.add('is-filled');
        highlight.parentElement.querySelector('.timeline-label')?.classList.add('is-revealed');
      });
    }
  });
}

const skillItems = document.querySelectorAll('#skills .skill-list > div');
if (skillItems.length && 'IntersectionObserver' in window) {
  const skillMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const skillObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-skill-revealed');
          skillObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.15 },
  );
  if (!skillMotionPreference.matches) {
    skillItems.forEach((item) => {
      item.classList.add('is-skill-reveal-ready');
      skillObserver.observe(item);
    });
  }
  skillMotionPreference.addEventListener('change', () => {
    if (skillMotionPreference.matches) {
      skillObserver.disconnect();
      skillItems.forEach((item) => item.classList.add('is-skill-revealed'));
    }
  });
}

const aboutTexts = document.querySelectorAll('#about .about-intro');
if (aboutTexts.length && 'IntersectionObserver' in window) {
  const aboutMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-about-revealed');
          aboutObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.35 },
  );
  if (!aboutMotionPreference.matches) {
    aboutTexts.forEach((text) => {
      text.classList.add('is-about-reveal-ready');
      aboutObserver.observe(text);
    });
  }
  aboutMotionPreference.addEventListener('change', () => {
    if (aboutMotionPreference.matches) {
      aboutObserver.disconnect();
      aboutTexts.forEach((text) => text.classList.add('is-about-revealed'));
    }
  });
}

const processGraph = document.querySelector('.process-graph');
if (processGraph && 'IntersectionObserver' in window) {
  const graphMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let graphFrame;
  const revealGraph = (progress) => {
    const width = processGraph.getBoundingClientRect().width;
    const gutter = Math.max(0, (document.documentElement.clientWidth - width) / 2);
    const rightInset = (width + gutter * 2) * (1 - progress) - gutter;
    processGraph.style.clipPath = `inset(-8px ${rightInset}px -8px ${-gutter}px)`;
  };
  const graphObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      graphObserver.disconnect();
      let started;
      const drawGraph = (now) => {
        started ??= now;
        const progress = Math.min(1, (now - started) / 4200);
        revealGraph(progress);
        if (progress < 1) graphFrame = requestAnimationFrame(drawGraph);
        else processGraph.style.removeProperty('clip-path');
      };
      graphFrame = requestAnimationFrame(drawGraph);
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.4 },
  );
  if (!graphMotionPreference.matches) {
    revealGraph(0);
    graphObserver.observe(
      document.querySelector('#collaboration .section-top') || processGraph.parentElement,
    );
  }
  graphMotionPreference.addEventListener('change', () => {
    if (graphMotionPreference.matches) {
      cancelAnimationFrame(graphFrame);
      graphObserver.disconnect();
      processGraph.style.removeProperty('clip-path');
    }
  });
}
