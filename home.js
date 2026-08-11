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
  const primaryReferenceRows = {
    'Home': '-2%',
    'All Subjects': '-13.18%',
    'My Notes': '-23.18%',
    'Favorites': '-33.39%',
    'Bookmarks': '-43.22%',
    'Downloads (Offline)': '-53.05%',
    'Recently Studied': '-62.51%',
    'Study Progress': '-71.74%',
    'Achievements': '-80.71%',
    'Daily Goals': '-90.17%'
  };
  if (primaryReferenceRows[label]) {
    return `<button class="drawer-item primary-reference-row${active}" ${action} aria-label="${label}" style="--row-shift:${primaryReferenceRows[label]}"><img src="assets/drawer-primary-menu-reference-exact.png" alt=""></button>`;
  }
  const secondaryReferenceRows = {
    'Revision Planner': '-1.8%',
    'Maps': '-14%',
    'Dictionary': '-25.4%',
    'Videos': '-36.2%',
    'Images': '-47.4%',
    'PDF Library': '-58.1%',
    'Music Corner': '-68.5%',
    'Ask Curio': '-79.1%',
    'Settings': '-90%'
  };
  if (secondaryReferenceRows[label]) {
    return `<button class="drawer-item secondary-reference-row" ${action} aria-label="${label}" style="--row-shift:${secondaryReferenceRows[label]}"><img src="assets/drawer-secondary-menu-reference-exact.png" alt=""></button>`;
  }
  if (label === 'Themes') {
    return `<button class="drawer-item theme-reference-row" ${action} aria-label="Themes"><img src="assets/drawer-theme-reference-exact.png" alt=""></button>`;
  }
  const utilityReferenceRows = {
    'Notifications': '-3.45%',
    'Backup & Sync': '-23.7%',
    'Feedback': '-42.77%',
    'Help & Support': '-61.91%',
    "About Rupai's World": '-79.95%'
  };
  if (utilityReferenceRows[label]) {
    return `<button class="drawer-item utility-reference-row" ${action} aria-label="${label}" style="--row-shift:${utilityReferenceRows[label]}"><img src="assets/drawer-utility-menu-reference-exact.png" alt=""></button>`;
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
  if (trigger?.dataset.panel === 'Ask Curio') {
    window.location.href = 'studio/ask-curio.html';
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
