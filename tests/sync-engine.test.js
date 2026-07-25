const assert=require('assert'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
let raw=null;const localStorage={getItem:k=>k==='rupaiSync:v1'?raw:null,setItem:(k,v)=>{if(k==='rupaiSync:v1')raw=v},removeItem(){}};const navigator={onLine:true};
const window={localStorage,navigator,dispatchEvent(){},addEventListener(){}};
const context=vm.createContext({window,localStorage,navigator,crypto:crypto.webcrypto,CustomEvent:function(){},Blob,console,setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync('studio/sync-service.js','utf8'),context);
const S=window.RupaiSync,userA='user_a',userB='user_b';

(async()=>{
  const a1=S.registerDevice(userA,{label:'A Laptop',type:'laptop'}),a2=S.registerDevice(userA,{label:'A Phone',type:'phone'}),b1=S.registerDevice(userB,{label:'B Tablet',type:'tablet'});
  assert.equal(S.listDevices(userA).length,2);assert.equal(S.listDevices(userB).length,1);
  assert.equal(S.status(userA,a2.id).state,'local_only');

  navigator.onLine=false;
  let profile=S.putRecord({userId:userA,deviceId:a1.id,entityType:'user_profile',recordId:'profile_a',data:{language:'english',theme:'light'},idempotencyKey:'profile-a-create'});
  assert.equal(profile.syncStatus,'offline');
  S.putRecord({userId:userA,deviceId:a1.id,entityType:'study_goal',recordId:'goal_a',data:{title:'SSC'},idempotencyKey:'goal-a'});
  S.putRecord({userId:userB,deviceId:b1.id,entityType:'study_goal',recordId:'goal_b',data:{title:'UPSC'},idempotencyKey:'goal-b'});
  S.deleteRecord({userId:userA,deviceId:a1.id,entityType:'study_goal',recordId:'goal_a',idempotencyKey:'goal-a-delete'});
  assert.equal(S.getRecord(userA,'study_goal','goal_a'),null);
  assert.ok(JSON.parse(raw).queue.length>=3,'queue survives durable storage');
  assert.equal(S.status(userA,a1.id).state,'offline');

  const unavailable=await S.runSync({userId:userA,deviceId:a1.id,authenticated:true});
  assert.equal(unavailable.state,'offline');
  navigator.onLine=true;S.configure({syncEnabled:true,provider:'supabase',retryLimit:4,batchSize:50});
  const providerUnavailable=await S.runSync({userId:userA,deviceId:a1.id,authenticated:true});
  assert.equal(providerUnavailable.state,'provider_unavailable');
  assert.equal(S.status(userA,a1.id).state,'pending_upload');

  let remoteChanges=[],serverVersion=0,failIds=new Set();
  const confirmedProvider={name:'test-confirmed-remote',remote:true,configured:true,
    async health(){return{available:true,remote:true,serverConfirmed:true}},
    async uploadChanges(items){return{results:items.map(item=>failIds.has(item.recordId)?{idempotencyKey:item.idempotencyKey,status:'failed',errorCode:'timeout',classification:'temporary'}:{idempotencyKey:item.idempotencyKey,status:'confirmed',serverConfirmed:true,serverVersion:++serverVersion,revisionToken:`r${serverVersion}`,serverTimestamp:'2026-07-25T10:00:00.000Z'})}},
    async readChangesSince(){const changes=remoteChanges;remoteChanges=[];return{changes,cursor:`c${serverVersion}`,revisionToken:`r${serverVersion}`,serverConfirmed:true}},
    async serverTime(){return{confirmed:true,time:'2026-07-25T10:00:00.000Z'}}
  };
  S.registerProvider('test-remote',confirmedProvider);S.configure({provider:'test-remote'});
  const reconnected=await S.runSync({userId:userA,deviceId:a1.id,authenticated:true});
  assert.ok(reconnected.uploaded>=2);assert.equal(reconnected.serverConfirmed,true);
  assert.ok(S.listRecords(userA,'user_profile')[0].lastSyncedAt);

  S.putRecord({userId:userA,deviceId:a1.id,entityType:'progress_event',recordId:'partial',data:{score:1},idempotencyKey:'partial-once'});
  failIds.add('partial');const partial=await S.runSync({userId:userA,deviceId:a1.id,authenticated:true});
  assert.equal(partial.failed,1);let partialQueue=S._read().queue.find(x=>x.recordId==='partial');assert.equal(partialQueue.status,'retry_scheduled');assert.ok(+new Date(partialQueue.nextRetryAt)>Date.now());
  S.putRecord({userId:userA,deviceId:a1.id,entityType:'progress_event',recordId:'partial',data:{score:2},idempotencyKey:'partial-once'});
  assert.equal(S._read().queue.filter(x=>x.recordId==='partial'&&x.status!=='confirmed').length,1,'idempotent queue compaction');
  failIds.delete('partial');S.retryFailed(userA);const retried=await S.runSync({userId:userA,deviceId:a1.id,authenticated:true});assert.ok(retried.uploaded>=1);

  S.putRecord({userId:userA,deviceId:a1.id,entityType:'user_profile',recordId:'profile_a',data:{theme:'dark'},idempotencyKey:'profile-theme'});
  let state=S._read(),local=state.records.find(x=>x.recordId==='profile_a');
  S._applyRemote(state,userA,a1.id,{...local,data:{language:'hinglish',theme:'light'},serverVersion:99,baseData:{language:'english',theme:'light'},ownerId:userA,userId:userA});
  S._write(state);local=S.getRecord(userA,'user_profile','profile_a');
  assert.equal(local.data.theme,'dark');assert.equal(local.data.language,'hinglish','different fields merged safely');

  S.putRecord({userId:userA,deviceId:a1.id,entityType:'language_preferences',recordId:'lang_conflict',data:{language:'english'},idempotencyKey:'lang-base'});
  state=S._read();let lang=state.records.find(x=>x.recordId==='lang_conflict');lang.baseData={language:'hindi'};lang.syncStatus='pending_upload';
  S._applyRemote(state,userA,a1.id,{...lang,data:{language:'hinglish'},serverVersion:10,ownerId:userA,userId:userA});
  S._write(state);assert.ok(S.listConflicts(userA).some(x=>x.recordId==='lang_conflict'&&x.conflictType==='field_conflict'));

  S.putRecord({userId:userA,deviceId:a1.id,entityType:'concept_memory',recordId:'delete_conflict',data:{title:'Stone Age'},idempotencyKey:'del-base'});
  state=S._read();let del=state.records.find(x=>x.recordId==='delete_conflict');
  S._applyRemote(state,userA,a1.id,{...del,deleted:true,data:del.data,serverVersion:5,ownerId:userA,userId:userA});
  S._write(state);assert.ok(S.listConflicts(userA).some(x=>x.recordId==='delete_conflict'&&x.conflictType==='delete_vs_update'));

  const mastery=S._mergeLearning('mastery',{data:{evidence:[{id:'e1',score:40}]}},{data:{evidence:[{id:'e2',score:80}]}},null);
  assert.equal(mastery.data.score,60);assert.equal(mastery.strategy,'recalculate_from_evidence');
  const history=S._mergeLearning('learning_history',{data:{events:[{id:'h1',createdAt:'2026-07-01T00:00:00Z'},{id:'h2',createdAt:'2026-07-02T00:00:00Z'}]}},{data:{events:[{id:'h2',createdAt:'2026-07-02T00:00:00Z'},{id:'h3',createdAt:'2026-07-03T00:00:00Z'}]}},null);
  assert.equal(history.data.events.length,3);assert.equal(history.data.recalculatedStreak.longest,3);
  const revision=S._mergeLearning('revision_plan',{data:{completedIds:['a'],pendingIds:['b']}},{data:{completedIds:['b'],pendingIds:['c']}},null);
  assert.deepEqual([...revision.data.completedIds].sort(),['a','b']);assert.deepEqual(revision.data.pendingIds,['c']);
  assert.equal(S._mergeLearning('learning_session',{data:{status:'completed'}},{data:{status:'active'}},null).data.status,'completed');
  assert.equal(S._mergeLearning('quiz_attempt',{data:{idempotencyKey:'submit-1'}},{data:{idempotencyKey:'submit-1'}},null).strategy,'deduplicate_submission');

  const migration=S.startMigration(userB,b1.id,'initial',{count:2});assert.equal(migration.status,'review_required');
  const confirmedMigration=S.confirmMigration(userB,migration.id,'use_local');assert.equal(confirmedMigration.status,'pending_sync');
  assert.throws(()=>S.completeMigration(userB,migration.id,false),/Server confirmation/);
  assert.equal(S.completeMigration(userB,migration.id,true).status,'completed');
  assert.throws(()=>S.startMigration(userB,b1.id,'initial',{}),/already completed/);

  const snap=S.createSnapshot(userA,'test_recovery');assert.ok(snap.checksum);
  const backup=S.exportBackup(userA);assert.equal(S.previewBackup(backup).valid,true);
  assert.throws(()=>S.restoreSnapshot(userA,snap.id,false),/Confirmation/);
  assert.equal(S.restoreSnapshot(userA,snap.id,true),true);

  const binary=S.registerBinary({userId:userA,objectKey:'images/map-1.png',contentType:'image/png',size:2048,checksum:'sha256:test',localCacheReference:'blob:local'});
  assert.equal(binary.uploadState,'local_only');assert.equal(binary.serverConfirmed,false);
  assert.equal(S.createExportJob(userA).status,'unavailable');assert.equal(S.createDeletionJob(userA).status,'unavailable');
  assert.equal(S.storageSummary(userA).cloudQuota,null);

  S.renameDevice(userA,a2.id,'A New Phone');assert.equal(S.listDevices(userA).find(x=>x.id===a2.id).label,'A New Phone');
  S.revokeDevice(userA,a2.id);assert.equal(S.listDevices(userA).find(x=>x.id===a2.id).sessionStatus,'revoked');
  const authRequired=await S.runSync({userId:userA,deviceId:a1.id,authenticated:false});assert.equal(authRequired.state,'authentication_required');

  state=S._read();const schemaLocal=state.records.find(x=>x.recordId==='profile_a');schemaLocal.schemaVersion=4;schemaLocal.syncStatus='pending_upload';
  S._applyRemote(state,userA,a1.id,{...schemaLocal,schemaVersion:1,serverVersion:100,ownerId:userA,userId:userA});
  S._write(state);assert.ok(S.listConflicts(userA).some(x=>x.recordId==='profile_a'&&x.conflictType==='unsupported_schema'));

  assert.equal(S.getRecord(userA,'study_goal','goal_b'),null,'user ownership boundaries preserved');
  assert.doesNotMatch(S.exportPending(userA),/passwordHash|authToken|privateKey/i);
  assert.ok(S._read().audit.some(x=>x.action==='sync_started'));assert.ok(S._read().audit.some(x=>x.action==='conflict_detected'));assert.ok(S._read().audit.some(x=>x.action==='device_revoked'));
  console.log('Sync tests passed: 2 users, 3 devices, offline CRUD, durable queue, reconnection, confirmed sync, partial retry, idempotency, conflicts, merges, migrations, recovery, binary metadata, jobs and authorization boundaries.');
})().catch(error=>{console.error(error);process.exitCode=1});
