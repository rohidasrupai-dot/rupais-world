(function(){
  const store=()=>window.TeachCurioStore;
  const uid=prefix=>`${prefix}_${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)}`;
  const clone=value=>JSON.parse(JSON.stringify(value)),now=()=>new Date().toISOString();
  const TYPES=new Set(['mcq','multiple_correct','true_false','fill_blank','match_following','arrange_order','image_based','map_based','timeline','assertion_reason','very_short','long_answer']);
  const MODES=new Set(['practice','exam','revision','challenge']),BLOOM=new Set(['remember','understand','apply','analyze','evaluate','create']);
  function snapshot(){return store().read();}
  function quizFor(projectId){return snapshot().quizzes.find(item=>item.projectId===projectId)||null;}
  function questionsFor(quizId){return snapshot().quizQuestions.filter(item=>item.quizId===quizId&&!item.deletedAt).sort((a,b)=>a.sortOrder-b.sortOrder);}
  function optionsFor(questionId){return snapshot().quizOptions.filter(item=>item.questionId===questionId).sort((a,b)=>a.sortOrder-b.sortOrder);}
  function approvedDraft(data,projectId){const draft=data.lessonDrafts.find(item=>item.projectId===projectId);if(!draft||draft.status!=='approved'||!draft.approvedVersionId)throw new Error('Approve the Lesson Draft before creating a quiz.');return draft;}
  function createQuiz(projectId,input,createdBy){
    const data=snapshot();if(data.quizzes.some(item=>item.projectId===projectId))throw new Error('This lesson already has a quiz.');
    const draft=approvedDraft(data,projectId),stamp=now(),mode=MODES.has(input.mode)?input.mode:'practice';
    const quiz={id:uid('quiz'),projectId,lessonDraftId:draft.id,lessonDraftVersionId:draft.approvedVersionId,title:String(input.title||'Lesson Quiz').trim(),mode,randomizeQuestions:Boolean(input.randomizeQuestions),randomizeOptions:Boolean(input.randomizeOptions),status:'draft',createdAt:stamp,updatedAt:stamp};
    data.quizzes.push(quiz);saveVersion(data,quiz,'created',createdBy);store().write(data);return quiz;
  }
  function validateQuestion(input,options=[]){
    const errors=[],type=input.type;if(!TYPES.has(type))errors.push('Choose a valid question type.');
    if(!String(input.prompt||'').trim())errors.push('Question text is required.');
    const marks=Number(input.marks),negative=Number(input.negativeMarks),time=Number(input.timeLimitSeconds),weight=Number(input.difficultyWeight);
    if(!Number.isFinite(marks)||marks<=0)errors.push('Marks must be greater than zero.');
    if(!Number.isFinite(negative)||negative<0||negative>marks)errors.push('Negative marks must be between zero and the question marks.');
    if(!Number.isFinite(time)||time<0)errors.push('Time limit cannot be negative.');
    if(!Number.isFinite(weight)||weight<=0)errors.push('Difficulty weight must be greater than zero.');
    if(!['easy','medium','hard'].includes(input.difficulty))errors.push('Choose a difficulty.');
    if(!BLOOM.has(input.bloomLevel))errors.push('Choose a Bloom learning level.');
    const optionTypes=['mcq','multiple_correct','true_false','image_based','assertion_reason'];
    if(optionTypes.includes(type)){
      if(type==='mcq'&&options.length!==4)errors.push('MCQ questions require exactly four options.');
      if(type==='true_false'&&options.length!==2)errors.push('True / False requires two options.');
      if(!options.length)errors.push('Answer options are required.');
      const text=options.map(item=>String(item.text||'').trim().toLowerCase());if(text.some(value=>!value))errors.push('Options cannot be empty.');if(new Set(text).size!==text.length)errors.push('Duplicate options are not allowed.');
      const correct=options.filter(item=>item.isCorrect).length;if(type==='multiple_correct'&&correct<2)errors.push('Multiple Correct requires at least two correct answers.');else if(type!=='multiple_correct'&&correct!==1)errors.push('Select exactly one correct answer.');
    }else if(!String(input.correctText||'').trim())errors.push('A correct answer is required.');
    if(type==='image_based'&&input.imageUrl&&!/^(https?:\/\/|data:image\/)/i.test(input.imageUrl))errors.push('Image URL is invalid.');
    return{valid:errors.length===0,errors};
  }
  function normalizedQuestion(quiz,input,id){
    const stamp=now();return{id:id||uid('question'),quizId:quiz.id,projectId:quiz.projectId,lessonDraftId:quiz.lessonDraftId,type:input.type,prompt:String(input.prompt||'').trim(),correctText:String(input.correctText||'').trim(),explanation:String(input.explanation||''),wrongAnswerExplanation:String(input.wrongAnswerExplanation||''),hint:String(input.hint||''),memoryTrick:String(input.memoryTrick||''),referenceSectionId:input.referenceSectionId||undefined,imageUrl:String(input.imageUrl||''),mapConfig:input.mapConfig||undefined,timelineConfig:input.timelineConfig||undefined,answerConfig:input.answerConfig||undefined,difficulty:input.difficulty,bloomLevel:input.bloomLevel,marks:Number(input.marks),negativeMarks:Number(input.negativeMarks),timeLimitSeconds:Number(input.timeLimitSeconds),difficultyWeight:Number(input.difficultyWeight),tags:[...new Set((input.tags||[]).map(tag=>String(tag).trim()).filter(Boolean))],origin:input.origin||'creator_added',status:input.status||'draft',sortOrder:Number.isFinite(input.sortOrder)?input.sortOrder:questionsFor(quiz.id).length,createdAt:input.createdAt||stamp,updatedAt:stamp};}
  function saveOptions(data,questionId,options){data.quizOptions=data.quizOptions.filter(item=>item.questionId!==questionId);options.forEach((option,index)=>data.quizOptions.push({id:option.id||uid('option'),questionId,text:String(option.text||'').trim(),isCorrect:Boolean(option.isCorrect),explanation:String(option.explanation||''),sortOrder:index}));}
  function addQuestion(projectId,input,options,createdBy){
    const data=snapshot(),quiz=data.quizzes.find(item=>item.projectId===projectId);if(!quiz)throw new Error('Create the quiz first.');
    const check=validateQuestion(input,options);if(!check.valid)throw new Error(check.errors.join(' '));
    const question=normalizedQuestion(quiz,input);data.quizQuestions.push(question);saveOptions(data,question.id,options);quiz.updatedAt=now();saveVersion(data,quiz,input.origin==='curio_suggested'?'ai_generation':'question_edit',createdBy);store().write(data);return question;
  }
  function importQuestions(projectId,items,createdBy){
    const data=snapshot(),quiz=data.quizzes.find(item=>item.projectId===projectId);if(!quiz)throw new Error('Create the quiz first.');
    const prepared=items.map((item,index)=>{const input={...item,origin:'curio_suggested',status:item.needsVerification?'needs_verification':'draft',sortOrder:data.quizQuestions.filter(q=>q.quizId===quiz.id&&!q.deletedAt).length+index,tags:Array.isArray(item.tags)?item.tags:[],marks:Number(item.marks||1),negativeMarks:Number(item.negativeMarks||0),timeLimitSeconds:Number(item.timeLimitSeconds||0),difficultyWeight:Number(item.difficultyWeight||1),difficulty:item.difficulty||'medium',bloomLevel:item.bloomLevel||'understand'},options=Array.isArray(item.options)?item.options:[];const check=validateQuestion(input,options);if(!check.valid)throw new Error(`Question ${index+1}: ${check.errors.join(' ')}`);return{input,options};});
    prepared.forEach(({input,options})=>{const question=normalizedQuestion(quiz,input);data.quizQuestions.push(question);saveOptions(data,question.id,options);});quiz.updatedAt=now();saveVersion(data,quiz,'ai_generation',createdBy);store().write(data);return prepared.length;
  }
  function updateQuestion(questionId,input,options,createdBy){
    const data=snapshot(),question=data.quizQuestions.find(item=>item.id===questionId&&!item.deletedAt);if(!question)throw new Error('Question not found.');
    const check=validateQuestion(input,options);if(!check.valid)throw new Error(check.errors.join(' '));
    const quiz=data.quizzes.find(item=>item.id===question.quizId),next=normalizedQuestion(quiz,{...input,sortOrder:question.sortOrder,createdAt:question.createdAt,origin:question.origin==='curio_suggested'?'hybrid':question.origin},question.id);Object.assign(question,next);saveOptions(data,question.id,options);quiz.updatedAt=now();saveVersion(data,quiz,'question_edit',createdBy);store().write(data);return question;
  }
  function deleteQuestion(questionId,createdBy){const data=snapshot(),question=data.quizQuestions.find(item=>item.id===questionId&&!item.deletedAt);if(!question)return;question.deletedAt=now();question.status='rejected';const quiz=data.quizzes.find(item=>item.id===question.quizId);saveVersion(data,quiz,'question_deleted',createdBy);store().write(data);}
  function duplicateQuestion(questionId,createdBy){const data=snapshot(),source=data.quizQuestions.find(item=>item.id===questionId&&!item.deletedAt);if(!source)throw new Error('Question not found.');const quiz=data.quizzes.find(item=>item.id===source.quizId),copy=normalizedQuestion(quiz,{...clone(source),prompt:`${source.prompt} (copy)`,origin:'creator_added'},uid('question'));data.quizQuestions.push(copy);saveOptions(data,copy.id,data.quizOptions.filter(item=>item.questionId===source.id).map(item=>({...item,id:undefined,questionId:copy.id})));saveVersion(data,quiz,'question_edit',createdBy);store().write(data);return copy;}
  function moveQuestion(questionId,direction,createdBy){const data=snapshot(),question=data.quizQuestions.find(item=>item.id===questionId&&!item.deletedAt);if(!question)throw new Error('Question not found.');const list=data.quizQuestions.filter(item=>item.quizId===question.quizId&&!item.deletedAt).sort((a,b)=>a.sortOrder-b.sortOrder),from=list.findIndex(item=>item.id===questionId),to=Math.max(0,Math.min(list.length-1,from+direction));[list[from],list[to]]=[list[to],list[from]];list.forEach((item,index)=>item.sortOrder=index);const quiz=data.quizzes.find(item=>item.id===question.quizId);saveVersion(data,quiz,'reordered',createdBy);store().write(data);}
  function saveVersion(data,quiz,kind,createdBy){const versions=data.quizVersions.filter(item=>item.quizId===quiz.id),questions=data.quizQuestions.filter(item=>item.quizId===quiz.id),ids=new Set(questions.map(item=>item.id));data.quizVersions.push({id:uid('quiz_version'),quizId:quiz.id,version:versions.length+1,kind,quiz:clone(quiz),questions:clone(questions),options:clone(data.quizOptions.filter(item=>ids.has(item.questionId))),createdAt:now(),createdBy});}
  function versionsFor(quizId){return snapshot().quizVersions.filter(item=>item.quizId===quizId).sort((a,b)=>b.version-a.version);}
  function restoreVersion(quizId,versionId,createdBy){const data=snapshot(),quiz=data.quizzes.find(item=>item.id===quizId),version=data.quizVersions.find(item=>item.id===versionId&&item.quizId===quizId);if(!quiz||!version)throw new Error('Quiz version not found.');const currentIds=new Set(data.quizQuestions.filter(item=>item.quizId===quizId).map(item=>item.id));Object.assign(quiz,clone(version.quiz),{id:quiz.id,updatedAt:now()});data.quizQuestions=data.quizQuestions.filter(item=>item.quizId!==quizId).concat(clone(version.questions));data.quizOptions=data.quizOptions.filter(item=>!currentIds.has(item.questionId)).concat(clone(version.options));saveVersion(data,quiz,'restored',createdBy);store().write(data);}
  function updateQuiz(projectId,changes){const data=snapshot(),quiz=data.quizzes.find(item=>item.projectId===projectId);if(!quiz)throw new Error('Quiz not found.');if(changes.mode&&!MODES.has(changes.mode))throw new Error('Invalid quiz mode.');Object.assign(quiz,changes,{id:quiz.id,projectId:quiz.projectId,updatedAt:now()});store().write(data);return quiz;}
  function searchLibrary(query,tags=[]){const q=String(query||'').toLowerCase(),required=new Set(tags);return snapshot().quizQuestions.filter(item=>!item.deletedAt&&(!q||`${item.prompt} ${item.tags.join(' ')}`.toLowerCase().includes(q))&&(!required.size||[...required].every(tag=>item.tags.includes(tag)))).slice(0,100);}
  function reuseQuestion(projectId,questionId,createdBy){const data=snapshot(),source=data.quizQuestions.find(item=>item.id===questionId&&!item.deletedAt),quiz=data.quizzes.find(item=>item.projectId===projectId);if(!source||!quiz)throw new Error('Question or target quiz not found.');const copy=normalizedQuestion(quiz,{...clone(source),origin:'creator_added'},uid('question'));data.quizQuestions.push(copy);saveOptions(data,copy.id,data.quizOptions.filter(item=>item.questionId===source.id).map(item=>({...item,id:undefined})));saveVersion(data,quiz,'question_edit',createdBy);store().write(data);return copy;}
  window.TeachCurioQuiz={TYPES:[...TYPES],quizFor,questionsFor,optionsFor,createQuiz,validateQuestion,addQuestion,importQuestions,updateQuestion,deleteQuestion,duplicateQuestion,moveQuestion,updateQuiz,versionsFor,restoreVersion,searchLibrary,reuseQuestion};
})();
