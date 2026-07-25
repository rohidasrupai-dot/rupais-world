(function(){
  const store=()=>window.TeachCurioStore;
  const id=prefix=>`${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const now=()=>new Date().toISOString();
  const clone=value=>JSON.parse(JSON.stringify(value));
  function data(){return store().read();}
  function structureFor(snapshot,projectId){return snapshot.lessonStructures.find(item=>item.projectId===projectId)||null;}
  function draftFor(projectId){return data().lessonDrafts.find(item=>item.projectId===projectId)||null;}
  function invalidateEnhancements(snapshot,projectId){const enhancement=snapshot.learningEnhancements.find(item=>item.projectId===projectId);if(!enhancement)return;enhancement.blocks.forEach(block=>{if(block.status==='user_approved')block.status='needs_verification';block.approvedVersionId=undefined;});enhancement.updatedAt=now();}
  function approvedInput(projectId){
    const snapshot=data(),structure=structureFor(snapshot,projectId),project=snapshot.projects.find(item=>item.id===projectId&&!item.deletedAt);
    if(!project)throw new Error('Project not found.');
    if(!structure||structure.approvalStatus!=='approved'||!structure.approvedVersionId)throw new Error('Approve the lesson structure before generating a lesson.');
    const version=structure.versions.find(item=>item.id===structure.approvedVersionId);
    if(!version)throw new Error('The approved structure version is missing.');
    const concepts=version.nodes.filter(node=>node.nodeType==='concept'&&node.includeInNextPhase&&node.status!=='rejected');
    if(!concepts.length)throw new Error('The approved structure must contain at least one Concept.');
    const included=version.nodes.filter(node=>node.includeInNextPhase&&node.status!=='rejected');
    if(!included.some(node=>node.nodeType==='subject'))throw new Error('The approved structure has no Subject.');
    if(!included.some(node=>node.nodeType==='chapter'||node.nodeType==='topic'))throw new Error('The approved structure has no Chapter or Topic.');
    if(included.some(node=>!String(node.title||'').trim()))throw new Error('The approved structure contains an empty title.');
    const approvedMetadata=(version.metadata||[]).filter(item=>item.verificationStatus==='user_approved'||item.verificationStatus==='from_my_notes');
    return {
      projectId,projectTitle:project.title,creatorNotes:project.creatorNotes||'',approvedStructureVersionId:version.id,
      structure:{nodes:included,concepts},
      metadata:approvedMetadata,
      sourceReferences:[...new Set(version.nodes.flatMap(node=>node.sourceReferences.map(ref=>ref.sourceId)))],
      preferences:{language:'dual',writingStyle:'clear_beginner_friendly'},
      verificationRules:{preserveSourceTraceability:true,markUnsupportedClaims:'needs_verification',neverPublish:true}
    };
  }
  function variants(blockId,english,hinglish){return[{id:id('variant'),blockId,language:'english',content:english||''},{id:id('variant'),blockId,language:'hinglish',content:hinglish||''}];}
  function importProviderDraft(projectId,output,createdBy){
    const snapshot=data(),input=approvedInput(projectId);
    if(snapshot.lessonDrafts.some(item=>item.projectId===projectId))throw new Error('A lesson draft already exists for this project.');
    const draftId=id('lesson_draft'),created=now();
    const sections=output.sections.map(section=>{
      const concept=input.structure.concepts.find(node=>node.id===section.structureNodeId),sectionId=id('writing_section'),paragraphId=id('paragraph');
      const makeDefinition=section.definition?{id:id('definition'),structureNodeId:concept.id,definition:variants(id('definition_field'),section.definition.definition?.english,section.definition.definition?.hinglish),meaning:variants(id('meaning_field'),section.definition.meaning?.english,section.definition.meaning?.hinglish),keyIdea:variants(id('keyidea_field'),section.definition.keyIdea?.english,section.definition.keyIdea?.hinglish),explanation:variants(id('definition_explanation'),section.definition.explanation?.english,section.definition.explanation?.hinglish),sourceReferences:clone(concept.sourceReferences),status:'curio_suggested'}:undefined;
      return{id:sectionId,lessonDraftId:draftId,structureNodeId:concept.id,title:concept.title,paragraph:{id:paragraphId,structureNodeId:concept.id,variants:variants(paragraphId,section.english,section.hinglish),sourceReferences:clone(concept.sourceReferences),origin:'curio_suggested',status:section.needsVerification?'needs_verification':'curio_suggested',creatorEdited:false,updatedAt:created},definition:makeDefinition,creatorNotes:'',status:section.needsVerification?'needs_verification':'curio_suggested',createdAt:created,updatedAt:created};
    });
    const draft={id:draftId,projectId,approvedStructureVersionId:input.approvedStructureVersionId,sections,versions:[],languagePreference:'dual',writingStyle:'clear_beginner_friendly',status:'needs_review',createdAt:created,updatedAt:created};
    draft.versions.push({id:id('writing_version'),lessonDraftId:draftId,version:1,kind:'ai_draft',sections:clone(sections),createdAt:created,createdBy});
    snapshot.lessonDrafts.push(draft);const project=snapshot.projects.find(item=>item.id===projectId);if(project){project.status='needs_review';project.updatedAt=created;}store().write(snapshot);return draft;
  }
  function createManualSection(projectId,input,createdBy){
    const snapshot=data(),approved=approvedInput(projectId),node=approved.structure.nodes.find(item=>item.id===input.structureNodeId&&['topic','subtopic','concept'].includes(item.nodeType));
    if(!node)throw new Error('Choose an approved Topic, Subtopic or Concept.');
    if(!['explanation','definition'].includes(input.sectionType))throw new Error('Choose Explanation or Definition.');
    if(!['english','hinglish','dual'].includes(input.language))throw new Error('Choose English, Hinglish or Dual language.');
    const english=String(input.english||''),hinglish=String(input.hinglish||'');
    if(input.language==='english'&&!english.trim()||input.language==='hinglish'&&!hinglish.trim()||input.language==='dual'&&(!english.trim()||!hinglish.trim()))throw new Error('Write the required language content before saving.');
    let draft=snapshot.lessonDrafts.find(item=>item.projectId===projectId),stamp=now();
    if(!draft){draft={id:id('lesson_draft'),projectId,approvedStructureVersionId:approved.approvedStructureVersionId,sections:[],versions:[],languagePreference:input.language,writingStyle:'clear_beginner_friendly',status:'draft',createdAt:stamp,updatedAt:stamp};snapshot.lessonDrafts.push(draft);}
    const origin=input.origin==='from_my_notes'?'from_my_notes':'creator_added',sectionId=id('writing_section'),paragraphId=id('paragraph'),refs=clone(input.sourceReferences||[]);
    const definition=input.sectionType==='definition'?{id:id('definition'),structureNodeId:node.id,term:String(input.title||node.title),definition:variants(id('definition_field'),english,hinglish),meaning:variants(id('meaning_field'),input.meaningEnglish,input.meaningHinglish),keyIdea:variants(id('keyidea_field'),input.keyIdeaEnglish,input.keyIdeaHinglish),explanation:variants(id('definition_explanation'),input.explanationEnglish,input.explanationHinglish),sourceReferences:refs,status:input.status||origin}:undefined;
    const section={id:sectionId,lessonDraftId:draft.id,structureNodeId:node.id,title:String(input.title||node.title).trim(),sectionType:input.sectionType,languageMode:input.language,origin,includeInLesson:true,paragraph:{id:paragraphId,structureNodeId:node.id,variants:variants(paragraphId,input.sectionType==='explanation'?english:'',input.sectionType==='explanation'?hinglish:''),sourceReferences:refs,origin,status:input.status||origin,creatorEdited:true,updatedAt:stamp},definition,creatorNotes:String(input.creatorNotes||''),status:input.status||'draft',createdAt:stamp,updatedAt:stamp};
    if(!section.title)throw new Error('Section title is required.');
    draft.sections.push(section);draft.languagePreference=input.language;draft.status='draft';draft.approvedVersionId=undefined;draft.updatedAt=stamp;draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'manual_draft',sections:clone(draft.sections),createdAt:stamp,createdBy});invalidateEnhancements(snapshot,projectId);
    const project=snapshot.projects.find(item=>item.id===projectId);if(project){project.status='draft';project.updatedAt=stamp;}store().write(snapshot);return section;
  }
  function mutate(projectId,callback){
    const snapshot=data(),draft=snapshot.lessonDrafts.find(item=>item.projectId===projectId);if(!draft)throw new Error('Lesson draft not found.');
    callback(draft,snapshot);draft.updatedAt=now();store().write(snapshot);return draft;
  }
  function updateSection(projectId,sectionId,changes,createdBy){
    return mutate(projectId,(draft,snapshot)=>{const section=draft.sections.find(item=>item.id===sectionId);if(!section)throw new Error('Lesson section not found.');if(changes.english!==undefined)section.paragraph.variants.find(v=>v.language==='english').content=changes.english;if(changes.hinglish!==undefined)section.paragraph.variants.find(v=>v.language==='hinglish').content=changes.hinglish;if(changes.creatorNotes!==undefined)section.creatorNotes=changes.creatorNotes;if(changes.status)section.status=changes.status;if(section.definition&&changes.definition){['definition','meaning','keyIdea','explanation'].forEach(field=>{if(changes.definition[field])['english','hinglish'].forEach(language=>{if(changes.definition[field][language]!==undefined)section.definition[field].find(v=>v.language===language).content=changes.definition[field][language];});});section.definition.status='user_edited';}section.paragraph.creatorEdited=true;section.paragraph.status=changes.status||'user_edited';section.paragraph.updatedAt=now();section.updatedAt=now();draft.status='draft';draft.approvedVersionId=undefined;draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'creator_edit',sections:clone(draft.sections),createdAt:now(),createdBy});invalidateEnhancements(snapshot,projectId);});
  }
  function replaceSection(projectId,sectionId,providerSection,createdBy){
    return mutate(projectId,draft=>{const section=draft.sections.find(item=>item.id===sectionId);if(!section)throw new Error('Lesson section not found.');section.paragraph.variants.find(v=>v.language==='english').content=providerSection.english;section.paragraph.variants.find(v=>v.language==='hinglish').content=providerSection.hinglish;section.paragraph.status='curio_suggested';section.paragraph.creatorEdited=false;section.status=providerSection.needsVerification?'needs_verification':'curio_suggested';section.updatedAt=now();draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'regenerated_section',sections:clone(draft.sections),createdAt:now(),createdBy});});
  }
  function approve(projectId,createdBy){
    return mutate(projectId,(draft,snapshot)=>{const active=draft.sections.filter(section=>!section.deletedAt&&section.includeInLesson!==false&&section.status!=='rejected');if(!active.length)throw new Error('Lesson draft has no active sections.');const required=(variants,mode)=>mode==='english'?variants.some(v=>v.language==='english'&&v.content.trim()):mode==='hinglish'?variants.some(v=>v.language==='hinglish'&&v.content.trim()):variants.filter(v=>v.content.trim()).length===2;active.forEach(section=>{const content=section.sectionType==='definition'?section.definition?.definition:section.paragraph.variants,mode=section.languageMode||draft.languagePreference;if(!content||!required(content,mode))throw new Error(`${section.title} is missing required ${mode} content.`);});active.forEach(section=>{section.status='user_approved';section.paragraph.status='user_approved';if(section.definition)section.definition.status='user_approved';});const version={id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'approved',sections:clone(draft.sections),createdAt:now(),createdBy};draft.versions.push(version);draft.status='approved';draft.approvedVersionId=version.id;const project=snapshot.projects.find(item=>item.id===projectId);if(project){project.status='user_approved';project.updatedAt=now();}});
  }
  function setLanguage(projectId,language){return mutate(projectId,draft=>{draft.languagePreference=language;});}
  function rejectDraft(projectId){return mutate(projectId,draft=>{draft.status='rejected';draft.sections.forEach(section=>{section.status='rejected';section.paragraph.status='rejected';});});}
  function restore(projectId,versionId){return mutate(projectId,draft=>{const version=draft.versions.find(item=>item.id===versionId);if(!version)throw new Error('Writing version not found.');draft.sections=clone(version.sections);draft.status='needs_review';draft.approvedVersionId=undefined;});}
  function deleteSection(projectId,sectionId,createdBy){return mutate(projectId,draft=>{const section=draft.sections.find(item=>item.id===sectionId);if(!section)throw new Error('Lesson section not found.');section.deletedAt=now();section.includeInLesson=false;draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'rejected',sections:clone(draft.sections),createdAt:now(),createdBy});});}
  function duplicateSection(projectId,sectionId,createdBy){return mutate(projectId,draft=>{const source=draft.sections.find(item=>item.id===sectionId&&!item.deletedAt);if(!source)throw new Error('Lesson section not found.');const copy=clone(source),stamp=now();copy.id=id('writing_section');copy.title=`${source.title} copy`;copy.origin='creator_added';copy.status='draft';copy.createdAt=stamp;copy.updatedAt=stamp;copy.deletedAt=undefined;copy.paragraph.id=id('paragraph');copy.paragraph.origin='creator_added';copy.paragraph.status='draft';if(copy.definition)copy.definition.id=id('definition');draft.sections.push(copy);draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'manual_draft',sections:clone(draft.sections),createdAt:stamp,createdBy});});}
  function moveSection(projectId,sectionId,direction,createdBy){return mutate(projectId,draft=>{const active=draft.sections.filter(item=>!item.deletedAt),from=active.findIndex(item=>item.id===sectionId),to=Math.max(0,Math.min(active.length-1,from+direction));if(from<0)throw new Error('Lesson section not found.');const fromAll=draft.sections.indexOf(active[from]),toAll=draft.sections.indexOf(active[to]);[draft.sections[fromAll],draft.sections[toAll]]=[draft.sections[toAll],draft.sections[fromAll]];draft.versions.push({id:id('writing_version'),lessonDraftId:draft.id,version:draft.versions.length+1,kind:'creator_edit',sections:clone(draft.sections),createdAt:now(),createdBy});});}
  window.TeachCurioWriting={draftFor,approvedInput,importProviderDraft,createManualSection,updateSection,replaceSection,approve,rejectDraft,setLanguage,restore,deleteSection,duplicateSection,moveSection};
})();
