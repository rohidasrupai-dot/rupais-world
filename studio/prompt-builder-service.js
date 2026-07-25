(function(){
  const store=()=>window.TeachCurioStore;
  const uid=prefix=>`${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const BASE={id:'base',version:1,extends:null,role:'Educational Lesson Writer',restrictions:[
    'Use only the approved structure, approved metadata, Creator notes and listed source references.',
    'Do not invent facts or silently fill information gaps.',
    'Do not use rejected or unapproved content.',
    'Do not generate quizzes, summaries, timelines, images, maps or publishing content.',
    'Generate only the requested content.'
  ],formattingRules:[
    'Return structured data matching the requested output contract.',
    'Keep every Concept linked to its approved structure node ID.',
    'Keep English and Hinglish variants semantically aligned.'
  ]};
  const SUBJECTS=['history','science','geography','economy','polity','math','reasoning','english','hindi','odia'];
  const TEMPLATES=Object.freeze(Object.fromEntries(SUBJECTS.map(subject=>[
    subject,
    {
      id:`${subject}_lesson`,subject,version:1,extends:'base',
      role:subject==='math'||subject==='reasoning'?'Teacher and Step-by-step Explanation Assistant':'Teacher and Curriculum Designer',
      writingStyle:subject==='history'?'concept_focused':subject==='english'||subject==='hindi'||subject==='odia'?'teacher_style':'clear_beginner_friendly',
      restrictions:[`Keep the explanation appropriate for the approved ${subject} lesson context.`],
      formattingRules:[subject==='math'||subject==='reasoning'?'Explain reasoning clearly without adding unrequested exercises.':'Use clear paragraphs and approved headings only.']
    }
  ])));
  function templateFor(subject){const key=String(subject||'').trim().toLowerCase();return clone(TEMPLATES[key]||{id:'general_lesson',subject:'general',version:1,extends:'base',role:BASE.role,writingStyle:'clear_beginner_friendly',restrictions:[],formattingRules:[]});}
  function languageInstruction(language){if(language==='english')return'Generate English content only.';if(language==='hinglish')return'Generate natural Hinglish in Roman script only.';if(language==='dual')return'Generate matching English and natural Roman-script Hinglish variants.';throw new Error('Select English, Hinglish or Dual language.');}
  function validate(prompt){
    const errors=[];if(!prompt||typeof prompt!=='object')return{valid:false,errors:['Prompt is missing.']};
    if(!prompt.role?.trim())errors.push('A prompt role is required.');
    if(!prompt.objective?.trim())errors.push('A generation objective is required.');
    if(!['english','hinglish','dual'].includes(prompt.language))errors.push('A valid language is required.');
    if(!prompt.approvedStructure?.versionId)errors.push('An approved structure version is required.');
    if(!prompt.approvedStructure?.concepts?.length)errors.push('At least one approved Concept is required.');
    if(!Array.isArray(prompt.restrictions)||!prompt.restrictions.length)errors.push('Prompt restrictions are required.');
    if(!Array.isArray(prompt.formattingRules)||!prompt.formattingRules.length)errors.push('Formatting rules are required.');
    if(!prompt.outputMode?.trim())errors.push('An output mode is required.');
    return{valid:errors.length===0,errors};
  }
  function build(input,options={}){
    if(!input?.approvedStructureVersionId||!input.structure?.concepts?.length)throw new Error('Approved Structure and required Concepts are missing.');
    const template=templateFor(options.template||input.structure.nodes.find(node=>node.nodeType==='subject')?.title),language=options.language||input.preferences?.language||'dual';
    const prompt={schemaVersion:1,promptId:uid('prompt'),templateId:template.id,templateVersion:template.version,role:options.role||template.role||BASE.role,objective:options.objective||'generate_explanation',audience:options.audience||'Learners using Rupai’s World',difficulty:options.difficulty||'beginner_friendly',language,outputMode:options.outputMode||'concept_explanations_with_definition_blocks',writingStyle:options.writingStyle||template.writingStyle||'clear_beginner_friendly',approvedStructure:{versionId:input.approvedStructureVersionId,nodes:clone(input.structure.nodes),concepts:clone(input.structure.concepts)},approvedMetadata:clone(input.metadata||[]),definitions:clone(options.definitions||[]),creatorNotes:String(input.creatorNotes||''),sourceReferences:clone(input.sourceReferences||[]),restrictions:[...BASE.restrictions,...template.restrictions,...(options.restrictions||[])],formattingRules:[...BASE.formattingRules,...template.formattingRules,languageInstruction(language),...(options.formattingRules||[])],verificationRules:{...clone(input.verificationRules||{}),flagUnsupportedClaims:true},generationSettings:{maximumLength:Number(options.maximumLength||700),paragraphStyle:options.paragraphStyle||'short_clear_paragraphs',headingStyle:options.headingStyle||'approved_concept_titles',bulletPreference:options.bulletPreference||'only_when_helpful',tone:options.tone||'friendly_formal'},futureExtensions:clone(options.futureExtensions||{}),createdAt:new Date().toISOString()};
    const result=validate(prompt);if(!result.valid)throw new Error(`Invalid prompt: ${result.errors.join(' ')}`);return prompt;
  }
  function buildLearning(input,draft,type,options={}){
    if(!draft||draft.status!=='approved'||!draft.approvedVersionId)throw new Error('Approve the Lesson Draft before generating learning enhancements.');
    if(!['important_points','quick_summary','memory_tricks','real_life_examples','ssc_connection','common_mistakes','fun_facts','revision_notes'].includes(type))throw new Error('Select a supported learning enhancement.');
    const approvedVersion=draft.versions.find(version=>version.id===draft.approvedVersionId);
    if(!approvedVersion?.sections?.length)throw new Error('The approved Lesson Draft version is missing or empty.');
    const objectives={important_points:'generate_important_points',quick_summary:'generate_quick_summary',memory_tricks:'generate_memory_tricks',real_life_examples:'generate_real_life_examples',ssc_connection:'generate_ssc_connection',common_mistakes:'generate_common_mistakes',fun_facts:options.itemId?'regenerate_fun_fact':'generate_fun_facts',revision_notes:options.itemId?'regenerate_revision_block':'generate_revision_notes'};
    const rules={
      important_points:'Extract concise essential learning points without copying whole paragraphs.',
      quick_summary:'Write a natural short summary without repeating the Important Points.',
      memory_tricks:'Create accurate educational memory tricks using visual, story, logical, pattern or keyword associations. Explain why every trick works. Avoid meaningless rhymes.',
      real_life_examples:'Create simple, relevant, age-appropriate everyday examples that accurately connect to the approved lesson concepts.',
      ssc_connection:'Explain educational SSC relevance: why the topic matters, possible question types, concepts needing attention and commonly tested facts. Never invent previous-year questions, predict appearance or guess exam frequency.',
      common_mistakes:'Identify supported conceptual mistakes such as confused dates, kingdoms, definitions, chronology, geography or terminology. Do not fabricate statistics or unsupported claims.',
      fun_facts:'Return concise, relevant supplementary facts distinct from core content, Important Points and Quick Summary. Never invent trivia, quotations, statistics, unsupported superlatives or sensational claims. Mark weakly supported facts Needs Verification, or return an honest no-suitable-supported-facts result.',
      revision_notes:'Transform the approved lesson into shorter, organised exam-ready notes with relevant headings. Remain more detailed than Quick Summary, preserve hierarchy, chronology, classifications, definitions, names and dates, and avoid copying the Lesson Draft.'
    };
    const objective=objectives[type];
    const prompt=build(input,{...options,objective,outputMode:type,maximumLength:options.maximumLength||(type==='quick_summary'?250:400),restrictions:[
      ...(options.restrictions||[]),
      rules[type]
    ]});
    prompt.approvedLessonDraft={draftId:draft.id,approvedVersionId:draft.approvedVersionId,sections:clone(approvedVersion.sections)};
    if(['fun_facts','revision_notes'].includes(type)){prompt.formattingRules.push(type==='fun_facts'?'Return a facts array with stable IDs, title, English, Hinglish, related approved node ID, source references and verification state.':'Return an ordered blocks array with stable IDs, block type, heading, English, Hinglish, related approved node ID, source references and verification state.');prompt.futureExtensions.regenerateItemId=options.itemId||null;}
    return prompt;
  }
  function buildQuiz(input,draft,enhancement,options={}){
    if(!draft||draft.status!=='approved'||!draft.approvedVersionId)throw new Error('Approve the Lesson Draft before generating a quiz.');
    const version=draft.versions.find(item=>item.id===draft.approvedVersionId);if(!version?.sections?.length)throw new Error('The approved Lesson Draft is empty.');
    const prompt=build(input,{...options,objective:'generate_quiz',outputMode:'normalized_quiz_questions',restrictions:[...(options.restrictions||[]),'Generate questions only from the approved lesson and supplied learning enhancements.','Do not invent facts, answers, PYQs, exam frequency or material outside the lesson.','Return normalized questions with answer data, explanations, references, difficulty and Bloom levels.']});
    prompt.approvedLessonDraft={draftId:draft.id,approvedVersionId:draft.approvedVersionId,sections:clone(version.sections)};
    const allowed=['important_points','quick_summary','memory_tricks','ssc_connection','common_mistakes'];
    prompt.futureExtensions.quizContext={mode:options.mode||'practice',count:Number(options.count||10),questionTypes:clone(options.questionTypes||[]),learningBlocks:clone((enhancement?.blocks||[]).filter(block=>allowed.includes(block.type)))};
    prompt.formattingRules.push('Return a questions array with unique stable IDs and provider-neutral question records.','MCQ must contain exactly four unique options and one correct answer.','Never leave a generated question without a valid answer.');
    return prompt;
  }
  function record(projectId,prompt,createdBy,capability='generateLessonDraft'){const snapshot=store().read(),stamp=new Date().toISOString(),run={id:uid('prompt_run'),projectId,prompt:clone(prompt),capability,status:'previewed',createdBy,createdAt:stamp,updatedAt:stamp};snapshot.promptRuns.push(run);store().write(snapshot);return run;}
  function updateRun(runId,status,error){const snapshot=store().read(),run=snapshot.promptRuns.find(item=>item.id===runId);if(!run)throw new Error('Prompt history record not found.');run.status=status;run.updatedAt=new Date().toISOString();if(error)run.error=String(error);store().write(snapshot);return run;}
  function history(projectId){return store().read().promptRuns.filter(item=>item.projectId===projectId);}
  function templateHistory(){return[{...clone(BASE),subject:'base'},...Object.values(TEMPLATES).map(clone)];}
  window.TeachCurioPromptBuilder={build,buildLearning,buildQuiz,validate,record,updateRun,history,templateFor,templateHistory};
})();
