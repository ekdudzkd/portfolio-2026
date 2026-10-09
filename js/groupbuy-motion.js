const groupbuyMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!groupbuyMotionPreference.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("gb-motion-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  document
    .querySelectorAll(
      ".gb-product-nav-image, .gb-seller-step-image, .gb-seller-check-image, .gb-ai-analysis-image, .gb-wishlist-flow",
    )
    .forEach((element) => {
      element.classList.add("gb-motion-callouts");
      observer.observe(element);
    });

  groupbuyMotionPreference.addEventListener("change", (event) => {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll(".gb-motion-callouts").forEach((element) => {
      element.classList.add("gb-motion-visible");
    });
  });
}
