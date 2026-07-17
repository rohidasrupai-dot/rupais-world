const historyPeriods = [
  {id:'ancient',title:'Ancient History',subtitle:'From the beginning of civilizations to the fall of ancient empires.',accentColour:'#8a55c5',route:'history.html?period=ancient',previewTopics:['Stone Age','Indus Valley Civilization','Vedic Period','Buddhism','Jainism','Mahajanapadas','Mauryan Empire','Gupta Empire','Sangam Age'],totalChapters:11,completedChapters:0,progress:0,lastOpenedChapter:'',isFavorite:false,isDownloaded:false},
  {id:'medieval',title:'Medieval History',subtitle:'From ancient empires to the rise of medieval kingdoms.',accentColour:'#df4e6c',route:'medieval-history.html',previewTopics:['Early Medieval India','Rajput Kingdoms','Delhi Sultanate','Vijayanagara Empire','Bahmani Kingdom','Mughal Empire','Maratha Empire','Bhakti Movement','Sufi Movement'],totalChapters:11,completedChapters:0,progress:0,lastOpenedChapter:'',isFavorite:false,isDownloaded:false},
  {id:'modern',title:'Modern History',subtitle:'From the 18th century to the contemporary world and independence.',accentColour:'#4c8b39',route:'modern-history.html',previewTopics:['Rise of British Power','Revolt of 1857','Social and Religious Reforms','Indian National Movement','Gandhian Era','World Wars','India After Independence','Constitution and Democracy','Science and Space'],totalChapters:11,completedChapters:0,progress:0,lastOpenedChapter:'',isFavorite:false,isDownloaded:false}
];

const historyFeatures = [
  {id:'all-topics',title:'All History Topics',description:'Explore all periods of History in one place.',icon:'📜',route:'history.html?feature=all-topics',type:'library',isFavorite:false},
  {id:'timeline',title:'Timeline',description:'See History events in order.',icon:'⌛',route:'history.html?feature=timeline',type:'timeline',isFavorite:false},
  {id:'maps',title:'Map Explorer',description:'Explore historical places on maps.',icon:'🌍',route:'history.html?feature=maps',type:'map',isFavorite:false},
  {id:'personalities',title:'Famous Personalities',description:'Learn about great rulers, leaders and thinkers.',icon:'👤',route:'history.html?feature=personalities',type:'library',isFavorite:false},
  {id:'quizzes',title:'Quiz Time',description:'Test your History knowledge.',icon:'❓',route:'history.html?feature=quizzes',type:'quiz',isFavorite:false}
];

const periodDialog = document.querySelector('#periodDialog');
const featureDialog = document.querySelector('#featureDialog');
const searchDialog = document.querySelector('#searchDialog');
const favorites = new Set(JSON.parse(localStorage.getItem('rupaiHistoryFavorites') || '[]'));
let activePeriod = null;
let speaking = false;
let snackbarTimer;
const narration = 'Hi Mumma! History hume batati hai ki humans, kingdoms, cultures aur civilizations time ke saath kaise badle. Chalo apni time journey shuru karte hain!';
const facts = ['History helps us understand our roots and make better decisions for the future!','The Indus Valley Civilization had one of the earliest planned drainage systems.','Ashoka spread messages through inscriptions carved on rocks and pillars.','The word history comes from a Greek word meaning inquiry or knowledge from investigation.'];
let factIndex = 0;

function showSnackbar(message) {
  const snackbar = document.querySelector('#snackbar');
  clearTimeout(snackbarTimer);
  snackbar.textContent = message;
  snackbar.classList.add('show');
  snackbarTimer = setTimeout(() => snackbar.classList.remove('show'), 1900);
}

function syncUrl(params) {
  const url = new URL(location.href);
  url.search = '';
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value));
  history.pushState(params, '', url);
}

function openPeriod(id, updateUrl = true) {
  const period = historyPeriods.find(item => item.id === id);
  if (!period) return;
  activePeriod = period;
  periodDialog.querySelector('h2').textContent = period.title;
  periodDialog.querySelector('.dialog-description').textContent = period.subtitle;
  periodDialog.querySelector('.dialog-topics').innerHTML = period.previewTopics.map(topic => `<span>${topic}</span>`).join('');
  const favoriteButton = document.querySelector('#favoritePeriod');
  favoriteButton.textContent = favorites.has(period.id) ? '♥ Favorited' : '♡ Favorite';
  if (updateUrl) syncUrl({period:id});
  periodDialog.showModal();
}

function openFeature(id, updateUrl = true) {
  const feature = historyFeatures.find(item => item.id === id);
  if (!feature) return;
  featureDialog.querySelector('.dialog-icon').textContent = feature.icon;
  featureDialog.querySelector('h2').textContent = feature.title;
  featureDialog.querySelector('p').textContent = `${feature.description} This section is connected and ready for its full content.`;
  if (updateUrl) syncUrl({feature:id});
  featureDialog.showModal();
}

function closeDialog(dialog) {
  dialog.close();
  if (location.search) history.replaceState({}, '', 'history.html');
}

function toggleVoice(replay = false) {
  if (!('speechSynthesis' in window)) {
    showSnackbar('Voice will be available soon.');
    return;
  }
  if (speaking && !replay) {
    speechSynthesis.pause();
    speaking = false;
    paintVoice();
    document.querySelector('#voiceStatus').textContent = 'Curio explanation paused';
    return;
  }
  if (speechSynthesis.paused && !replay) {
    speechSynthesis.resume();
    speaking = true;
    paintVoice();
    document.querySelector('#voiceStatus').textContent = 'Curio explanation playing';
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(narration);
  utterance.lang = 'hi-IN';
  utterance.rate = .92;
  utterance.pitch = 1.12;
  utterance.onstart = () => { speaking = true; paintVoice(); };
  utterance.onend = utterance.onerror = () => { speaking = false; paintVoice(); };
  speechSynthesis.speak(utterance);
  document.querySelector('#voiceStatus').textContent = 'Curio explanation playing';
}

function paintVoice() {
  document.querySelector('#curioExplains').classList.toggle('playing', speaking);
  document.querySelector('#voiceWave').classList.toggle('playing', speaking);
  document.querySelector('#soundButton').setAttribute('aria-pressed', String(speaking));
}

function renderSearch(value = '') {
  const query = value.trim().toLowerCase();
  const items = [
    ...historyPeriods.flatMap(period => [period.title, ...period.previewTopics].map(title => ({title,period:period.id}))),
    ...historyFeatures.map(feature => ({title:feature.title,feature:feature.id}))
  ].filter(item => !query || item.title.toLowerCase().includes(query));
  document.querySelector('#historySearchResults').innerHTML = items.slice(0,18).map(item => `<button type="button" data-result-period="${item.period || ''}" data-result-feature="${item.feature || ''}">${item.title}</button>`).join('');
}

document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.period === 'ancient') {
    window.location.href = 'ancient-history.html';
    return;
  }
  if (button.dataset.period === 'medieval') {
    window.location.href = 'medieval-history.html';
    return;
  }
  if (button.dataset.period === 'modern') {
    window.location.href = 'modern-history.html';
    return;
  }
  openPeriod(button.dataset.period);
}));
document.querySelectorAll('[data-feature]').forEach(button => button.addEventListener('click', () => openFeature(button.dataset.feature)));
document.querySelector('#favoritePeriod').addEventListener('click', () => {
  if (!activePeriod) return;
  const wasFavorite = favorites.has(activePeriod.id);
  wasFavorite ? favorites.delete(activePeriod.id) : favorites.add(activePeriod.id);
  localStorage.setItem('rupaiHistoryFavorites', JSON.stringify([...favorites]));
  document.querySelector('#favoritePeriod').textContent = favorites.has(activePeriod.id) ? '♥ Favorited' : '♡ Favorite';
  showSnackbar(wasFavorite ? 'Removed from Favorites · Undo available' : 'Added to Favorites');
});
document.querySelector('#continuePeriod').addEventListener('click', () => {
  if (!activePeriod) return;
  localStorage.setItem('rupaiLastHistoryPeriod', activePeriod.id);
  localStorage.setItem('rupaiHistoryProgress', JSON.stringify({period:activePeriod.id,completedChapters:activePeriod.completedChapters,totalChapters:activePeriod.totalChapters,progress:activePeriod.progress,lastOpened:new Date().toISOString()}));
  if (activePeriod.id === 'ancient') {
    window.location.href = 'ancient-history.html';
    return;
  }
  if (activePeriod.id === 'medieval') {
    window.location.href = 'medieval-history.html';
    return;
  }
  if (activePeriod.id === 'modern') {
    window.location.href = 'modern-history.html';
    return;
  }
  showSnackbar(`${activePeriod.title} selected`);
});
document.querySelector('#addPeriodRevision').addEventListener('click', () => {
  if (!activePeriod) return;
  RupaiRevision.addTask({sourceContentId:`history-${activePeriod.id}`,sourceType:'Chapter',title:activePeriod.title,subject:'History',chapter:activePeriod.title,topic:activePeriod.previewTopics[0],revisionMode:'Full Chapter Revision',estimatedMinutes:20,priority:4,isBookmarked:favorites.has(activePeriod.id),sourceRoute:activePeriod.route,description:activePeriod.subtitle}, 'today');
  showSnackbar('Added to Revision · Due today');
});
document.querySelector('#curioExplains').addEventListener('click', () => toggleVoice());
document.querySelector('#soundButton').addEventListener('click', () => toggleVoice(true));
document.querySelector('#historySearchButton').addEventListener('click', () => { renderSearch(); searchDialog.showModal(); document.querySelector('#historyQuery').focus(); });
document.querySelector('#historySearch').addEventListener('submit', event => { event.preventDefault(); renderSearch(document.querySelector('#historyQuery').value); });
document.querySelector('#historyQuery').addEventListener('input', event => renderSearch(event.target.value));
document.querySelector('#historySearchResults').addEventListener('click', event => {
  const result = event.target.closest('button');
  if (!result) return;
  searchDialog.close();
  if (result.dataset.resultPeriod === 'ancient') { window.location.href='ancient-history.html'; return; }
  if (result.dataset.resultPeriod === 'medieval') { window.location.href='medieval-history.html'; return; }
  if (result.dataset.resultPeriod === 'modern') { window.location.href='modern-history.html'; return; }
  if (result.dataset.resultPeriod) openPeriod(result.dataset.resultPeriod);
  if (result.dataset.resultFeature) openFeature(result.dataset.resultFeature);
});
document.querySelector('#funFactButton').addEventListener('click', () => { factIndex = (factIndex + 1) % facts.length; showSnackbar(facts[factIndex]); });
document.querySelectorAll('.dialog-x').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
featureDialog.querySelector('.dialog-ok').addEventListener('click', () => closeDialog(featureDialog));
[periodDialog,featureDialog,searchDialog].forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(dialog); }));
window.addEventListener('popstate', () => { [periodDialog,featureDialog,searchDialog].forEach(dialog => { if (dialog.open) dialog.close(); }); const params = new URLSearchParams(location.search); if (params.get('period')) openPeriod(params.get('period'), false); if (params.get('feature')) openFeature(params.get('feature'), false); });

const initialParams = new URLSearchParams(location.search);
if (initialParams.get('period')) openPeriod(initialParams.get('period'), false);
if (initialParams.get('feature')) openFeature(initialParams.get('feature'), false);
