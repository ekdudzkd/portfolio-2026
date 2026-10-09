document.querySelectorAll(".blind-screen-strip").forEach((strip) => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const screens = [...strip.children];
  screens.forEach((screen) => {
    const duplicate = screen.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    strip.append(duplicate);
  });
  let hovered = false;
  let focused = false;
  let visible = false;
  let resumeAt = 0;
  let previousTime = 0;
  let position = strip.scrollLeft;
  strip.addEventListener("mouseenter", () => {
    hovered = true;
  });
  strip.addEventListener("mouseleave", () => {
    hovered = false;
  });
  strip.addEventListener("focusin", () => {
    focused = true;
  });
  strip.addEventListener("focusout", () => {
    focused = false;
  });
  strip.addEventListener("pointerdown", () => {
    resumeAt = performance.now() + 3000;
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(strip);
  const animate = (time) => {
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
    previousTime = time;
    const loopWidth = strip.children[screens.length].offsetLeft - screens[0].offsetLeft;
    if (
      visible &&
      !document.hidden &&
      !hovered &&
      !focused &&
      time > resumeAt &&
      !reducedMotion.matches
    ) {
      position += elapsed * 0.024;
      if (loopWidth > 0 && position >= loopWidth) position -= loopWidth;
      strip.scrollLeft = position;
    } else {
      position = strip.scrollLeft;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  strip.addEventListener(
    "wheel",
    (event) => {
      resumeAt = performance.now() + 3000;
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1;
      const limit = strip.scrollWidth - strip.clientWidth;
      const next = Math.max(0, Math.min(limit, strip.scrollLeft + event.deltaY * unit));
      if (Math.abs(next - strip.scrollLeft) < 1) return;
      event.preventDefault();
      strip.scrollLeft = next;
    },
    { passive: false },
  );
});
