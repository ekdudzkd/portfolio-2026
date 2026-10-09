document.querySelectorAll("[data-collab-dialog]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.collabDialog);
  if (!dialog) return;

  button.addEventListener("click", () => {
    dialog.showModal();
    document.documentElement.classList.add("gb-dialog-open");
    dialog.scrollTop = 0;
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("gb-dialog-open");
    button.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  });
});
