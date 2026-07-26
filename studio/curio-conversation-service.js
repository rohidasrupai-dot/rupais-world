(function(){
  'use strict';
  const S=()=>window.TeachCurioStore,A=()=>window.RupaiAI;
  const now=()=>new Date().toISOString(),clone=v=>JSON.parse(JSON.stringify(v)),uid=p=>`${p}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const MODES=['explain_concept','solve_doubt','teach_step_by_step','ask_me_questions','revision_partner','exam_coach','socratic_tutor','compare_concepts','explain_answer','explain_mistake','explore_curiosity','lesson_companion','custom'];
  const LEVELS=['very_simple','simple','standard','detailed','exam_focused','deep_exploration'];
  const LANGUAGES=['english','simple_english','hinglish','english_hinglish','hindi_foundation'];
  const INTENTS=['definition','concept_explanation','factual_question','why_question','how_question','comparison','chronology','location_map','process_explanation','formula_calculation','example_request','revision_request','quiz_request','lesson_doubt','mistake_explanation','general_curiosity','current_information','unsupported_unclear'];
  const GROUNDING=['grounded_lesson','grounded_upload','general_ai','mixed_sources','rule_based','cannot_verify','provider_unavailable'];
  const ensure=()=>{
    const s=S().read();
    ['curioConversations','curioMessages','curioTeachingGoals','curioIntentResults','curioResponsePlans','curioContextItems','curioContextSnapshots','curioConversationTeachingSteps','curioStudentAnswerEvaluations','curioMessageSources','curioCorrectionReports','curioOutputReviews','curioConversationSummaries','curioMemoryWriteProposals','curioAIConsents','curioProviderRoutingDecisions','curioPendingQuestions','curioConversationTasks'].forEach(k=>s[k]||(s[k]=[]));
    S().write(s);return s;
  };
  const normalize=v=>String(v||'').trim(),words=v=>normalize(v).toLowerCase().match(/[a-z0-9\u0900-\u097f]+/g)||[];
  const safeText=v=>normalize(v).slice(0,12000);
  const providerMode=mode=>({exam_coach:'exam_coach',revision_partner:'revision_partner',ask_me_questions:'question_generator'}[mode]||'tutor');
  function access(conversation,userId,review=false){
    if(!conversation)throw Object.assign(Error('Conversation not found.'),{code:'not_found'});
    if(conversation.userId!==userId&&!review)throw Object.assign(Error('You can only access your own conversations.'),{code:'forbidden'});
  }
  function createConversation(input){
    const s=ensure(),stamp=now(),c={id:uid('curio_conversation'),userId:input.userId,studentProfileId:input.studentProfileId||input.userId,projectId:input.projectId||null,relatedLessonId:input.relatedLessonId||input.projectId||null,relatedTopicIds:clone(input.relatedTopicIds||[]),relatedConceptIds:clone(input.relatedConceptIds||[]),teachingMode:MODES.includes(input.teachingMode)?input.teachingMode:'solve_doubt',preferredLanguage:LANGUAGES.includes(input.preferredLanguage)?input.preferredLanguage:'english',explanationLevel:LEVELS.includes(input.explanationLevel)?input.explanationLevel:'standard',startedAt:stamp,updatedAt:stamp,lastActiveAt:stamp,status:'active',providerMode:'automatic',safetyState:'unchecked',memoryPermissionState:input.memoryPermissionState||'not_asked',currentTeachingGoal:safeText(input.currentTeachingGoal||''),summaryPlaceholder:null,archivedAt:null,contextSharingAllowed:Boolean(input.contextSharingAllowed),ageGroup:input.ageGroup||'unknown',teacherSettings:clone(input.teacherSettings||{})};
    s.curioConversations.push(c);S().write(s);return clone(c);
  }
  function listConversations(userId,options={}){
    return ensure().curioConversations.filter(x=>x.userId===userId&&(!options.status||x.status===options.status)).sort((a,b)=>b.lastActiveAt.localeCompare(a.lastActiveAt)).slice(options.offset||0,(options.offset||0)+(options.limit||30)).map(clone);
  }
  function getConversation(id,userId,options={}){
    const s=ensure(),c=s.curioConversations.find(x=>x.id===id);access(c,userId,options.review===true);
    return{conversation:clone(c),messages:s.curioMessages.filter(x=>x.conversationId===id&&!['system_instruction'].includes(x.messageType)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).slice(-(options.messageLimit||100)).map(clone),steps:s.curioConversationTeachingSteps.filter(x=>x.conversationId===id).map(clone),summary:clone(s.curioConversationSummaries.filter(x=>x.conversationId===id).at(-1)||null)};
  }
  function updateConversation(id,userId,changes){
    const s=ensure(),c=s.curioConversations.find(x=>x.id===id);access(c,userId);
    if(changes.teachingMode&&MODES.includes(changes.teachingMode))c.teachingMode=changes.teachingMode;
    if(changes.preferredLanguage&&LANGUAGES.includes(changes.preferredLanguage))c.preferredLanguage=changes.preferredLanguage;
    if(changes.explanationLevel&&LEVELS.includes(changes.explanationLevel))c.explanationLevel=changes.explanationLevel;
    if(changes.projectId!==undefined){c.projectId=changes.projectId||null;c.relatedLessonId=changes.projectId||null}
    if(['active','paused','completed','archived'].includes(changes.status))c.status=changes.status;
    if(changes.contextSharingAllowed!==undefined)c.contextSharingAllowed=Boolean(changes.contextSharingAllowed);
    c.updatedAt=c.lastActiveAt=now();if(c.status==='archived')c.archivedAt=c.updatedAt;S().write(s);return clone(c);
  }
  function classifyIntent(text,override){
    const q=normalize(text).toLowerCase();let intent='concept_explanation',evidence=[],confidence=.62,clarification=false;
    const rules=[
      ['current_information',/\b(today|latest|current|news|now|202[6-9])\b/,'time-sensitive wording'],
      ['quiz_request',/\b(quiz|test me|practice question)\b/,'quiz wording'],
      ['revision_request',/\b(revise|revision|recap|summary)\b/,'revision wording'],
      ['comparison',/\b(compare|difference|versus| vs |similarit)\b/,'comparison wording'],
      ['chronology',/\b(timeline|chronology|before|after|when)\b/,'chronology wording'],
      ['location_map',/\b(where|map|location|located)\b/,'location wording'],
      ['formula_calculation',/\b(calculate|solve|formula|equation|\d+\s*[\+\-\*\/])\b/,'calculation wording'],
      ['mistake_explanation',/\b(why.*wrong|my mistake|incorrect answer)\b/,'mistake wording'],
      ['why_question',/^(why|why does|why did)\b/,'why question'],
      ['how_question',/^(how|how does|how did)\b/,'how question'],
      ['definition',/\b(define|definition|what is|meaning of)\b/,'definition wording'],
      ['example_request',/\b(example|show me one)\b/,'example wording'],
      ['process_explanation',/\b(process|steps|cycle|procedure)\b/,'process wording']
    ];
    const hit=rules.find(x=>x[1].test(q));if(hit){intent=hit[0];evidence=[hit[2]];confidence=.86}
    if(q.length<3){intent='unsupported_unclear';confidence=.2;clarification=true;evidence=['question too short']}
    if(override&&INTENTS.includes(override)){intent=override;confidence=1;evidence=['user override'];clarification=false}
    return{intent,confidence,evidence,clarificationRequired:clarification,method:'rule_based_metadata',override:override||null};
  }
  function flatten(value){
    if(typeof value==='string')return[value];if(Array.isArray(value))return value.flatMap(flatten);
    if(value&&typeof value==='object')return Object.values(value).flatMap(flatten);return[];
  }
  function candidateContext(s,c,question){
    const project=s.projects.find(x=>x.id===c.projectId),draft=s.lessonDrafts.find(x=>x.projectId===c.projectId),approved=draft?.versions?.find(x=>x.id===draft.approvedVersionId)||draft?.versions?.at(-1);
    const items=[];
    (approved?.sections||[]).forEach(section=>items.push({id:section.id||uid('ctx'),kind:'lesson_section',title:section.title||section.sectionType||'Lesson section',text:flatten(section.paragraph||section.content||section).join(' '),sourceIds:(section.paragraph?.sourceReferences||[]).map(x=>x.sourceId),approved:draft?.status==='approved',conceptId:section.structureNodeId||null}));
    const enhancement=s.learningEnhancements?.find(x=>x.projectId===c.projectId);
    (enhancement?.blocks||[]).forEach(block=>{if(['user_approved','user_edited','creator_added','from_my_notes'].includes(block.status)||(block.approvedVersionId)){items.push({id:block.id,kind:block.type,title:block.type.replaceAll('_',' '),text:flatten(block.english).join(' '),sourceIds:(block.sourceReferences||[]).map(x=>x.sourceId),approved:true})}});
    (s.sourceMaterials||[]).filter(x=>x.projectId===c.projectId&&x.includeInAnalysis!==false).forEach(src=>items.push({id:src.id,kind:'uploaded_material',title:src.title,text:`${src.textContent||''} ${src.creatorNotes||''}`,sourceIds:[src.id],approved:Boolean(src.primary||src.processingStatus==='approved')}));
    (s.visualAssetReferences||[]).filter(x=>x.projectId===c.projectId&&!x.deletedAt).forEach(ref=>{const asset=s.visualAssets?.find(x=>x.id===ref.assetId&&x.reviewStatus==='approved');if(asset)items.push({id:asset.id,kind:'visual',title:asset.title,text:`${asset.title} ${asset.description} ${asset.caption} ${(asset.tags||[]).join(' ')}`,sourceIds:[asset.id],approved:true,assetType:asset.assetType})});
    (s.educationalVisuals||[]).filter(x=>x.projectId===c.projectId&&x.reviewStatus==='approved').forEach(v=>items.push({id:v.id,kind:'visual',title:v.title,text:`${v.title} ${v.visualType} ${(v.tags||[]).join(' ')}`,sourceIds:[v.id],approved:true,assetType:v.visualType}));
    return{project,items};
  }
  function rankContext(items,question,c){
    const q=new Set(words(question));return items.map(item=>{const tokens=words(`${item.title} ${item.text}`),overlap=[...new Set(tokens.filter(x=>q.has(x)))].length,exact=c.relatedConceptIds?.includes(item.conceptId)?8:0,lesson=c.relatedLessonId?3:0,approved=item.approved?2:0,score=exact+lesson+approved+Math.min(overlap,8),match=score>=10?'direct_match':score>=7?'strong_match':score>=4?'possible_match':score>=2?'weak_match':'unrelated';return{...item,score,match}}).filter(x=>x.match!=='unrelated').sort((a,b)=>b.score-a.score).slice(0,8);
  }
  function buildContext(conversationId,userId,question,options={}){
    const s=ensure(),c=s.curioConversations.find(x=>x.id===conversationId);access(c,userId);const available=candidateContext(s,c,question),ranked=rankContext(available.items,question,c),limit=Math.max(600,Math.min(options.characterLimit||6000,12000));let used=[],size=0;
    for(const item of ranked){const text=safeText(item.text);if(!text||size+text.length>limit)continue;used.push({...item,text});size+=text.length}
    const memoryCategories=[];if(c.contextSharingAllowed){const profiles=(s.studentLearningProfiles||[]).filter(x=>x.studentId===c.studentProfileId),concepts=(s.conceptMemories||[]).filter(x=>x.studentId===c.studentProfileId&&(!c.projectId||x.lessonId===c.projectId)).slice(0,8);if(profiles.length)memoryCategories.push('learning_preferences');if(concepts.length)memoryCategories.push('concept_mastery');}
    const snapshot={id:uid('context_snapshot'),conversationId,projectId:c.projectId,questionHash:hash(question),contextItemIds:used.map(x=>x.id),sourceIds:[...new Set(used.flatMap(x=>x.sourceIds||[]))],memoryCategories,characterCount:size,retrievalMethod:'metadata_keyword_ranking',createdAt:now()};
    s.curioContextSnapshots.push(snapshot);used.forEach(x=>s.curioContextItems.push({id:uid('context_item'),snapshotId:snapshot.id,referenceId:x.id,kind:x.kind,match:x.match,score:x.score,sourceIds:x.sourceIds||[],createdAt:snapshot.createdAt}));S().write(s);return{snapshot:clone(snapshot),items:clone(used),project:clone(available.project||null)};
  }
  const hash=v=>{let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
  function responsePlan(c,intent,context){
    const parts=['acknowledge','direct_explanation'];if(['why_question','how_question','process_explanation','comparison'].includes(intent.intent))parts.push('reason');if(!['definition','factual_question'].includes(intent.intent))parts.push('example');if(context.items.some(x=>x.kind==='visual'))parts.push('visual');if(c.explanationLevel==='exam_focused')parts.push('common_mistake','exam_pattern');if(c.teachingMode==='socratic_tutor')parts.splice(1,1,'open_question','small_clue');else if(c.teachingMode==='teach_step_by_step')parts.push('checking_question');parts.push('next_step');
    return{parts:[...new Set(parts)],level:c.explanationLevel,language:c.preferredLanguage,mode:c.teachingMode,groundingTarget:context.items.some(x=>x.kind==='lesson_section')?'grounded_lesson':context.items.some(x=>x.kind==='uploaded_material')?'grounded_upload':'cannot_verify'};
  }
  function sourceLabel(state){return{grounded_lesson:"Based on Rupai's World lesson",grounded_upload:'Based on creator material',general_ai:'General AI explanation — verification may be required',mixed_sources:'Mixed sources',rule_based:'Rule-based learning support',cannot_verify:'Cannot verify from approved material',provider_unavailable:'AI provider unavailable'}[state]}
  function formatGrounded(c,question,context,plan){
    const primary=context.items.find(x=>x.kind==='lesson_section')||context.items[0],text=safeText(primary?.text),short=c.explanationLevel==='very_simple'?text.split(/[.!?]/).slice(0,2).join('. '):c.explanationLevel==='simple'?text.split(/[.!?]/).slice(0,4).join('. '):text.slice(0,c.explanationLevel==='detailed'||c.explanationLevel==='deep_exploration'?2600:1400);
    const visual=context.items.find(x=>x.kind==='visual'),follow=c.teachingMode==='socratic_tutor'?'What do you think is the first clue?':'Would you like a simpler example or one practice question?';
    return{directAnswer:short||`I found approved material related to “${safeText(question)}”.`,steps:c.teachingMode==='teach_step_by_step'?[{title:'Start with the core idea',content:short},{title:'Check your understanding',content:'Explain the idea in your own words.'}]:[],examples:[],commonMistake:null,followUpQuestion:follow,suggestedVisual:visual?{id:visual.id,title:visual.title,type:visual.assetType,reason:'This approved visual matches the current topic.'}:null,confidence:primary?.match==='direct_match'?.95:.78};
  }
  function addMessage(s,c,input){
    const m={id:uid('curio_message'),conversationId:c.id,role:input.role,messageType:input.messageType||'text',content:safeText(input.content),structuredContent:clone(input.structuredContent||null),createdAt:now(),provider:input.provider||null,model:input.model||null,promptTemplateVersion:input.promptTemplateVersion||null,executionId:input.executionId||null,sourceReferences:clone(input.sourceReferences||[]),lessonReferences:clone(input.lessonReferences||[]),safetyResult:clone(input.safetyResult||null),verificationState:input.verificationState||'unverified',groundingState:input.groundingState||null,costUsageReference:input.costUsageReference||null,errorState:input.errorState||null,retryParentId:input.retryParentId||null,trustLabel:input.groundingState?sourceLabel(input.groundingState):null};s.curioMessages.push(m);c.updatedAt=c.lastActiveAt=m.createdAt;return m;
  }
  function localSafety(question,c){
    const ai=A(),base=ai?.safetyCheck?ai.safetyCheck({userId:c.userId,sessionId:c.id,capability:'educational_explanation',mode:providerMode(c.teachingMode),prompt:question,context:{studentHistoryInvented:false}}):{safe:true,issues:[]};
    const child=['child','teen'].includes(c.ageGroup),sensitive=/\b(self harm|suicide|explicit sexual|buy drugs)\b/i.test(question),cheat=/\b(do my exam|give final answer only|complete my graded)\b/i.test(question)&&c.teacherSettings?.restrictedAssessment;
    const issues=[...(base.issues||[])];if(child&&sensitive)issues.push({type:'minor_safety',severity:'block'});if(cheat)issues.push({type:'academic_integrity',severity:'redirect'});return{safe:base.safe!==false&&!issues.some(x=>x.severity==='block'),issues,academicIntegrityRedirect:cheat};
  }
  async function ask(conversationId,userId,question,options={}){
    const text=safeText(question);if(!text)throw Error('Enter an educational question.');const s=ensure(),c=s.curioConversations.find(x=>x.id===conversationId);access(c,userId);
    const recent=s.curioMessages.findLast?.(x=>x.conversationId===c.id&&x.role==='student')||[...s.curioMessages].reverse().find(x=>x.conversationId===c.id&&x.role==='student');
    if(recent&&recent.content===text&&Date.now()-new Date(recent.createdAt).getTime()<10000)return{state:'duplicate_prevented',message:'This question is already being handled.',conversationId:c.id};
    const safety=localSafety(text,c),student=addMessage(s,c,{role:'student',content:text,safetyResult:safety,verificationState:'user_input'});if(!safety.safe){c.status='blocked';c.safetyState='blocked';const blocked=addMessage(s,c,{role:'curio',messageType:'error',content:'I cannot help with that request. Please ask a trusted adult or teacher for support.',safetyResult:safety,verificationState:'safety_blocked',groundingState:'rule_based'});S().write(s);return{state:'blocked',message:clone(blocked)}}
    const intent={id:uid('intent'),conversationId:c.id,messageId:student.id,...classifyIntent(text,options.intentOverride),createdAt:now()};s.curioIntentResults.push(intent);S().write(s);
    const context=buildContext(c.id,userId,text,options),state=ensure(),conversation=state.curioConversations.find(x=>x.id===c.id),planData=responsePlan(conversation,intent,context),plan={id:uid('response_plan'),conversationId:c.id,messageId:student.id,...planData,createdAt:now()};state.curioResponsePlans.push(plan);
    if(safety.academicIntegrityRedirect){const m=addMessage(state,conversation,{role:'curio',content:'I can explain the concept, give a hint, or show a similar example, but I cannot complete a restricted assessment for you.',groundingState:'rule_based',verificationState:'safe_learning_support',safetyResult:safety});S().write(state);return{state:'complete',message:clone(m),intent,plan,context:context.snapshot}}
    if(context.items.length){
      const structured=formatGrounded(conversation,text,context,plan),grounding=context.items.some(x=>x.kind==='lesson_section')?'grounded_lesson':'grounded_upload',m=addMessage(state,conversation,{role:'curio',messageType:'structured_explanation',content:structured.directAnswer,structuredContent:structured,sourceReferences:context.snapshot.sourceIds,lessonReferences:conversation.relatedLessonId?[conversation.relatedLessonId]:[],groundingState:grounding,verificationState:'creator_approved_source',safetyResult:safety});
      context.items.forEach(x=>(x.sourceIds||[x.id]).forEach(sourceId=>state.curioMessageSources.push({id:uid('message_source'),messageId:m.id,conversationId:c.id,sourceId,contextReferenceId:x.id,groundingState:grounding,createdAt:now()})));
      if(conversation.teachingMode==='teach_step_by_step'||conversation.teachingMode==='socratic_tutor')createSteps(state,conversation,m,structured,context);
      S().write(state);return{state:'complete',message:clone(m),intent:clone(intent),plan:clone(plan),context:clone(context.snapshot)};
    }
    if(intent.intent==='current_information'){const m=addMessage(state,conversation,{role:'curio',messageType:'error',content:'I cannot verify current information because live internet search is not available in this phase.',groundingState:'cannot_verify',verificationState:'cannot_verify',safetyResult:safety});queueReview(state,m,'cannot_verify','Current-information request requires a verified source.');S().write(state);return{state:'cannot_verify',message:clone(m),intent,plan,context:context.snapshot}}
    const route=A()?.curioDecision?.({capability:'educational_explanation',manualPreferred:false})||{shouldCallAI:false,reason:'No AI provider layer.'};state.curioProviderRoutingDecisions.push({id:uid('routing'),conversationId:c.id,messageId:student.id,providerId:route.providerId||null,modelId:route.modelId||null,reason:route.reason,shouldCallAI:route.shouldCallAI,createdAt:now()});
    if(!route.shouldCallAI||navigator.onLine===false){const offline=navigator.onLine===false,copy=offline?'You are offline. Your question is saved, but new AI generation is unavailable. Approved lessons remain available.':"AI teaching is not configured. Curio can still help using approved Rupai's World lessons and learning tools. I could not find an approved answer for this doubt, so I created a creator review task.";const m=addMessage(state,conversation,{role:'curio',messageType:'no_provider_notice',content:copy,groundingState:offline?'provider_unavailable':'provider_unavailable',verificationState:'provider_unavailable',safetyResult:safety});conversation.status='provider_unavailable';state.curioPendingQuestions.push({id:uid('pending_question'),conversationId:c.id,messageId:student.id,userId,question:text,status:offline?'pending_connection':'needs_creator',createdAt:now()});queueReview(state,m,'unanswered_question',text);S().write(state);return{state:offline?'offline':'provider_unavailable',message:clone(m),intent,plan,context:context.snapshot}}
    const streaming=options.streaming===true,request=A().buildRequest({userId,sessionId:c.id,capability:'educational_explanation',mode:providerMode(conversation.teachingMode),language:conversation.preferredLanguage,prompt:text,structured:!streaming,streaming,responseSchema:streaming?null:{type:'object'},context:{approvedContext:context.items.map(x=>({referenceId:x.id,text:x.text,sourceIds:x.sourceIds})),groundingRequired:false,studentDataCategories:context.snapshot.memoryCategories,ageGroup:conversation.ageGroup}});
    let result=await A().execute(request);options.onExecution?.(result.execution?.id||null);
    if(result.state==='streaming'){
      const consumed=await A().consumeStream(result,event=>options.onChunk?.(event));
      const streamedState=ensure(),streamedConversation=streamedState.curioConversations.find(x=>x.id===c.id),partial=addMessage(streamedState,streamedConversation,{role:'curio',messageType:'text',content:consumed.content||'Generation stopped before any confirmed text was received.',provider:result.provider,model:result.model,executionId:result.execution.id,groundingState:'general_ai',verificationState:consumed.state==='completed'?'verification_required':'cancelled_partial',safetyResult:safety,errorState:consumed.state==='completed'?null:'cancelled'});
      S().write(streamedState);return{state:consumed.state,message:clone(partial),intent,plan,context:context.snapshot};
    }
    const fresh=ensure(),live=fresh.curioConversations.find(x=>x.id===c.id);
    if(!result.ok){const m=addMessage(fresh,live,{role:'curio',messageType:'error',content:result.error||'The provider could not answer. Approved learning tools remain available.',groundingState:'provider_unavailable',verificationState:'provider_failure',executionId:result.execution?.id,safetyResult:safety});S().write(fresh);return{state:result.state||'failed',message:clone(m),intent,plan,context:context.snapshot}}
    const valid=validateStructured(result.content),payload=valid.valid?result.content:{directAnswer:typeof result.content==='string'?result.content:'The provider returned an unsupported response format.',followUpQuestion:null,confidence:null},m=addMessage(fresh,live,{role:'curio',messageType:'structured_explanation',content:payload.directAnswer,structuredContent:payload,provider:result.provider,model:result.model,executionId:result.execution.id,groundingState:'general_ai',verificationState:valid.valid?'verification_required':'invalid_structure',safetyResult:safety});
    if(!valid.valid)queueReview(fresh,m,'invalid_structure',valid.errors.join(' '));else if(Number(payload.confidence||0)<.65)queueReview(fresh,m,'low_confidence','Provider confidence below review threshold.');S().write(fresh);return{state:'complete',message:clone(m),intent,plan,context:context.snapshot};
  }
  function createSteps(s,c,m,payload,context){
    const parts=c.teachingMode==='socratic_tutor'?[['open_question','What do you already know about this?'],['small_clue','Use one clue from the approved lesson.'],['direct_explanation',payload.directAnswer],['reflection','Explain the idea in your own words.']]:[['prior_knowledge','What do you already know?'],['teach_part',payload.directAnswer],['check','Explain this part in one sentence.'],['example','Try one related example.'],['recall','What is the key idea?'],['summary','Summarize what you learned.']];
    parts.forEach((x,i)=>s.curioConversationTeachingSteps.push({id:uid('teaching_step'),conversationId:c.id,messageId:m.id,order:i,goal:x[0],content:x[1],expectedLearnerResponse:['prior_knowledge','check','recall','reflection','open_question'].includes(x[0])?'short_answer':null,completionState:i?'pending':'active',retryCount:0,adaptationReason:c.teachingMode,relatedConcept:c.relatedConceptIds?.[0]||null,evidenceSource:context.items[0]?.id||null,createdAt:now()}));
  }
  function validateStructured(v){const errors=[];if(!v||typeof v!=='object')errors.push('Response must be an object.');if(!normalize(v?.directAnswer))errors.push('Direct answer is required.');if(v?.steps&&!Array.isArray(v.steps))errors.push('Steps must be an array.');if(v?.sourceReferences&&!Array.isArray(v.sourceReferences))errors.push('Source references must be an array.');return{valid:!errors.length,errors}}
  function evaluateAnswer(input){
    const expected=(input.expectedConcepts||[]).map(x=>normalize(x).toLowerCase()).filter(Boolean),answer=normalize(input.answer),hits=expected.filter(x=>answer.toLowerCase().includes(x)),ratio=expected.length?hits.length/expected.length:answer?0.5:0,status=!answer?'not_answered':ratio===1?'correct':ratio>=.66?'mostly_correct':ratio>=.34?'partially_correct':ratio>0?'incorrect':'unclear',missing=expected.filter(x=>!hits.includes(x)),next={correct:'continue',mostly_correct:'confirm_and_continue',partially_correct:'explain_missing_concepts',incorrect:'remediate_with_smaller_example',unclear:'ask_clarifying_question',not_answered:'offer_hint'}[status];
    const s=ensure(),record={id:uid('answer_evaluation'),conversationId:input.conversationId,stepId:input.stepId||null,studentMessageId:input.studentMessageId||null,status,evidenceUsed:clone(input.evidenceUsed||[]),expectedConcepts:expected,matchedConcepts:hits,missingConcepts:missing,misconceptionsDetected:clone(input.misconceptions||[]),confidence:expected.length?Math.max(.55,ratio):.35,recommendedNextAction:next,grammarPenalized:false,method:'rule_based_concept_match',createdAt:now()};s.curioStudentAnswerEvaluations.push(record);S().write(s);return clone(record);
  }
  function remediation(evaluation){return{tone:'encouraging',parts:['identify_misunderstanding','show_correct_principle','contrast_answers','new_example','smaller_follow_up'],message:evaluation.status==='incorrect'?"That's a useful attempt. Let's correct one small part first.":'You have part of the idea. Let us add the missing concept.',weakTopicWriteAllowed:false,reason:'One response alone does not establish a weak topic.'}}
  function proposeMemory(input){
    const allowed=['learning_preference','confirmed_study_goal','concept_practiced','concept_understood','misconception_evidence','revision_requested','saved_explanation','user_approved_note'];if(!allowed.includes(input.category))throw Error('Unsupported memory category.');
    const s=ensure(),c=s.curioConversations.find(x=>x.id===input.conversationId);access(c,input.userId);const consent=c.memoryPermissionState==='granted'||s.curioAIConsents.some(x=>x.userId===input.userId&&x.type==='long_term_learning_memory'&&x.granted);
    const p={id:uid('memory_proposal'),conversationId:c.id,userId:input.userId,category:input.category,content:safeText(input.content),sourceMessageId:input.sourceMessageId||null,confidence:Number(input.confidence||0),retentionCategory:input.retentionCategory||'review_required',status:consent&&Number(input.confidence||0)>=.7?'proposed':'consent_required',consentSatisfied:consent,createdAt:now()};s.curioMemoryWriteProposals.push(p);S().write(s);return clone(p);
  }
  function setConsent(userId,input){const s=ensure(),r={id:uid('ai_consent'),userId,type:input.type||'provider_context',granted:Boolean(input.granted),dataCategories:clone(input.dataCategories||[]),ageRule:input.ageRule||'standard',createdAt:now(),revokedAt:input.granted?null:now()};s.curioAIConsents.push(r);S().write(s);return clone(r)}
  function summarize(conversationId,userId){
    const s=ensure(),c=s.curioConversations.find(x=>x.id===conversationId);access(c,userId);const messages=s.curioMessages.filter(x=>x.conversationId===conversationId),intents=s.curioIntentResults.filter(x=>x.conversationId===conversationId),evaluations=s.curioStudentAnswerEvaluations.filter(x=>x.conversationId===conversationId),summary={id:uid('conversation_summary'),conversationId,mainTopic:c.currentTeachingGoal||messages.find(x=>x.role==='student')?.content?.slice(0,120)||'Educational conversation',conceptsCovered:[...new Set(c.relatedConceptIds||[])],questionsAnswered:messages.filter(x=>x.role==='curio'&&['structured_explanation','text'].includes(x.messageType)).length,remainingDoubts:messages.filter(x=>x.verificationState==='cannot_verify'||x.messageType==='no_provider_notice').map(x=>x.content.slice(0,160)),examplesUsed:messages.filter(x=>x.structuredContent?.examples?.length).length,quizOutcome:null,learningEvidence:evaluations.map(x=>({status:x.status,expectedConcepts:x.expectedConcepts})),intents:[...new Set(intents.map(x=>x.intent))],suggestedNextStep:evaluations.at(-1)?.recommendedNextAction||'Continue from the current learning goal.',messageCount:messages.length,createdAt:now()};s.curioConversationSummaries.push(summary);c.summaryPlaceholder=summary.id;S().write(s);return clone(summary);
  }
  function queueReview(s,message,reason,detail){const r={id:uid('output_review'),messageId:message.id,conversationId:message.conversationId,reason,detail:safeText(detail),status:'open',priority:['safety_failure','factual_error'].includes(reason)?'high':'normal',creatorAction:null,createdAt:now(),resolvedAt:null};s.curioOutputReviews.push(r);return r}
  function reportCorrection(input){
    const s=ensure(),c=s.curioConversations.find(x=>x.id===input.conversationId);access(c,input.userId);const message=s.curioMessages.find(x=>x.id===input.messageId&&x.conversationId===c.id);if(!message)throw Error('Message not found.');const allowed=['factual_error','confusing_explanation','wrong_source','outdated_information','inappropriate_difficulty','translation_issue','missing_visual','other'],r={id:uid('correction_report'),messageId:message.id,conversationId:c.id,lessonId:c.relatedLessonId,providerExecutionId:message.executionId,sourceReferences:clone(message.sourceReferences||[]),userId:input.userId,category:allowed.includes(input.category)?input.category:'other',details:safeText(input.details),status:'open',creatorResolution:null,createdAt:now(),resolvedAt:null};s.curioCorrectionReports.push(r);queueReview(s,message,'reported_answer',`${r.category}: ${r.details}`);S().write(s);return clone(r);
  }
  function reviewQueue(options={}){
    const s=ensure(),rows=s.curioOutputReviews.filter(x=>!options.status||x.status===options.status).map(x=>({...x,message:s.curioMessages.find(m=>m.id===x.messageId),report:s.curioCorrectionReports.find(r=>r.messageId===x.messageId&&r.status==='open')}));return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(options.offset||0,(options.offset||0)+(options.limit||50)).map(clone);
  }
  function resolveReview(id,actor,input){
    const s=ensure(),r=s.curioOutputReviews.find(x=>x.id===id);if(!r)throw Error('Review item not found.');const actions=['approve_conversation_only','convert_to_lesson_draft','edit','add_source','reject','archive','create_content_task'];if(!actions.includes(input.action))throw Error('Invalid creator action.');r.status='resolved';r.creatorAction=input.action;r.creatorNotes=safeText(input.notes);r.resolvedBy=actor;r.resolvedAt=now();if(input.action==='create_content_task')s.curioConversationTasks.push({id:uid('content_task'),reviewId:r.id,conversationId:r.conversationId,title:'Improve lesson from Curio review',status:'accepted',createdBy:actor,createdAt:now()});S().write(s);return clone(r);
  }
  function suggestedQuestions(projectId){const s=ensure(),p=s.projects.find(x=>x.id===projectId),blocks=s.learningEnhancements?.find(x=>x.projectId===projectId)?.blocks||[];return[`What is the main idea in ${p?.title||'this lesson'}?`,blocks.some(x=>x.type==='memory_tricks')?'Show me an approved memory trick.':'Can you explain this simply?',blocks.some(x=>x.type==='common_mistakes')?'What common mistake should I avoid?':'Ask me one practice question.'].slice(0,3)}
  function quizLink(projectId){const s=ensure(),q=s.quizzes?.find(x=>x.projectId===projectId);return q?{available:true,quizId:q.id,url:`quiz.html?project=${encodeURIComponent(projectId)}`}:{available:false,message:'No quiz is available for this lesson.'}}
  function visualRecommendation(projectId,question){if(window.TeachCurioVisualIntelligence)return window.TeachCurioVisualIntelligence.recommendForAsk(projectId,question,{userId:'ask-curio',permissions:['visual.student.view']});const s=ensure(),items=rankContext(candidateContext(s,{projectId,relatedLessonId:projectId,relatedConceptIds:[]},question).items.filter(x=>x.kind==='visual'),question,{relatedConceptIds:[],relatedLessonId:projectId});return items[0]?{available:true,asset:clone(items[0])}:{available:false,task:{type:'visual_generation_request',status:'draft',message:'No approved visual matched. A creator visual task may be created; no visual was generated.'}}}
  ensure();
  window.TeachCurioConversation={MODES,LEVELS,LANGUAGES,INTENTS,GROUNDING,createConversation,listConversations,getConversation,updateConversation,classifyIntent,buildContext,responsePlan,ask,evaluateAnswer,remediation,proposeMemory,setConsent,summarize,reportCorrection,reviewQueue,resolveReview,suggestedQuestions,quizLink,visualRecommendation,validateStructured,_ensure:ensure};
})();
