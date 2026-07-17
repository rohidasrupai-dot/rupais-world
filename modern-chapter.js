const chapters={
  'rise-of-british-power':['The Rise of British Power','From traders to rulers: the British expansion in India.',12],
  'revolt-of-1857':['Revolt of 1857','The first war of independence and its impact.',10],
  'social-religious-reforms':['Social & Religious Reforms',"Reforms that awakened India's social conscience.",11],
  'indian-national-movement':['Indian National Movement','The struggle for freedom and unity.',15],
  'gandhian-era':['Gandhian Era','Non-violence, truth and mass movements that changed history.',10],
  'world-wars-impact':['World Wars & Their Impact','Global wars and their effect on India.',9],
  'india-after-independence':['India After Independence','Challenges, progress and nation building.',12],
  'constitution-democracy':['Constitution & Democracy','Framing of the Constitution and democratic values.',9],
  'five-year-plans':['Five-Year Plans & Economic Growth','Planning the future for a stronger India.',8],
  'science-technology-space':['Science, Technology & Space Achievements',"India's journey in science and space.",9],
  'india-21st-century':['India in the 21st Century','A new era of opportunities, challenges and global leadership.',12]
};
const id=new URLSearchParams(location.search).get('chapter')||'revolt-of-1857',data=chapters[id]||chapters['revolt-of-1857'],[title,description,totalTopics]=data,key='rupaiModernHistory:v1';let state;try{state=JSON.parse(localStorage.getItem(key)||'{}')}catch{state={}}state.chapters=state.chapters||{};const item=state.chapters[id]||{};let progress=Number(item.progress||0),favorite=window.RupaiFavorites?.has(`modern-${id}`)||Boolean(item.favorite),toastTimer;
document.title=`${title} | Rupai's World`;document.querySelector('#chapterTitle').textContent=title;document.querySelector('#chapterDescription').textContent=description;document.querySelector('#chapterStory').textContent=`Travel through ${title} with Curio. Discover the events, people, movements and ideas that shaped the modern world.`;
function save(){state.chapters[id]={...item,progress,favorite,lastOpened:new Date().toISOString()};localStorage.setItem(key,JSON.stringify(state))}
function paint(){const complete=Math.round(progress/100*totalTopics);document.querySelector('#progressLabel').textContent=`${progress}% complete`;document.querySelector('#topicLabel').textContent=`${complete} of ${totalTopics} topics`;document.querySelector('#progressBar').style.width=`${progress}%`;document.querySelector('#favoriteButton').textContent=favorite?'♥':'♡';document.querySelector('#favoriteButton').setAttribute('aria-pressed',String(favorite))}
function toast(message){const el=document.querySelector('#toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),2000)}
document.querySelector('#completeTopic').addEventListener('click',()=>{progress=Math.min(100,progress+Math.max(5,Math.round(100/totalTopics)));save();paint();toast(progress===100?'Chapter completed! 🏆':'Topic completed ✨')});
document.querySelector('#favoriteButton').addEventListener('click',()=>{favorite=!favorite;const favoriteItem={id:`modern-${id}`,title,description,type:'Chapter',subject:'History',chapter:'Modern History',meta:`${totalTopics} topics · ${progress}%`,icon:'🇮🇳',route:`modern-chapter.html?chapter=${id}`};favorite?window.RupaiFavorites?.add(favoriteItem):window.RupaiFavorites?.remove(favoriteItem.id);save();paint();toast(favorite?'Added to Favorites ❤️':'Removed from Favorites')});
document.querySelector('.lesson-grid').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.tool){const panel={'Notes':'My Notes','Videos':'Videos','Maps':'Maps','Ask Curio':'Ask Curio'}[button.dataset.tool];location.href=`index.html?${new URLSearchParams({panel,subject:'History',period:'Modern History',chapter:title,context:title})}`}else toast(button.dataset.panel==='quiz'?'Chapter quiz is ready!':'Learning journey started')});
save();paint();
