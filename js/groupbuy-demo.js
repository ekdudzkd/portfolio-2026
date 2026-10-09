const demoVideo = document.querySelector(".gb-demo-video");
const demoChapters = document.querySelector(".gb-demo-chapters");

if (demoVideo && demoChapters) {
  let pendingTime = null;

  demoVideo.addEventListener("loadedmetadata", () => {
    if (pendingTime !== null) {
      demoVideo.currentTime = pendingTime;
      pendingTime = null;
    }
  });

  demoChapters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-demo-time]");
    if (!button) return;

    const time = Number(button.dataset.demoTime);
    if (demoVideo.readyState >= 1) {
      demoVideo.currentTime = time;
    } else {
      pendingTime = time;
      demoVideo.load();
    }
    demoVideo.play().catch(() => {
      // 재생이 제한된 환경에서는 영상의 기본 재생 버튼을 사용할 수 있습니다.
    });
  });
}
