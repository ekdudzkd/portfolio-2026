const familyPrototypePanel = document.querySelector(".family-prototype-inline");
const familyReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!familyReducedMotion.matches && "IntersectionObserver" in window) {
  const problem = document.querySelector("#problem");
  const direction = document.querySelector(".family-design-needs");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("family-revealed");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
  );
  [problem, direction].forEach((section) => {
    if (!section) return;
    section.classList.add("family-motion-ready");
    revealObserver.observe(section);
  });
  familyReducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    revealObserver.disconnect();
    document.querySelectorAll(".family-motion-ready").forEach((section) => {
      section.classList.add("family-revealed");
    });
  });
}
const familyPrototypeFrame = familyPrototypePanel?.querySelector("iframe");

function showFamilyPrototypeNode(node) {
  if (!familyPrototypeFrame) return;
  const source = new URL(familyPrototypeFrame.src);
  source.searchParams.set("node-id", node);
  source.searchParams.set("starting-point-node-id", node.replace("-", ":"));
  familyPrototypeFrame.src = source.href;
  familyPrototypePanel.querySelectorAll("[data-prototype-node]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.prototypeNode === node));
  });
}
familyPrototypePanel?.querySelectorAll("[data-prototype-node]").forEach((button) => {
  button.addEventListener("click", () => showFamilyPrototypeNode(button.dataset.prototypeNode));
});

document.querySelectorAll(".family-screen-strip").forEach((strip) => {
  strip.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1;
      const distance = event.deltaY * unit;
      const limit = strip.scrollWidth - strip.clientWidth;
      const next = Math.max(0, Math.min(limit, strip.scrollLeft + distance));
      // At either end, let the wheel continue scrolling the page.
      if (Math.abs(next - strip.scrollLeft) < 1) return;

      event.preventDefault();
      strip.scrollLeft = next;
    },
    { passive: false },
  );
});
