const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const results=[
{id:'chapter',type:'Chapters',label:'Chapter',title:'Harappan Civilization',desc:'Learn about the Indus Valley Civilization, its cities, people, culture and achievements.',subject:'History',keywords:'harappa harappan indus valley civilization cities culture',icon:'🏛️',meta:'📖 History  ◷ 25 min read',route:'history.html',views:9800,date:10,bookmarked:true},
{id:'notes',type:'Notes',label:'My Notes',title:'Harappan Civilization – My Notes',desc:'My notes about Harappan cities, drainage system, trade and daily life.',subject:'History',keywords:'harappa notes roads drainage system trade daily life',icon:'📒',meta:'📝 My Notes<br>◷ 2 days ago',route:'search-result.html',views:900,date:12,downloaded:true},
{id:'images',type:'Images',label:'Images',title:'Harappan Civilization Images (24)',desc:'Explore important images like Great Bath, seals, statues and more.',subject:'History',keywords:'harappa images great bath seals statues archaeology',icon:'🖼️',meta:'🖼️ 24 Images',route:'search-result.html',views:6200,date:7},
{id:'video',type:'Videos',label:'Videos',title:'Harappan Civilization Documentary',desc:'Watch this video to understand the rise, life and discovery of Indus Valley Civilization.',subject:'History',keywords:'harappa documentary videos indus valley',icon:'🏙️',meta:'▣ Video  ◉ 12K views',route:'search-result.html',views:12000,date:9,downloaded:true,duration:'18:45'},
{id:'map',type:'Maps',label:'Maps',title:'Harappan Cities Map',desc:'Map showing major Harappan cities and important archaeological sites.',subject:'History',keywords:'harappa maps mohenjo daro dholavira lothal rakhigarhi',icon:'🗺️',meta:'🌍 1 Map',route:'search-result.html',views:5100,date:5},
{id:'pdf',type:'PDFs',label:'PDF',title:'Harappan Civilization Complete Notes',desc:'Detailed PDF notes for quick revision and exam preparation.',subject:'History',keywords:'harappa complete notes pdf revision exam',icon:'📄',meta:'▱ PDF  ▤ 15 Pages',route:'search-result.html',views:4300,date:8,downloaded:true},
{id:'quiz',type:'Quizzes',label:'Quiz',title:'Harappan Civilization Quiz',desc:'Test your knowledge with 15 important questions on Harappan Civilization.',subject:'History',keywords:'harappa quiz questions test practice',icon:'📝',meta:'✾ 15 Questions',route:'search-result.html',views:3600,date:11},
{id:'facts',type:'Fun Facts',label:'Fun Facts',title:'Fun Facts about Harappa',desc:'Interesting and amazing facts that will surprise you!',subject:'History',keywords:'harappa fun facts great bath discoveries',icon:'💡',meta:'💡 10 Facts',route:'search-result.html',views:2900,date:6},
{id:'curio',type:'Ask Curio',label:'Ask Curio',title:'Why was Harappa so advanced?',desc:'Curio explains the amazing planning, drainage system and technology used in Harappan cities.',subject:'History',keywords:'harappa why advanced ask curio drainage planning',icon:'',meta:'👧 Curio Answer',route:'search-result.html',views:7400,date:13},
{id:'saved',type:'Bookmarks',label:'Bookmarks',title:'Saved: Harappan Civilization',desc:'Your bookmarked content related to Harappan Civilization.',subject:'History',keywords:'harappa saved bookmark favorite',icon:'♥',meta:'♥ Saved',route:'search-result.html',views:300,date:4,bookmarked:true},
{id:'history-subject',type:'Subjects',label:'Subject',title:'History',desc:'Explore Ancient India, civilizations, empires and the stories that shaped our world.',subject:'History',keywords:'harappa history subject ancient india',icon:'📚',meta:'12 Harappa results',route:'history.html',views:15000,date:3,all:false},
{id:'drainage-topic',type:'Topics',label:'Topic',title:'Harappan Drainage System',desc:'Learn how covered drains and planned streets made Harappan cities extraordinary.',subject:'History',keywords:'harappa drainage system topic roads planning',icon:'🧱',meta:'10 min read',route:'search-result.html',views:5800,date:14,all:false},
{id:'maurya',type:'Chapters',label:'Chapter',title:'The Mauryan Empire',desc:'Explore Chandragupta Maurya, Ashoka and the growth of an ancient empire.',subject:'History',keywords:'mauryan empire ashoka chandragupta',icon:'🦁',meta:'📖 History  ◷ 30 min read',route:'history.html',views:8900,date:2},
{id:'buddhism',type:'Notes',label:'My Notes',title:'Buddhism – My Notes',desc:'Personal notes about Buddha, the Four Noble Truths and Eightfold Path.',subject:'History',keywords:'buddhism notes buddha noble truths',icon:'📒',meta:'📝 My Notes',route:'search-result.html',views:600,date:1}
];
const tabs=[['All','▦'],['Subjects','📖'],['Chapters','▤'],['Topics','▧'],['Notes','📝'],['Videos','▻'],['Images','🖼️'],['Maps','🌍'],['More','•••']];
const moreTypes=['PDFs','Quizzes','Fun Facts','Ask Curio','Bookmarks'];
const suggestions=['Harappa','Harappan Civilization','Harappan Drainage System','Harappan Cities Map','Harappa Notes','Harappa Videos','Ask Curio about Harappa','Mauryan Empire','Buddhism'];
const related=['Mohenjo-daro','Indus Valley Civilization','Harappan Trade','Harappan Drainage System','Lothal','Great Bath','Harappan Seals'];
const input=$('#searchInput'),grid=$('#resultGrid');
let state={query:new URLSearchParams(location.search).get('q')||'Harappa',tab:'All',sort:'Most Relevant',subjects:[],statuses:[]};
let recents=readStore('recents',['Harappa','Mauryan Empire','Drainage system','Buddhism','Ashoka']);
let bookmarks=new Set(readStore('bookmarks',results.filter(r=>r.bookmarked).map(r=>r.id)));
function readStore(k,f){try{return JSON.parse(localStorage.getItem(`rupaiSearch:${k}`))??f}catch{return f}}function saveStore(k,v){try{localStorage.setItem(`rupaiSearch:${k}`,JSON.stringify(v))}catch{}}
function words(q){return q.toLowerCase().split(/\s+/).filter(w=>w.length>1&&!['find','show','about','the','my'].includes(w))}
function matches(r){const hay=`${r.title} ${r.desc} ${r.subject} ${r.keywords}`.toLowerCase(),ws=words(state.query);return !ws.length||ws.some(w=>hay.includes(w))}
function visibleResults(){let list=results.filter(r=>matches(r));if(state.tab==='All')list=list.filter(r=>r.all!==false);else if(state.tab!=='More')list=list.filter(r=>r.type===state.tab);if(state.subjects.length)list=list.filter(r=>state.subjects.includes(r.subject));if(state.statuses.includes('bookmarked'))list=list.filter(r=>bookmarks.has(r.id));if(state.statuses.includes('downloaded'))list=list.filter(r=>r.downloaded);return list.sort((a,b)=>state.sort==='A to Z'?a.title.localeCompare(b.title):state.sort==='Recently Added'||state.sort==='Recently Opened'?b.date-a.date:state.sort==='Most Viewed'?b.views-a.views:state.sort==='Most Bookmarked'?Number(bookmarks.has(b.id))-Number(bookmarks.has(a.id)):b.views-a.views)}
function cardArtwork(r){
  const sprites={chapter:1,notes:2,images:3,video:4,map:5,pdf:6,quiz:7,facts:8,curio:9,saved:10,maurya:4,buddhism:2};
  if(sprites[r.id]){
    const labels={map:'Indus Valley<br>Civilization'};
    return `<div class="sprite-art sprite-${sprites[r.id]}">${labels[r.id]?`<span class="sprite-copy sprite-copy-${r.id}">${labels[r.id]}</span>`:''}</div>`;
  }
  if(r.id==='drainage-topic')return `<div class="topic-art"><span>▦</span><strong>Covered brick drains</strong><i>→ → →</i></div>`;
  return `<span class="art-icon">${r.icon}</span>`;
}
function visual(r){const cls=r.type.toLowerCase().replace(/\s+/g,'-');return `<div class="card-visual ${cls}"><span class="type-tag ${cls}">${r.label}</span>${cardArtwork(r)}${r.type==='Videos'?'<span class="play">▶</span>':''}${r.duration?`<span class="duration">${r.duration}</span>`:''}</div>`}
function card(r){const target=r.route==='history.html'?'history.html':`${r.route}?type=${encodeURIComponent(r.label)}&title=${encodeURIComponent(r.title)}`;return `<article class="result-card" data-id="${r.id}"><button class="card-open" type="button" data-route="${target}" aria-label="Open ${r.title}">${visual(r)}<h3>${r.title}</h3><p>${r.desc}</p></button><div class="card-meta"><span>${r.meta}</span><button class="bookmark ${bookmarks.has(r.id)?'active':''}" type="button" aria-label="${bookmarks.has(r.id)?'Remove bookmark':'Bookmark'}" aria-pressed="${bookmarks.has(r.id)}">${bookmarks.has(r.id)?'♥':'♡'}</button></div></article>`}
function render(){const list=visibleResults();grid.innerHTML=list.map(card).join('');grid.hidden=!list.length;$('#emptyState').hidden=!!list.length;const total=state.query.toLowerCase()==='harappa'&&state.tab==='All'&&!state.subjects.length&&!state.statuses.length?128:list.length;$('#resultsSummary').innerHTML=`Found ${total} result${total===1?'':'s'} for <em>“${escapeHtml(state.query||'Everything')}”</em> <b>✦</b>`;$$('#categoryTabs button').forEach(b=>{const active=b.dataset.tab===state.tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});bindCards();$('#filterBadge').textContent=state.subjects.length+state.statuses.length||''}
function bindCards(){$$('.card-open').forEach(b=>b.addEventListener('click',()=>{if(window.__SEARCH_TESTING__){(window.__openedRoutes??=[]).push(b.dataset.route);return}location.href=b.dataset.route}));$$('.bookmark').forEach(b=>b.addEventListener('click',()=>{const id=b.closest('.result-card').dataset.id;if(bookmarks.has(id))bookmarks.delete(id);else bookmarks.add(id);saveStore('bookmarks',[...bookmarks]);render();toast(bookmarks.has(id)?'Saved to Bookmarks ♥':'Removed from Bookmarks')}))}
function escapeHtml(v){return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function runSearch(q,{remember=true}={}){state.query=q.trim();input.value=state.query;$('#clearButton').hidden=!state.query;$('#suggestionBox').hidden=true;if(remember&&state.query){recents=[state.query,...recents.filter(x=>x.toLowerCase()!==state.query.toLowerCase())].slice(0,7);saveStore('recents',recents);renderRecents()}history.replaceState(null,'',`search.html${state.query?`?q=${encodeURIComponent(state.query)}`:''}`);render()}
function renderRecents(){$('#recentBox').hidden=!recents.length;$('#recentList').innerHTML=recents.map((q,i)=>`<span class="recent-chip"><button class="run-recent" type="button" data-query="${escapeHtml(q)}">◷ &nbsp; ${escapeHtml(q)}</button><button class="remove-recent" type="button" data-index="${i}" aria-label="Remove ${escapeHtml(q)}">×</button></span>`).join('');$$('.run-recent').forEach(b=>b.addEventListener('click',()=>runSearch(b.dataset.query)));$$('.remove-recent').forEach(b=>b.addEventListener('click',()=>{recents.splice(+b.dataset.index,1);saveStore('recents',recents);renderRecents()}))}
$('#categoryTabs').innerHTML=tabs.map(([name,icon])=>`<button type="button" data-tab="${name}" aria-pressed="${name==='All'}"><span>${icon}</span>${name}</button>`).join('');
$('#categoryTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;if(b.dataset.tab==='More'){showPlaceholder('More Categories',moreTypes.join(' • '));return}state.tab=b.dataset.tab;render()});
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();runSearch(input.value)});$('#clearButton').addEventListener('click',()=>{input.value='';input.focus();$('#clearButton').hidden=true});
let debounce;input.addEventListener('input',()=>{clearTimeout(debounce);$('#clearButton').hidden=!input.value;debounce=setTimeout(()=>{const q=input.value.trim().toLowerCase(),box=$('#suggestionBox');const list=q.length>1?suggestions.filter(x=>x.toLowerCase().includes(q)).slice(0,6):[];box.innerHTML=list.map(x=>`<button type="button" data-suggestion="${x}">⌕ &nbsp; ${x}</button>`).join('');box.hidden=!list.length;$$('[data-suggestion]',box).forEach(b=>b.addEventListener('click',()=>runSearch(b.dataset.suggestion)))},180)});
$('#clearAllRecents').addEventListener('click',()=>{recents=[];saveStore('recents',recents);renderRecents()});$('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render()});
$('#filterButton').addEventListener('click',()=>$('#filterDialog').showModal());$('#filterDialog').addEventListener('close',()=>{if($('#filterDialog').returnValue!=='apply')return;state.subjects=$$('input[name="subject"]:checked').map(x=>x.value);state.statuses=$$('input[name="status"]:checked').map(x=>x.value);render()});$('#resetFilters').addEventListener('click',()=>{$$('#filterDialog input').forEach(x=>x.checked=false);state.subjects=[];state.statuses=[];render()});
$('#relatedList').innerHTML=related.map(q=>`<button type="button">${q}</button>`).join('');$$('#relatedList button').forEach(b=>b.addEventListener('click',()=>runSearch(b.textContent)));
function showPlaceholder(title,text){const d=$('#placeholderDialog');$('h2',d).textContent=title;$('p',d).textContent=text||'This Rupai’s World section is connected and ready for its full page.';d.showModal()}$$('[data-placeholder]').forEach(b=>b.addEventListener('click',()=>showPlaceholder(b.dataset.placeholder)));$('.dialog-x').addEventListener('click',()=>$('#placeholderDialog').close());$('.okay').addEventListener('click',()=>$('#placeholderDialog').close());
let toastTimer;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>{if(window.__SEARCH_TESTING__){$('#cameraInput').dataset.activated='true';return}$('#cameraInput').click()}));$('#cameraInput').addEventListener('change',e=>{if(e.target.files.length){toast('Photo added for image search 📷');runSearch('Harappa')}});$$('[data-voice]').forEach(b=>b.addEventListener('click',()=>{const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Voice search is not supported on this device yet.');return}const r=new R();r.lang='en-IN';r.onresult=e=>runSearch(e.results[0][0].transcript);r.onerror=()=>toast('Please try voice search again.');toast('Listening…');r.start()}));
$('#tryAgain').addEventListener('click',()=>{input.focus();input.select()});input.value='';$('#clearButton').hidden=false;renderRecents();render();

const bindSearchCardControls=bindCards;
bindCards=function(){
  bindSearchCardControls();
  $$('.result-card').forEach(card=>{
    const meta=$('.card-meta',card),id=card.dataset.id,result=results.find(item=>item.id===id);
    if(!meta||!result||$('.add-revision',card))return;
    const button=document.createElement('button');
    button.className='add-revision';button.type='button';button.textContent='⟳ Revise';button.setAttribute('aria-label',`Add ${result.title} to Revision`);
    button.addEventListener('click',()=>{RupaiRevision.addTask({sourceContentId:result.id,sourceType:result.type,title:result.title,subject:result.subject,chapter:result.subject==='History'?'Ancient History':result.subject,topic:result.title,revisionMode:result.type==='Quizzes'?'MCQ Practice':result.type==='Notes'?'Read My Notes':result.type==='Images'?'Image Revision':result.type==='Maps'?'Map Revision':'Quick Recall',estimatedMinutes:result.type==='Quizzes'?15:10,priority:result.type==='Quizzes'?4:3,isBookmarked:bookmarks.has(result.id),sourceRoute:result.route,description:result.desc},'today');toast('Added to Revision · Due today')});
    meta.appendChild(button);
  });
};

async function runBrowserSelfTest(){window.__SEARCH_TESTING__=true;const checks=[];const check=(name,pass)=>checks.push({name,pass:!!pass});
  check('back link',$('.back-button').getAttribute('href')==='index.html');
  for(const button of $$('#categoryTabs [data-tab]')){button.click();check(`tab ${button.dataset.tab}`,button.dataset.tab==='More'?$('#placeholderDialog').open:button.classList.contains('active'));if($('#placeholderDialog').open)$('#placeholderDialog').close()}
  state.tab='All';runSearch('Mauryan Empire',{remember:false});check('search submit',grid.textContent.includes('Mauryan Empire'));
  $('#clearButton').click();check('clear button',input.value==='');runSearch('Harappa',{remember:false});
  recents=['Harappa','Mauryan Empire','Buddhism'];renderRecents();const before=$$('.recent-chip').length;$('.remove-recent').click();check('recent remove',$$('.recent-chip').length===before-1);$('#clearAllRecents').click();check('clear all recents',$('#recentBox').hidden);
  recents=['Harappa','Mauryan Empire','Drainage system','Buddhism','Ashoka'];renderRecents();
  $('#sortSelect').value='A to Z';$('#sortSelect').dispatchEvent(new Event('change',{bubbles:true}));const titles=$$('.result-card h3').map(x=>x.textContent);check('sort dropdown',titles.join('|')===[...titles].sort((a,b)=>a.localeCompare(b)).join('|'));
  $('#filterButton').click();check('filter opens',$('#filterDialog').open);const historyFilter=$('input[name="subject"][value="History"]');historyFilter.checked=true;$('#filterDialog').close('apply');await new Promise(resolve=>setTimeout(resolve,0));check('filter applies',$('#filterBadge').textContent==='1');
  historyFilter.checked=false;state.subjects=[];render();const bookmarkButton=$('.bookmark');const oldBookmark=bookmarkButton.getAttribute('aria-pressed');bookmarkButton.click();check('bookmark toggles',$('.bookmark').getAttribute('aria-pressed')!==oldBookmark);
  const cardButtons=$$('.card-open');cardButtons.forEach(button=>button.click());check('all cards open routes',window.__openedRoutes.length===cardButtons.length);
  $('.camera-tool').click();check('camera button',$('#cameraInput').dataset.activated==='true');
  $$('[data-placeholder]')[0].click();check('bottom navigation action',$('#placeholderDialog').open);if($('#placeholderDialog').open)$('#placeholderDialog').close();
  check('voice buttons',$$('[data-voice]').length===2);check('search button',$('.submit-button').type==='submit');check('real controls',$$('button,input,select,a').length>40);
  const failed=checks.filter(x=>!x.pass);document.documentElement.dataset.selftest=failed.length?'failed':'passed';await fetch(`/__search_selftest__?passed=${checks.length-failed.length}&failed=${failed.length}&names=${encodeURIComponent(failed.map(x=>x.name).join(','))}`).catch(()=>{});
}
if(new URLSearchParams(location.search).get('selftest')==='1')setTimeout(runBrowserSelfTest,250);

// Tactile 3D feedback for the storybook controls and search bar.
document.addEventListener('click',event=>{
  const control=event.target.closest('.icon-button,.category-tabs button,.search-tool,.submit-button,.filter-button,.recent-chip button,.card-open,.bookmark,.bottom-nav a,.bottom-nav button,.related-box button');
  if(!control)return;
  control.classList.remove('is-popping');
  void control.offsetWidth;
  control.classList.add('is-popping');
  setTimeout(()=>control.classList.remove('is-popping'),480);
});
function wakeSearch(){const bar=$('.search-sticky');bar.classList.remove('is-awake');void bar.offsetWidth;bar.classList.add('is-awake');setTimeout(()=>bar.classList.remove('is-awake'),620)}
$('#searchForm').addEventListener('pointerdown',wakeSearch);$('#searchInput').addEventListener('focus',wakeSearch);
