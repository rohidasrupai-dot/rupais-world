const $=(selector)=>document.querySelector(selector);
const toast=$('#toast');
const searchDialog=$('#searchDialog');
function showMessage(message){toast.textContent=message;toast.classList.add('show');clearTimeout(showMessage.timer);showMessage.timer=setTimeout(()=>toast.classList.remove('show'),2300)}
document.querySelectorAll('[data-message]').forEach(button=>button.addEventListener('click',()=>showMessage(button.dataset.message)));
$('#openSearch').addEventListener('click',()=>{searchDialog.showModal();$('#favoriteQuery').focus()});
document.querySelector('[data-open-favorite-search]').addEventListener('click',()=>{searchDialog.showModal();$('#favoriteQuery').focus()});
$('.dialog-close').addEventListener('click',()=>searchDialog.close());
searchDialog.addEventListener('click',event=>{if(event.target===searchDialog)searchDialog.close()});
function renderFavoriteRevisionList(){
  const items=RupaiFavorites.read(),list=$('#favoriteRevisionList');
  list.hidden=!items.length;
  list.innerHTML=items.map(item=>`<article data-favorite-id="${item.id}"><span>${item.icon||'📚'}</span><div><h3>${item.title}</h3><p>${item.subject||item.type} · ${item.chapter||'Saved in Favorites'}</p></div><button type="button">⟳ Add to Revision</button></article>`).join('');
  list.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const item=items.find(saved=>saved.id===button.closest('article').dataset.favoriteId);RupaiRevision.addTask({sourceContentId:item.id,sourceType:item.type,title:item.title,subject:item.subject||'General',chapter:item.chapter||item.subject||'Favorites',topic:item.title,revisionMode:item.type==='Note'?'Read My Notes':'Quick Recall',estimatedMinutes:10,priority:3,isBookmarked:item.bookmarked,sourceRoute:item.route||'favorites.html',description:item.description},'today');showMessage('Added to Revision · Due today')}));
}
renderFavoriteRevisionList();
$('#searchForm').addEventListener('submit',event=>{event.preventDefault();const query=$('#favoriteQuery').value.trim();searchDialog.close();showMessage(query?`Searching favorites for “${query}”`:'Showing all favorites')});
