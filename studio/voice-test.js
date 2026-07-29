(function(){
  'use strict';
  const V=TeachCurioVoice,C=TeachCurioConversation,session=window.__voiceTestSession,$=q=>document.querySelector(q),actor=()=>({userId:session.userId,permissions:session.permissions||[]});
  let conversationId=null,voiceSessionId=null,lastText='';
  const yes=v=>v?'Available':'Unavailable',label=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
  function setup(){
    const cap=V.capabilities(),conversation=C.createConversation({userId:session.userId,teachingMode:'solve_doubt',preferredLanguage:'english',ageGroup:'unknown'});
    conversationId=conversation.id;voiceSessionId=V.createSession({userId:session.userId,conversationId,inputLanguage:'english',outputLanguage:'english',mode:'browser'},actor()).id;
    $('#capabilities').innerHTML=`<dt>Secure context</dt><dd>${yes(cap.secureContext)}</dd><dt>Microphone API</dt><dd>${yes(cap.microphoneApi)}</dd><dt>Browser recognition</dt><dd>${yes(cap.browserRecognition)}</dd><dt>Browser synthesis</dt><dd>${yes(cap.browserSynthesis)}</dd><dt>Online</dt><dd>${yes(cap.online)}</dd>`;
    $('#providers').innerHTML=`<dt>Speech-to-Text</dt><dd>${yes(cap.providerSpeechToText)}</dd><dt>Text-to-Speech</dt><dd>${yes(cap.providerTextToSpeech)}</dd>`;
    $('#providerNotice').textContent=cap.providerSpeechToText||cap.providerTextToSpeech?'A configured provider exists. Paid execution still requires consent and cost authorisation.':'Premium voice services are not configured. Browser voice features may still be available on this device.';
    $('#overallState').textContent=cap.browserRecognition||cap.browserSynthesis?'Browser fallback available':'Text-only fallback';fillVoices();bind();
  }
  function fillVoices(){const rows=V.availableVoices($('#outputLanguage').value);$('#voice').innerHTML='<option value="">Device default</option>'+rows.map(x=>`<option value="${x.id}">${x.displayName} · ${x.locale}</option>`).join('')}
  function state(v){$('#inputState').textContent=label(v);const active=['listening','speech_detected','processing_transcript'].includes(v);$('#listen').disabled=active;$('#stop').disabled=!active;$('#cancel').disabled=!active}
  async function permission(){V.consent(session.userId,{type:'microphone',granted:$('#consent').checked,remember:false,dataCategories:['microphone_audio_during_active_listening','confirmed_transcript']},actor());const out=await V.requestMicrophone(voiceSessionId,session.userId,actor());state(out.state)}
  async function listen(){if(!$('#consent').checked){state('permission_denied');return}await permission();const out=await V.startListening(voiceSessionId,session.userId,actor(),{maximumDurationMs:Number($('#duration').value),partialResults:true,onTranscript:e=>{$('#partial').textContent=e.partial?`Temporary: ${e.partial}`:''},onState:v=>{state(v);if(v==='transcript_ready'){const t=V.latestTranscript(voiceSessionId,session.userId);$('#transcript').value=t?.text||'';$('#partial').textContent=''}}});state(out.state)}
  async function speak(){lastText=$('#previewText').value;const out=await V.speak(voiceSessionId,session.userId,lastText,actor(),{voiceId:$('#voice').value||null});output(out.state)}
  function output(v){$('#outputState').textContent=label(v);$('#pause').disabled=v!=='speaking';$('#resume').disabled=v!=='paused';$('#stopSpeech').disabled=!['speaking','paused','resumed'].includes(v);$('#replay').disabled=!lastText}
  function bind(){
    $('#permission').onclick=permission;$('#listen').onclick=listen;$('#stop').onclick=()=>{V.stopListening(voiceSessionId,session.userId,actor());state('stopped')};$('#cancel').onclick=()=>{V.cancelListening(voiceSessionId,session.userId,actor());$('#partial').textContent='';state('cancelled')};
    $('#inputLanguage').onchange=()=>V.savePreference(session.userId,{inputLanguage:$('#inputLanguage').value},actor());$('#outputLanguage').onchange=fillVoices;$('#speak').onclick=speak;$('#pause').onclick=()=>{V.pauseSpeech(voiceSessionId,session.userId,actor());output('paused')};$('#resume').onclick=()=>{V.resumeSpeech(voiceSessionId,session.userId,actor());output('speaking')};$('#stopSpeech').onclick=()=>{V.stopSpeaking(voiceSessionId,session.userId,actor());output('stopped')};$('#replay').onclick=speak;window.addEventListener('pagehide',()=>V.cleanup(voiceSessionId,session.userId,actor(),'route_change'));
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
