(function(){
  'use strict';
  const V=TeachCurioVideoIntelligence,S=TeachCurioStore,session=window.__videoSession,$=q=>document.querySelector(q),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const actor=()=>({userId:session.userId,permissions:session.permissions||[]}),pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
  let requestId=null,tab='plan';
  const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)};
  function setup(){
    const s=S.read(),projectSelect=$('#requestForm [name=projectId]');
    projectSelect.innerHTML='<option value="">Choose lesson</option>'+s.projects.filter(x=>!x.deletedAt).map(x=>`<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');
    $('#requestForm [name=videoType]').innerHTML=V.TYPES.map(x=>`<option value="${x}">${pretty(x)}</option>`).join('');
    $('#requestForm [name=pacing]').innerHTML=V.PACING.map(x=>`<option value="${x}">${pretty(x)}</option>`).join('');
    $('#requestForm [name=narrationStyle]').innerHTML=V.NARRATION.map(x=>`<option value="${x}">${pretty(x)}</option>`).join('');
    $('#requestForm [name=language]').innerHTML=V.LANGUAGES.map(x=>`<option value="${x}">${pretty(x)}</option>`).join('');
    $('#sceneForm [name=transition]').innerHTML=V.TRANSITIONS.map(x=>`<option value="${x}">${pretty(x)}</option>`).join('');
    const provider=V.providerStatus();$('#providerStatus').textContent=provider.message;bind();renderList();
  }
  function bind(){
    $('#newRequest').onclick=()=>{$('#requestForm').reset();$('#requestForm [name=duration]').value=120;$('#requestForm [name=subtitles]').checked=true;$('#requestDialog').showModal()};
    $('#requestForm').addEventListener('submit',e=>{if(e.submitter?.value!=='create')return;const f=e.currentTarget,d=new FormData(f);try{const r=V.createRequest({projectId:d.get('projectId'),videoType:d.get('videoType'),topic:d.get('topic'),subtopic:d.get('subtopic'),learningObjective:d.get('learningObjective'),audience:d.get('audience'),estimatedDurationSeconds:Number(d.get('duration')),pacing:d.get('pacing'),narrationStyle:d.get('narrationStyle'),visualStyle:d.get('visualStyle'),language:d.get('language'),subtitles:d.get('subtitles')==='on',backgroundMusicPreference:d.get('music')},actor());requestId=r.id;renderList();render();toast('Video request created. No video was generated.')}catch(error){toast(error.message)}});
    $('#sceneForm').addEventListener('submit',e=>{if(e.submitter?.value!=='save')return;const f=e.currentTarget,d=new FormData(f),input={title:d.get('title'),narration:d.get('narration'),visualDescription:d.get('visualDescription'),learningObjective:d.get('learningObjective'),estimatedDurationSeconds:Number(d.get('duration')),transition:d.get('transition'),notes:d.get('notes')};try{d.get('sceneId')?V.updateScene(d.get('sceneId'),input,actor()):V.addScene(requestId,input,actor());render();renderList();toast('Scene saved.')}catch(error){toast(error.message)}});
    $('#assetForm').addEventListener('submit',e=>{if(e.submitter?.value!=='link')return;const f=e.currentTarget;try{V.linkAsset(f.elements.sceneId.value,{assetId:f.elements.assetId.value},actor());render();toast('Existing asset linked by reference.')}catch(error){toast(error.message)}});
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()});
  }
  function renderList(){
    const rows=V.list();
    if(!rows.some(r=>r.id===requestId))requestId=rows[0]?.id||null;
    $('#requestList').innerHTML=rows.map(r=>`<button class="request-item ${r.id===requestId?'active':''}" data-request="${r.id}"><strong>${esc(r.topic||pretty(r.videoType))}</strong><small>${pretty(r.videoType)} · ${r.sceneCount} scene(s)</small></button>`).join('')||'<p>No video requests yet.</p>';
    document.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>{requestId=b.dataset.request;renderList();render()});
    render();
  }
  function render(){
    const data=requestId&&V.get(requestId);$('#emptyState').hidden=Boolean(data);$('#editor').hidden=!data;if(!data)return;
    if(tab==='plan')renderPlan(data);if(tab==='scenes')renderScenes(data);if(tab==='timeline')renderTimeline(data);if(tab==='review')renderReview(data);
  }
  function renderPlan({request:r,scenes}){
    const project=S.read().projects.find(x=>x.id===r.projectId);$('#content').innerHTML=`<section class="card"><h2>${esc(r.topic||project?.title||'Video plan')}</h2><div class="summary-grid"><div><small>Lesson</small><strong>${esc(project?.title||r.lessonId)}</strong></div><div><small>Type</small><strong>${pretty(r.videoType)}</strong></div><div><small>Subtopic</small><strong>${esc(r.subtopic||'Not set')}</strong></div><div><small>Audience</small><strong>${esc(r.audience)}</strong></div><div><small>Duration</small><strong>${r.estimatedDurationSeconds} seconds</strong></div><div><small>Scenes</small><strong>${scenes.length}</strong></div><div><small>Language</small><strong>${pretty(r.language)}</strong></div><div><small>Subtitles</small><strong>${r.subtitles?'Included':'Not requested'}</strong></div></div></section><section class="card"><h3>Learning objective</h3><p>${esc(r.learningObjective)}</p><h3>Direction</h3><p>${pretty(r.pacing)} pacing · ${pretty(r.narrationStyle)} narration · ${esc(r.visualStyle)}</p><p>Background music: ${esc(r.backgroundMusicPreference)}</p></section><section class="honest-status">${esc(r.providerMessage)}</section>`;
  }
  function renderScenes(data){
    $('#content').innerHTML=`<section class="card"><div class="scene-toolbar"><div><h2>Scene planner</h2><p>Each scene is structured planning data. No video rendering occurs.</p></div><button id="addScene" class="primary">Add scene</button></div><div class="scene-list">${data.scenes.map((s,i)=>sceneCard(s,i,data.links)).join('')||'<p>No scenes yet.</p>'}</div></section>`;$('#addScene').onclick=()=>openScene();
    bindSceneActions();
  }
  function sceneCard(scene,index,links){
    const sceneLinks=links.filter(x=>x.sceneId===scene.id);return`<article class="scene-card"><header><span class="scene-number">${index+1}</span><div><strong>${esc(scene.title)}</strong><small>${scene.estimatedDurationSeconds}s · ${pretty(scene.transition)}</small></div></header><h4>Narration</h4><p>${esc(scene.narration)||'<em>Missing narration</em>'}</p><h4>Visual</h4><p>${esc(scene.visualDescription)||'<em>Missing visual description</em>'}</p><div class="asset-links">${sceneLinks.map(x=>`<span class="asset-tag">${pretty(x.assetKind)}: ${esc(x.label)} <button data-unlink="${x.id}" aria-label="Unlink ${esc(x.label)}">×</button></span>`).join('')||'<span>No linked assets</span>'}</div><div class="scene-actions"><button data-edit="${scene.id}">Edit</button><button data-asset="${scene.id}">Link asset</button><button data-up="${scene.id}" ${index===0?'disabled':''}>Move up</button><button data-down="${scene.id}" ${index===V.get(requestId).scenes.length-1?'disabled':''}>Move down</button><button data-delete="${scene.id}">Delete</button></div></article>`;
  }
  function bindSceneActions(){
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openScene(V.get(requestId).scenes.find(x=>x.id===b.dataset.edit)));document.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>openAsset(b.dataset.asset));document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{V.moveScene(b.dataset.up,'up',actor());render();renderList()});document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{V.moveScene(b.dataset.down,'down',actor());render();renderList()});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{V.removeScene(b.dataset.delete,actor());render();renderList()});document.querySelectorAll('[data-unlink]').forEach(b=>b.onclick=()=>{V.unlinkAsset(b.dataset.unlink,actor());render()});
  }
  function openScene(scene){
    const f=$('#sceneForm');f.reset();f.elements.sceneId.value=scene?.id||'';f.elements.title.value=scene?.title||'';f.elements.duration.value=scene?.estimatedDurationSeconds||15;f.elements.narration.value=scene?.narration||'';f.elements.visualDescription.value=scene?.visualDescription||'';f.elements.learningObjective.value=scene?.learningObjective||'';f.elements.transition.value=scene?.transition||'cut';f.elements.notes.value=scene?.notes||'';$('#sceneDialogTitle').textContent=scene?'Edit scene':'Add scene';$('#sceneDialog').showModal();
  }
  function openAsset(sceneId){
    const catalog=V.assetCatalog(V.get(requestId).request.projectId),f=$('#assetForm');f.elements.sceneId.value=sceneId;f.elements.assetId.innerHTML=catalog.map(x=>`<option value="${x.id}">${pretty(x.kind)} · ${esc(x.label)}</option>`).join('')||'<option value="">No approved assets available</option>';$('#assetDialog').showModal();
  }
  function renderTimeline(data){
    $('#content').innerHTML=`<section class="card"><h2>Scene timeline</h2><p>Use the buttons to rearrange the plan. Scene numbers update immediately.</p><div class="timeline">${data.scenes.map((s,i)=>`<article class="timeline-scene"><span class="scene-number">${i+1}</span><strong>Scene ${i+1}: ${esc(s.title)}</strong><small>${s.estimatedDurationSeconds}s · ${pretty(s.transition)}</small><p>${esc(s.learningObjective||s.visualDescription||'No objective')}</p><div class="timeline-controls"><button data-up="${s.id}" ${i===0?'disabled':''}>← Earlier</button><button data-down="${s.id}" ${i===data.scenes.length-1?'disabled':''}>Later →</button></div></article>`).join('')||'<p>No scenes to display.</p>'}</div></section>`;document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{V.moveScene(b.dataset.up,'up',actor());render();renderList()});document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{V.moveScene(b.dataset.down,'down',actor());render();renderList()});
  }
  function renderReview(data){
    const result=V.validate(requestId);$('#content').innerHTML=`<section class="card"><div class="scene-toolbar"><div><h2>Planning review</h2><p>${result.blocking} blocking issue(s) · ${result.warnings} warning(s)</p></div><button id="runReview" class="primary">Save review snapshot</button></div><div class="review-list">${result.issues.map(x=>`<div class="issue ${x.severity}"><strong>${pretty(x.code)}</strong><p>${esc(x.message)}</p></div>`).join('')}</div></section><section class="honest-status">${esc(result.provider.message)}</section><section class="card"><h3>Generation boundary</h3><p>This foundation can prepare structured, provider-independent planning data only. It does not generate, render, export or fabricate a video.</p><button id="prepare" class="secondary">Check provider readiness</button></section>`;$('#runReview').onclick=()=>{const r=V.review(requestId,actor());toast(r.status==='planning_complete'?'Planning review saved.':'Review saved — changes are required.');renderList();render()};$('#prepare').onclick=()=>{try{const r=V.prepareProviderRequest(requestId,actor());toast(r.message)}catch(error){toast(error.message)}};
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
