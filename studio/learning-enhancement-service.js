(function(){
  const store=()=>window.TeachCurioStore;
  const uid=prefix=>`${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const clone=value=>JSON.parse(JSON.stringify(value)),now=()=>new Date().toISOString();
  const title=type=>({important_points:'Important Points',quick_summary:'Quick Summary',memory_tricks:'Memory Tricks',real_life_examples:'Real Life Examples',ssc_connection:'SSC Connection',common_mistakes:'Common Mistakes',fun_facts:'Fun Facts',revision_notes:'Revision Notes'})[type]||'Learning enhancement';
  function enhancementFor(projectId){return store().read().learningEnhancements.find(item=>item.projectId===projectId)||null;}
  function blockFor(projectId,type){return enhancementFor(projectId)?.blocks.find(block=>block.type===type)||null;}
  function approvedDraft(snapshot,projectId){
    const draft=snapshot.lessonDrafts.find(item=>item.projectId===projectId);
    if(!draft||draft.status!=='approved'||!draft.approvedVersionId)throw new Error('Approve the Lesson Draft before generating learning enhancements.');
    if(!snapshot.lessonStructures.some(item=>item.projectId===projectId&&item.approvalStatus==='approved'))throw new Error('An approved Lesson Structure is required.');
    return draft;
  }
  function importBlock(projectId,type,output,createdBy){
    const snapshot=store().read(),draft=approvedDraft(snapshot,projectId);
    let enhancement=snapshot.learningEnhancements.find(item=>item.projectId===projectId);
    const stamp=now();if(!enhancement){enhancement={id:uid('learning'),projectId,lessonDraftId:draft.id,blocks:[],languagePreference:draft.languagePreference||'dual',createdAt:stamp,updatedAt:stamp};snapshot.learningEnhancements.push(enhancement);}
    if(['memory_tricks','real_life_examples'].includes(type)&&!['important_points','quick_summary'].every(required=>enhancement.blocks.some(block=>block.type===required)))throw new Error('Generate Important Points and Quick Summary before Part 2 enhancements.');
    if(['ssc_connection','common_mistakes'].includes(type)&&!['important_points','quick_summary','memory_tricks','real_life_examples'].every(required=>enhancement.blocks.some(block=>block.type===required)))throw new Error('Generate all Part 1 and Part 2 enhancements before Part 3.');
    if(['fun_facts','revision_notes'].includes(type)&&!['important_points','quick_summary','memory_tricks','real_life_examples','ssc_connection','common_mistakes'].every(required=>enhancement.blocks.some(block=>block.type===required)))throw new Error('Generate all earlier learning enhancements before Part 4.');
    if(enhancement.blocks.some(block=>block.type===type))throw new Error(`${title(type)} already exists.`);
    const approvedVersion=draft.versions.find(version=>version.id===draft.approvedVersionId),sections=approvedVersion?.sections||[],relatedStructureNodeIds=[...new Set(sections.map(section=>section.structureNodeId).filter(Boolean))],sourceReferences=[...new Map(sections.flatMap(section=>section.paragraph?.sourceReferences||[]).map(ref=>[`${ref.sourceId}:${ref.locator||''}`,ref])).values()];
    const block={id:uid('learning_block'),projectId,lessonDraftId:draft.id,lessonDraftVersionId:draft.approvedVersionId,type,english:clone(output.english),hinglish:clone(output.hinglish),creatorNotes:'',relatedStructureNodeIds,sourceReferences:clone(sourceReferences),status:output.needsVerification?'needs_verification':'curio_suggested',versions:[],createdAt:stamp,updatedAt:stamp};
    block.versions.push({id:uid('generation_version'),version:1,kind:'ai_generation',english:clone(block.english),hinglish:clone(block.hinglish),creatorNotes:'',createdAt:stamp,createdBy});
    enhancement.blocks.push(block);enhancement.updatedAt=stamp;store().write(snapshot);return block;
  }
  function mutate(projectId,type,callback){
    const snapshot=store().read(),enhancement=snapshot.learningEnhancements.find(item=>item.projectId===projectId),block=enhancement?.blocks.find(item=>item.type===type);
    if(!block)throw new Error(`${title(type)} has not been generated.`);
    callback(block,enhancement,snapshot);block.updatedAt=now();enhancement.updatedAt=block.updatedAt;store().write(snapshot);return block;
  }
  function update(projectId,type,changes,createdBy){
    return mutate(projectId,type,block=>{block.english=clone(changes.english);block.hinglish=clone(changes.hinglish);block.creatorNotes=String(changes.creatorNotes||'');block.status=changes.status||'user_edited';block.approvedVersionId=undefined;block.versions.push({id:uid('generation_version'),version:block.versions.length+1,kind:'creator_edit',english:clone(block.english),hinglish:clone(block.hinglish),creatorNotes:block.creatorNotes,createdAt:now(),createdBy});});
  }
  function replace(projectId,type,output,createdBy){
    return mutate(projectId,type,block=>{block.english=clone(output.english);block.hinglish=clone(output.hinglish);block.status=output.needsVerification?'needs_verification':'curio_suggested';block.approvedVersionId=undefined;block.versions.push({id:uid('generation_version'),version:block.versions.length+1,kind:'ai_generation',english:clone(block.english),hinglish:clone(block.hinglish),creatorNotes:block.creatorNotes,createdAt:now(),createdBy});});
  }
  function approve(projectId,type,createdBy){
    return mutate(projectId,type,(block,enhancement)=>{const required=(english,hinglish,mode)=>mode==='english'?Boolean(english.trim()):mode==='hinglish'?Boolean(hinglish.trim()):Boolean(english.trim()&&hinglish.trim());if(block.items){if(!block.items.length)throw new Error(`${title(type)} has no items to approve.`);if(block.items.some(item=>!required(item.english,item.hinglish,item.languageMode||enhancement.languagePreference)))throw new Error('Every item needs its selected language content.');block.items.forEach(item=>{if(item.verificationStatus!=='rejected')item.verificationStatus='user_approved';});}else if(!block.english.length||block.english.some((value,index)=>!required(value,block.hinglish[index]||'',enhancement.languagePreference)))throw new Error(`The block needs the selected ${enhancement.languagePreference} content.`);block.status='user_approved';const version={id:uid('generation_version'),version:block.versions.length+1,kind:'approved',english:clone(block.english),hinglish:clone(block.hinglish),items:block.items?clone(block.items):undefined,creatorNotes:block.creatorNotes,createdAt:now(),createdBy};block.versions.push(version);block.approvedVersionId=version.id;});
  }
  function reject(projectId,type){return mutate(projectId,type,block=>{block.status='rejected';block.approvedVersionId=undefined;});}
  function restore(projectId,type,versionId){
    return mutate(projectId,type,block=>{const version=block.versions.find(item=>item.id===versionId);if(!version)throw new Error('Learning block version not found.');block.english=clone(version.english);block.hinglish=clone(version.hinglish);if(version.items)block.items=clone(version.items);block.creatorNotes=version.creatorNotes;block.status='user_edited';block.approvedVersionId=undefined;block.versions.push({id:uid('generation_version'),version:block.versions.length+1,kind:'restored',english:clone(block.english),hinglish:clone(block.hinglish),items:block.items?clone(block.items):undefined,creatorNotes:block.creatorNotes,createdAt:now(),createdBy:'creator'});});
  }
  function ensureEnhancement(snapshot,projectId,draft){
    let enhancement=snapshot.learningEnhancements.find(item=>item.projectId===projectId),stamp=now();
    if(!enhancement){enhancement={id:uid('learning'),projectId,lessonDraftId:draft.id,blocks:[],languagePreference:draft.languagePreference||'dual',createdAt:stamp,updatedAt:stamp};snapshot.learningEnhancements.push(enhancement);}return enhancement;
  }
  function itemContext(snapshot,projectId){
    const structure=snapshot.lessonStructures.find(item=>item.projectId===projectId),version=structure?.versions?.find(item=>item.id===structure.approvedVersionId),node=version?.nodes?.find(item=>item.nodeType==='concept'&&item.includeInNextPhase&&item.status!=='rejected');
    return{relatedStructureNodeId:node?.id,sourceReferences:clone(node?.sourceReferences||[])};
  }
  function mappedItem(item,index,context,origin='curio_suggested'){
    const stamp=now(),verificationStatus=item.needsVerification?'needs_verification':item.verificationStatus||origin;return{id:item.id||uid('learning_item'),itemType:item.itemType||'core_concept',title:String(item.title||'Untitled item'),english:String(item.english||''),hinglish:String(item.hinglish||''),languageMode:item.languageMode||'dual',relatedStructureNodeId:item.relatedStructureNodeId||context.relatedStructureNodeId,sourceReferences:clone(item.sourceReferences?.length?item.sourceReferences:context.sourceReferences),origin,verificationStatus,creatorNotes:String(item.verificationReason||item.creatorNotes||''),sortOrder:index,creatorEdited:origin!=='curio_suggested',createdAt:stamp,updatedAt:stamp};}
  function snapshotVersion(block,kind,createdBy){block.versions.push({id:uid('generation_version'),version:block.versions.length+1,kind,english:clone(block.english),hinglish:clone(block.hinglish),items:clone(block.items),creatorNotes:block.creatorNotes,createdAt:now(),createdBy});}
  function importStructuredBlock(projectId,type,output,createdBy){
    if(!['fun_facts','revision_notes'].includes(type))throw new Error('Unsupported structured learning block.');
    const snapshot=store().read(),draft=approvedDraft(snapshot,projectId),enhancement=ensureEnhancement(snapshot,projectId,draft);
    if(enhancement.blocks.some(block=>block.type===type))throw new Error(`${title(type)} already exists.`);
    if(!['important_points','quick_summary','memory_tricks','real_life_examples','ssc_connection','common_mistakes'].every(required=>enhancement.blocks.some(block=>block.type===required)))throw new Error('Generate all earlier learning enhancements before Part 4.');
    const stamp=now(),context=itemContext(snapshot,projectId),items=output.items.map((item,index)=>mappedItem(item,index,context));
    const block={id:uid('learning_block'),projectId,lessonDraftId:draft.id,lessonDraftVersionId:draft.approvedVersionId,type,english:items.map(item=>item.english),hinglish:items.map(item=>item.hinglish),items,creatorNotes:output.noSuitableSupportedFacts?'No suitable supported Fun Facts found.':'',status:output.noSuitableSupportedFacts||items.some(item=>item.verificationStatus==='needs_verification')?'needs_verification':'curio_suggested',versions:[],createdAt:stamp,updatedAt:stamp};snapshotVersion(block,'ai_generation',createdBy);enhancement.blocks.push(block);enhancement.updatedAt=stamp;store().write(snapshot);return block;
  }
  function addManualItem(projectId,type,input,createdBy){
    const snapshot=store().read(),draft=approvedDraft(snapshot,projectId),enhancement=ensureEnhancement(snapshot,projectId,draft),context=itemContext(snapshot,projectId);let block=enhancement.blocks.find(item=>item.type===type),stamp=now();
    if(!block){block={id:uid('learning_block'),projectId,lessonDraftId:draft.id,lessonDraftVersionId:draft.approvedVersionId,type,english:[],hinglish:[],items:[],creatorNotes:'',status:'user_edited',versions:[],createdAt:stamp,updatedAt:stamp};enhancement.blocks.push(block);}
    if(!block.items){block.items=block.english.map((english,index)=>mappedItem({id:uid('learning_item'),title:`${title(type)} ${index+1}`,english,hinglish:block.hinglish[index]||'',itemType:type,sourceReferences:block.sourceReferences||[]},index,context,'curio_suggested'));}
    const origin=input.origin==='from_my_notes'?'from_my_notes':'creator_added',item=mappedItem({...input,id:uid('learning_item')},block.items.length,context,origin);item.sourceReferences=clone(input.sourceReferences||[]);item.relatedStructureNodeId=input.relatedStructureNodeId||context.relatedStructureNodeId;block.items.push(item);block.english=block.items.map(value=>value.english);block.hinglish=block.items.map(value=>value.hinglish);block.status='user_edited';snapshotVersion(block,'creator_edit',createdBy);enhancement.updatedAt=stamp;store().write(snapshot);return item;
  }
  function updateItem(projectId,type,itemId,changes,createdBy){return mutate(projectId,type,block=>{const item=block.items?.find(value=>value.id===itemId);if(!item)throw new Error('Learning item not found.');Object.assign(item,{title:String(changes.title||''),english:String(changes.english||''),hinglish:String(changes.hinglish||''),creatorNotes:String(changes.creatorNotes||''),verificationStatus:changes.verificationStatus||'user_edited',creatorEdited:true,updatedAt:now()});block.english=block.items.map(value=>value.english);block.hinglish=block.items.map(value=>value.hinglish);block.status='user_edited';block.approvedVersionId=undefined;snapshotVersion(block,'creator_edit',createdBy);});}
  function deleteItem(projectId,type,itemId,createdBy){return mutate(projectId,type,block=>{block.items=block.items.filter(item=>item.id!==itemId);block.items.forEach((item,index)=>item.sortOrder=index);block.english=block.items.map(item=>item.english);block.hinglish=block.items.map(item=>item.hinglish);block.status='user_edited';snapshotVersion(block,'creator_edit',createdBy);});}
  function moveItem(projectId,type,itemId,direction,createdBy){return mutate(projectId,type,block=>{const from=block.items.findIndex(item=>item.id===itemId),to=Math.max(0,Math.min(block.items.length-1,from+direction));if(from<0)throw new Error('Learning item not found.');[block.items[from],block.items[to]]=[block.items[to],block.items[from]];block.items.forEach((item,index)=>item.sortOrder=index);snapshotVersion(block,'creator_edit',createdBy);});}
  function setItemStatus(projectId,type,itemId,status,createdBy){return mutate(projectId,type,block=>{const item=block.items.find(value=>value.id===itemId);if(!item)throw new Error('Learning item not found.');item.verificationStatus=status;item.updatedAt=now();snapshotVersion(block,status==='user_approved'?'approved':'creator_edit',createdBy);});}
  function replaceItem(projectId,type,itemId,providerItem,createdBy){return mutate(projectId,type,block=>{const index=block.items.findIndex(value=>value.id===itemId);if(index<0)throw new Error('Learning item not found.');const old=block.items[index],replacement=mappedItem({...providerItem,id:old.id},index,{relatedStructureNodeId:old.relatedStructureNodeId,sourceReferences:old.sourceReferences});replacement.createdAt=old.createdAt;block.items[index]=replacement;block.english=block.items.map(item=>item.english);block.hinglish=block.items.map(item=>item.hinglish);block.status=replacement.verificationStatus==='needs_verification'?'needs_verification':'curio_suggested';snapshotVersion(block,'ai_generation',createdBy);});}
  function setLanguage(projectId,language){if(!['english','hinglish','dual'].includes(language))throw new Error('Select English, Hinglish or Dual language.');const snapshot=store().read(),enhancement=snapshot.learningEnhancements.find(item=>item.projectId===projectId);if(!enhancement)return;enhancement.languagePreference=language;enhancement.updatedAt=now();store().write(snapshot);}
  window.TeachCurioLearning={enhancementFor,blockFor,importBlock,importStructuredBlock,addManualItem,updateItem,deleteItem,moveItem,setItemStatus,replaceItem,update,replace,approve,reject,restore,setLanguage};
})();
