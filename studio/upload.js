(function () {
  if (!window.__studioSession) return;
  const store = window.TeachCurioStore;
  const files = window.TeachCurioFileStorage;
  const validator = window.TeachCurioFileValidation;
  const session = window.__studioSession;
  const $ = selector => document.querySelector(selector);
  const state = { projectId: new URLSearchParams(location.search).get('project'), selectedId: null, mode: 'text', previewUrl: null, saveTimer: null };
  const icons = { text:'¶', pdf:'PDF', docx:'DOC', image:'IMG', map:'MAP', diagram:'DIA', audio:'AUD', existing_note:'NOTE' };

  function esc(value = '') { const node=document.createElement('div'); node.textContent=value; return node.innerHTML; }
  function currentProject() { return state.projectId ? store.getProject(state.projectId) : null; }
  function sources() { return state.projectId ? store.getProjectSources(state.projectId) : []; }
  function selected() { return sources().find(source => source.id === state.selectedId) || null; }
  function formatBytes(bytes) {
    if (!bytes) return '0 B'; const units=['B','KB','MB','GB']; const index=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),3);
    return `${(bytes/Math.pow(1024,index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }
  function setSave(status, text) { $('#saveState').className=`save-state ${status}`; $('#saveState').textContent=text; }
  function savedSoon() {
    setSave('saving','Saving…'); clearTimeout(state.saveTimer);
    state.saveTimer=setTimeout(()=>setSave('','Saved'),500);
  }
  function toast(message, error=false) {
    const node=$('#toast'); node.textContent=message; node.style.background=error?'#8d3348':'#41285f'; node.classList.add('show');
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('show'),3600);
  }
  function createProjectDialog(project=null) {
    $('#projectForm').reset();
    const projects=store.read().projects.filter(item=>!item.deletedAt&&item.status!=='archived');
    $('#existingProject').innerHTML='<option value="">Create a new project</option>'+projects.map(item=>`<option value="${item.id}" ${item.id===project?.id?'selected':''}>${esc(item.title)}</option>`).join('');
    $('#projectTitle').value=project?.title||''; $('#projectDesc').value=project?.description||'';
    $('#projectSubject').value=project?.subject||''; $('#projectChapter').value=project?.chapterHint||'';
    $('#projectNotes').value=project?.creatorNotes||''; $('#projectDialog').showModal();
    setTimeout(()=>$('#projectTitle').focus(),40);
  }
  function ensureProject() {
    if (!currentProject()) createProjectDialog();
  }
  function renderHeader() {
    const project=currentProject();
    $('#projectHeading').textContent=project?.title||'Choose or create a project';
    $('#projectDescription').textContent=project?.description||'Every source stays connected to one lesson project.';
  }
  function renderComposer() {
    const project=currentProject();
    if (!project) {
      $('#composer').innerHTML='<div class="empty-material"><h3>Create a project first</h3><p>Source material always belongs to a saved Studio project.</p><button class="primary" data-create>New project</button></div>';
      return;
    }
    if (state.mode==='text' || state.mode==='clipboard') {
      $('#composer').innerHTML=`<form class="composer-card" id="textForm"><h3>${state.mode==='clipboard'?'Paste from clipboard':'Write or paste text'}</h3>
        <div class="field-row"><label>Material title<input id="textTitle" required maxlength="100" placeholder="Name this source"></label><label>Source type<select id="textType"><option value="text">Typed text</option><option value="text">Pasted text</option></select></label></div>
        <label>Text content<textarea id="textContent" required placeholder="Your original material stays exactly as entered"></textarea><span class="char-count" id="charCount">0 characters</span></label>
        <div class="field-row"><label>Optional source name<input id="textSource" maxlength="120" placeholder="Book, teacher, website…"></label><label>Optional source notes<input id="textNotes" maxlength="300"></label></div>
        ${state.mode==='clipboard'?'<button type="button" class="secondary" id="readClipboard">Read clipboard</button>':''}
        <div class="composer-actions"><button type="button" class="secondary" data-clear>Clear</button><button class="primary">Add to Project</button></div></form>`;
    } else if (state.mode==='existing') {
      $('#composer').innerHTML='<div class="empty-material"><h3>Existing Notes not connected yet</h3><p>The adapter is ready for a future Notes data source. No sample notes are shown.</p></div>';
    } else {
      const imageOnly=state.mode==='image';
      $('#composer').innerHTML=`<div class="drop-zone" id="dropZone" tabindex="0" role="button" aria-label="Choose or drop ${imageOnly?'images':'files'}"><b>↑</b><h3>Drop ${imageOnly?'images, maps or diagrams':'files'} here</h3><p>${imageOnly?'JPG, PNG, WebP or GIF':'PDF, DOCX, common images and audio · up to 25 MB each'}</p><button class="secondary" id="browseFiles">Choose ${imageOnly?'from gallery or camera':'files'}</button></div>`;
    }
  }
  function renderList() {
    const items=sources(); $('#sourceCount').textContent=items.length;
    $('#sourceList').innerHTML=items.length?items.map((source,index)=>`<article class="source-card ${source.id===state.selectedId?'selected':''}" data-source="${source.id}" tabindex="0">
      <div class="source-kind">${icons[source.kind]||'SRC'}</div><div class="source-copy"><h3>${esc(source.title)}</h3><p>${source.kind==='text'?`${source.textContent.length.toLocaleString()} characters`:formatBytes(source.fileSize)} · ${new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(new Date(source.createdAt))}</p>
      <div class="badges">${source.primary?'<span class="badge primary">Primary</span>':''}<span class="badge">${source.includeInAnalysis?'Included':'Excluded'}</span>${source.uploadStatus==='metadata_only'?'<span class="badge warning">File needs re-selection</span>':''}</div></div>
      <div class="source-actions"><button data-up title="Move earlier" aria-label="Move ${esc(source.title)} earlier" ${index===0?'disabled':''}>↑</button><button data-down title="Move later" aria-label="Move ${esc(source.title)} later" ${index===items.length-1?'disabled':''}>↓</button><button data-remove title="Remove" aria-label="Remove ${esc(source.title)}">×</button></div></article>`).join(''):'';
  }
  async function renderPreview() {
    if (state.previewUrl) { URL.revokeObjectURL(state.previewUrl); state.previewUrl=null; }
    const source=selected();
    if (!source) {
      $('#previewContent').innerHTML='<div class="preview-empty"><div><b>✦</b><h3>Select a source</h3><p>Preview its original content and edit metadata here.</p></div></div>'; return;
    }
    let preview='';
    if (source.kind==='text') preview=`<pre class="text-preview">${esc(source.textContent)}</pre>`;
    else {
      let blob=null; try { blob=await files.get(source.id); } catch {}
      if (blob && ['image','map','diagram'].includes(source.kind)) { state.previewUrl=URL.createObjectURL(blob); preview=`<img class="media-preview" src="${state.previewUrl}" alt="Preview of ${esc(source.title)}">`; }
      else if (blob && source.kind==='audio') { state.previewUrl=URL.createObjectURL(blob); preview=`<audio class="media-preview" controls src="${state.previewUrl}"></audio>`; }
      else preview=`<div class="metadata-preview"><h3>${esc(source.originalName)}</h3><p>${source.mimeType||source.kind} · ${formatBytes(source.fileSize)}</p><p>${source.kind==='pdf'?'PDF reading is not connected yet.':source.kind==='docx'?'DOCX content preview is not connected yet.':'The local file is unavailable and may need to be selected again.'}</p></div>`;
    }
    $('#previewContent').innerHTML=`${preview}<form class="settings" id="settingsForm">
      <label>Display title<input name="title" value="${esc(source.title)}" required maxlength="100"></label>
      ${source.kind==='text'?`<label>Source text<textarea name="textContent">${esc(source.textContent)}</textarea></label>`:''}
      <label>Source category<select name="kind">${['text','pdf','docx','image','map','diagram','audio','existing_note'].map(kind=>`<option value="${kind}" ${kind===source.kind?'selected':''}>${kind.replace('_',' ')}</option>`).join('')}</select></label>
      <label>Source name<input name="sourceName" value="${esc(source.sourceName)}" maxlength="120"></label>
      <label>Creator notes<textarea name="creatorNotes" maxlength="1000">${esc(source.creatorNotes)}</textarea></label>
      <div class="two-fields"><label>Language hint<input name="languageHint" value="${esc(source.languageHint)}"></label><label>Subject hint<input name="subjectHint" value="${esc(source.subjectHint)}"></label></div>
      <label>Chapter hint<input name="chapterHint" value="${esc(source.chapterHint)}"></label>
      <label class="toggle-row"><span>Primary source</span><input type="checkbox" name="primary" ${source.primary?'checked':''}></label>
      <label class="toggle-row"><span>Include in analysis</span><input type="checkbox" name="includeInAnalysis" ${source.includeInAnalysis?'checked':''}></label>
    </form>${source.kind!=='text'?'<p class="file-note">Files are stored in this browser when storage is available. Browser cleanup or private mode may remove them; metadata stays in the Studio draft.</p>':''}`;
  }
  function renderAnalysis() {
    const included=sources().filter(source=>source.includeInAnalysis);
    $('#analyseButton').disabled=!currentProject()||!included.length;
    $('#analysisSummary').textContent=included.length?`${included.length} source${included.length===1?'':'s'} ready for analysis`:'Add material to continue';
  }
  function renderAll() { renderHeader(); renderComposer(); renderList(); renderPreview(); renderAnalysis(); }

  async function addFiles(fileList) {
    const project=currentProject(); if (!project) return ensureProject();
    let existing=sources();
    for (const file of Array.from(fileList)) {
      const result=validator.validate(file,existing);
      if (!result.ok) { toast(result.error,true); continue; }
      const source=store.addSource(project.id,{ title:file.name.replace(/\.[^.]+$/,''), originalName:file.name, kind:result.kind, mimeType:file.type, fileSize:file.size, uploadStatus:files.available?'stored':'metadata_only', originalMetadata:{lastModified:file.lastModified} });
      try { if(files.available) await files.save(source.id,file); } catch { store.updateSource(source.id,{uploadStatus:'metadata_only'}); toast(`${file.name}: metadata saved, but the local file could not be stored.`,true); }
      state.selectedId=source.id; existing=sources();
    }
    savedSoon(); renderAll();
  }
  async function analyse() {
    const included=sources().filter(source=>source.includeInAnalysis); if(!included.length) return toast('Choose at least one source for analysis.',true);
    $('#analysisDialog').showModal(); $('#analysisTitle').textContent='Checking AI analysis service'; $('#analysisMessage').textContent='Your sources are safe. No analysis stage will be marked complete without a provider report.';
    $('#analysisStages').querySelectorAll('li').forEach((li,index)=>li.className=index===0?'current':'');
    try {
      const output = await window.TeachCurioAI.provider.extractLessonStructure({ projectId:state.projectId, selectedSourceIds:included.map(source=>source.id), sources:included, project:currentProject() });
      const validated = window.TeachCurioAI.validateStructureOutput(output);
      window.TeachCurioStructure.importProposal(state.projectId,validated,session.id);
      store.updateProject(state.projectId,{status:'needs_review'});
      window.location.href=`structure.html?project=${encodeURIComponent(state.projectId)}`;
    } catch (error) {
      $('#analysisTitle').textContent=error.name==='StudioAiUnavailableError'?'AI analysis service is not connected yet.':'Analysis could not start';
      $('#analysisMessage').textContent=error.message;
      $('#analysisStages li').className='failed'; store.updateProject(state.projectId,{status:'material_uploaded'}); setSave('','Saved');
    }
  }

  $('#projectForm').addEventListener('submit',event=>{
    if(event.submitter?.value==='cancel') return;
    event.preventDefault(); if(!$('#projectTitle').reportValidity()) return;
    const input={title:$('#projectTitle').value,description:$('#projectDesc').value,subject:$('#projectSubject').value,chapterHint:$('#projectChapter').value,creatorNotes:$('#projectNotes').value};
    try {
      const project=currentProject()?store.updateProject(state.projectId,input):store.createProject({...input,createdBy:session.id});
      state.projectId=project.id; history.replaceState(null,'',`upload.html?project=${encodeURIComponent(project.id)}`); $('#projectDialog').close(); savedSoon(); renderAll();
    } catch(error) { setSave('error','Save failed'); toast(error.message,true); }
  });
  $('#existingProject').addEventListener('change',event=>{
    if(!event.target.value) {
      $('#projectTitle').value=''; $('#projectDesc').value=''; $('#projectSubject').value=''; $('#projectChapter').value=''; $('#projectNotes').value=''; $('#projectTitle').focus(); return;
    }
    state.projectId=event.target.value; state.selectedId=store.getProjectSources(state.projectId)[0]?.id||null;
    history.replaceState(null,'',`upload.html?project=${encodeURIComponent(state.projectId)}`);
    $('#projectDialog').close(); renderAll();
  });
  $('#changeProject').addEventListener('click',()=>createProjectDialog(currentProject()));
  $('#saveDraft').addEventListener('click',()=>{ try { if(!currentProject()) return ensureProject(); store.updateProject(state.projectId,{}); setSave('','Saved'); toast('Draft saved.'); } catch(error){setSave('error','Save failed');toast(error.message,true);} });
  document.querySelectorAll('.material-choice').forEach(button=>button.addEventListener('click',()=>{ state.mode=button.dataset.mode; document.querySelectorAll('.material-choice').forEach(item=>item.classList.toggle('active',item===button)); renderComposer(); }));
  $('#addMore').addEventListener('click',()=>{state.mode='text';renderComposer();$('#composer').scrollIntoView({behavior:'smooth',block:'center'});});
  $('#composer').addEventListener('input',event=>{if(event.target.id==='textContent')$('#charCount').textContent=`${event.target.value.length.toLocaleString()} characters`;});
  $('#composer').addEventListener('click',async event=>{
    if(event.target.closest('[data-create]')) createProjectDialog();
    if(event.target.closest('[data-clear]')) { $('#textForm').reset(); $('#charCount').textContent='0 characters'; }
    if(event.target.closest('#browseFiles')) { event.preventDefault(); $(state.mode==='image'?'#imageInput':'#fileInput').click(); }
    if(event.target.closest('#readClipboard')) {
      try { $('#textContent').value=await navigator.clipboard.readText(); $('#textContent').dispatchEvent(new Event('input',{bubbles:true})); }
      catch { toast('Clipboard permission was denied. Paste manually into the text box.',true); $('#textContent').focus(); }
    }
  });
  $('#composer').addEventListener('submit',event=>{
    if(event.target.id!=='textForm') return; event.preventDefault();
    const text=$('#textContent').value; if(!text.trim()) return toast('Add some text before saving this material.',true);
    try {
      const source=store.addSource(state.projectId,{title:$('#textTitle').value.trim(),originalName:$('#textTitle').value.trim(),kind:'text',textContent:text,sourceName:$('#textSource').value,creatorNotes:$('#textNotes').value,uploadStatus:'stored',originalMetadata:{characterCount:text.length}});
      state.selectedId=source.id; event.target.reset(); savedSoon(); renderAll();
    } catch(error) { setSave('error','Save failed'); toast('This text could not be saved in browser storage. Your editor content has been preserved.',true); }
  });
  $('#composer').addEventListener('dragover',event=>{if(event.target.closest('#dropZone')){event.preventDefault();$('#dropZone').classList.add('dragover');}});
  $('#composer').addEventListener('dragleave',event=>{if(event.target.closest('#dropZone'))$('#dropZone').classList.remove('dragover');});
  $('#composer').addEventListener('drop',event=>{if(event.target.closest('#dropZone')){event.preventDefault();$('#dropZone').classList.remove('dragover');addFiles(event.dataTransfer.files);}});
  $('#composer').addEventListener('keydown',event=>{if(event.target.id==='dropZone'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();$(state.mode==='image'?'#imageInput':'#fileInput').click();}});
  $('#fileInput').addEventListener('change',event=>{addFiles(event.target.files);event.target.value='';}); $('#imageInput').addEventListener('change',event=>{addFiles(event.target.files);event.target.value='';});
  $('#sourceList').addEventListener('click',event=>{
    const card=event.target.closest('[data-source]'); if(!card)return; const id=card.dataset.source;
    if(event.target.closest('[data-up]')) store.reorderSource(id,-1);
    else if(event.target.closest('[data-down]')) store.reorderSource(id,1);
    else if(event.target.closest('[data-remove]')) { state.selectedId=id; $('#confirmDialog').showModal(); }
    else state.selectedId=id; renderList(); renderPreview();
  });
  $('#sourceList').addEventListener('keydown',event=>{if(event.target.matches('.source-card')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();state.selectedId=event.target.dataset.source;renderList();renderPreview();}});
  $('#confirmDialog').addEventListener('close',async()=>{if($('#confirmDialog').returnValue!=='remove')return;const id=state.selectedId;store.removeSource(id);try{await files.remove(id);}catch{}state.selectedId=sources()[0]?.id||null;savedSoon();renderAll();});
  $('#previewContent').addEventListener('change',event=>{
    const form=event.target.closest('#settingsForm'); if(!form)return;
    const data=new FormData(form); const changes={title:data.get('title'),kind:data.get('kind'),sourceName:data.get('sourceName'),creatorNotes:data.get('creatorNotes'),languageHint:data.get('languageHint'),subjectHint:data.get('subjectHint'),chapterHint:data.get('chapterHint'),primary:data.has('primary'),includeInAnalysis:data.has('includeInAnalysis')}; if(data.has('textContent'))changes.textContent=data.get('textContent');
    try { store.updateSource(state.selectedId,changes);savedSoon();renderList();renderAnalysis(); } catch(error){setSave('error','Save failed');toast(error.message,true);}
  });
  $('#previewContent').addEventListener('input',event=>{if(event.target.closest('#settingsForm')){clearTimeout(state.settingsTimer);state.settingsTimer=setTimeout(()=>event.target.dispatchEvent(new Event('change',{bubbles:true})),500);}});
  $('#analyseButton').addEventListener('click',analyse); $('#retryAnalysis').addEventListener('click',analyse);
  $('#buildManually').addEventListener('click',()=>{ window.location.href=`structure.html?project=${encodeURIComponent(state.projectId)}`; });
  $('#returnMaterials').addEventListener('click',()=>$('#analysisDialog').close()); $('#closeAnalysis').addEventListener('click',()=>$('#analysisDialog').close());
  window.addEventListener('teach-curio:changed',()=>{renderHeader();renderList();renderAnalysis();});
  window.addEventListener('beforeunload',()=>{if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);});
  const initialSources=sources(); state.selectedId=initialSources[0]?.id||null; renderAll(); ensureProject();
})();
