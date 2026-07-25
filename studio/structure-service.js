(function () {
  const TYPES=['subject','chapter','topic','subtopic','concept','activity','quizPlaceholder'];
  const ALLOWED={
    root:['subject'],
    subject:['chapter','topic'],
    chapter:['topic','concept'],
    topic:['subtopic','concept','activity','quizPlaceholder'],
    subtopic:['concept','activity','quizPlaceholder'],
    concept:['activity','quizPlaceholder'],
    activity:[], quizPlaceholder:[]
  };
  const id=prefix=>`${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const now=()=>new Date().toISOString();
  const clone=value=>JSON.parse(JSON.stringify(value));
  function snapshot(){return window.TeachCurioStore.read();}
  function structureOf(data,projectId){return data.lessonStructures.find(item=>item.projectId===projectId);}
  function ensure(projectId){
    const data=snapshot(); let structure=structureOf(data,projectId);
    if(!structure){structure={id:id('structure'),projectId,nodes:[],metadata:[],warnings:[],suggestions:[],versions:[],approvalStatus:'draft',updatedAt:now()};data.lessonStructures.push(structure);window.TeachCurioStore.write(data);}
    return structure;
  }
  function save(projectId,mutate){
    const data=snapshot(); let structure=structureOf(data,projectId);
    if(!structure){structure={id:id('structure'),projectId,nodes:[],metadata:[],warnings:[],suggestions:[],versions:[],approvalStatus:'draft',updatedAt:now()};data.lessonStructures.push(structure);}
    mutate(structure,data); structure.updatedAt=now(); window.TeachCurioStore.write(data); return structure;
  }
  function validChild(parentType,nodeType){return (ALLOWED[parentType||'root']||[]).includes(nodeType);}
  function depthFor(nodes,parentId){if(!parentId)return 0;const parent=nodes.find(node=>node.id===parentId);return parent?parent.depth+1:0;}
  function descendants(nodes,nodeId){
    const found=[]; const visit=idValue=>nodes.filter(node=>node.parentId===idValue).forEach(node=>{found.push(node.id);visit(node.id);});visit(nodeId);return found;
  }
  function addNode(projectId,input){
    return save(projectId,structure=>{
      const parent=input.parentId?structure.nodes.find(node=>node.id===input.parentId):null;
      if(input.parentId&&!parent)throw new Error('Parent node no longer exists.');
      if(!validChild(parent?.nodeType,input.nodeType))throw new Error(`${input.nodeType} cannot be placed under ${parent?.nodeType||'the structure root'}.`);
      const siblings=structure.nodes.filter(node=>(node.parentId||'')===(input.parentId||''));
      structure.nodes.push({id:id('node'),parentId:input.parentId||undefined,projectId,nodeType:input.nodeType,title:String(input.title||'').trim(),description:'',creatorNotes:'',sortOrder:siblings.length,depth:depthFor(structure.nodes,input.parentId),status:'draft',sourceReferences:input.sourceReferences||[],origin:'creator_added',verificationStatus:'from_my_notes',includeInNextPhase:true,keywords:[],createdAt:now(),updatedAt:now()});
    });
  }
  function updateNode(projectId,nodeId,changes){
    return save(projectId,structure=>{
      const node=structure.nodes.find(item=>item.id===nodeId);if(!node)throw new Error('Structure item not found.');
      if(changes.nodeType&&changes.nodeType!==node.nodeType){
        const parent=node.parentId?structure.nodes.find(item=>item.id===node.parentId):null;
        if(!validChild(parent?.nodeType,changes.nodeType))throw new Error(`A ${changes.nodeType} cannot be placed here.`);
        const children=structure.nodes.filter(item=>item.parentId===node.id);
        if(children.some(child=>!validChild(changes.nodeType,child.nodeType)))throw new Error('That type would make an existing child invalid.');
      }
      if(changes.title!==undefined&&!String(changes.title).trim())throw new Error('A structure title cannot be empty.');
      if(changes.title!==undefined&&changes.title!==node.title&&!node.originalTitle)node.originalTitle=node.title;
      Object.assign(node,changes,{id:node.id,projectId:node.projectId,updatedAt:now()});
    });
  }
  function moveNode(projectId,nodeId,parentId){
    return save(projectId,structure=>{
      const node=structure.nodes.find(item=>item.id===nodeId);const parent=parentId?structure.nodes.find(item=>item.id===parentId):null;
      if(!node)throw new Error('Structure item not found.'); if(parentId&&!parent)throw new Error('New parent not found.');
      if(parentId===nodeId||descendants(structure.nodes,nodeId).includes(parentId))throw new Error('An item cannot be moved inside itself.');
      if(!validChild(parent?.nodeType,node.nodeType))throw new Error(`${node.nodeType} cannot be moved under ${parent?.nodeType||'the root'}.`);
      node.parentId=parentId||undefined;node.sortOrder=structure.nodes.filter(item=>(item.parentId||'')===(parentId||'')&&item.id!==nodeId).length;
      const recalc=(idValue,depth)=>structure.nodes.filter(item=>item.parentId===idValue).forEach(child=>{child.depth=depth;recalc(child.id,depth+1);});
      node.depth=depthFor(structure.nodes,parentId);recalc(node.id,node.depth+1);
    });
  }
  function reorder(projectId,nodeId,direction){
    return save(projectId,structure=>{const node=structure.nodes.find(item=>item.id===nodeId);if(!node)return;const siblings=structure.nodes.filter(item=>(item.parentId||'')===(node.parentId||'')).sort((a,b)=>a.sortOrder-b.sortOrder);const from=siblings.findIndex(item=>item.id===nodeId);const to=Math.max(0,Math.min(siblings.length-1,from+direction));[siblings[from],siblings[to]]=[siblings[to],siblings[from]];siblings.forEach((item,index)=>item.sortOrder=index);});
  }
  function reject(projectId,nodeId){return updateNode(projectId,nodeId,{status:'rejected',verificationStatus:'rejected',includeInNextPhase:false});}
  function duplicate(projectId,nodeId){
    return save(projectId,structure=>{const node=structure.nodes.find(item=>item.id===nodeId);if(!node)throw new Error('Structure item not found.');const copy=clone(node);copy.id=id('node');copy.title=`${node.title} copy`;copy.originalTitle=node.title;copy.status='draft';copy.verificationStatus='from_my_notes';copy.origin='creator_added';copy.sortOrder=structure.nodes.filter(item=>(item.parentId||'')===(node.parentId||'')).length;copy.createdAt=now();copy.updatedAt=copy.createdAt;structure.nodes.push(copy);});
  }
  function merge(projectId,nodeId,targetId){
    return save(projectId,structure=>{const node=structure.nodes.find(item=>item.id===nodeId),target=structure.nodes.find(item=>item.id===targetId);if(!node||!target||node.id===target.id)throw new Error('Choose another structure item to merge with.');if(node.nodeType!==target.nodeType)throw new Error('Only items of the same type can be merged.');target.originalTitle=target.originalTitle||target.title;target.description=[target.description,node.description].filter(Boolean).join('\n');target.sourceReferences=[...target.sourceReferences,...node.sourceReferences.filter(ref=>!target.sourceReferences.some(existing=>existing.sourceId===ref.sourceId))];target.keywords=[...new Set([...target.keywords,...node.keywords])];target.updatedAt=now();structure.nodes.filter(item=>item.parentId===node.id).forEach(child=>child.parentId=target.id);node.status='rejected';node.verificationStatus='rejected';node.includeInNextPhase=false;node.creatorNotes=`Merged into ${target.title}. Original wording preserved.`;});
  }
  function remove(projectId,nodeId){return save(projectId,structure=>{const ids=[nodeId,...descendants(structure.nodes,nodeId)];structure.nodes=structure.nodes.filter(node=>!ids.includes(node.id));structure.metadata.forEach(item=>{if(ids.includes(item.relatedNodeId))item.relatedNodeId=undefined;});});}
  function addMetadata(projectId,input){return save(projectId,structure=>structure.metadata.push({id:id('meta'),projectId,type:input.type||'keyword',value:String(input.value||'').trim(),relatedNodeId:input.relatedNodeId||undefined,sourceReferences:input.sourceReferences||[],verificationStatus:'from_my_notes',creatorNotes:''}));}
  function updateMetadata(projectId,metadataId,changes){return save(projectId,structure=>{const item=structure.metadata.find(meta=>meta.id===metadataId);if(!item)throw new Error('Metadata item not found.');Object.assign(item,changes,{id:item.id,projectId:item.projectId});});}
  function validate(projectId){
    const structure=ensure(projectId);const included=structure.nodes.filter(node=>node.includeInNextPhase&&node.status!=='rejected');const errors=[];
    if(!included.some(node=>node.nodeType==='subject'))errors.push('Add at least one Subject.');
    if(!included.some(node=>node.nodeType==='chapter'||node.nodeType==='topic'))errors.push('Add at least one Chapter or Topic.');
    included.forEach(node=>{if(!node.title.trim())errors.push('Every included item needs a title.');const parent=node.parentId?structure.nodes.find(item=>item.id===node.parentId):null;if(!validChild(parent?.nodeType,node.nodeType))errors.push(`${node.title} has an invalid parent relationship.`);});
    structure.warnings.filter(item=>item.blocking&&item.status==='open').forEach(item=>errors.push(item.message));return {valid:!errors.length,errors,included};
  }
  function approve(projectId,createdBy){
    const check=validate(projectId);if(!check.valid)throw new Error(check.errors.join(' '));
    return save(projectId,(structure,data)=>{structure.nodes.forEach(node=>{if(node.includeInNextPhase&&node.status!=='rejected'){node.status='accepted';node.verificationStatus='user_approved';}});const version={id:id('structure_version'),projectId,version:structure.versions.length+1,kind:'approved',nodes:clone(structure.nodes),metadata:clone(structure.metadata),createdAt:now(),createdBy};structure.versions.push(version);structure.approvalStatus='approved';structure.approvedVersionId=version.id;const project=data.projects.find(item=>item.id===projectId);if(project){project.status='structure_ready';project.updatedAt=now();}});
  }
  function restore(projectId,versionId){return save(projectId,structure=>{const version=structure.versions.find(item=>item.id===versionId);if(!version)throw new Error('Version not found.');structure.nodes=clone(version.nodes);structure.metadata=clone(version.metadata);structure.approvalStatus='draft';});}
  function importProposal(projectId,proposal,createdBy){
    return save(projectId,structure=>{
      if(structure.nodes.length)throw new Error('A structure draft already exists. Review it before importing another proposal.');
      const created=now();structure.nodes=proposal.nodes.map((node,index)=>({id:node.id,parentId:node.parentId||undefined,projectId,nodeType:node.nodeType,title:node.title,originalTitle:node.title,description:node.description||'',creatorNotes:'',sortOrder:Number.isFinite(node.sortOrder)?node.sortOrder:index,depth:Number.isFinite(node.depth)?node.depth:0,status:node.verificationStatus==='needs_verification'?'needs_verification':'draft',confidence:Number.isFinite(node.confidence)?node.confidence:undefined,sourceReferences:Array.isArray(node.sourceReferences)?node.sourceReferences:[],origin:node.origin||'curio_suggested',verificationStatus:node.verificationStatus||'curio_suggested',includeInNextPhase:true,sscRelevance:node.sscRelevance||'',difficulty:node.difficulty,keywords:Array.isArray(node.keywords)?node.keywords:[],createdAt:created,updatedAt:created}));
      structure.metadata=Array.isArray(proposal.metadata)?proposal.metadata:[];structure.warnings=Array.isArray(proposal.warnings)?proposal.warnings:[];structure.suggestions=Array.isArray(proposal.suggestions)?proposal.suggestions:[];
      structure.versions.push({id:id('structure_version'),projectId,version:structure.versions.length+1,kind:'ai_proposal',nodes:clone(structure.nodes),metadata:clone(structure.metadata),createdAt:created,createdBy});
    });
  }
  window.TeachCurioStructure={TYPES,ALLOWED,ensure,addNode,updateNode,moveNode,reorder,reject,duplicate,merge,remove,addMetadata,updateMetadata,validate,approve,restore,importProposal,validChild};
})();
