(function () {
  const KEY = 'rupaiFavorites:v1';
  const listeners = new Set();
  function read() { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
  function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); listeners.forEach(fn => fn(items)); window.dispatchEvent(new CustomEvent('rupai:favorites-changed', { detail: items })); return items; }
  function normalize(item) { const now = new Date().toISOString(); return { id:String(item.id), title:item.title||'Untitled favorite', description:item.description||'Saved in Rupai’s World.', type:item.type||'Topic', subject:item.subject||'', chapter:item.chapter||'', meta:item.meta||'', icon:item.icon||'📚', route:item.route||'', dateAdded:item.dateAdded||now, views:Number(item.views||0), pinned:Boolean(item.pinned), bookmarked:Boolean(item.bookmarked) }; }
  function add(item) { const items=read(); if(!items.some(saved=>saved.id===String(item.id))) items.unshift(normalize(item)); return write(items); }
  function remove(id) { const items=read(); const removed=items.find(item=>item.id===String(id)); write(items.filter(item=>item.id!==String(id))); return removed; }
  function toggle(item) { return read().some(saved=>saved.id===String(item.id)) ? {added:false,item:remove(item.id)} : (add(item),{added:true,item:normalize(item)}); }
  function update(id,changes) { return write(read().map(item=>item.id===String(id)?{...item,...changes}:item)); }
  function has(id) { return read().some(item=>item.id===String(id)); }
  window.addEventListener('storage',event=>{if(event.key===KEY)listeners.forEach(fn=>fn(read()))});
  window.RupaiFavorites={read,add,remove,toggle,update,has,write,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
})();
