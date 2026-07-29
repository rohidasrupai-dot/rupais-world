(function(){
  'use strict';
  const C=TeachCurioConversation,S=TeachCurioStore,V=TeachCurioVoice,session=window.__curioSession,$=q=>document.querySelector(q);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=new URLSearchParams(location.search),actor=()=>({userId:session.userId,permissions:session.permissions||[]});
  let conversationId=params.get('conversation'),busy=false,activeExecution=null,voiceSessionId=null,activeTranscriptId=null,lastSpokenText='',timer=null,timerStarted=0;
  const labels=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
  const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)};
  const mapLanguage=v=>v==='hindi_foundation'?'hindi':String(v).includes('hinglish')?'hinglish':'english';

  function setup(){
    const data=S.read(),projects=data.projects.filter(x=>!x.deletedAt);
    $('#project').innerHTML='<option value="">No lesson selected</option>'+projects.map(x=>`<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');
    if(params.get('project'))$('#project').value=params.get('project');
    $('#mode').innerHTML=C.MODES.map(x=>`<option value="${x}">${labels(x)}</option>`).join('');
    $('#language').innerHTML=C.LANGUAGES.map(x=>`<option value="${x}">${labels(x)}</option>`).join('');
    $('#level').innerHTML=C.LEVELS.map(x=>`<option value="${x}">${labels(x)}</option>`).join('');
    $('#mode').value='solve_doubt';$('#level').value='standard';
    const profile=data.studentLearningProfiles?.find(x=>x.studentId===session.userId);
    if(profile){$('#language').value=C.LANGUAGES.includes(profile.preferredLanguage)?profile.preferredLanguage:'english';$('#level').value=profile.detailLevel==='detailed'?'detailed':'standard';document.body.classList.toggle('large-text',profile.accessibility?.largeText);document.body.classList.toggle('high-contrast',profile.accessibility?.highContrast)}
    const noProvider=RupaiAI.dashboard().noProvider;
    $('#providerNotice').textContent=noProvider?"AI teaching is not configured. Curio can still help using approved Rupai's World lessons and learning tools.":'A configured provider may be used only after safety, privacy, grounding and budget checks.';
    setupVoice();bind();refreshList();if(conversationId)load();else newConversation();
  }
  function newConversation(){
    const data=S.read(),identity=RupaiAuth.getCurrentUser?.(),profile=identity?.profile||data.profiles?.find(x=>x.userId===session.userId);
    if(voiceSessionId)V.cleanup(voiceSessionId,session.userId,actor(),'new_conversation');
    const c=C.createConversation({userId:session.userId,projectId:$('#project').value||null,teachingMode:$('#mode').value,preferredLanguage:$('#language').value,explanationLevel:$('#level').value,ageGroup:profile?.ageGroup||'unknown',memoryPermissionState:'not_asked'});
    conversationId=c.id;history.replaceState(null,'',`ask-curio.html?conversation=${c.id}`);refreshList();load();
  }
  function refreshList(){
    const rows=C.listConversations(session.userId);
    $('#conversationList').innerHTML=rows.map(x=>`<button class="conversation-item ${x.id===conversationId?'active':''}" data-conversation="${x.id}">${esc(x.currentTeachingGoal||'Learning conversation')}<small>${labels(x.teachingMode)} · ${new Date(x.lastActiveAt).toLocaleDateString()}</small></button>`).join('')||'<p>No conversations yet.</p>';
    document.querySelectorAll('[data-conversation]').forEach(b=>b.onclick=()=>{if(voiceSessionId)V.cleanup(voiceSessionId,session.userId,actor(),'conversation_change');conversationId=b.dataset.conversation;history.replaceState(null,'',`ask-curio.html?conversation=${conversationId}`);load();refreshList()});
  }
  function load(){
    const view=C.getConversation(conversationId,session.userId),c=view.conversation;
    $('#project').value=c.projectId||'';$('#mode').value=c.teachingMode;$('#language').value=c.preferredLanguage;$('#level').value=c.explanationLevel;$('#contextConsent').checked=c.contextSharingAllowed;
    ensureVoiceSession(c);renderMessages(view.messages);renderSuggestions();
  }
  function renderSuggestions(){
    const q=C.suggestedQuestions($('#project').value);$('#suggestions').innerHTML=q.map(x=>`<button type="button">${esc(x)}</button>`).join('');
    $('#suggestions').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{$('#question').value=q[i];$('#question').focus()});
  }
  function renderMessages(messages){
    $('#messages').innerHTML=messages.length?messages.map(message).join(''):'<div class="message"><h3>Curio</h3><p>Ask an educational question. I will prefer approved lesson content and show where the answer came from.</p></div>';
    $('#messages').scrollTop=$('#messages').scrollHeight;
    document.querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>{$('#reportMessage').value=b.dataset.report;$('#reportDialog').showModal()});
    document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speakMessage(b.dataset.speak,b.dataset.text));
  }
  function message(m){
    const structured=m.structuredContent||{},visual=structured.suggestedVisual;
    return`<article class="message ${m.role==='student'?'student':'curio'}"><h3>${m.role==='student'?'You':'Curio'}</h3><p>${esc(m.content)}</p>${structured.followUpQuestion?`<p class="follow-up">${esc(structured.followUpQuestion)}</p>`:''}${visual?`<div class="visual-card"><strong>${esc(visual.title)}</strong><p>${esc(visual.reason)}</p></div>`:''}${m.role==='curio'?`<div class="trust"><span>${esc(m.trustLabel||'Learning support')}</span>${m.provider?.name?`<span>Provider: ${esc(m.provider.name)}</span>`:''}${m.sourceReferences?.length?`<span>${m.sourceReferences.length} source reference(s)</span>`:''}</div><div class="message-actions"><button data-speak="${m.id}" data-text="${esc(m.content)}">Speak answer</button><button data-report="${m.id}">Report issue</button></div>`:''}</article>`;
  }
  async function submit(e){
    e.preventDefault();if(busy)return;busy=true;activeExecution=null;$('#messages').setAttribute('aria-busy','true');$('#progress').textContent='Preparing · Retrieving lesson context · Reviewing safety';e.submitter.disabled=true;$('#stop').disabled=true;const question=$('#question').value;
    try{
      C.updateConversation(conversationId,session.userId,{teachingMode:$('#mode').value,preferredLanguage:$('#language').value,explanationLevel:$('#level').value,contextSharingAllowed:$('#contextConsent').checked});
      const result=await C.ask(conversationId,session.userId,question,{streaming:true,onExecution:id=>{activeExecution=id;$('#stop').disabled=!id;$('#progress').textContent='Waiting for provider · Generating'},onChunk:event=>{$('#progress').textContent=`Generating · ${event.content.length} confirmed characters`}});
      $('#question').value='';load();$('#progress').textContent=result.state==='complete'?'Complete':labels(result.state);
      const pref=V.preference(session.userId);if(pref.autoRead&&result.message?.content)speakMessage(result.message.id,result.message.content);
    }catch(error){$('#progress').textContent=`Failed: ${error.message}`}
    finally{busy=false;activeExecution=null;$('#stop').disabled=true;e.submitter.disabled=false;$('#messages').setAttribute('aria-busy','false');refreshList()}
  }
  function setupVoice(){
    const cap=V.capabilities(),premium=cap.providerSpeechToText||cap.providerTextToSpeech;
    $('#voiceNotice').textContent=premium?'Configured premium voice capabilities may be used only after consent, capability, privacy and cost checks.':'Premium voice services are not configured. Browser voice features may still be available on this device.';
    const p=V.preference(session.userId);$('#startListening').disabled=!p.inputEnabled||(!cap.browserRecognition&&!cap.providerSpeechToText);fillSettings(p);
    if(!cap.browserRecognition)$('#voiceState').textContent='Browser recognition unavailable — keyboard input remains available.';
    if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>fillVoiceChoices(V.preference(session.userId).outputLanguage);
  }
  function ensureVoiceSession(c){
    const existing=V.dashboard(session.userId,actor()).sessions.filter(x=>x.conversationId===c.id&&x.status==='active').at(-1);
    voiceSessionId=existing?.id||V.createSession({userId:session.userId,conversationId:c.id,inputLanguage:mapLanguage(c.preferredLanguage),outputLanguage:mapLanguage(c.preferredLanguage),mode:'browser'},actor()).id;
  }
  function voiceState(value){
    $('#voiceState').textContent=labels(value);const listening=['requesting_permission','listening','speech_detected','processing_transcript'].includes(value);
    $('.voice-state').classList.toggle('active',listening);document.body.classList.toggle('microphone-live',listening);$('#startListening').disabled=listening;$('#stopListening').disabled=!listening;$('#cancelListening').disabled=!listening;if(listening)startTimer();else stopTimer();
  }
  function startTimer(){if(timer)return;timerStarted=Date.now();timer=setInterval(()=>{const seconds=Math.floor((Date.now()-timerStarted)/1000);$('#voiceTimer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`},250)}
  function stopTimer(){clearInterval(timer);timer=null}
  async function beginListening(){
    if(!voiceSessionId)return;const permission=V.latestConsent(session.userId);if(!permission?.granted){$('#microphoneConsent').showModal();return}
    const grant=await V.requestMicrophone(voiceSessionId,session.userId,actor());if(grant.state!=='granted'){voiceState(grant.state);return}
    $('#partialTranscript').textContent='';$('#transcriptReview').hidden=true;
    const result=await V.startListening(voiceSessionId,session.userId,actor(),{maximumDurationMs:60000,silenceTimeoutMs:10000,partialResults:true,onTranscript:event=>{$('#partialTranscript').textContent=event.partial||'';if(event.final)voiceState('processing_transcript')},onState:value=>{voiceState(value);if(value==='transcript_ready')showTranscript()}});
    voiceState(result.state);
  }
  function showTranscript(){
    const t=V.latestTranscript(voiceSessionId,session.userId);if(!t)return;activeTranscriptId=t.id;$('#partialTranscript').textContent='';$('#reviewTranscript').value=t.text;$('#transcriptReview').hidden=false;voiceState('transcript_ready');const pref=V.preference(session.userId);if(pref.autoSend&&pref.inputLanguage!=='hinglish')sendReviewedTranscript();else $('#reviewTranscript').focus();
  }
  async function sendReviewedTranscript(){
    if(!activeTranscriptId)return;V.editTranscript(activeTranscriptId,session.userId,$('#reviewTranscript').value,actor());voiceState('processing_transcript');
    try{const out=await V.confirmTranscript(activeTranscriptId,session.userId,actor(),{streaming:false});$('#transcriptReview').hidden=true;activeTranscriptId=null;load();voiceState('stopped');$('#progress').textContent=labels(out.result.state);const pref=V.preference(session.userId);if(pref.autoRead&&out.result.message?.content)speakMessage(out.result.message.id,out.result.message.content)}
    catch(error){voiceState('failed');$('#progress').textContent=error.message}
  }
  async function speakMessage(messageId,value){
    if(!voiceSessionId)return;lastSpokenText=value;const pref=V.preference(session.userId);if(!pref.spokenAnswersEnabled){toast('Spoken answers are disabled in Voice settings.');return}
    const out=await V.speak(voiceSessionId,session.userId,value,actor(),{messageId,voiceId:pref.voiceId,rate:pref.speakingRate,pitch:pref.pitch,summaryOnly:pref.readSummaryOnly,reduceDetail:pref.reduceSpokenDetail});playbackState(out.state);if(out.state==='unsupported')toast('Speech synthesis is unavailable. The full text remains visible.');
  }
  function playbackState(value){
    $('#pauseSpeech').disabled=value!=='speaking';$('#resumeSpeech').disabled=value!=='paused';const active=['speaking','paused','resumed','ready'].includes(value);$('#stopSpeech').disabled=!active;$('#previousSpeech').disabled=!active;$('#nextSpeech').disabled=!active;$('#replaySpeech').disabled=!lastSpokenText;$('#voiceState').textContent=`Speech: ${labels(value)}`;
  }
  function fillVoiceChoices(language){
    const rows=V.availableVoices(language),select=$('#voiceChoice'),current=select.value;select.innerHTML='<option value="">Device default</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.displayName)} · ${esc(x.locale)}</option>`).join('');select.value=rows.some(x=>x.id===current)?current:'';
  }
  function fillSettings(p){
    $('#voiceInputEnabled').checked=p.inputEnabled;$('#spokenAnswersEnabled').checked=p.spokenAnswersEnabled;$('#voiceInputLanguage').value=p.inputLanguage;$('#voiceOutputLanguage').value=p.outputLanguage;$('#speakingRate').value=p.speakingRate;$('#speakingPitch').value=p.pitch;$('#autoReadAnswers').checked=p.autoRead;$('#autoSendTranscript').checked=p.autoSend;$('#readSummaryOnly').checked=p.readSummaryOnly;$('#reduceSpokenDetail').checked=p.reduceSpokenDetail;$('#stopSpeechWhenTyping').checked=p.stopSpeechWhenTyping;$('#transcriptAlwaysVisible').checked=p.transcriptAlwaysVisible;fillVoiceChoices(p.outputLanguage);$('#voiceChoice').value=p.voiceId||'';
  }
  function bind(){
    $('#newConversation').onclick=newConversation;$('#composer').onsubmit=submit;
    ['project','mode','language','level'].forEach(id=>$('#'+id).onchange=()=>{if(conversationId)C.updateConversation(conversationId,session.userId,{projectId:$('#project').value,teachingMode:$('#mode').value,preferredLanguage:$('#language').value,explanationLevel:$('#level').value});renderSuggestions()});
    $('#contextConsent').onchange=()=>{C.updateConversation(conversationId,session.userId,{contextSharingAllowed:$('#contextConsent').checked});C.setConsent(session.userId,{type:'provider_context',granted:$('#contextConsent').checked,dataCategories:['learning_preferences','concept_mastery']})};
    $('#openLesson').onclick=()=>{$('#project').value?location.href=`lesson.html?project=${encodeURIComponent($('#project').value)}`:toast('Choose a lesson first.')};$('#launchQuiz').onclick=()=>{const x=C.quizLink($('#project').value);x.available?location.href=x.url:toast(x.message)};$('#findVisual').onclick=()=>{const x=C.visualRecommendation($('#project').value,$('#question').value);toast(x.available?`Approved visual: ${x.asset.title}`:(x.task?.message||x.message||'No approved visual matched.'))};$('#summarize').onclick=()=>{const x=C.summarize(conversationId,session.userId);toast(`Summary saved: ${x.questionsAnswered} answer(s).`)};
    $('#stop').onclick=()=>{if(activeExecution&&RupaiAI.cancel(activeExecution))$('#progress').textContent='Cancelled — partial text was not marked complete.'};
    $('#reportForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return;C.reportCorrection({conversationId,userId:session.userId,messageId:$('#reportMessage').value,category:$('#reportCategory').value,details:$('#reportDetails').value});toast('Report added to creator review.');$('#reportDetails').value=''};
    $('#startListening').onclick=beginListening;$('#stopListening').onclick=()=>{V.stopListening(voiceSessionId,session.userId,actor());voiceState('stopped')};$('#cancelListening').onclick=()=>{V.cancelListening(voiceSessionId,session.userId,actor());$('#partialTranscript').textContent='';$('#transcriptReview').hidden=true;voiceState('cancelled')};$('#keyboardFallback').onclick=()=>{$('#question').focus();voiceState('idle')};
    $('#retryTranscript').onclick=()=>{if(activeTranscriptId)V.deleteTranscript(activeTranscriptId,session.userId,actor());activeTranscriptId=null;beginListening()};$('#deleteTranscript').onclick=()=>{if(activeTranscriptId)V.deleteTranscript(activeTranscriptId,session.userId,actor());activeTranscriptId=null;$('#transcriptReview').hidden=true;voiceState('idle')};$('#sendTranscript').onclick=sendReviewedTranscript;
    $('#microphoneConsent').addEventListener('close',async()=>{if($('#microphoneConsent').returnValue==='allow'){const identity=RupaiAuth.getCurrentUser?.(),age=identity?.profile?.ageGroup||'unknown';V.consent(session.userId,{type:'microphone',granted:true,remember:$('#rememberMicrophone').checked,childAccount:['child','minor'].includes(age),dataCategories:['microphone_audio_during_active_listening','confirmed_transcript']},actor());await beginListening()}else V.consent(session.userId,{type:'microphone',granted:false,remember:false},actor())});
    $('#voiceSettings').onclick=()=>{fillSettings(V.preference(session.userId));$('#voiceSettingsDialog').showModal()};$('#voiceOutputLanguage').onchange=()=>fillVoiceChoices($('#voiceOutputLanguage').value);
    $('#voiceSettingsForm').addEventListener('submit',e=>{if(e.submitter?.value!=='save')return;const p=V.savePreference(session.userId,{inputEnabled:$('#voiceInputEnabled').checked,spokenAnswersEnabled:$('#spokenAnswersEnabled').checked,inputLanguage:$('#voiceInputLanguage').value,outputLanguage:$('#voiceOutputLanguage').value,voiceId:$('#voiceChoice').value||null,speakingRate:Number($('#speakingRate').value),pitch:Number($('#speakingPitch').value),autoRead:$('#autoReadAnswers').checked,autoSend:$('#autoSendTranscript').checked,readSummaryOnly:$('#readSummaryOnly').checked,reduceSpokenDetail:$('#reduceSpokenDetail').checked,stopSpeechWhenTyping:$('#stopSpeechWhenTyping').checked,transcriptAlwaysVisible:$('#transcriptAlwaysVisible').checked},actor());$('#startListening').disabled=!p.inputEnabled;toast('Voice settings saved on this device.')});
    $('#pauseSpeech').onclick=()=>playbackState(V.pauseSpeech(voiceSessionId,session.userId,actor())?'paused':'speaking');$('#resumeSpeech').onclick=()=>playbackState(V.resumeSpeech(voiceSessionId,session.userId,actor())?'speaking':'paused');$('#stopSpeech').onclick=()=>{V.stopSpeaking(voiceSessionId,session.userId,actor());playbackState('stopped')};$('#previousSpeech').onclick=()=>V.spokenSection(voiceSessionId,session.userId,'previous',actor());$('#nextSpeech').onclick=()=>V.spokenSection(voiceSessionId,session.userId,'next',actor());$('#replaySpeech').onclick=()=>speakMessage(null,lastSpokenText);
    $('#question').addEventListener('input',()=>{if(voiceSessionId&&V.preference(session.userId).stopSpeechWhenTyping)V.stopSpeaking(voiceSessionId,session.userId,actor(),{reason:'typing'})});
    window.addEventListener('pagehide',()=>{if(voiceSessionId)V.cleanup(voiceSessionId,session.userId,actor(),'route_change')});
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
