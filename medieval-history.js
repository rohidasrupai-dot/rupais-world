const STORAGE_KEY='rupaiMedievalHistory:v1';
const chapterSeed=[
  {id:'slave-age',number:1,title:'Slave Age',description:'Life of slaves, society and the feudal system.',topics:12,difficulty:'Easy',progress:80},
  {id:'delhi-sultanate',number:2,title:'Delhi Sultanate',description:'Rise of sultanate and its administration.',topics:15,difficulty:'Medium',progress:60},
  {id:'vijay-age',number:3,title:'Vijay Age',description:'The rise of the Vijayanagara Empire and its greatness.',topics:10,difficulty:'Easy',progress:100},
  {id:'maharasputra',number:4,title:'Maharasputra',description:'The rule, society and culture of the era.',topics:14,difficulty:'Medium',progress:70},
  {id:'rashtrakuta',number:5,title:'Rashtrakuta',description:'Powerful dynasty and their achievements.',topics:11,difficulty:'Medium',progress:90},
  {id:'chaman',number:6,title:'Chaman',description:'The story of bravery and valor.',topics:9,difficulty:'Easy',progress:75},
  {id:'wargan-empire',number:7,title:'Wargan Empire',description:'Expansion, culture and administration.',topics:10,difficulty:'Hard',progress:80},
  {id:'fort-manage-period',number:8,title:'Fort-Manage Period',description:'Military strategies, forts and defense systems.',topics:8,difficulty:'Medium',progress:60},
  {id:'gaja-empire',number:9,title:'Gaja Empire',description:'Trade, economy and cultural development.',topics:13,difficulty:'Hard',progress:85},
  {id:'satyam-age',number:10,title:'Satyam Age',description:'Society, education and art culture.',topics:9,difficulty:'Easy',progress:50},
  {id:'southern-dynasty',number:11,title:'Southern Dynasty',description:'Glory of the southern kingdoms and their contributions.',topics:16,difficulty:'Medium',progress:0}
];

function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
let saved=readState();
let chapters=chapterSeed.map(chapter=>({...chapter,...(saved.chapters?.[chapter.id]||{}),favorite:window.RupaiFavorites?.has(`medieval-${chapter.id}`)||Boolean(saved.chapters?.[chapter.id]?.favorite)}));
let toastTimer;

function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify({chapters:Object.fromEntries(chapters.map(chapter=>[chapter.id,{progress:chapter.progress,favorite:chapter.favorite,lastOpened:chapter.lastOpened||'',downloaded:Boolean(chapter.downloaded)}]))}))}
function showToast(message){const toast=document.querySelector('#toast');clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
function chapterRoute(chapter){return `medieval-chapter.html?chapter=${encodeURIComponent(chapter.id)}`}
function openChapter(chapter){chapter.lastOpened=new Date().toISOString();persist();location.href=chapterRoute(chapter)}
function openTool(tool,chapter){const panel={'Notes':'My Notes','Videos':'Videos','Maps':'Maps','Ask Curio':'Ask Curio'}[tool];location.href=`index.html?${new URLSearchParams({panel,subject:'History',period:'Medieval History',chapter:chapter.title,context:chapter.title})}`}
function sparkle(control){const layer=document.querySelector('#interactionLayer');const left=parseFloat(control.style.left),top=parseFloat(control.style.top),width=parseFloat(control.style.width),height=parseFloat(control.style.height);for(let i=0;i<7;i++){const dot=document.createElement('i');dot.className='sparkle';dot.style.left=`${left+width/2}%`;dot.style.top=`${top+height/2}%`;dot.style.setProperty('--dx',`${Math.cos(i)*22}px`);dot.style.setProperty('--dy',`${Math.sin(i)*22}px`);layer.appendChild(dot);setTimeout(()=>dot.remove(),700)}}
function toggleFavorite(chapter,control){chapter.favorite=!chapter.favorite;const item={id:`medieval-${chapter.id}`,title:chapter.title,description:chapter.description,type:'Chapter',subject:'History',chapter:'Medieval History',meta:`${chapter.topics} topics · ${chapter.progress}%`,icon:'🏰',route:chapterRoute(chapter)};chapter.favorite?window.RupaiFavorites?.add(item):window.RupaiFavorites?.remove(item.id);persist();sparkle(control);showToast(chapter.favorite?'Added to Favorites ❤️':'Removed from Favorites')}

function addSurface({x,y,w,h,label,href,onClick,className='ui-tile',tilt='0deg'}){
  const layer=document.querySelector('#interactionLayer');const control=document.createElement(href?'a':'button');if(href)control.href=href;else control.type='button';control.className=className;control.setAttribute('aria-label',label);Object.assign(control.style,{left:`${x/10.24}%`,top:`${y/15.36}%`,width:`${w/10.24}%`,height:`${h/15.36}%`,backgroundSize:`${1024/w*100}% ${1536/h*100}%`,backgroundPosition:`${x/(1024-w)*100}% ${y/(1536-h)*100}%`});control.style.setProperty('--tilt',tilt);if(onClick)control.addEventListener('click',()=>onClick(control));layer.appendChild(control);return control}
function addMask({x,y,w,h}){const mask=document.createElement('span');mask.className='chapter-mask';Object.assign(mask.style,{left:`${x/10.24}%`,top:`${y/15.36}%`,width:`${w/10.24}%`,height:`${h/15.36}%`});document.querySelector('#interactionLayer').appendChild(mask)}

function buildInteractions(){
  const sideRoutes=[['Home','index.html'],['All Subjects','subjects.html'],['My Notes','index.html?panel=My%20Notes'],['Favorites','favorites.html'],['Bookmark','index.html?panel=Bookmarks'],['Curiosity World','index.html?panel=Curiosity%20World'],['Ask Curio','index.html?panel=Ask%20Curio'],['Calculator','calculator/rupais-world-calculator-live.html'],['Daily Goals','index.html?panel=Daily%20Goals'],['Progress','index.html?panel=Study%20Progress'],['Achievements','index.html?panel=Achievements'],['Settings','index.html?panel=Settings'],['Theme','index.html?panel=Themes'],['Help and Support','index.html?panel=Help%20%26%20Support']];
  sideRoutes.forEach(([label,href],index)=>addSurface({x:13,y:213+index*69,w:167,h:65,label,href}));
  addSurface({x:861,y:37,w:67,h:58,label:'Search Medieval History',onClick:()=>{renderSearch();document.querySelector('#searchDialog').showModal();document.querySelector('#searchQuery').focus()}});
  addSurface({x:939,y:37,w:64,h:58,label:'Medieval History menu',onClick:()=>document.querySelector('#menuDialog').showModal()});
  const statX=[201,356,491,659,822],statW=[155,135,168,163,178];statX.forEach((x,index)=>addSurface({x,y:357,w:statW[index],h:86,label:['Total Chapters','Topics','Total Study Time','Your Score','Your Streak'][index],className:'stat-tile'}));
  const rects=[[201,458,389,187],[600,458,400,187],[201,655,389,176],[600,655,400,176],[201,841,389,150],[600,841,400,150],[201,1001,389,151],[600,1001,400,151],[201,1162,389,141],[600,1162,400,141]];
  rects.forEach((rect,index)=>{const [x,y,w,h]=rect,chapter=chapters[index];addMask({x,y,w,h});addSurface({x,y,w,h,label:`Open ${chapter.title}`,className:'chapter-tile',tilt:x<500?'2.2deg':'-2.2deg',onClick:()=>openChapter(chapter)});addSurface({x:x+w-42,y:y+5,w:37,h:38,label:`Favorite ${chapter.title}`,className:'chapter-control ui-tile',onClick:control=>toggleFavorite(chapter,control)});const footerY=y+h-39,toolWidth=(w*.56)/4;['Notes','Videos','Maps','Ask Curio'].forEach((tool,toolIndex)=>addSurface({x:x+6+toolIndex*toolWidth,y:footerY,w:toolWidth,h:35,label:`${tool}: ${chapter.title}`,className:'chapter-control ui-tile',onClick:()=>openTool(tool,chapter)}));addSurface({x:x+w-105,y:y+h-43,w:101,h:39,label:`Continue ${chapter.title}`,className:'chapter-control ui-tile',onClick:()=>openChapter(chapter)})});
  const southern=chapters[10];addMask({x:201,y:1314,w:799,h:108});addSurface({x:201,y:1314,w:799,h:108,label:'Open Southern Dynasty',className:'chapter-tile',onClick:()=>openChapter(southern)});addSurface({x:774,y:1314,w:226,h:108,label:'Ask Curio',className:'chapter-control ui-tile',onClick:()=>openTool('Ask Curio',southern)});
  const bottom=[['Home','index.html'],['Subjects','subjects.html'],['Curio','index.html?panel=Ask%20Curio'],['Calculator','calculator/rupais-world-calculator-live.html'],['Notes','index.html?panel=My%20Notes'],['Profile','index.html?panel=Profile']];bottom.forEach(([label,href],index)=>addSurface({x:index*(1024/6),y:1438,w:1024/6,h:98,label,href}));
}

function resultButton(chapter){return `<button type="button" data-chapter="${chapter.id}"><strong>${chapter.number}. ${chapter.title}</strong><small>${chapter.description} · ${chapter.difficulty} · ${chapter.progress}%</small></button>`}
function renderSearch(value=''){const q=value.trim().toLowerCase();const results=chapters.filter(chapter=>!q||[chapter.title,chapter.description,'notes videos maps images'].join(' ').toLowerCase().includes(q));document.querySelector('#searchResults').innerHTML=results.map(resultButton).join('')||'<p>No Medieval History result found.</p>'}
function filtered(){const form=new FormData(document.querySelector('#filterForm'));const status=form.get('status'),difficulty=form.get('difficulty');return chapters.filter(chapter=>(difficulty==='all'||chapter.difficulty===difficulty)&&(status==='all'||status==='completed'&&chapter.progress===100||status==='not-started'&&chapter.progress===0||status==='learning'&&chapter.progress>0&&chapter.progress<100||status==='favorite'&&chapter.favorite))}
function sorted(){const mode=document.querySelector('#sortBy').value;return [...chapters].sort((a,b)=>mode==='progress'?b.progress-a.progress:mode==='recent'?String(b.lastOpened||'').localeCompare(String(a.lastOpened||'')):mode==='alphabetical'?a.title.localeCompare(b.title):a.number-b.number)}
function wireDialogs(){document.querySelectorAll('.dialog-x').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));document.querySelector('#searchForm').addEventListener('submit',event=>{event.preventDefault();renderSearch(document.querySelector('#searchQuery').value)});document.querySelector('#searchQuery').addEventListener('input',event=>renderSearch(event.target.value));document.querySelector('#filterForm').addEventListener('submit',event=>{event.preventDefault();document.querySelector('#filterResults').innerHTML=filtered().map(resultButton).join('')||'<p>No chapter matches this filter.</p>'});document.querySelector('#sortForm').addEventListener('submit',event=>{event.preventDefault();document.querySelector('#sortResults').innerHTML=sorted().map(resultButton).join('')});document.querySelectorAll('.result-list').forEach(list=>list.addEventListener('click',event=>{const button=event.target.closest('[data-chapter]');if(button){const chapter=chapters.find(item=>item.id===button.dataset.chapter);if(chapter)openChapter(chapter)}}));document.querySelector('.menu-list').addEventListener('click',event=>{const button=event.target.closest('[data-menu]');if(!button)return;const action=button.dataset.menu;if(action==='filter'){document.querySelector('#menuDialog').close();document.querySelector('#filterDialog').showModal()}else if(action==='sort'){document.querySelector('#menuDialog').close();document.querySelector('#sortDialog').showModal()}else if(action==='favorites'){document.querySelector('#menuDialog').close();document.querySelector('#filterForm [name=status]').value='favorite';document.querySelector('#filterDialog').showModal();document.querySelector('#filterResults').innerHTML=chapters.filter(chapter=>chapter.favorite).map(resultButton).join('')||'<p>No favorite chapters yet.</p>'}else if(action==='learning'){const chapter=[...chapters].filter(item=>item.progress>0&&item.progress<100).sort((a,b)=>String(b.lastOpened||'').localeCompare(String(a.lastOpened||'')))[0]||chapters[0];openChapter(chapter)}else if(action==='downloads'){chapters.forEach(chapter=>chapter.downloaded=true);persist();showToast('Medieval chapters saved on this device')}else if(action==='reset'){localStorage.removeItem(STORAGE_KEY);chapters=chapterSeed.map(chapter=>({...chapter,favorite:false}));showToast('Medieval History progress reset');document.querySelector('#menuDialog').close()}})}

function wirePointerMotion(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.chapter-tile,.ui-tile,.stat-tile').forEach(control=>{
    let frame=0,lastEvent;
    control.addEventListener('pointermove',event=>{lastEvent=event;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const rect=control.getBoundingClientRect();const nx=(lastEvent.clientX-rect.left)/rect.width-.5,ny=(lastEvent.clientY-rect.top)/rect.height-.5;const isChapter=control.classList.contains('chapter-tile');control.style.setProperty('--move-x',`${nx*(isChapter?10:8)}px`);control.style.setProperty('--move-y',`${(isChapter?-11:-8)+ny*4}px`);control.style.setProperty('--move-rx',`${-ny*(isChapter?15:12)}deg`);control.style.setProperty('--move-ry',`${nx*(isChapter?15:12)}deg`);control.classList.add('motion-active')})});
    control.addEventListener('pointerleave',()=>{if(frame)cancelAnimationFrame(frame);frame=0;control.classList.remove('motion-active');for(const property of ['--move-x','--move-y','--move-rx','--move-ry'])control.style.removeProperty(property)});
    control.addEventListener('pointerdown',event=>{const page=document.querySelector('.medieval-page').getBoundingClientRect();const ripple=document.createElement('i');ripple.className='motion-ripple';ripple.style.left=`${(event.clientX-page.left)/page.width*100}%`;ripple.style.top=`${(event.clientY-page.top)/page.height*100}%`;document.querySelector('#interactionLayer').appendChild(ripple);setTimeout(()=>ripple.remove(),600)});
  });
}

function wireChapterProximityMotion(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const page=document.querySelector('.medieval-page');
  const cards=[...document.querySelectorAll('.chapter-tile')];
  let frame=0,lastEvent;
  page.addEventListener('pointermove',event=>{
    lastEvent=event;
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      cards.forEach(card=>{
        const rect=card.getBoundingClientRect();
        const near=lastEvent.clientX>=rect.left-45&&lastEvent.clientX<=rect.right+45&&lastEvent.clientY>=rect.top-45&&lastEvent.clientY<=rect.bottom+45;
        if(!near){card.classList.remove('proximity-active');return}
        const nx=Math.max(-.5,Math.min(.5,(lastEvent.clientX-rect.left)/rect.width-.5));
        const ny=Math.max(-.5,Math.min(.5,(lastEvent.clientY-rect.top)/rect.height-.5));
        card.style.setProperty('--move-x',`${nx*11}px`);
        card.style.setProperty('--move-y',`${-12+ny*4}px`);
        card.style.setProperty('--move-rx',`${-ny*15}deg`);
        card.style.setProperty('--move-ry',`${nx*15}deg`);
        card.classList.add('proximity-active');
      });
    });
  });
  page.addEventListener('pointerleave',()=>cards.forEach(card=>card.classList.remove('proximity-active')));
}

buildInteractions();wireDialogs();wirePointerMotion();wireChapterProximityMotion();
