const assert=require('assert'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
let local={},session={},replaced=null;
const storage=target=>({getItem:key=>Object.hasOwn(target,key)?target[key]:null,setItem:(key,value)=>target[key]=String(value),removeItem:key=>delete target[key]});
const localStorage=storage(local),sessionStorage=storage(session);
const document={addEventListener(){},querySelector(){return null}};
const location={pathname:'/studio/index.html',search:'',replace:value=>replaced=value};
const navigator={onLine:true};
const window={localStorage,sessionStorage,location,navigator,document,dispatchEvent(){}};
const context=vm.createContext({window,localStorage,sessionStorage,location,navigator,document,crypto:crypto.webcrypto,CustomEvent:function(){},TextEncoder,btoa,atob,unescape,encodeURIComponent,Intl,console,setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync('studio/auth.js','utf8'),context);
const A=window.RupaiAuth;

(async()=>{
  assert.equal(A.providerStatus().productionReady,false);
  assert.match(A.providerStatus().message,/stored only on this device/i);
  assert.equal(A.securityContracts().serverAuthorizationRequired,true);
  assert.equal(A.developmentSetupAvailable(),true);

  const owner=await A.bootstrapDevelopmentOwner({displayName:'Local Owner',email:'owner@example.test',password:'correct horse battery staple',role:'super_admin'});
  assert.equal(owner.primaryRole,'super_admin');
  assert.equal(A.developmentSetupAvailable(),false);
  await A.signIn({email:'owner@example.test',password:'correct horse battery staple',remember:true});
  assert.equal(A.hasPermission('users.manage'),true);
  assert.equal(A.routeDecision('studio.access').allowed,true);

  const invitation=A.invite({email:'teacher@example.test',role:'teacher'});
  assert.equal(invitation.status,'created_local');
  assert.match(invitation.message,/No email was sent/i);
  let identity=JSON.parse(localStorage.getItem('rupaiIdentity:v2'));
  identity.invitations[0].expiresAt='2020-01-01T00:00:00.000Z';
  localStorage.setItem('rupaiIdentity:v2',JSON.stringify(identity));
  assert.equal(A.listInvitations()[0].status,'expired');

  A.signOut();
  const studentResult=await A.signUp({displayName:'Student One',email:'student1@example.test',password:'student password 123',ageGroup:'teen',termsAccepted:true,privacyAccepted:true});
  assert.equal(studentResult.account.primaryRole,'student');
  await assert.rejects(()=>A.signIn({email:'student1@example.test',password:'wrong password'}),error=>error.code==='invalid_credentials');
  await A.signIn({email:'student1@example.test',password:'student password 123',remember:false});
  const student=A.getCurrentUser();
  assert.equal(student.role,'student');
  assert.equal(A.hasPermission('quiz.take'),true);
  assert.equal(A.hasPermission('studio.access'),false);
  assert.equal(A.routeDecision('studio.access').reason,'permission_denied');
  A.requirePermission('studio.access',{returnTo:'https://evil.example/steal'});
  assert.match(replaced,/view=denied/);
  assert.match(replaced,/returnTo=index.html/);
  A.updateProfile({preferredLanguage:'hinglish',learningGoal:'SSC preparation'});
  assert.equal(A.getCurrentUser().profile.preferredLanguage,'hinglish');

  const studioSnapshot={schemaVersion:1,projects:[],studentLearningProfiles:[{id:'p1',studentId:'student_placeholder'}],studentKnowledgeProfiles:[],conceptMemories:[{id:'c1',studentId:'student_placeholder'}],studentMasteries:[],weakTopics:[],quizAttempts:[],curioLearningSessions:[],adaptiveRevisionPlans:[],longTermRevisionPlans:[],learningTimeline:[],progressEvents:[],studyGoals:[],memoryEvents:[]};
  localStorage.setItem('teachCurioStudio:v1',JSON.stringify(studioSnapshot));
  assert.equal(A.findLocalData().found,true);
  const migrated=A.migrateLocalData('attach');
  assert.equal(migrated.changed,2);
  const migratedStore=JSON.parse(localStorage.getItem('teachCurioStudio:v1'));
  assert.equal(migratedStore.conceptMemories[0].studentId,student.userId);
  assert.throws(()=>A.migrateLocalData('attach'),error=>error.code==='duplicate_migration');
  const exported=A.exportAccountData();
  assert.doesNotMatch(exported,/passwordHash|passwordSalt|sessionId|recoverySnapshot/);
  assert.match(exported,/SSC preparation/);

  A.signOut();
  A.startGuest();
  assert.equal(A.readSession().guest,true);
  assert.equal(A.hasPermission('quiz.take'),true);
  assert.equal(A.hasPermission('progress.read.own'),false);
  A.signOut();

  await A.signIn({email:'owner@example.test',password:'correct horse battery staple',remember:true});
  const users=A.listUsers(),studentAccount=users.find(user=>user.email==='student1@example.test');
  A.assignRole(studentAccount.id,'creator');
  assert.equal(A.listUsers().find(user=>user.id===studentAccount.id).roles.includes('creator'),true);
  A.removeRole(studentAccount.id,'creator');
  assert.equal(A.listUsers().find(user=>user.id===studentAccount.id).roles.includes('creator'),false);
  A.setAccountStatus(studentAccount.id,'suspended');
  A.signOut();
  await assert.rejects(()=>A.signIn({email:'student1@example.test',password:'student password 123'}),error=>error.code==='account_suspended');

  await A.signIn({email:'owner@example.test',password:'correct horse battery staple',remember:true});
  A.setAccountStatus(studentAccount.id,'active');
  const relationship=A.createRelationship({targetId:studentAccount.id,type:'teacher_student',permissions:['progress.read.linked']});
  assert.equal(relationship.status,'pending');

  identity=JSON.parse(localStorage.getItem('rupaiIdentity:v2'));
  const activeSession=identity.sessions.find(item=>item.id===A.readSession().id);
  activeSession.expiresAt='2020-01-01T00:00:00.000Z';
  localStorage.setItem('rupaiIdentity:v2',JSON.stringify(identity));
  assert.equal(A.readSession(),null);

  navigator.onLine=false;
  await assert.rejects(()=>A.signIn({email:'owner@example.test',password:'correct horse battery staple',requireCloud:true}),error=>error.code==='network_unavailable');
  navigator.onLine=true;
  assert.equal(A.requestPasswordReset().available,false);
  assert.match(A.requestPasswordReset().message,/unavailable/i);
  assert.equal(A.verifyEmail().available,false);

  await A.signIn({email:'student1@example.test',password:'student password 123'});
  assert.throws(()=>A.requestDeletion('wrong'),error=>error.code==='confirmation_required');
  const deletion=A.requestDeletion('DELETE');
  assert.equal(deletion.scope,'local_device_only');
  assert.equal(A.readSession(),null);

  identity=JSON.parse(localStorage.getItem('rupaiIdentity:v2'));
  assert.ok(identity.auditEvents.some(event=>event.action==='sign_in.failed'));
  assert.ok(identity.auditEvents.some(event=>event.action==='data_migration.completed'));
  assert.ok(identity.auditEvents.some(event=>event.action==='permission.denied'));
  assert.equal(JSON.stringify(identity.auditEvents).includes('correct horse battery staple'),false);
  assert.equal(JSON.stringify(identity.auditEvents).includes('student password 123'),false);
  console.log('Authentication tests passed: multi-role accounts, PBKDF2 credentials, sessions, RBAC, guest, migration, invitation expiry, suspension, deletion, export, offline and audit.');
})().catch(error=>{console.error(error);process.exitCode=1});
