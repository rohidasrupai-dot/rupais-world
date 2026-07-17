const STORAGE_KEY = 'rupaiAncientHistory:v2';
const REFERENCE_STUDY_MINUTES = 515;
const REFERENCE_COMPLETED_TOPICS = 18;
const referenceChapterProgress = {
  'stone-age': {progress:0,completedTopics:0},
  'indus-valley': {progress:60,completedTopics:8},
  'vedic-age': {progress:30,completedTopics:5},
  'mahajanapadas': {progress:10,completedTopics:1},
  'mauryan-empire': {progress:20,completedTopics:4}
};

const ancientChapters = [
  {id:'stone-age',slug:'stone-age',chapterNumber:1,title:'Stone Age',description:'The story of early humans and their life on Earth.',illustration:'assets/ancient-stone-age-full-v3.png',accentColour:'#7540b7',totalTopics:10,estimatedMinutes:35,difficulty:'Easy',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Bhimbetka','Hunsgi','Kurnool Caves']},
  {id:'indus-valley',slug:'indus-valley',chapterNumber:2,title:'Indus Valley Civilization',description:"The world's first urban civilization.",illustration:'assets/ancient-indus-valley-full-v3.png',accentColour:'#df3567',totalTopics:14,estimatedMinutes:55,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Harappa','Mohenjo-daro','Lothal','Dholavira','Rakhigarhi']},
  {id:'vedic-age',slug:'vedic-age',chapterNumber:3,title:'Vedic Age',description:'The age of Vedas and ancient wisdom.',illustration:'assets/ancient-vedic-age-full-v3.png',accentColour:'#3f914d',totalTopics:16,estimatedMinutes:50,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Sapta Sindhu','Kuru','Panchala']},
  {id:'mahajanapadas',slug:'mahajanapadas',chapterNumber:4,title:'Mahajanapadas',description:'Rise of kingdoms and early republics.',illustration:'assets/ancient-mahajanapadas-full-v3.png',accentColour:'#3853c8',totalTopics:12,estimatedMinutes:40,difficulty:'Easy',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Magadha','Kosala','Avanti','Vatsa']},
  {id:'buddhism',slug:'buddhism',chapterNumber:5,title:'Buddhism',description:'The path of peace and enlightenment.',illustration:'assets/ancient-buddhism-full-v3.png',accentColour:'#ec6c00',totalTopics:11,estimatedMinutes:40,difficulty:'Easy',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Lumbini','Bodh Gaya','Sarnath','Kushinagar']},
  {id:'jainism',slug:'jainism',chapterNumber:6,title:'Jainism',description:'The path of truth and non-violence.',illustration:'assets/ancient-jainism-full-v3.png',accentColour:'#8b3fc0',totalTopics:10,estimatedMinutes:35,difficulty:'Easy',hasNotes:true,hasMaps:true,hasVideos:false,hasImages:true,hasQuiz:true,maps:['Vaishali','Pawapuri','Shravanabelagola']},
  {id:'mauryan-empire',slug:'mauryan-empire',chapterNumber:7,title:'Mauryan Empire',description:'The first empire that united India.',illustration:'assets/ancient-mauryan-full-v3.png',accentColour:'#df2f61',totalTopics:18,estimatedMinutes:65,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Pataliputra','Taxila','Ujjain','Tosali','Suvarnagiri']},
  {id:'post-mauryan',slug:'post-mauryan',chapterNumber:8,title:'Post-Mauryan Period',description:'The age of regional kingdoms and change.',illustration:'assets/ancient-post-mauryan-full-v3.png',accentColour:'#278b68',totalTopics:14,estimatedMinutes:50,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:false,hasImages:true,hasQuiz:true,maps:['Mathura','Purushapura','Pratishthana']},
  {id:'gupta-empire',slug:'gupta-empire',chapterNumber:9,title:'Gupta Empire',description:'The golden age of Indian art, science and culture.',illustration:'assets/ancient-gupta-full-v3.png',accentColour:'#7140bd',totalTopics:15,estimatedMinutes:55,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Pataliputra','Ujjain','Nalanda']},
  {id:'sangam-age',slug:'sangam-age',chapterNumber:10,title:'Sangam Age',description:'The glory of ancient Tamil kingdoms.',illustration:'assets/ancient-sangam-full-v3.png',accentColour:'#f27600',totalTopics:14,estimatedMinutes:45,difficulty:'Easy',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Madurai','Puhar','Muziris']},
  {id:'southern-dynasties',slug:'southern-dynasties',chapterNumber:11,title:'Southern Dynasties',description:'The great dynasties of South India and their remarkable legacy.',illustration:'assets/ancient-southern-full-v3.png',accentColour:'#7042b5',totalTopics:18,estimatedMinutes:50,difficulty:'Medium',hasNotes:true,hasMaps:true,hasVideos:true,hasImages:true,hasQuiz:true,maps:['Kanchipuram','Badami','Thanjavur']}
].map(chapter => {
  const reference = referenceChapterProgress[chapter.id] || {progress:0,completedTopics:0};
  return {...chapter,...reference,actualStudyMinutes:0,status:reference.progress>0?'in-progress':'not-started',lastOpenedTopicId:'',lastOpenedSection:'',lastOpenedAt:'',isFavorite:false,isDownloaded:false,starsEarned:0,badgeStatus:'locked',quizAccuracy:0,notesCreated:0,videosWatched:0,mapsExplored:0,route:`ancient-history.html?chapter=${chapter.slug}`};
});

const defaultFilters = {status:'all',difficulty:'all',hasNotes:false,hasMaps:false,hasVideos:false,hasImages:false,hasQuiz:false,isDownloaded:false,favoritesOnly:false};
let state = loadState();
let chapters = mergeChapterState(state.chapters);
let activeChapterId = null;
let query = '';
let snackbarTimer;
let undoAction = null;
let lastInteractionAt = Date.now();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {chapters:saved.chapters || {},filters:{...defaultFilters,...(saved.filters || {})},sort:saved.sort || 'order',view:saved.view || 'cards'};
  } catch {
    return {chapters:{},filters:{...defaultFilters},sort:'order',view:'cards'};
  }
}

function mergeChapterState(saved) {
  return ancientChapters.map(chapter => ({...chapter,...(saved[chapter.id] || {}),isFavorite:window.RupaiFavorites?.has(`ancient-${chapter.id}`) || Boolean(saved[chapter.id]?.isFavorite)}));
}

function persist() {
  const savedChapters = Object.fromEntries(chapters.map(chapter => [chapter.id,{completedTopics:chapter.completedTopics,actualStudyMinutes:chapter.actualStudyMinutes,progress:chapter.progress,status:chapter.status,lastOpenedTopicId:chapter.lastOpenedTopicId,lastOpenedSection:chapter.lastOpenedSection,lastOpenedAt:chapter.lastOpenedAt,isFavorite:chapter.isFavorite,isDownloaded:chapter.isDownloaded,starsEarned:chapter.starsEarned,badgeStatus:chapter.badgeStatus,quizAccuracy:chapter.quizAccuracy,notesCreated:chapter.notesCreated,videosWatched:chapter.videosWatched,mapsExplored:chapter.mapsExplored}]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({chapters:savedChapters,filters:state.filters,sort:state.sort,view:state.view}));
}

function chapterStatus(chapter) {
  if (chapter.progress >= 100) return 'completed';
  if (chapter.status === 'in-progress' || chapter.progress > 0) return 'in-progress';
  return 'not-started';
}

function actionLabel(chapter) {
  const status = chapterStatus(chapter);
  if (chapter.id === 'mahajanapadas' && !chapter.lastOpenedAt) return 'Start Learning';
  return status === 'completed' ? 'Review Again' : status === 'in-progress' ? 'Continue' : 'Start Learning';
}

function visibleChapters() {
  const filtered = chapters.filter(chapter => {
    const searchable = [chapter.title,chapter.description,...chapter.maps,'Notes','Maps','Videos','Images','Quiz'].join(' ').toLowerCase();
    if (query && !searchable.includes(query.toLowerCase())) return false;
    if (state.filters.status !== 'all' && chapterStatus(chapter) !== state.filters.status) return false;
    if (state.filters.difficulty !== 'all' && chapter.difficulty !== state.filters.difficulty) return false;
    for (const key of ['hasNotes','hasMaps','hasVideos','hasImages','hasQuiz','isDownloaded']) if (state.filters[key] && !chapter[key]) return false;
    if (state.filters.favoritesOnly && !chapter.isFavorite) return false;
    return true;
  });
  const difficultyRank = {Easy:1,Medium:2,Hard:3};
  return filtered.sort((a,b) => {
    if (state.sort === 'recent') return String(b.lastOpenedAt).localeCompare(String(a.lastOpenedAt));
    if (state.sort === 'progress') return b.progress - a.progress;
    if (state.sort === 'az') return a.title.localeCompare(b.title);
    if (state.sort === 'study-time') return b.actualStudyMinutes - a.actualStudyMinutes;
    if (state.sort === 'easy') return difficultyRank[a.difficulty] - difficultyRank[b.difficulty] || a.chapterNumber-b.chapterNumber;
    if (state.sort === 'hard') return difficultyRank[b.difficulty] - difficultyRank[a.difficulty] || a.chapterNumber-b.chapterNumber;
    return a.chapterNumber - b.chapterNumber;
  });
}

function render() {
  const grid = document.querySelector('#chapterGrid');
  const visible = visibleChapters();
  grid.classList.toggle('list-view', state.view === 'list');
  grid.innerHTML = visible.map(chapter => `
    <article class="chapter-card ${chapter.id==='southern-dynasties'?'southern':''}" id="chapter-${chapter.id}" style="--accent:${chapter.accentColour};--progress:${chapter.progress}%">
      <button class="chapter-art-button" type="button" data-open="${chapter.id}" aria-label="Open ${chapter.title}"><img class="chapter-art" src="${chapter.illustration}" loading="lazy" decoding="async" alt="${chapter.title}: ${chapter.description}"></button>
      <button class="favorite-button ${chapter.isFavorite?'on':''}" type="button" data-favorite="${chapter.id}" aria-label="${chapter.isFavorite?'Remove':'Add'} ${chapter.title} ${chapter.isFavorite?'from':'to'} Favorites" aria-pressed="${chapter.isFavorite}"><span aria-hidden="true">♥</span></button>
      ${chapter.isDownloaded?'<span class="downloaded-badge">✓ Downloaded</span>':''}
      <div class="chapter-footer">
        <div class="chapter-meta"><span>▣ ${chapter.totalTopics} Topics</span><span>◷ ${chapter.estimatedMinutes} min</span><span>☆ ${chapter.difficulty}</span></div>
        <div class="chapter-tools"><button data-tool="Notes" data-id="${chapter.id}">📝 Notes</button><button data-tool="Maps" data-id="${chapter.id}">🗺 Maps</button><button data-tool="Videos" data-id="${chapter.id}">▶ Videos</button><button data-tool="Ask Curio" data-id="${chapter.id}">♙ Ask Curio</button></div>
        <div class="chapter-progress"><b>${chapter.progress}%</b></div>
        <button class="primary-action" type="button" data-open="${chapter.id}">${actionLabel(chapter)} →</button>
      </div>
      ${chapter.id==='southern-dynasties'?'<button class="southern-ask" type="button" data-tool="Ask Curio" data-id="southern-dynasties" aria-label="Ask Curio, your History friend"></button>':''}
    </article>`).join('');
  document.querySelector('#resultCount').textContent = `${visible.length} chapter${visible.length===1?'':'s'}`;
  document.querySelector('#emptyState').hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
  paintStats();
}

function paintStats() {
  const totalTopics = chapters.reduce((sum,chapter) => sum + chapter.totalTopics,0);
  const completedTopics = chapters.reduce((sum,chapter) => sum + chapter.completedTopics,0);
  const newTopics = Math.max(0,completedTopics - REFERENCE_COMPLETED_TOPICS);
  const remainingTopics = Math.max(1,totalTopics - REFERENCE_COMPLETED_TOPICS);
  const progress = Math.min(100,42 + Math.round(newTopics / remainingTopics * 58));
  const study = REFERENCE_STUDY_MINUTES + chapters.reduce((sum,chapter) => sum + chapter.actualStudyMinutes,0);
  document.querySelector('#totalChapters').textContent = chapters.length;
  document.querySelector('#totalTopics').textContent = totalTopics;
  document.querySelector('#studyTime').textContent = study >= 60 ? `${Math.floor(study/60)}h ${study%60}m` : `${study}m`;
  document.querySelector('#overallProgress').textContent = `${progress}%`;
  document.querySelector('#overallRing').style.setProperty('--progress',`${progress}%`);
}

function saveChapter(chapter) {
  chapter.progress = Math.round(chapter.completedTopics / chapter.totalTopics * 100);
  chapter.status = chapter.progress >= 100 ? 'completed' : chapter.status === 'not-started' ? 'in-progress' : chapter.status;
  if (chapter.progress >= 100) { chapter.badgeStatus='earned'; chapter.starsEarned=Math.max(chapter.starsEarned,3); }
  persist();
  render();
}

function showSnackbar(message, undo) {
  const snackbar = document.querySelector('#snackbar');
  clearTimeout(snackbarTimer);
  snackbar.querySelector('span').textContent = message;
  const button = snackbar.querySelector('button');
  undoAction = undo || null;
  button.hidden = !undoAction;
  snackbar.classList.add('show');
  snackbarTimer = setTimeout(() => { snackbar.classList.remove('show'); undoAction=null; },2200);
}

function toggleFavorite(id) {
  const chapter = chapters.find(item => item.id === id);
  if (!chapter) return;
  const previous = chapter.isFavorite;
  chapter.isFavorite = !previous;
  const favoriteItem = {id:`ancient-${chapter.id}`,title:chapter.title,description:chapter.description,type:'Chapter',subject:'History',chapter:'Ancient History',meta:`${chapter.totalTopics} topics · ${chapter.progress}%`,icon:'🏛️',route:chapter.route};
  chapter.isFavorite ? window.RupaiFavorites?.add(favoriteItem) : window.RupaiFavorites?.remove(favoriteItem.id);
  persist(); render();
  showSnackbar(chapter.isFavorite?'Added to Favorites':'Removed from Favorites',() => {chapter.isFavorite=previous; previous?window.RupaiFavorites?.add(favoriteItem):window.RupaiFavorites?.remove(favoriteItem.id);persist();render();});
}

function openChapter(id, sync = true) {
  const chapter = chapters.find(item => item.id === id);
  if (!chapter) return;
  activeChapterId = id;
  chapter.lastOpenedAt = new Date().toISOString();
  chapter.lastOpenedSection = chapter.lastOpenedSection || 'overview';
  chapter.lastOpenedTopicId = chapter.lastOpenedTopicId || `${chapter.slug}-topic-1`;
  if (chapter.status === 'not-started') chapter.status = 'in-progress';
  persist();
  const dialog = document.querySelector('#chapterDialog');
  dialog.querySelector('h2').textContent = chapter.title;
  dialog.querySelector('.chapter-description').textContent = chapter.description;
  dialog.querySelector('.chapter-detail-progress i').style.width = `${chapter.progress}%`;
  dialog.querySelector('.chapter-status').textContent = `${chapter.completedTopics} of ${chapter.totalTopics} topics complete · ${chapter.actualStudyMinutes} min studied · ${chapter.difficulty}`;
  document.querySelector('#openChapter').textContent = actionLabel(chapter);
  document.querySelector('#toggleDownload').textContent = chapter.isDownloaded ? 'Remove Download' : 'Download';
  if (sync) history.pushState({chapter:id},'',`ancient-history.html?chapter=${chapter.slug}`);
  if (!dialog.open) dialog.showModal();
  render();
}

function openTool(tool, chapter) {
  const routePanel = {'Notes':'My Notes','Maps':'Maps','Videos':'Videos','Ask Curio':'Ask Curio'}[tool];
  if (tool === 'Videos' && !chapter.hasVideos) {
    const dialog = document.querySelector('#toolDialog');
    dialog.querySelector('.dialog-icon').textContent='▶';dialog.querySelector('h2').textContent=`${chapter.title} Videos`;dialog.querySelector('p').textContent='Abhi is chapter ke videos add kiye ja rahe hain.';document.querySelector('#toolExtras').innerHTML='<button class="dialog-ok" data-empty-ask>Ask Curio</button>';dialog.showModal();return;
  }
  if (tool === 'Maps') chapter.mapsExplored += 1;
  if (tool === 'Videos') chapter.videosWatched += 1;
  persist();
  const params = new URLSearchParams({panel:routePanel,subject:'History',period:'Ancient History',chapter:chapter.title,context:chapter.title});
  window.location.href = `index.html?${params}`;
}

function applyFiltersFromForm() {
  const data = new FormData(document.querySelector('#filterForm'));
  state.filters = {status:data.get('status'),difficulty:data.get('difficulty'),hasNotes:data.has('hasNotes'),hasMaps:data.has('hasMaps'),hasVideos:data.has('hasVideos'),hasImages:data.has('hasImages'),hasQuiz:data.has('hasQuiz'),isDownloaded:data.has('isDownloaded'),favoritesOnly:data.has('favoritesOnly')};
  persist(); render();
}

function fillFilterForm() {
  const form = document.querySelector('#filterForm');
  form.elements.status.value=state.filters.status;form.elements.difficulty.value=state.filters.difficulty;
  for (const key of ['hasNotes','hasMaps','hasVideos','hasImages','hasQuiz','isDownloaded','favoritesOnly']) form.elements[key].checked=state.filters[key];
}

function renderSearch(value='') {
  const needle=value.trim().toLowerCase();
  const matches=chapters.filter(chapter=>[chapter.title,chapter.description,...chapter.maps].join(' ').toLowerCase().includes(needle));
  document.querySelector('#searchResults').innerHTML=matches.map(chapter=>`<button type="button" data-search-id="${chapter.id}">${chapter.chapterNumber}. ${chapter.title}<small>${chapter.description}</small></button>`).join('') || '<p>No matching Ancient History chapter found.</p>';
}

document.querySelector('#chapterGrid').addEventListener('click', event => {
  const favorite=event.target.closest('[data-favorite]');if(favorite){toggleFavorite(favorite.dataset.favorite);return;}
  const tool=event.target.closest('[data-tool]');if(tool){const chapter=chapters.find(item=>item.id===tool.dataset.id);if(chapter)openTool(tool.dataset.tool,chapter);return;}
  const opener=event.target.closest('[data-open]');if(opener)openChapter(opener.dataset.open);
});
document.querySelector('#openSearch').addEventListener('click',()=>{renderSearch();document.querySelector('#searchDialog').showModal();document.querySelector('#searchQuery').focus();});
document.querySelector('#chapterSearch').addEventListener('submit',event=>{event.preventDefault();renderSearch(document.querySelector('#searchQuery').value);});
document.querySelector('#searchQuery').addEventListener('input',event=>renderSearch(event.target.value));
document.querySelector('#searchResults').addEventListener('click',event=>{const button=event.target.closest('[data-search-id]');if(button){document.querySelector('#searchDialog').close();openChapter(button.dataset.searchId);}});
document.querySelector('#openFilter').addEventListener('click',()=>{fillFilterForm();document.querySelector('#filterDialog').showModal();});
document.querySelector('#filterForm').addEventListener('submit',event=>{event.preventDefault();applyFiltersFromForm();document.querySelector('#filterDialog').close();});
document.querySelector('#resetFilters').addEventListener('click',()=>{state.filters={...defaultFilters};query='';document.querySelector('#searchQuery').value='';persist();fillFilterForm();render();});
document.querySelector('#tryAgain').addEventListener('click',()=>{state.filters={...defaultFilters};query='';persist();render();});
document.querySelector('#openSort').addEventListener('click',()=>{document.querySelector('#sortBy').value=state.sort;document.querySelector('#sortDialog').showModal();});
document.querySelector('#sortForm').addEventListener('submit',event=>{event.preventDefault();state.sort=document.querySelector('#sortBy').value;persist();render();document.querySelector('#sortDialog').close();});
document.querySelector('#openMenu').addEventListener('click',()=>document.querySelector('#menuDialog').showModal());
document.querySelector('.menu-list').addEventListener('click',event=>{const button=event.target.closest('[data-menu]');if(!button)return;const action=button.dataset.menu;document.querySelector('#menuDialog').close();if(action==='cards'||action==='list'){state.view=action;persist();render();return}if(['completed','progress','not-started'].includes(action)){state.filters.status=action==='progress'?'in-progress':action;persist();render();return}if(action==='download'){chapters.forEach(chapter=>chapter.isDownloaded=true);persist();render();showSnackbar('Ancient History chapter data saved on this device');return}if(action==='reset'){document.querySelector('#resetDialog').showModal();return}if(action==='timeline'){document.querySelector('[data-tool="Timeline"]').click();return}const dialog=document.querySelector('#toolDialog');dialog.querySelector('.dialog-icon').textContent='⚙';dialog.querySelector('h2').textContent=action==='settings'?'Ancient History Settings':'Ancient History Help';dialog.querySelector('p').textContent=action==='settings'?'Cards, filters, downloads and progress are stored on this device.':'Choose a chapter, then use Notes, Maps, Videos or Ask Curio for help.';document.querySelector('#toolExtras').innerHTML='';dialog.showModal();});
document.querySelector('#completeTopic').addEventListener('click',()=>{const chapter=chapters.find(item=>item.id===activeChapterId);if(!chapter)return;chapter.completedTopics=Math.min(chapter.totalTopics,chapter.completedTopics+1);saveChapter(chapter);openChapter(chapter.id,false);showSnackbar('Topic completed · Progress updated');});
document.querySelector('#openChapter').addEventListener('click',()=>{const chapter=chapters.find(item=>item.id===activeChapterId);if(!chapter)return;chapter.lastOpenedAt=new Date().toISOString();chapter.status=chapter.progress>=100?'completed':'in-progress';persist();showSnackbar(chapter.progress>=100?'Revision options ready':'Resuming from your last topic');});
document.querySelector('#toggleDownload').addEventListener('click',()=>{const chapter=chapters.find(item=>item.id===activeChapterId);if(!chapter)return;chapter.isDownloaded=!chapter.isDownloaded;localStorage.setItem(`rupaiAncientDownload:${chapter.id}`,chapter.isDownloaded?JSON.stringify({id:chapter.id,title:chapter.title,topics:chapter.totalTopics,savedAt:new Date().toISOString()}):'');persist();openChapter(chapter.id,false);showSnackbar(chapter.isDownloaded?'Chapter data saved on this device':'Downloaded chapter data removed');});
document.querySelector('.chapter-dialog-tools').addEventListener('click',event=>{const button=event.target.closest('[data-dialog-tool]');const chapter=chapters.find(item=>item.id===activeChapterId);if(button&&chapter)openTool(button.dataset.dialogTool,chapter);});
document.querySelectorAll('[data-tool="Timeline"]').forEach(button=>button.addEventListener('click',()=>{window.location.href='history.html?feature=timeline';}));
document.querySelector('#cancelReset').addEventListener('click',()=>document.querySelector('#resetDialog').close());
document.querySelector('#confirmReset').addEventListener('click',()=>{chapters.forEach(chapter=>window.RupaiFavorites?.remove(`ancient-${chapter.id}`));localStorage.removeItem(STORAGE_KEY);state=loadState();chapters=mergeChapterState({});document.querySelector('#resetDialog').close();render();showSnackbar('Ancient History progress reset');});
document.querySelector('#snackbar button').addEventListener('click',()=>{if(undoAction)undoAction();undoAction=null;document.querySelector('#snackbar').classList.remove('show');});
document.querySelectorAll('.dialog-x').forEach(button=>button.addEventListener('click',()=>{const dialog=button.closest('dialog');dialog.close();if(dialog.id==='chapterDialog'&&location.search)history.replaceState({},'', 'ancient-history.html');}));
document.querySelectorAll('.dialog-ok').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.addEventListener('click',event=>{if(event.target.matches('[data-empty-ask]'))window.location.href='index.html?panel=Ask%20Curio&context=Ancient%20History';});
window.addEventListener('popstate',()=>{const dialog=document.querySelector('#chapterDialog');if(dialog.open)dialog.close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)activeChapterId=null;});
['pointerdown','keydown','touchstart'].forEach(type=>document.addEventListener(type,()=>{lastInteractionAt=Date.now();},{passive:true}));
setInterval(()=>{if(!activeChapterId||document.hidden||Date.now()-lastInteractionAt>300000)return;const chapter=chapters.find(item=>item.id===activeChapterId);if(chapter){chapter.actualStudyMinutes+=1;persist();paintStats();}},60000);

function addExactHotspot(layer,{x,y,w,h,label,href,onClick,className,backgroundImage,tilt}) {
  const control=document.createElement(href?'a':'button');
  if(href) control.href=href; else control.type='button';
  control.setAttribute('aria-label',label);
  if(className) control.className=className;
  Object.assign(control.style,{left:`${x/10.85}%`,top:`${y/14.49}%`,width:`${w/10.85}%`,height:`${h/14.49}%`});
  if(backgroundImage) control.style.backgroundImage=`url("${backgroundImage}")`;
  if(!backgroundImage) {
    control.classList.add('exact-ui-tile');
    control.style.backgroundImage='url("assets/ancient-dashboard-reference-v1.png")';
    control.style.backgroundSize=`${1085/w*100}% ${1449/h*100}%`;
    control.style.backgroundPosition=`${x/(1085-w)*100}% ${y/(1449-h)*100}%`;
  }
  if(tilt) control.style.setProperty('--card-tilt',tilt);
  if(onClick) control.addEventListener('click',onClick);
  layer.appendChild(control);
}

function addExactMask(layer,{x,y,w,h}) {
  const mask=document.createElement('span');
  mask.className='exact-card-mask';
  Object.assign(mask.style,{left:`${x/10.85}%`,top:`${y/14.49}%`,width:`${w/10.85}%`,height:`${h/14.49}%`});
  layer.appendChild(mask);
}

function buildExactInteractionLayer() {
  const layer=document.querySelector('#exactInteractionLayer');
  if(!layer||layer.childElementCount) return;
  const add=options=>addExactHotspot(layer,options);

  const sideRoutes=[
    ['Home','index.html'],['All Subjects','subjects.html'],['My Notes','index.html?panel=My%20Notes'],['Favorites','favorites.html'],['Bookmark','index.html?panel=Bookmarks'],['Curiosity World','index.html?panel=Curiosity%20World'],['Ask Curio','index.html?panel=Ask%20Curio'],['Calculator','calculator/rupais-world-calculator-live.html'],['Daily Goals','index.html?panel=Daily%20Goals'],['Progress','index.html?panel=Study%20Progress'],['Achievements','index.html?panel=Achievements'],['Settings','index.html?panel=Settings'],['Theme','index.html?panel=Themes'],['Help and Support','index.html?panel=Help%20%26%20Support']
  ];
  sideRoutes.forEach(([label,href],index)=>add({x:0,y:188+index*64,w:182,h:64,label,href}));

  add({x:927,y:14,w:59,h:59,label:'Search Ancient History',onClick:()=>document.querySelector('#openSearch').click()});
  add({x:997,y:14,w:60,h:59,label:'Ancient History menu',onClick:()=>document.querySelector('#openMenu').click()});
  add({x:916,y:359,w:145,h:65,label:'View History Timeline',href:'history.html?feature=timeline'});
  add({x:875,y:432,w:94,h:40,label:'Filter chapters',onClick:()=>document.querySelector('#openFilter').click()});
  add({x:975,y:432,w:88,h:40,label:'Sort chapters',onClick:()=>document.querySelector('#openSort').click()});

  const cardRects=[
    ['stone-age',203,466,413,168],['indus-valley',629,466,435,168],
    ['vedic-age',203,646,413,157],['mahajanapadas',629,646,435,157],
    ['buddhism',203,809,413,138],['jainism',629,809,435,138],
    ['mauryan-empire',203,960,413,132],['post-mauryan',629,960,435,132],
    ['gupta-empire',203,1104,413,130],['sangam-age',629,1104,435,130]
  ];
  cardRects.forEach(([id,x,y,w,h])=>{
    const chapter=chapters.find(item=>item.id===id);
    addExactMask(layer,{x,y,w,h});
    add({x,y,w,h,label:`Open ${chapter.title}`,className:'exact-card-tile',backgroundImage:chapter.illustration,tilt:x<500?'2.2deg':'-2.2deg',onClick:()=>openChapter(id)});
    add({x:x+w-47,y:y+4,w:43,h:42,label:`Favorite ${chapter.title}`,className:'exact-card-control',onClick:()=>toggleFavorite(id)});
    const toolY=y+h-25,toolWidth=(w*.55)/4;
    ['Notes','Maps','Videos','Ask Curio'].forEach((tool,index)=>add({x:x+7+index*toolWidth,y:toolY,w:toolWidth,h:23,label:`${tool}: ${chapter.title}`,className:'exact-card-control',onClick:()=>openTool(tool,chapter)}));
    add({x:x+w-165,y:y+h-55,w:58,h:54,label:`${chapter.progress}% progress: ${chapter.title}`,className:'exact-card-control',onClick:()=>openChapter(id)});
    add({x:x+w-107,y:y+h-45,w:103,h:40,label:`${actionLabel(chapter)} ${chapter.title}`,className:'exact-card-control',onClick:()=>openChapter(id)});
  });

  const southern=chapters.find(item=>item.id==='southern-dynasties');
  addExactMask(layer,{x:203,y:1249,w:859,h:93});
  add({x:203,y:1249,w:859,h:93,label:'Open Southern Dynasties',className:'exact-card-tile exact-card-tile-wide',backgroundImage:southern.illustration,tilt:'0deg',onClick:()=>openChapter(southern.id)});
  ['Notes','Maps','Videos','Ask Curio'].forEach((tool,index)=>add({x:475+index*57,y:1313,w:57,h:25,label:`${tool}: Southern Dynasties`,className:'exact-card-control',onClick:()=>openTool(tool,southern)}));
  add({x:817,y:1249,w:245,h:93,label:'Ask Curio, your History friend',className:'exact-card-control',onClick:()=>openTool('Ask Curio',southern)});

  const bottomRoutes=[['Home','index.html'],['Subjects','subjects.html'],['Curio','index.html?panel=Ask%20Curio'],['Calculator','calculator/rupais-world-calculator-live.html'],['Notes','index.html?panel=My%20Notes'],['Profile','index.html?panel=Profile']];
  bottomRoutes.forEach(([label,href],index)=>add({x:index*(1085/6),y:1367,w:1085/6,h:82,label,href}));
}

buildExactInteractionLayer();
setTimeout(()=>{try{render();const initial=new URLSearchParams(location.search).get('chapter');if(initial){const chapter=chapters.find(item=>item.slug===initial);if(chapter)openChapter(chapter.id,false);}}catch{document.querySelector('#chapterGrid').hidden=true;const empty=document.querySelector('#emptyState');empty.hidden=false;empty.querySelector('h2').textContent='Ancient History ki journey abhi load nahi hui.';}},220);
