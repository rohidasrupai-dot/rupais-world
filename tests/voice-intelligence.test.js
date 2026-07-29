const assert=require('assert'),fs=require('fs'),vm=require('vm'),{webcrypto}=require('crypto'),{performance}=require('perf_hooks');
class Storage{constructor(){this.d={}}getItem(k){return this.d[k]??null}setItem(k,v){this.d[k]=String(v)}removeItem(k){delete this.d[k]}}
class FakeRecognition{
  static last=null;
  constructor(){FakeRecognition.last=this;this.lang='en-IN';this.interimResults=true;this.continuous=false}
  start(){this.started=true}
  stop(){this.stopped=true}
  abort(){this.aborted=true}
  result(transcript,isFinal=false,confidence){const item={0:{transcript,confidence},isFinal,length:1};this.onresult?.({resultIndex:0,results:[item]})}
  end(){this.onend?.()}
  error(error){this.onerror?.({error})}
}
class FakeUtterance{constructor(text){this.text=text;this.lang='';this.rate=1;this.pitch=1}}
class FakeSynthesis{
  constructor(){this.speaking=false;this.paused=false;this.current=null;this.spoken=[];this.voices=[{voiceURI:'voice-en',name:'English Test Voice',lang:'en-IN'},{voiceURI:'voice-hi',name:'Hindi Test Voice',lang:'hi-IN'}]}
  getVoices(){return this.voices}
  speak(u){this.current=u;this.spoken.push(u.text);this.speaking=true;u.onstart?.()}
  pause(){this.paused=true}
  resume(){this.paused=false}
  cancel(){this.speaking=false;this.paused=false;this.current=null}
  finish(){const u=this.current;this.current=null;this.speaking=false;u?.onend?.()}
}
const localStorage=new Storage(),navigator={onLine:true,mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},synth=new FakeSynthesis();
const location={hostname:'127.0.0.1'},window={localStorage,navigator,crypto:webcrypto,performance,location,isSecureContext:true,speechSynthesis:synth,SpeechRecognition:FakeRecognition,SpeechSynthesisUtterance:FakeUtterance,dispatchEvent(){},addEventListener(){}};
const context=vm.createContext({window,localStorage,navigator,location,crypto:webcrypto,performance,structuredClone,TextEncoder,TextDecoder,URL,URLSearchParams,console,setTimeout,clearTimeout,setInterval,clearInterval,CustomEvent:function(){},SpeechSynthesisUtterance:FakeUtterance});
for(const file of ['studio/store.js','studio/ai-provider-service.js','studio/curio-conversation-service.js','studio/voice-intelligence-service.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const Store=window.TeachCurioStore,AI=window.RupaiAI,C=window.TeachCurioConversation,V=window.TeachCurioVoice;
const actor={userId:'student_voice',permissions:['voice.input.use','voice.output.use','voice.transcript.read.own','voice.session.read.own']};
function seed(){
  const s=Store.read();s.projects.push({id:'project_voice',title:'Water Cycle',subject:'Science'});s.lessonDrafts.push({id:'lesson_voice',projectId:'project_voice',status:'approved',approvedVersionId:'v1',versions:[{id:'v1',sections:[{id:'section1',title:'Water Cycle',paragraph:{english:'The water cycle includes evaporation, condensation, precipitation and collection.',sourceReferences:[{sourceId:'source1'}]}}]}]});
  s.visualAccessibilityDescriptions||(s.visualAccessibilityDescriptions=[]);s.visualAssets.push({id:'visual1',originProjectId:'project_voice',title:'Water Cycle Diagram',reviewStatus:'approved',altText:'A labelled water cycle diagram.',description:'Water moves through evaporation, condensation, precipitation and collection.'});s.visualAccessibilityDescriptions.push({id:'desc1',assetId:'visual1',shortAltText:'A labelled water cycle diagram.',detailedDescription:'A detailed approved description showing evaporation, condensation, precipitation and collection.'});Store.write(s);
}
(async()=>{
  seed();
  const conversation=C.createConversation({userId:actor.userId,projectId:'project_voice',preferredLanguage:'english',ageGroup:'unknown'}),voice=V.createSession({userId:actor.userId,conversationId:conversation.id,inputLanguage:'english',outputLanguage:'english'},actor);
  let cap=V.capabilities();assert.equal(cap.secureContext,true);assert.equal(cap.browserRecognition,true);assert.equal(cap.browserSynthesis,true);assert.equal(cap.providerSpeechToText,false);assert.equal(cap.providerTextToSpeech,false);
  assert.equal((await V.requestMicrophone(voice.id,actor.userId,actor)).state,'permission_denied');
  V.consent(actor.userId,{type:'microphone',granted:true,remember:true,dataCategories:['microphone_audio_during_active_listening','confirmed_transcript']},actor);
  assert.equal((await V.requestMicrophone(voice.id,actor.userId,actor)).state,'granted');
  const events=[];let listening=await V.startListening(voice.id,actor.userId,actor,{onTranscript:e=>events.push(e),onState:s=>events.push({state:s})});assert.equal(listening.state,'listening');
  FakeRecognition.last.result('What is the',false);FakeRecognition.last.result('What is the water cycle?',true);FakeRecognition.last.end();
  const transcript=V.latestTranscript(voice.id,actor.userId);assert.equal(transcript.state,'final');assert.equal(transcript.confidence,null);assert.ok(events.some(x=>x.partial==='What is the'));assert.ok(events.some(x=>x.final.includes('water cycle')));
  const edited=V.editTranscript(transcript.id,actor.userId,'Explain the water cycle.',actor);assert.equal(edited.edited,true);assert.equal(C.getConversation(conversation.id,actor.userId).messages.length,0);
  const confirmed=await V.confirmTranscript(transcript.id,actor.userId,actor);assert.equal(confirmed.transcript.state,'confirmed');assert.ok(confirmed.transcript.canonicalMessageId);assert.ok(C.getConversation(conversation.id,actor.userId).messages.some(x=>x.role==='student'&&x.content==='Explain the water cycle.'));
  const cancelStart=await V.startListening(voice.id,actor.userId,actor);assert.equal(cancelStart.state,'listening');assert.equal(V.cancelListening(voice.id,actor.userId,actor).state,'cancelled');assert.equal(FakeRecognition.last.aborted,true);
  const noSpeech=await V.startListening(voice.id,actor.userId,actor);assert.equal(noSpeech.state,'listening');FakeRecognition.last.error('no-speech');assert.equal(V.dashboard(actor.userId,actor).sessions.find(x=>x.id===voice.id).inputState,'no_speech_detected');
  V.savePreference(actor.userId,{inputLanguage:'hindi',outputLanguage:'hindi',autoSend:false,readSummaryOnly:true,stopSpeechWhenTyping:true},actor);assert.equal(V.preference(actor.userId).autoSend,false);assert.equal(V.availableVoices('hindi')[0].id,'voice-hi');
  assert.ok(V.chunks('First sentence. Second sentence. Third sentence.',20).length>1);assert.equal(V.cleanSpeech('Read https://example.com and provider id abc123').includes('abc123'),false);
  let spoken=await V.speak(voice.id,actor.userId,'This is an approved answer. It has another sentence.',actor,{summaryOnly:false,chunkLength:30});assert.equal(spoken.state,'speaking');assert.equal(spoken.audioReference,null);assert.equal(V.pauseSpeech(voice.id,actor.userId,actor),true);assert.equal(V.resumeSpeech(voice.id,actor.userId,actor),true);while(synth.current)synth.finish();assert.equal(V.dashboard(actor.userId,actor).sessions.find(x=>x.id===voice.id).playbackState,'completed');
  spoken=await V.speak(voice.id,actor.userId,'Replay this approved answer.',actor);assert.equal(V.stopSpeaking(voice.id,actor.userId,actor),true);assert.equal(synth.speaking,false);
  const visual=V.visualDescription('project_voice','visual1','detailed');assert.equal(visual.available,true);assert.match(visual.approvedText,/evaporation/);
  const runtimeState=Store.read();runtimeState.curioLearningSessions.push({id:'runtime1',projectId:'project_voice',teachingPlanId:'plan1',currentStepId:'step1'});runtimeState.curioTeachingSteps.push({id:'step1',planId:'plan1',order:0,stepType:'main_explanation'});runtimeState.curioSessionStepStates.push({id:'state1',sessionId:'runtime1',teachingStepId:'step1',state:'active'});Store.write(runtimeState);assert.equal(V.spokenRuntimeAnswer({transcript:'Evaporation changes water to vapour.'}).requiresConfirmation,true);
  const quiz=Store.read();quiz.quizzes.push({id:'quiz1',projectId:'project_voice'});quiz.quizQuestions.push({id:'q1',quizId:'quiz1',projectId:'project_voice',prompt:'What causes evaporation?'});quiz.quizOptions.push({id:'o1',questionId:'q1',text:'Heat',isCorrect:true});Store.write(quiz);assert.equal(V.quizRead('project_voice','q1').hiddenFieldsExcluded.includes('correct'),true);assert.equal(V.quizAnswer('Heat').autoSubmitted,false);
  const other={userId:'other',permissions:actor.permissions};assert.throws(()=>V.dashboard(actor.userId,other),/own voice data/);
  const childConversation=C.createConversation({userId:actor.userId,projectId:'project_voice',ageGroup:'child'}),child=V.createSession({userId:actor.userId,conversationId:childConversation.id},actor);assert.equal((await V.requestMicrophone(child.id,actor.userId,actor)).state,'permission_denied');
  navigator.onLine=false;V._setAdapters({recognitionFactory:null});window.SpeechRecognition=null;cap=V.capabilities();assert.equal(cap.online,false);assert.equal(V.route('speech_to_text',{providerAllowed:false}).mode,'text_only');navigator.onLine=true;window.SpeechRecognition=FakeRecognition;V._setAdapters({recognitionFactory:FakeRecognition});
  AI.configureProvider('openai',{configured:true,status:'active',availability:'available',credentialReference:'server:voice',serverEndpoint:'/api/voice'});
  AI.registerModel({id:'voice-model',name:'Voice Model',providerId:'openai',status:'available',voiceSupport:true,capabilities:['speech_recognition','voice_generation'],voiceFeatures:['stt','tts'],supportedLanguages:['english','hindi'],supportedAudioFormats:['audio/webm'],maximumAudioDurationSeconds:60,cancellationSupport:true});
  AI.registerAdapter('openai',{id:'openai',configured:true,health:async()=>({available:true}),execute:async request=>request.capability==='speech_recognition'?{content:{transcript:'Provider transcript',detectedLanguage:'english',confidence:.91,duration:2},usage:{totalTokens:2}}:{content:{audioReference:'server://temporary-audio/1',duration:3},usage:{totalTokens:5}}});
  const providerConversation=C.createConversation({userId:actor.userId,projectId:'project_voice'}),providerSession=V.createSession({userId:actor.userId,conversationId:providerConversation.id,mode:'provider'},actor);V.consent(actor.userId,{type:'microphone',granted:true,childAccount:false},actor);
  assert.equal((await V.startListening(providerSession.id,actor.userId,actor,{audioReference:'server://temporary-audio/input',costApproved:false})).state,'approval_required');
  const providerStt=await V.startListening(providerSession.id,actor.userId,actor,{audioReference:'server://temporary-audio/input',costApproved:true});assert.equal(providerStt.state,'transcript_ready');assert.equal(providerStt.transcript.confidence,.91);
  const providerTts=await V.speak(providerSession.id,actor.userId,'Approved provider speech text.',actor,{costApproved:true});assert.equal(providerTts.state,'ready');assert.equal(providerTts.audioReference,'server://temporary-audio/1');
  const sync=V.syncPayload(actor.userId);assert.equal(sync.rawAudio.length,0);assert.ok(sync.confirmedTranscripts.length);assert.equal(V.dashboard(actor.userId,actor).retention[0].state,'not_stored');
  assert.equal(JSON.stringify(Store.read()).includes('student@example.com'),false);assert.equal(/sk-[A-Za-z0-9]{20,}/.test(JSON.stringify(Store.read())),false);
  V.cleanup(providerSession.id,actor.userId,actor,'sign_out');assert.equal(V.dashboard(actor.userId,actor).sessions.find(x=>x.id===providerSession.id).status,'ended');
  console.log('Voice intelligence tests passed: browser/provider/text-only modes, consent, permission, listening, partial/final/edit/confirm, English/Hindi/Hinglish settings, playback controls, chunking, turn-taking, child safety, cost authorization, retention, sync minimization, Ask Curio, quiz and visual integration.');
})().catch(error=>{console.error(error);process.exitCode=1});
