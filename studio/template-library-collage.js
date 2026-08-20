(function () {
  if (!window.__studioSession) return;
  const api = window.RupaiTemplateLibrary, session = window.__studioSession;
  const filters = ['All','Opening','Paragraph','Points','Comparison','Table','Process','Timeline','Light','Dark','2D','3D','More'];
  const state = { selectedId: null, filter: 'All', query: '', zoom: 1, urls: new Map() };
  const $ = selector => document.querySelector(selector);
  const escape = value => { const node = document.createElement('div'); node.textContent = value ?? ''; return node.innerHTML; };
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2800); }
  function matches(item) {
    const searchable = [item.name,item.category,item.style,item.type,item.dimension,item.size,...(item.slots||[])].join(' ').toLowerCase();
    const filter = state.filter, filterMatch = filter === 'All' || (filter === 'More' ? !filters.includes(item.category) : [item.category,item.type,item.dimension].includes(filter));
    return filterMatch && searchable.includes(state.query.toLowerCase());
  }
  async function previewUrl(item) {
    if (state.urls.has(item.id)) return state.urls.get(item.id);
    const blob = await api.getPreview(item.previewAssetId); if (!blob) return '';
    const url = URL.createObjectURL(blob); state.urls.set(item.id,url); return url;
  }
  async function render() {
    const all=api.list(), visible=all.filter(matches), selected=all.find(item=>item.id===state.selectedId) || null;
    $('#templateCount').textContent=`My Templates (${all.length})`; $('#showing').textContent=`Showing ${visible.length} of ${all.length} template${all.length===1?'':'s'}`;
    const allFilter=document.querySelector('[data-filter="All"]');if(allFilter)allFilter.textContent=`All (${all.length})`;
    $('#templateList').innerHTML=all.length ? (visible.length?'<div class="template-grid">'+visible.map(item=>`<button class="template-card ${item.id===state.selectedId?'active':''}" data-id="${item.id}"><span class="thumb" data-thumb="${item.id}"></span><span><strong>${escape(item.name)} ${item.favorite?'💜':''}</strong><small>${escape(item.category)} · ${escape(item.type)}</small></span></button>`).join('')+'</div>':'<div class="empty-list"><div class="empty-art">⌕</div><h3>No matches</h3><p>Try a different search or category filter.</p></div>') : `<div class="empty-list"><div class="empty-art">◇</div><h3>No templates yet!</h3><p>Add your first template to get started. Your templates will appear here.</p><button class="secondary add-template">＋ &nbsp; Add New Template 🌿</button></div>`;
    visible.forEach(async item=>{const holder=document.querySelector(`[data-thumb="${CSS.escape(item.id)}"]`);if(holder){const url=await previewUrl(item);holder.innerHTML=url?`<img src="${url}" alt="">`:'';}});
    await renderSelected(selected);
  }
  async function renderSelected(item) {
    if(!item){$('#previewBadge').textContent='';$('#previewControls').hidden=true;$('#previewStage').innerHTML=`<div class="empty-preview"><div style="font-size:62px;color:#abc4aa">▧</div><h3>No template selected</h3><p>${api.list().length?'Choose a template from My Templates to preview it.':'Add your first original design to see its full preview here.'}</p></div>`;$('#details').className='empty-details';$('#details').innerHTML='<div style="font-size:42px;color:#b3c6b2">⌑</div><p>Select a saved template to view its details and actions.</p>';return;}
    const url=await previewUrl(item);$('#previewBadge').textContent=`${item.favorite?'💜 Favorite · ':''}${item.category}`;$('#previewControls').hidden=false;$('#previewStage').innerHTML=url?`<img id="previewImage" src="${url}" alt="Preview of ${escape(item.name)}">`:'<p>Preview asset unavailable.</p>';applyZoom();
    $('#details').className='';$('#details').innerHTML=`<dl class="detail-list"><div><dt>Template Name</dt><dd>${escape(item.name)}</dd></div><div><dt>Category</dt><dd>${escape(item.category)}</dd></div><div><dt>Style</dt><dd>${escape(item.style)}</dd></div><div><dt>Type</dt><dd>${escape(item.type)}</dd></div><div><dt>Dimension</dt><dd>${escape(item.dimension)}</dd></div><div><dt>Created On</dt><dd>${new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(item.createdAt))}</dd></div><div><dt>Size</dt><dd>${escape(item.size)}</dd></div><div><dt>Status</dt><dd><span class="slot-tags"><span>Saved</span></span></dd></div></dl>${item.slots?.length?`<section class="slots"><h3>Slots / Areas</h3><div class="slot-tags">${item.slots.map(slot=>`<span>${escape(slot)}</span>`).join('')}</div></section>`:''}<section class="actions"><h3>Actions</h3><button class="primary" id="useTemplate">✣ &nbsp; Use This Template</button><button class="secondary" id="favoriteTemplate">♡ &nbsp; ${item.favorite?'Remove from Favorites':'Add to Favorites'}</button></section><div class="master-note">✧ <b>Master stays safe</b><br>Using this template creates a separate chapter-page copy. Your library design is never modified.</div>`;
  }
  function openPlacement() {
    const options=api.placementOptions(),dialog=$('#placementDialog'),subject=$('#placementSubject');
    if(!options.subjects.length){toast('Create or save a chapter project first, then place this template.');return;}
    dialog.dataset.options=JSON.stringify(options);subject.innerHTML=options.subjects.map(name=>`<option>${escape(name)}</option>`).join('');$('#placementChapter').value='';updateChapterSuggestions();dialog.showModal();
  }
  function placementOptions(){try{return JSON.parse($('#placementDialog').dataset.options||'{}')}catch{return {chapters:[],pages:[]}}}
  function updateChapterSuggestions(){const options=placementOptions(),subject=$('#placementSubject').value,chapters=options.chapters.filter(item=>item.subject===subject);$('#chapterSuggestions').innerHTML=chapters.map(item=>`<option value="${escape(item.name)}"></option>`).join('');updatePlacementPages();}
  function updatePlacementPages(){const options=placementOptions(),subject=$('#placementSubject').value,chapterName=$('#placementChapter').value.trim().toLowerCase(),pages=options.pages.filter(item=>item.subject===subject&&item.chapterName.toLowerCase()===chapterName);$('#placementPage').innerHTML=pages.map(item=>`<option value="${item.id}">${escape(item.name)}</option>`).join('');const existing=document.querySelector('input[name="pageMode"][value="existing"]');existing.disabled=!pages.length;if(!pages.length&&existing.checked)document.querySelector('input[name="pageMode"][value="new"]').checked=true;updatePlacementMode();}
  function updatePlacementMode(){const existing=document.querySelector('input[name="pageMode"]:checked').value==='existing';$('#existingPageWrap').hidden=!existing;$('#newPageWrap').hidden=existing;updatePlacementPath();}
  function updatePlacementPath(){const subject=$('#placementSubject').value,chapter=$('#placementChapter').value.trim()||'Type chapter name',existing=document.querySelector('input[name="pageMode"]:checked')?.value==='existing',page=existing?($('#placementPage').selectedOptions[0]?.textContent||'Choose page'):($('#placementTitle').value.trim()||'New Page');$('#placementPath').textContent=`${subject}  ›  ${chapter}  ›  ${page}`;}
  function applyZoom(){const image=$('#previewImage');if(!image)return;image.style.width=`${state.zoom*70}%`;$('#zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;}
  $('#filters').innerHTML=filters.map(name=>`<button class="filter ${name==='All'?'active':''}" data-filter="${name}">${name}${name==='All'?' (0)':''}</button>`).join('');
  document.addEventListener('click',async event=>{
    if(event.target.closest('.add-template')){$('#templateForm').reset();$('#addDialog').showModal();return;}
    if(event.target.closest('[data-close]')){$('#addDialog').close();return;} if(event.target.closest('[data-close-help]')){$('#helpDialog').close();return;}
    const card=event.target.closest('[data-id]');if(card){state.selectedId=card.dataset.id;state.zoom=1;await render();return;}
    const filter=event.target.closest('[data-filter]');if(filter){state.filter=filter.dataset.filter;document.querySelectorAll('.filter').forEach(el=>el.classList.toggle('active',el===filter));await render();return;}
    const zoom=event.target.closest('[data-zoom]');if(zoom){state.zoom=Math.min(2,Math.max(.35,state.zoom+(zoom.dataset.zoom==='+'?.1:-.1)));applyZoom();return;}
    if(event.target.closest('#fit')){state.zoom=1;applyZoom();return;} if(event.target.closest('#fullscreen')){$('#previewStage').requestFullscreen?.();return;}
    if(event.target.closest('#favoriteTemplate')){api.toggleFavorite(state.selectedId);toast('Favorite updated and saved.');await render();return;}
    if(event.target.closest('#useTemplate')){openPlacement();return;}
    if(event.target.closest('[data-close-placement]')){$('#placementDialog').close();return;}
  });
  $('#search').addEventListener('input',async event=>{state.query=event.target.value;await render();});
  $('#howTo').addEventListener('click',()=>$('#helpDialog').showModal());
  $('#placementSubject').addEventListener('change',()=>{$('#placementChapter').value='';updateChapterSuggestions()});$('#placementChapter').addEventListener('input',updatePlacementPages);$('#placementPage').addEventListener('change',updatePlacementPath);$('#placementTitle').addEventListener('input',updatePlacementPath);document.querySelectorAll('input[name="pageMode"]').forEach(input=>input.addEventListener('change',updatePlacementMode));
  $('#placementForm').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),mode=data.get('pageMode');try{const page=api.createChapterCopy(state.selectedId,{subject:data.get('subject'),chapterName:data.get('chapterName'),mode,pageId:mode==='existing'?data.get('pageId'):null,title:mode==='new'?data.get('pageTitle'):''},session.userId||session.id);$('#placementDialog').close();toast('Editable page copy created. Opening editor…');setTimeout(()=>{location.href=`template-page-editor-collage.html?page=${encodeURIComponent(page.id)}`},450);}catch(error){toast(error.message||'Could not create the page copy.');}});
  $('#templateForm').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form),button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Saving…';try{const template=await api.create({name:data.get('name'),category:data.get('category'),style:data.get('style'),type:data.get('type'),dimension:data.get('dimension'),size:data.get('size'),slots:String(data.get('slots')||'').split(',').map(s=>s.trim()),notes:data.get('notes'),createdBy:session.userId||session.id},form.elements.preview.files[0]);state.selectedId=template.id;$('#addDialog').close();toast('Template saved safely.');await render();}catch(error){toast(error.message||'Could not save template.');}finally{button.disabled=false;button.textContent='Save Template';}});
  window.addEventListener('teach-curio:changed',render);window.addEventListener('beforeunload',()=>state.urls.forEach(URL.revokeObjectURL));render();
})();
