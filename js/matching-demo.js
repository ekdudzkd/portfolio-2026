const demoVideo = document.querySelector(".blind-demo-video");
document.querySelectorAll("[data-demo-time]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!demoVideo) return;
    const seekAndPlay = () => {
      demoVideo.currentTime = Number(button.dataset.demoTime);
      demoVideo.play().catch(() => {});
    };
    if (demoVideo.readyState >= 1) seekAndPlay();
    else {
      demoVideo.addEventListener("loadedmetadata", seekAndPlay, { once: true });
      demoVideo.load();
    }
  });
});
