const $ = (selector) => document.querySelector(selector);
const dialog = $('#comingSoon');
const drawer = $('#mainDrawer');
const drawerToggle = $('#drawerToggle');
const drawerClose = $('#drawerClose');
const drawerCloseTop = $('#drawerCloseTop');
const drawerBackdrop = $('#drawerBackdrop');
let drawerTimer;

const drawerReferenceItems = [
  ['🏠','Home','scroll','top'],
  ['📘','All Subjects','panel','Subjects'],
  ['📝','My Notes','panel','My Notes'],
  ['♥','Favorites','panel','Favorites'],
  ['🔖','Bookmarks','panel','Bookmarks'],
  ['☁️','Downloads (Offline)','panel','Downloads (Offline)'],
  ['⏱️','Recently Studied','panel','Recently Studied'],
  ['📊','Study Progress','panel','Study Progress'],
  ['🏆','Achievements','panel','Achievements'],
  ['🎯','Daily Goals','panel','Daily Goals','group-start'],
  ['🗓️','Revision Planner','panel','Revision Planner'],
  ['🌍','Maps','panel','Maps','group-start'],
  ['📙','Dictionary','panel','Dictionary'],
  ['▶️','Videos','panel','Videos'],
  ['🖼️','Images','panel','Images'],
  ['📕','PDF Library','panel','PDF Library'],
  ['🎵','Music Corner','panel','Music Corner'],
  ['🤖','Ask Curio','panel','Ask Curio'],
  ['⚙️','Settings','panel','Settings','group-start'],
  ['🎨','Themes','panel','Themes'],
  ['🔔','Notifications','panel','Notifications'],
  ['☁️','Backup & Sync','panel','Backup & Sync'],
  ['💬','Feedback','panel','Feedback','group-start'],
  ['❓','Help & Support','panel','Help & Support'],
  ['ℹ️',"About Rupai's World",'panel',"About Rupai's World"]
];

drawer.querySelector('.drawer-menu').innerHTML = drawerReferenceItems.map(([icon,label,type,value,group]) => {
  const action = type === 'scroll' ? `data-scroll="${value}"` : `data-panel="${value}"`;
  const active = label === 'Home' ? ' active' : '';
  if (label === 'Home') {
    return `<button class="drawer-item home-logo-row${active}" ${action} aria-label="Home"><img src="assets/drawer-home-row-v2.png" alt="Home"></button>`;
  }
  if (label === 'All Subjects') {
    return `<button class="drawer-item subjects-logo-row" ${action} aria-label="All Subjects"><img src="assets/drawer-all-subjects-row-v2.png" alt="All Subjects"></button>`;
  }
  if (label === 'My Notes') {
    return `<button class="drawer-item notes-logo-row" ${action} aria-label="My Notes"><img src="assets/drawer-my-notes-row-v2.png" alt="My Notes"></button>`;
  }
  if (label === 'Favorites') {
    return `<button class="drawer-item favorites-logo-row" ${action} aria-label="Favorites"><img src="assets/drawer-favorites-row-v2.png" alt="Favorites"></button>`;
  }
  const referenceRows = {
    'Bookmarks': ['drawer-bookmarks-row-v2.png', 'Bookmarks'],
    'Downloads (Offline)': ['drawer-downloads-offline-row-v2.png', 'Downloads Offline'],
    'Recently Studied': ['drawer-recently-studied-row-v2.png', 'Recently Studied'],
    'Study Progress': ['drawer-study-progress-row-v2.png', 'Study Progress'],
    'Achievements': ['drawer-achievements-row-v2.png', 'Achievements'],
    'Daily Goals': ['drawer-daily-goals-row-v2.png', 'Daily Goals'],
    'Revision Planner': ['drawer-revision-planner-row-v2.png', 'Revision Planner'],
    'Maps': ['drawer-maps-row-v2.png', 'Maps'],
    'Dictionary': ['drawer-dictionary-row-v2.png', 'Dictionary'],
    'Videos': ['drawer-videos-row-v2.png', 'Videos'],
    'Images': ['drawer-images-row-v2.png', 'Images'],
    'PDF Library': ['drawer-pdf-library-row-v2.png', 'PDF Library'],
    'Music Corner': ['drawer-music-corner-row-v2.png', 'Music Corner'],
    'Ask Curio': ['drawer-ask-curio-row-v2.png', 'Ask Curio'],
    'Settings': ['drawer-settings-row-v2.png', 'Settings'],
    'Themes': ['drawer-themes-row-v2.png', 'Themes'],
    'Notifications': ['drawer-notifications-row-v2.png', 'Notifications'],
    'Backup & Sync': ['drawer-backup-sync-row-v2.png', 'Backup & Sync'],
    'Feedback': ['drawer-feedback-row-v2.png', 'Feedback'],
    'Help & Support': ['drawer-help-support-row-v2.png', 'Help & Support'],
    "About Rupai's World": ['drawer-about-rupais-world-row-v2.png', "About Rupai's World"]
  };
  if (referenceRows[label]) {
    const [image, alt] = referenceRows[label];
    return `<button class="drawer-item reference-logo-row" ${action} aria-label="${alt}"><img src="assets/${image}" alt="${alt}"></button>`;
  }
  return `<button class="drawer-item${active}${group ? ` ${group}` : ''}" ${action}><span>${icon}</span><b>${label}</b><i>›</i></button>`;
}).join('') + `
  <section class="dream-progress-reference" aria-label="Dream Progress">
    <div class="dream-progress-crop">
      <img src="assets/drawer-dream-progress-reference.png" alt="Dream Progress: SSC Preparation 72 percent and Rupai's World 41 percent">
    </div>
  </section>`;

if (window.RupaiAuth?.canAccessStudio()) {
  const studioLink = document.createElement('a');
  studioLink.className = 'drawer-item studio-link';
  studioLink.href = 'studio/index.html';
  studioLink.innerHTML = '<span>✦</span><b>Teach Curio Studio</b><i>›</i>';
  studioLink.setAttribute('aria-label', 'Open Teach Curio Studio');
  drawer.querySelector('.drawer-menu').appendChild(studioLink);
}

function openDrawer() {
  clearTimeout(drawerTimer);
  drawerBackdrop.hidden = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawerToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('drawer-open');
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-visible');
  });
  drawer.querySelector('.drawer-item')?.focus({ preventScroll: true });
}

function closeDrawer(restoreFocus = true) {
  drawer.classList.remove('is-open');
  drawerBackdrop.classList.remove('is-visible');
  drawer.setAttribute('aria-hidden', 'true');
  drawerToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('drawer-open');
  drawerTimer = setTimeout(() => { drawerBackdrop.hidden = true; }, 340);
  if (restoreFocus) drawerToggle.focus({ preventScroll: true });
}

drawerToggle.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', () => closeDrawer());
drawerCloseTop.addEventListener('click', () => closeDrawer());
drawerBackdrop.addEventListener('click', () => closeDrawer());
drawer.addEventListener('click', (event) => {
  if (event.target.closest('.drawer-item')) closeDrawer(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
});

function openPanel(name) {
  $('#dialogTitle').textContent = name;
  const panelAliases = new Set([name]);
  if (name === 'My Notes') panelAliases.add('Notes');
  if (name === 'Study Progress') panelAliases.add('Progress');
  document.querySelectorAll('.bottom-nav .active, .drawer-menu .active').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.bottom-nav [data-panel], .drawer-menu [data-panel]').forEach((item) => {
    if (panelAliases.has(item.dataset.panel)) item.classList.add('active');
  });
  if (typeof dialog.showModal === 'function') dialog.showModal();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-panel]');
  if (trigger?.dataset.panel === 'Search') {
    window.location.href = 'search.html';
    return;
  }
  if (trigger?.dataset.panel === 'Subjects') {
    window.location.href = 'subjects.html';
    return;
  }
  if (trigger?.dataset.panel === 'Favorites') {
    window.location.href = 'favorites.html';
    return;
  }
  if (trigger?.dataset.panel === 'Revision' || trigger?.dataset.panel === 'Revision Planner') {
    window.location.href = 'revision.html';
    return;
  }
  if (trigger) openPanel(trigger.dataset.panel);
  if (event.target.closest('[data-scroll="top"]')) window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('.dialog-close').addEventListener('click', () => dialog.close());
$('.dialog-ok').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const requestedPanel = new URLSearchParams(window.location.search).get('panel');
if (requestedPanel) openPanel(requestedPanel);

function updateClock() {
  const now = new Date();
  $('#todayDate').textContent = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  $('#todayDay').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(now);
  $('#currentTime').textContent = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(now);
}
updateClock();
setInterval(updateClock, 30000);

$('#smartSearch').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = event.currentTarget.querySelector('input').value.trim();
  window.location.href = `search.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
});

let remaining = 25 * 60;
let timerId = null;
const timer = $('#timer');
const focusButton = $('#focusButton');

function paintTimer() {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  timer.textContent = `${minutes}:${seconds}`;
}

focusButton.addEventListener('click', () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    focusButton.textContent = 'Resume Focus';
    return;
  }
  focusButton.textContent = 'Pause';
  timerId = setInterval(() => {
    remaining -= 1;
    paintTimer();
    if (remaining <= 0) {
      clearInterval(timerId);
      timerId = null;
      remaining = 25 * 60;
      focusButton.textContent = 'Start Again';
      openPanel('Focus complete — beautiful work!');
    }
  }, 1000);
});
