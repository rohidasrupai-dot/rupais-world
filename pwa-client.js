(function () {
  'use strict';
  var host;
  var waitingWorker = null;
  var refreshing = false;
  var installEvent = null;
  var unsavedWork = false;

  function ensureHost() {
    if (host) return host;
    host = document.createElement('div');
    host.className = 'pwa-status-host';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'true');
    document.body.appendChild(host);
    return host;
  }

  function remove(id) {
    var item = document.getElementById(id);
    if (item) item.remove();
  }

  function showOffline() {
    var item = document.getElementById('pwaOfflineStatus');
    if (!item) {
      item = document.createElement('div');
      item.id = 'pwaOfflineStatus';
      item.className = 'pwa-status';
      item.innerHTML = '<span class="pwa-offline-dot" aria-hidden="true"></span><span>Offline — saved lessons and local tools are still available.</span>';
      ensureHost().appendChild(item);
    }
    item.hidden = navigator.onLine;
    document.querySelectorAll('[data-requires-network]').forEach(function (control) {
      control.toggleAttribute('disabled', !navigator.onLine);
      control.setAttribute('aria-disabled', String(!navigator.onLine));
      if (!navigator.onLine) control.title = 'Internet required for this action.';
      else if (control.title === 'Internet required for this action.') control.removeAttribute('title');
    });
  }

  function showRestored() {
    showOffline();
    var item = document.createElement('div');
    item.className = 'pwa-status';
    item.id = 'pwaConnectionRestored';
    item.textContent = 'Connection restored.';
    ensureHost().appendChild(item);
    setTimeout(function () { remove('pwaConnectionRestored'); }, 3500);
  }

  function showUpdate(worker) {
    waitingWorker = worker;
    if (document.getElementById('pwaUpdateStatus')) return;
    var item = document.createElement('div');
    item.id = 'pwaUpdateStatus';
    item.className = 'pwa-status pwa-update';
    item.innerHTML = '<span>A newer app version is ready.</span><button type="button">Update when ready</button>';
    item.querySelector('button').addEventListener('click', function () {
      if (unsavedWork) {
        item.querySelector('span').textContent = 'Save or submit your current work before updating.';
        return;
      }
      if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    });
    ensureHost().appendChild(item);
  }

  function showInstall() {
    if (!installEvent || document.getElementById('pwaInstallStatus')) return;
    var item = document.createElement('div');
    item.id = 'pwaInstallStatus';
    item.className = 'pwa-status pwa-install';
    item.innerHTML = '<span>Install Rupai\'s World on this device?</span><button type="button">Install</button>';
    item.querySelector('button').addEventListener('click', async function () {
      if (!installEvent) return;
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
      remove('pwaInstallStatus');
    });
    ensureHost().appendChild(item);
  }

  function exposeCacheVersion() {
    if (!navigator.serviceWorker.controller) return;
    var channel = new MessageChannel();
    channel.port1.onmessage = function (event) {
      if (event.data?.version) document.documentElement.dataset.pwaCacheVersion = event.data.version;
    };
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_SUMMARY' }, [channel.port2]);
  }

  window.addEventListener('online', showRestored);
  window.addEventListener('offline', showOffline);
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installEvent = event;
    showInstall();
  });
  window.addEventListener('appinstalled', function () {
    installEvent = null;
    remove('pwaInstallStatus');
  });

  document.addEventListener('DOMContentLoaded', showOffline);
  document.addEventListener('input', function (event) {
    if (event.target.matches('input:not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]')) unsavedWork = true;
  });
  document.addEventListener('submit', function () { unsavedWork = false; });
  window.addEventListener('beforeunload', function (event) {
    if (!unsavedWork) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.documentElement.dataset.pwaServiceWorker = 'unsupported';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' }).then(function (registration) {
        document.documentElement.dataset.pwaServiceWorker = 'registered';
        exposeCacheVersion();
        if (registration.waiting) showUpdate(registration.waiting);
        registration.addEventListener('updatefound', function () {
          var installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', function () {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) showUpdate(installing);
          });
        });
      }).catch(function () {
        document.documentElement.dataset.pwaServiceWorker = 'unavailable';
        // Normal browsing remains available when service workers are unsupported or blocked.
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
}());
