(function(){
  if(!window.__studioSession)return;
  const $=selector=>document.querySelector(selector),store=window.TeachCurioStore,writing=window.TeachCurioWriting,learning=window.TeachCurioLearning,session=window.__studioSession;
  const state={projectId:new URLSearchParams(location.search).get('project'),selectedId:null,language:'dual',dirty:false,pendingPrompt:null,pendingRun:null,regenerateSection:null,learningTarget:null,learningItemId:null,learningDirty:null,versionTarget:null};
  const esc=value=>{const node=document.createElement('div');node.textContent=value||'';return node.innerHTML;};
  const project=()=>store.getProject(state.projectId),draft=()=>writing.draftFor(state.projectId);
  const structure=()=>store.read().lessonStructures.find(item=>item.projectId===state.projectId);
  const variant=(variants,language)=>variants?.find(item=>item.language===language)?.content||'';
  function toast(message,error=false){const node=$('#toast');node.textContent=message;node.style.background=error?'#8d3348':'#41285f';node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),3400);}
  function saveState(kind,text){$('#saveState').className=`save-state ${kind}`;$('#saveState').textContent=text;}
  function approvedRequest(){return writing.approvedInput(state.projectId);}
  function populateManualSelectors(nodeSelector,sourcesSelector){
    const input=approvedRequest(),nodes=input.structure.nodes.filter(node=>['topic','subtopic','concept'].includes(node.nodeType)),projectSources=store.getProjectSources(state.projectId);
    $(nodeSelector).innerHTML=nodes.map(node=>`<option value="${node.id}">${esc(node.nodeType)} · ${esc(node.title)}</option>`).join('');
    $(sourcesSelector).innerHTML=projectSources.length?projectSources.map(source=>`<label><input type="checkbox" name="sourceIds" value="${source.id}"> ${esc(source.title)} · ${esc(source.kind)}</label>`).join(''):'<p>No source attached</p>';
  }
  function manualReferences(data){const refs=data.getAll('sourceIds').map(sourceId=>({sourceId})),name=String(data.get('sourceName')||'').trim();if(name)refs.push({sourceId:`creator:${name}`});return refs;}
  function openManualLesson(){
    try{const form=$('#manualLessonForm');form.reset();form.elements.language.value=state.language||'dual';populateManualSelectors('#manualLessonNode','#manualLessonSources');$('#manualLessonDialog').showModal();}catch(error){toast(error.message,true);}
  }
  function renderGeneration(){
    const current=draft(),container=$('#generationState'),workspace=$('#lessonWorkspace');
    if(current){container.innerHTML='';workspace.hidden=false;return;}
    workspace.hidden=true;
    try{const input=approvedRequest();container.innerHTML=`<section class="generation-card"><div><span class="eyebrow">Approved structure ready</span><h2>Write ${input.structure.concepts.length} concept explanation${input.structure.concepts.length===1?'':'s'}</h2><p>Use AI through the approved prompt, or complete the lesson manually without a provider.</p></div><div class="editor-actions"><button class="secondary" id="createManualDraft">Create Manually</button><button class="primary" id="generateDraft">Generate Lesson</button></div></section>`;}
    catch(error){container.innerHTML=`<section class="generation-card error"><div><span class="eyebrow">Cannot generate yet</span><h2>Approved structure required</h2><p>${esc(error.message)}</p></div><a class="secondary" href="structure.html?project=${encodeURIComponent(state.projectId)}">Return to Structure</a></section>`;}
  }
  function renderList(){
    const current=draft();if(!current)return;$('#sectionList').innerHTML=current.sections.filter(section=>!section.deletedAt&&section.includeInLesson!==false).map(section=>`<button class="section-card ${section.id===state.selectedId?'active':''}" data-section="${section.id}"><strong>${esc(section.title)}</strong><small>${esc((section.sectionType||'explanation').replaceAll('_',' '))} · ${esc((section.origin||section.paragraph.origin||'curio_suggested').replaceAll('_',' '))} · ${esc(section.status.replaceAll('_',' '))}</small></button>`).join('');
  }
  function languageBlocks(english,hinglish){
    const written=value=>esc(value||'Not written yet');
    if(state.language==='english')return `<div class="language-block"><small>English</small><p>${written(english)}</p></div>`;
    if(state.language==='hinglish')return `<div class="language-block hinglish"><small>Hinglish</small><p>${written(hinglish)}</p></div>`;
    return `<div class="language-block"><small>English</small><p>${written(english)}</p></div><div class="language-block hinglish"><small>Matching Hinglish</small><p>${written(hinglish)}</p></div>`;
  }
  function renderDefinition(definition){
    if(!definition)return '';
    const fields=[['definition','Definition'],['meaning','Meaning'],['keyIdea','Key Idea'],['explanation','Explanation']];
    const visible=fields.filter(([field])=>variant(definition[field],'english')||variant(definition[field],'hinglish'));
    if(!visible.length)return '';
    return `<section class="definition-preview"><h3>Definition block</h3>${visible.map(([field,label])=>`<div class="definition-row"><b>${label}</b>${languageBlocks(variant(definition[field],'english'),variant(definition[field],'hinglish'))}</div>`).join('')}</section>`;
  }
  function renderPreview(){
    const current=draft(),section=current?.sections.find(item=>item.id===state.selectedId);
    document.querySelectorAll('.language-switch button').forEach(button=>button.classList.toggle('active',button.dataset.language===state.language));
    if(!section){$('#previewTitle').textContent='Select a concept';$('#previewContent').innerHTML='<div class="preview-empty"><div><b>Preview Mode</b><p>Select a concept explanation from the approved hierarchy.</p></div></div>';return;}
    $('#previewTitle').textContent=section.title;
    $('#previewContent').innerHTML=`<article class="concept-preview"><h2>${esc(section.title)}</h2>${section.sectionType==='definition'?'':languageBlocks(variant(section.paragraph.variants,'english'),variant(section.paragraph.variants,'hinglish'))}${renderDefinition(section.definition)}</article>`;
  }
  function definitionEditor(definition){
    if(!definition)return '<p>No definition block was returned for this concept.</p>';
    return ['definition','meaning','keyIdea','explanation'].map(field=>`<label>${field==='keyIdea'?'Key Idea':field[0].toUpperCase()+field.slice(1)} · English<textarea name="${field}English">${esc(variant(definition[field],'english'))}</textarea></label><label>${field==='keyIdea'?'Key Idea':field[0].toUpperCase()+field.slice(1)} · Hinglish<textarea name="${field}Hinglish">${esc(variant(definition[field],'hinglish'))}</textarea></label>`).join('');
  }
  function renderEditor(){
    const current=draft(),section=current?.sections.find(item=>item.id===state.selectedId);
    if(!section){$('#sectionEditor').innerHTML='<div class="preview-empty"><p>Select a concept to edit its explanation.</p></div>';return;}
    const sourceIds=section.paragraph.sourceReferences.map(ref=>ref.sourceId),sources=store.getProjectSources(state.projectId).filter(source=>sourceIds.includes(source.id));
    $('#sectionEditor').innerHTML=`<form class="writing-form" id="writingForm"><span class="status-pill">${section.status.replaceAll('_',' ')}</span>
      <label>English explanation<textarea name="english">${esc(variant(section.paragraph.variants,'english'))}</textarea></label>
      <label>Hinglish explanation<textarea name="hinglish">${esc(variant(section.paragraph.variants,'hinglish'))}</textarea></label>
      <details class="definition-fields"><summary>Definition fields</summary>${definitionEditor(section.definition)}</details>
      <label>Creator notes<textarea name="creatorNotes">${esc(section.creatorNotes)}</textarea></label>
      <div><span class="eyebrow">Source references</span>${sources.length?sources.map(source=>`<div class="source-mini">${esc(source.title)} · ${source.kind}</div>`).join(''):'<p>No source reference attached.</p>'}</div>
      <div class="editor-actions"><button class="primary" type="submit">Save Section</button><button class="secondary" type="button" data-section-approve>Approve</button><button class="secondary" type="button" data-regenerate>Regenerate Section</button><button class="secondary" type="button" data-section-duplicate>Duplicate</button><button class="secondary" type="button" data-section-move="-1" aria-label="Move section up">↑</button><button class="secondary" type="button" data-section-move="1" aria-label="Move section down">↓</button><button class="danger" type="button" data-section-reject>Reject</button><button class="danger" type="button" data-section-delete>Delete</button><button class="secondary" type="button" data-versions>Version History</button></div></form>`;
  }
  function renderAll(){
    const current=draft();renderGeneration();if(!current)return;
    state.language=current.languagePreference||state.language;const active=current.sections.filter(item=>!item.deletedAt&&item.includeInLesson!==false);if(!state.selectedId||!active.some(item=>item.id===state.selectedId))state.selectedId=active[0]?.id||null;
    renderList();renderPreview();renderEditor();renderLearning();$('#approveDraft').disabled=!current.sections.length;
  }
  function learningTitle(type){return({important_points:'Important Points',quick_summary:'Quick Summary',memory_tricks:'Memory Tricks',real_life_examples:'Real Life Examples',ssc_connection:'SSC Connection',common_mistakes:'Common Mistakes',fun_facts:'Fun Facts',revision_notes:'Revision Notes'})[type]||'Learning Enhancement';}
  function learningDomKey(type){return({important_points:'importantPoints',quick_summary:'quickSummary',memory_tricks:'memoryTricks',real_life_examples:'realLifeExamples',ssc_connection:'sscConnection',common_mistakes:'commonMistakes',fun_facts:'funFacts',revision_notes:'revisionNotes'})[type];}
  function structuredPreview(item){
    if(state.language==='english')return`<div class="language-block"><small>English</small><p>${esc(item.english)}</p></div>`;
    if(state.language==='hinglish')return`<div class="language-block hinglish"><small>Hinglish</small><p>${esc(item.hinglish)}</p></div>`;
    return`<div class="language-block"><small>English</small><p>${esc(item.english)}</p></div><div class="language-block hinglish"><small>Matching Hinglish</small><p>${esc(item.hinglish)}</p></div>`;
  }
  function renderStructuredBlock(type,body,status){
    const block=learning.blockFor(state.projectId,type),items=block?.items||[],earlier=['important_points','quick_summary','memory_tricks','real_life_examples','ssc_connection','common_mistakes'].every(required=>learning.blockFor(state.projectId,required));
    status.textContent=block?block.status.replaceAll('_',' '):'Not generated';
    const generate=earlier&&!block?`<button class="primary" data-learning-generate="${type}">Generate ${learningTitle(type)}</button>`:'';
    const manual=`<button class="secondary" data-manual-add="${type}">Add Manual ${type==='fun_facts'?'Fun Fact':'Revision Block'}</button>`;
    const blockActions=block?`<button class="secondary" data-learning-approve="${type}">Approve Section</button><button class="danger" data-learning-reject="${type}">Reject Section</button><button class="secondary" data-learning-versions="${type}">Version History</button>`:'';
    body.innerHTML=`<div class="structured-tools">${generate}${manual}${blockActions}</div>${!earlier&&!block?'<div class="structured-empty"><p>AI generation unlocks after all earlier enhancements. Manual creation remains available.</p></div>':''}<div class="structured-list">${items.length?items.sort((a,b)=>a.sortOrder-b.sortOrder).map(item=>`<article class="structured-item" data-item="${item.id}"><header><div><span class="eyebrow">${esc(item.itemType.replaceAll('_',' '))}</span><h3>${esc(item.title)}</h3></div><span class="status-pill">${esc(item.verificationStatus.replaceAll('_',' '))}</span></header><div class="item-meta"><span class="source-reference">Origin: ${esc(item.origin.replaceAll('_',' '))}</span><span class="source-reference">Approved draft: ${esc(block.lessonDraftVersionId)}</span></div>${structuredPreview(item)}<form data-structured-form="${type}" data-item-id="${item.id}"><label>Heading<input name="title" value="${esc(item.title)}" required></label><label>English<textarea name="english" required>${esc(item.english)}</textarea></label><label>Hinglish<textarea name="hinglish" required>${esc(item.hinglish)}</textarea></label><label>Creator Notes<textarea name="creatorNotes">${esc(item.creatorNotes)}</textarea></label><details><summary>View Source</summary>${item.sourceReferences.length?item.sourceReferences.map(ref=>`<div class="source-reference">${esc(ref.sourceId)}${ref.locator?` · ${esc(ref.locator)}`:''}</div>`).join(''):'<p>No exact source reference is attached.</p>'}</details><div class="item-actions"><button class="primary" type="submit">Save</button><button class="secondary" type="button" data-item-status="user_approved">Approve</button><button class="secondary" type="button" data-item-status="needs_verification">Needs Verification</button><button class="secondary" type="button" data-item-regenerate>Regenerate Item</button><button class="secondary" type="button" data-item-move="-1" aria-label="Move item up">↑</button><button class="secondary" type="button" data-item-move="1" aria-label="Move item down">↓</button><button class="danger" type="button" data-item-status="rejected">Reject</button><button class="danger" type="button" data-item-delete>Delete</button></div></form></article>`).join(''):`<div class="structured-empty"><p>${block?.creatorNotes||`No ${learningTitle(type)} yet.`}</p></div>`}</div>`;
  }
  function learningContent(block){
    const content=language=>block?.[language]||[];
    if(block.type!=='quick_summary'){
      if(state.language==='english')return`<div class="language-block"><small>English</small><ol>${content('english').map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div>`;
      if(state.language==='hinglish')return`<div class="language-block hinglish"><small>Hinglish</small><ol>${content('hinglish').map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div>`;
      return`<div class="language-block"><small>English</small><ol>${content('english').map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div><div class="language-block hinglish"><small>Matching Hinglish</small><ol>${content('hinglish').map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div>`;
    }
    return languageBlocks(content('english')[0]||'',content('hinglish')[0]||'');
  }
  function renderLearningBlock(type){
    const block=learning.blockFor(state.projectId,type),key=learningDomKey(type),body=$(`#${key}Body`),status=$(`#${key}Status`);
    if(['fun_facts','revision_notes'].includes(type)||block?.items){renderStructuredBlock(type,body,status);return;}
    status.textContent=block?block.status.replaceAll('_',' '):'Not generated';
    const part2=['memory_tricks','real_life_examples'].includes(type),part1Ready=learning.blockFor(state.projectId,'important_points')&&learning.blockFor(state.projectId,'quick_summary');
    if(!block&&part2&&!part1Ready){body.innerHTML=`<div class="learning-empty"><h3>${learningTitle(type)}</h3><p>Generate Important Points and Quick Summary first.</p><button class="secondary" disabled>Waiting for Part 1</button></div>`;return;}
    const part3=['ssc_connection','common_mistakes'].includes(type),part2Ready=['important_points','quick_summary','memory_tricks','real_life_examples'].every(required=>learning.blockFor(state.projectId,required));
    if(!block&&part3&&!part2Ready){body.innerHTML=`<div class="learning-empty"><h3>${learningTitle(type)}</h3><p>Generate all Part 1 and Part 2 enhancements first.</p><button class="secondary" disabled>Waiting for earlier enhancements</button></div>`;return;}
    const descriptions={important_points:'Extract concise essential learning points.',quick_summary:'Create a natural short summary without repeating Important Points.',memory_tricks:'Build accurate associations and explain why each one works.',real_life_examples:'Connect approved concepts to simple, relevant everyday life.',ssc_connection:'Explain educational SSC relevance without predictions or invented previous-year questions.',common_mistakes:'Warn learners about supported conceptual errors and confusions.'};
    if(!block){body.innerHTML=`<div class="learning-empty"><h3>${learningTitle(type)}</h3><p>${descriptions[type]}</p><div class="editor-actions"><button class="secondary" data-manual-add="${type}">Add Manually</button><button class="primary" data-learning-generate="${type}">Generate ${learningTitle(type)}</button></div></div>`;return;}
    const lines=language=>block[language].join('\n');
    body.innerHTML=`<div class="structured-tools"><button class="secondary" data-manual-add="${type}">Add Manually</button></div><div class="learning-body"><section class="learning-preview"><span class="eyebrow">Preview</span>${learningContent(block)}</section><form class="learning-editor" data-learning-form="${type}"><label>English ${type==='quick_summary'?'summary':'· one item per line'}<textarea name="english" required>${esc(lines('english'))}</textarea></label><label>Hinglish ${type==='quick_summary'?'summary':'· one item per line'}<textarea name="hinglish" required>${esc(lines('hinglish'))}</textarea></label><label>Creator Notes<textarea name="creatorNotes">${esc(block.creatorNotes)}</textarea></label><div class="learning-actions"><button class="primary" type="submit">Save</button><button class="secondary" type="button" data-learning-approve="${type}">Approve</button><button class="secondary" type="button" data-learning-regenerate="${type}">Regenerate</button><button class="danger" type="button" data-learning-reject="${type}">Reject</button><button class="secondary" type="button" data-learning-versions="${type}">Version</button></div></form></div>`;
  }
  function renderLearning(){
    const current=draft(),container=$('#learningEnhancements');container.hidden=!current||current.status!=='approved';
    if(container.hidden)return;
    const enhancement=learning.enhancementFor(state.projectId);if(enhancement?.languagePreference)state.language=enhancement.languagePreference;
    renderLearningBlock('important_points');renderLearningBlock('quick_summary');renderLearningBlock('memory_tricks');renderLearningBlock('real_life_examples');renderLearningBlock('ssc_connection');renderLearningBlock('common_mistakes');renderLearningBlock('fun_facts');renderLearningBlock('revision_notes');
  }
  function promptOptions(){
    return{role:$('#promptRole').value,objective:$('#promptObjective').value,writingStyle:$('#promptStyle').value,language:state.language||'dual'};
  }
  function promptInput(){
    const input=approvedRequest();
    if(state.regenerateSection)input.structure={...input.structure,concepts:input.structure.concepts.filter(node=>node.id===state.regenerateSection.structureNodeId)};
    return input;
  }
  function renderPromptPreview(){
    try{
      const prompt=state.learningTarget?window.TeachCurioPromptBuilder.buildLearning(promptInput(),draft(),state.learningTarget,{...promptOptions(),itemId:state.learningItemId}):window.TeachCurioPromptBuilder.build(promptInput(),promptOptions()),validation=window.TeachCurioPromptBuilder.validate(prompt);
      state.pendingPrompt=prompt;
      $('#promptValidation').className=validation.valid?'prompt-valid':'prompt-invalid';
      $('#promptValidation').textContent=validation.valid?'Prompt is valid and ready for the provider.':validation.errors.join(' ');
      const list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
      $('#promptDetails').innerHTML=`<div class="prompt-grid"><section class="prompt-section"><h3>Role and objective</h3><p>${esc(prompt.role)} · ${esc(prompt.objective.replaceAll('_',' '))}</p><p>${esc(prompt.language)} · ${esc(prompt.writingStyle.replaceAll('_',' '))}</p></section><section class="prompt-section"><h3>Output format</h3><p>${esc(prompt.outputMode.replaceAll('_',' '))}</p><p>${prompt.approvedStructure.concepts.length} approved Concept${prompt.approvedStructure.concepts.length===1?'':'s'} · Template ${esc(prompt.templateId)} v${prompt.templateVersion}</p></section></div><section class="prompt-section"><h3>Approved structure</h3>${list(prompt.approvedStructure.nodes.map(node=>`${node.nodeType}: ${node.title}`))}</section><div class="prompt-grid"><section class="prompt-section"><h3>Approved metadata</h3>${prompt.approvedMetadata.length?list(prompt.approvedMetadata.map(item=>`${item.type}: ${item.value}`)):'<p>No approved metadata. Generation may continue using the approved structure.</p>'}</section><section class="prompt-section"><h3>Source references</h3>${prompt.sourceReferences.length?list(prompt.sourceReferences):'<p>No approved source references.</p>'}</section></div><section class="prompt-section"><h3>Creator notes</h3><p>${esc(prompt.creatorNotes||'No Creator notes supplied.')}</p></section><div class="prompt-grid"><section class="prompt-section"><h3>Restrictions</h3>${list(prompt.restrictions)}</section><section class="prompt-section"><h3>Formatting and verification</h3>${list(prompt.formattingRules)}<p>Unsupported claims must be flagged. Publishing is prohibited.</p></section></div>`;
      const previewOnly=Boolean(draft()&&!state.regenerateSection&&!state.learningTarget);
      $('#sendPrompt').disabled=!validation.valid||previewOnly;
      $('#sendPrompt').textContent=previewOnly?'Preview only':'Send to AI';
    }catch(error){state.pendingPrompt=null;$('#promptValidation').className='prompt-invalid';$('#promptValidation').textContent=error.message;$('#promptDetails').innerHTML='';$('#sendPrompt').disabled=true;}
  }
  function openPromptPreview(regenerateSection=null){
    try{
      state.regenerateSection=regenerateSection;state.learningTarget=null;state.learningItemId=null;
      const input=promptInput(),subject=input.structure.nodes.find(node=>node.nodeType==='subject')?.title,template=window.TeachCurioPromptBuilder.templateFor(subject);
      $('#promptRole').value=template.role||'Educational Lesson Writer';$('#promptStyle').value=template.writingStyle||'clear_beginner_friendly';
      $('#promptObjective').value=regenerateSection?'regenerate_concept':'generate_explanation';
      renderPromptPreview();$('#promptDialog').showModal();
    }catch(error){toast(error.message,true);}
  }
  function openLearningPrompt(type,itemId=null){
    try{
      if(['memory_tricks','real_life_examples'].includes(type)&&(!learning.blockFor(state.projectId,'important_points')||!learning.blockFor(state.projectId,'quick_summary')))throw new Error('Generate Important Points and Quick Summary before Part 2 enhancements.');
      if(['ssc_connection','common_mistakes'].includes(type)&&!['important_points','quick_summary','memory_tricks','real_life_examples'].every(required=>learning.blockFor(state.projectId,required)))throw new Error('Generate all Part 1 and Part 2 enhancements before Part 3.');
      if(['fun_facts','revision_notes'].includes(type)&&!itemId&&!['important_points','quick_summary','memory_tricks','real_life_examples','ssc_connection','common_mistakes'].every(required=>learning.blockFor(state.projectId,required)))throw new Error('Generate all earlier learning enhancements before Part 4 AI generation. Manual creation remains available.');
      state.regenerateSection=null;state.learningTarget=type;state.learningItemId=itemId;
      const input=promptInput(),subject=input.structure.nodes.find(node=>node.nodeType==='subject')?.title,template=window.TeachCurioPromptBuilder.templateFor(subject);
      $('#promptRole').value=template.role||'Educational Lesson Writer';$('#promptStyle').value=template.writingStyle||'clear_beginner_friendly';
      $('#promptObjective').value=({important_points:'generate_important_points',quick_summary:'generate_quick_summary',memory_tricks:'generate_memory_tricks',real_life_examples:'generate_real_life_examples',ssc_connection:'generate_ssc_connection',common_mistakes:'generate_common_mistakes',fun_facts:itemId?'regenerate_fun_fact':'generate_fun_facts',revision_notes:itemId?'regenerate_revision_block':'generate_revision_notes'})[type];
      renderPromptPreview();$('#promptDialog').showModal();
    }catch(error){toast(error.message,true);}
  }
  async function sendPrompt(){
    renderPromptPreview();if(!state.pendingPrompt)return;
    const input=promptInput(),conceptIds=input.structure.concepts.map(node=>node.id);
    const capability=({important_points:'generateImportantPoints',quick_summary:'generateQuickSummary',memory_tricks:'generateMemoryTricks',real_life_examples:'generateRealLifeExamples',ssc_connection:'generateSSCConnection',common_mistakes:'generateCommonMistakes',fun_facts:state.learningItemId?'regenerateFunFact':'generateFunFacts',revision_notes:state.learningItemId?'regenerateRevisionBlock':'generateRevisionNotes'})[state.learningTarget]||'generateLessonDraft';
    state.pendingRun=window.TeachCurioPromptBuilder.record(state.projectId,state.pendingPrompt,session.id,capability);
    window.TeachCurioPromptBuilder.updateRun(state.pendingRun.id,'sent');$('#promptDialog').close();
    $('#providerDialog').showModal();$('#providerTitle').textContent=state.learningTarget?`Generating ${learningTitle(state.learningTarget)}`:state.regenerateSection?`Regenerating ${state.regenerateSection.title}`:'Writing from approved structure';$('#providerMessage').textContent='The validated provider-neutral prompt was sent. No lesson text is invented locally.';
    try{
      const output=await window.TeachCurioAI.execute(capability,state.pendingPrompt);
      if(state.learningTarget){
        if(['fun_facts','revision_notes'].includes(state.learningTarget)){
          const approvedNodes=promptInput().structure.nodes.map(node=>node.id),validated=window.TeachCurioAI.validateStructuredLearningOutput(output,state.learningTarget,approvedNodes);
          if(state.learningItemId){if(validated.items.length!==1)throw new Error('Single-item regeneration must return exactly one item.');learning.replaceItem(state.projectId,state.learningTarget,state.learningItemId,validated.items[0],session.id);}
          else learning.importStructuredBlock(state.projectId,state.learningTarget,validated,session.id);
        }else{
          const validated=window.TeachCurioAI.validateLearningBlockOutput(output,state.learningTarget);
          if(learning.blockFor(state.projectId,state.learningTarget))learning.replace(state.projectId,state.learningTarget,validated,session.id);else learning.importBlock(state.projectId,state.learningTarget,validated,session.id);
        }
      }else{
        const validated=window.TeachCurioAI.validateLessonDraftOutput(output,conceptIds);
        if(state.regenerateSection)writing.replaceSection(state.projectId,state.regenerateSection.id,validated.sections[0],session.id);
        else{const created=writing.importProviderDraft(state.projectId,validated,session.id);state.selectedId=created.sections[0]?.id||null;}
      }
      window.TeachCurioPromptBuilder.updateRun(state.pendingRun.id,'completed');state.regenerateSection=null;state.learningTarget=null;state.learningItemId=null;$('#providerDialog').close();renderAll();
    }catch(error){window.TeachCurioPromptBuilder.updateRun(state.pendingRun.id,'failed',error.message);$('#providerTitle').textContent=error.name==='StudioAiUnavailableError'?'AI writing service is not connected yet.':'Lesson generation failed';$('#providerMessage').textContent=error.message;}
  }
  function generate(){openPromptPreview();}
  function formChanges(status){
    const form=$('#writingForm'),section=draft()?.sections.find(item=>item.id===state.selectedId);if(!form||!section)return null;
    const data=new FormData(form),definition={};
    ['definition','meaning','keyIdea','explanation'].forEach(field=>{definition[field]={english:data.get(`${field}English`),hinglish:data.get(`${field}Hinglish`)};});
    return{english:data.get('english'),hinglish:data.get('hinglish'),creatorNotes:data.get('creatorNotes'),definition:section.definition?definition:undefined,status};
  }
  function saveSection(status='user_edited'){
    try{saveState('saving','Saving…');writing.updateSection(state.projectId,state.selectedId,formChanges(status),session.id);state.dirty=false;saveState('','Saved');renderAll();return true;}catch(error){saveState('error','Save Failed');toast(error.message,true);return false;}
  }
  $('#generationState').addEventListener('click',event=>{if(event.target.closest('#generateDraft'))generate();else if(event.target.closest('#createManualDraft'))openManualLesson();});
  document.querySelector('.language-switch').addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(!button||!draft())return;state.language=button.dataset.language;writing.setLanguage(state.projectId,state.language);learning.setLanguage(state.projectId,state.language);renderPreview();renderLearning();});
  $('#sectionList').addEventListener('click',event=>{const button=event.target.closest('[data-section]');if(!button)return;if(state.dirty)saveSection();state.selectedId=button.dataset.section;renderList();renderPreview();renderEditor();});
  $('#sectionEditor').addEventListener('input',event=>{if(event.target.closest('#writingForm')){state.dirty=true;saveState('saving','Saving…');}});
  $('#sectionEditor').addEventListener('focusout',event=>{if(state.dirty&&event.target.matches('textarea'))setTimeout(()=>{if(state.dirty)saveSection();},0);});
  $('#sectionEditor').addEventListener('submit',event=>{if(event.target.id!=='writingForm')return;event.preventDefault();saveSection();});
  $('#sectionEditor').addEventListener('click',async event=>{
    const section=draft()?.sections.find(item=>item.id===state.selectedId);if(!section)return;
    if(event.target.closest('[data-section-approve]'))saveSection('user_approved');
    else if(event.target.closest('[data-section-reject]'))saveSection('rejected');
    else if(event.target.closest('[data-section-duplicate]')){try{writing.duplicateSection(state.projectId,section.id,session.id);renderAll();toast('Section duplicated as a manual draft.');}catch(error){toast(error.message,true);}}
    else if(event.target.closest('[data-section-move]')){try{writing.moveSection(state.projectId,section.id,Number(event.target.closest('[data-section-move]').dataset.sectionMove),session.id);renderAll();}catch(error){toast(error.message,true);}}
    else if(event.target.closest('[data-section-delete]')){if(confirm('Delete this section? A version will remain in history.'))try{writing.deleteSection(state.projectId,section.id,session.id);state.selectedId=null;renderAll();toast('Section removed.');}catch(error){toast(error.message,true);}}
    else if(event.target.closest('[data-regenerate]'))openPromptPreview(section);
    else if(event.target.closest('[data-versions]'))openVersions();
  });
  function learningValues(form,type){
    const data=new FormData(form),parse=value=>type!=='quick_summary'?String(value||'').split(/\r?\n/).map(item=>item.trim()).filter(Boolean):[String(value||'').trim()];
    return{english:parse(data.get('english')),hinglish:parse(data.get('hinglish')),creatorNotes:data.get('creatorNotes')};
  }
  function saveLearning(type,status='user_edited'){
    const form=document.querySelector(`[data-learning-form="${type}"]`);if(!form)return false;
    try{learning.update(state.projectId,type,{...learningValues(form,type),status},session.id);state.learningDirty=null;saveState('','Saved');renderLearning();return true;}catch(error){saveState('error','Save Failed');toast(error.message,true);return false;}
  }
  function saveStructuredItem(form,status='user_edited'){
    const data=new FormData(form),type=form.dataset.structuredForm,itemId=form.dataset.itemId;
    try{learning.updateItem(state.projectId,type,itemId,{title:data.get('title'),english:data.get('english'),hinglish:data.get('hinglish'),creatorNotes:data.get('creatorNotes'),verificationStatus:status},session.id);state.learningDirty=null;saveState('','Saved');renderLearning();return true;}catch(error){saveState('error','Save Failed');toast(error.message,true);return false;}
  }
  $('#learningEnhancements').addEventListener('input',event=>{const form=event.target.closest('[data-structured-form]');if(form){state.learningDirty=form.dataset.itemId;saveState('saving','Saving…');}});
  $('#learningEnhancements').addEventListener('focusout',event=>{const form=event.target.closest('[data-structured-form]');if(form&&state.learningDirty===form.dataset.itemId&&event.target.matches('input,textarea'))setTimeout(()=>{if(state.learningDirty===form.dataset.itemId)saveStructuredItem(form);},0);});
  $('#learningEnhancements').addEventListener('submit',event=>{const form=event.target.closest('[data-structured-form]');if(!form)return;event.preventDefault();saveStructuredItem(form);});
  $('#learningEnhancements').addEventListener('input',event=>{const form=event.target.closest('[data-learning-form]');if(form){state.learningDirty=form.dataset.learningForm;saveState('saving','Saving…');}});
  $('#learningEnhancements').addEventListener('focusout',event=>{const form=event.target.closest('[data-learning-form]');if(form&&state.learningDirty===form.dataset.learningForm&&event.target.matches('textarea'))setTimeout(()=>{if(state.learningDirty===form.dataset.learningForm)saveLearning(form.dataset.learningForm);},0);});
  $('#learningEnhancements').addEventListener('submit',event=>{const form=event.target.closest('[data-learning-form]');if(!form)return;event.preventDefault();saveLearning(form.dataset.learningForm);});
  $('#learningEnhancements').addEventListener('click',event=>{
    const manual=event.target.closest('[data-manual-add]'),itemForm=event.target.closest('[data-structured-form]');
    if(manual){const form=$('#manualItemForm'),type=manual.dataset.manualAdd;form.reset();form.elements.type.value=type;$('#manualItemTitle').textContent=`Add Manual ${learningTitle(type)}`;populateManualSelectors('#manualItemNode','#manualItemSources');$('#manualItemDialog').showModal();return;}
    if(itemForm){
      const type=itemForm.dataset.structuredForm,itemId=itemForm.dataset.itemId,status=event.target.closest('[data-item-status]'),move=event.target.closest('[data-item-move]');
      try{
        if(event.target.closest('[data-item-regenerate]'))return openLearningPrompt(type,itemId);
        if(event.target.closest('[data-item-delete]')){learning.deleteItem(state.projectId,type,itemId,session.id);renderLearning();toast('Item deleted.');return;}
        if(move){learning.moveItem(state.projectId,type,itemId,Number(move.dataset.itemMove),session.id);renderLearning();return;}
        if(status){if(state.learningDirty===itemId){if(!saveStructuredItem(itemForm,status.dataset.itemStatus))return;}else{learning.setItemStatus(state.projectId,type,itemId,status.dataset.itemStatus,session.id);renderLearning();}toast(`Item marked ${status.dataset.itemStatus.replaceAll('_',' ')}.`);return;}
      }catch(error){toast(error.message,true);}return;
    }
    const generate=event.target.closest('[data-learning-generate]'),regenerate=event.target.closest('[data-learning-regenerate]'),approve=event.target.closest('[data-learning-approve]'),reject=event.target.closest('[data-learning-reject]'),versions=event.target.closest('[data-learning-versions]');
    if(generate)return openLearningPrompt(generate.dataset.learningGenerate);
    if(regenerate)return openLearningPrompt(regenerate.dataset.learningRegenerate);
    try{
      if(approve){const type=approve.dataset.learningApprove;if(state.learningDirty===type&&!saveLearning(type))return;learning.approve(state.projectId,type,session.id);renderLearning();toast(`${learningTitle(type)} approved.`);}
      else if(reject){const type=reject.dataset.learningReject;learning.reject(state.projectId,type);renderLearning();toast(`${learningTitle(type)} rejected.`);}
      else if(versions)openLearningVersions(versions.dataset.learningVersions);
    }catch(error){toast(error.message,true);}
  });
  $('#manualItemForm').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),type=data.get('type'),english=String(data.get('english')||''),hinglish=String(data.get('hinglish')||''),mode=state.language||'dual';try{if(mode==='english'&&!english.trim()||mode==='hinglish'&&!hinglish.trim()||mode==='dual'&&(!english.trim()||!hinglish.trim()))throw new Error(`Write the required ${mode} content.`);learning.addManualItem(state.projectId,type,{title:data.get('title'),english,hinglish,languageMode:mode,origin:data.get('origin'),creatorNotes:data.get('creatorNotes'),verificationStatus:data.get('verificationStatus'),relatedStructureNodeId:data.get('structureNodeId'),sourceReferences:manualReferences(data),itemType:type==='fun_facts'?'fun_fact':type==='revision_notes'?'core_concept':type},session.id);$('#manualItemDialog').close();renderLearning();toast(`Manual ${learningTitle(type)} item added.`);}catch(error){toast(error.message,true);}});
  $('#closeManualItem').addEventListener('click',()=>$('#manualItemDialog').close());$('#cancelManualItem').addEventListener('click',()=>$('#manualItemDialog').close());
  function openVersions(){state.versionTarget=null;const versions=draft()?.versions||[];$('#versionList').innerHTML=versions.length?versions.slice().reverse().map(version=>`<article class="version-card"><div><h3>Version ${version.version} · ${version.kind.replaceAll('_',' ')}</h3><p>${new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(version.createdAt))}</p></div><button class="secondary" data-restore="${version.id}">Restore Draft</button></article>`).join(''):'<p>No writing versions yet.</p>';$('#versionDialog').showModal();}
  function openLearningVersions(type){state.versionTarget=type;const versions=learning.blockFor(state.projectId,type)?.versions||[];$('#versionList').innerHTML=versions.length?versions.slice().reverse().map(version=>`<article class="version-card"><div><h3>Version ${version.version} · ${version.kind.replaceAll('_',' ')}</h3><p>${new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(version.createdAt))}</p></div><button class="secondary" data-restore="${version.id}">Restore ${learningTitle(type)}</button></article>`).join(''):'<p>No versions yet.</p>';$('#versionDialog').showModal();}
  $('#versionList').addEventListener('click',event=>{const button=event.target.closest('[data-restore]');if(!button)return;if(state.versionTarget)learning.restore(state.projectId,state.versionTarget,button.dataset.restore);else{writing.restore(state.projectId,button.dataset.restore);state.selectedId=null;}$('#versionDialog').close();renderAll();toast('Version restored as an editable draft.');});
  $('#approveDraft').addEventListener('click',()=>{try{if(state.dirty&&!saveSection())return;writing.approve(state.projectId,session.id);renderAll();toast('Lesson draft approved. Nothing was published.');}catch(error){toast(error.message,true);}});
  $('#rejectDraft').addEventListener('click',()=>{try{writing.rejectDraft(state.projectId);renderAll();toast('Lesson draft rejected. Structure and sources remain safe.');}catch(error){toast(error.message,true);}});
  $('#saveDraft').addEventListener('click',()=>{if(state.dirty)saveSection();else toast('Lesson draft is already saved.');});
  $('#addManualSection').addEventListener('click',openManualLesson);
  $('#manualLessonForm').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);try{const section=writing.createManualSection(state.projectId,{sectionType:data.get('sectionType'),structureNodeId:data.get('structureNodeId'),language:data.get('language'),origin:data.get('origin'),status:data.get('status'),title:data.get('title'),english:data.get('english'),hinglish:data.get('hinglish'),meaningEnglish:data.get('meaningEnglish'),meaningHinglish:data.get('meaningHinglish'),keyIdeaEnglish:data.get('keyIdeaEnglish'),keyIdeaHinglish:data.get('keyIdeaHinglish'),explanationEnglish:data.get('explanationEnglish'),explanationHinglish:data.get('explanationHinglish'),creatorNotes:data.get('creatorNotes'),sourceReferences:manualReferences(data)},session.id);state.selectedId=section.id;state.language=data.get('language');$('#manualLessonDialog').close();renderAll();toast('Manual lesson section saved.');}catch(error){toast(error.message,true);}});
  $('#closeManualLesson').addEventListener('click',()=>$('#manualLessonDialog').close());$('#cancelManualLesson').addEventListener('click',()=>$('#manualLessonDialog').close());
  $('#promptPreview').addEventListener('click',()=>openPromptPreview());
  ['promptRole','promptObjective','promptStyle'].forEach(id=>$('#'+id).addEventListener('change',renderPromptPreview));
  $('#sendPrompt').addEventListener('click',sendPrompt);$('#cancelPrompt').addEventListener('click',()=>$('#promptDialog').close());$('#closePrompt').addEventListener('click',()=>$('#promptDialog').close());
  $('#retryGeneration').addEventListener('click',()=>state.learningTarget?openLearningPrompt(state.learningTarget,state.learningItemId):openPromptPreview(state.regenerateSection));$('#returnLesson').addEventListener('click',()=>$('#providerDialog').close());$('#closeProvider').addEventListener('click',()=>$('#providerDialog').close());$('#closeVersions').addEventListener('click',()=>$('#versionDialog').close());
  if(!state.projectId||!project()){document.body.innerHTML='<main><h1>Project not found</h1><a href="index.html">Return to Studio</a></main>';return;}
  $('#projectName').textContent=project().title;$('#backStructure').href=`structure.html?project=${encodeURIComponent(state.projectId)}`;$('#quizTab').href=`quiz.html?project=${encodeURIComponent(state.projectId)}`;$('#visualAssetsTab').href=`visual-assets.html?project=${encodeURIComponent(state.projectId)}`;const brain=document.createElement('a');brain.textContent='Curio Brain';brain.href=`curio-brain.html?project=${encodeURIComponent(state.projectId)}`;$('#visualAssetsTab').after(brain);renderAll();
})();
