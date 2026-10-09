const matchingReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!matchingReducedMotion.matches && "IntersectionObserver" in window) {
  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("blind-motion-visible");
        motionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
  );
  document.querySelectorAll(".blind-problem-grid, .blind-copy-highlight, #solution .case-section-heading, #solution .case-solution, #result .case-section-heading, #result .blind-reflection-copy").forEach((element) => {
    element.classList.add("blind-motion-ready");
    motionObserver.observe(element);
  });
  matchingReducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    motionObserver.disconnect();
    document.querySelectorAll(".blind-motion-ready").forEach((element) => {
      element.classList.add("blind-motion-visible");
    });
  });
}
