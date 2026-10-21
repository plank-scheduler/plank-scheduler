// Capture this event before the booking page's client-only bundle is ready.
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  window.__plankSchedulerInstallPrompt = event;
});
window.addEventListener('appinstalled', function () {
  window.__plankSchedulerInstallPrompt = null;
  window.__plankSchedulerInstalled = true;
});
