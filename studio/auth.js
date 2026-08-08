(function () {
  'use strict';
  const KEY = 'rupaiIdentity:v2';
  const SESSION_KEY = 'rupaiSession:v2';
  const LEGACY_SESSION_KEY = 'rupaiSession:v1';
  const STUDIO_KEY = 'teachCurioStudio:v1';
  const encoder = new TextEncoder();
  const now = () => new Date().toISOString();
  const uid = prefix => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const CONFIG = Object.freeze({
    mode: 'local-development',
    provider: 'local',
    providerUrl: '',
    publicClientKey: '',
    developmentAdapterEnabled: true,
    emailVerificationRequired: false,
    guestModeEnabled: true,
    registrationEnabled: true,
    allowedPublicRole: 'student',
    sessionDurationMinutes: 480,
    minimumPasswordLength: 10
  });
  const PERMISSIONS = Object.freeze({
    student: ['lesson.read', 'quiz.take', 'progress.read.own', 'profile.edit.own', 'visual.student.view', 'visual.request.create', 'voice.input.use', 'voice.output.use', 'voice.transcript.read.own', 'voice.session.read.own', 'curio.brain.use', 'curio.brain.explanation.read', 'curio.brain.override.own'],
    creator: ['lesson.read', 'lesson.create', 'lesson.edit', 'lesson.approve', 'lesson.publish', 'quiz.review', 'studio.access', 'profile.edit.own', 'visual.student.view', 'visual.request.create', 'visual.generate.execute', 'visual.prompt.edit', 'visual.output.review', 'visual.asset.approve', 'visual.cost.view', 'visual.provenance.read', 'voice.input.use', 'voice.output.use', 'voice.transcript.read.own', 'voice.session.read.own', 'voice.review.creator', 'voice.cost.view', 'video.request.create', 'video.request.edit', 'video.review', 'video.project.create', 'video.project.edit', 'video.scene.manage', 'video.asset.link', 'video.script.review', 'video.production.approve', 'video.cost.view', 'video.version.restore', 'curio.brain.use', 'curio.brain.explanation.read', 'curio.brain.override.own', 'curio.brain.review', 'curio.rules.manage', 'curio.decision.audit'],
    teacher: ['lesson.read', 'quiz.review', 'progress.read.linked', 'profile.edit.own'],
    parent: ['lesson.read', 'progress.read.linked', 'profile.edit.own'],
    admin: ['lesson.read', 'studio.access', 'users.manage', 'roles.manage', 'profile.edit.own', 'visual.student.view', 'visual.request.create', 'visual.generate.execute', 'visual.prompt.edit', 'visual.output.review', 'visual.asset.approve', 'visual.cost.view', 'visual.provenance.read', 'visual.provider.configure', 'voice.input.use', 'voice.output.use', 'voice.transcript.read.own', 'voice.session.read.own', 'voice.review.creator', 'voice.cost.view', 'voice.retention.manage', 'voice.provider.configure', 'video.request.create', 'video.request.edit', 'video.review', 'video.provider.configure', 'curio.brain.use', 'curio.brain.explanation.read', 'curio.brain.override.own', 'curio.brain.review', 'curio.rules.manage', 'curio.decision.audit', 'curio.provider.configure'],
    super_admin: ['lesson.read', 'studio.access', 'users.manage', 'roles.manage', 'system.configure', 'profile.edit.own', 'visual.student.view', 'visual.request.create', 'visual.generate.execute', 'visual.prompt.edit', 'visual.output.review', 'visual.asset.approve', 'visual.cost.view', 'visual.provenance.read', 'visual.provider.configure', 'voice.input.use', 'voice.output.use', 'voice.transcript.read.own', 'voice.session.read.own', 'voice.review.creator', 'voice.cost.view', 'voice.retention.manage', 'voice.provider.configure', 'video.request.create', 'video.request.edit', 'video.review', 'video.provider.configure', 'curio.brain.use', 'curio.brain.explanation.read', 'curio.brain.override.own', 'curio.brain.review', 'curio.rules.manage', 'curio.decision.audit', 'curio.provider.configure'],
    guest: ['lesson.read', 'quiz.take']
  });
  const SAFE_RETURN_PREFIXES = ['../', './', '/', 'index.html', 'upload.html', 'structure.html', 'lesson.html', 'quiz.html', 'ask-curio.html', 'voice-test.html', 'video-', 'curio-', 'visual-', 'adaptive-', 'learning-', 'creator-', 'publishing-', 'offline-', 'production-', 'account.html', 'admin-users.html'];
  const emptyState = () => ({
    schemaVersion: 2,
    providerConfiguration: { mode: CONFIG.mode, provider: CONFIG.provider, configured: false },
    accounts: [], profiles: [], roleAssignments: [], sessions: [], invitations: [],
    relationships: [], consents: [], deletionRequests: [], migrations: [], auditEvents: []
  });
  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value?.schemaVersion === 2) return { ...emptyState(), ...value };
    } catch {}
    return emptyState();
  }
  function writeState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent?.(new CustomEvent('rupai:identity-changed', { detail: clone(state) }));
    return state;
  }
  function safeReturn(value, fallback = 'index.html') {
    const target = String(value || '');
    if (!target || target.includes('://') || target.startsWith('//') || target.includes('\\') || target.includes('\n')) return fallback;
    return SAFE_RETURN_PREFIXES.some(prefix => target.startsWith(prefix)) ? target : fallback;
  }
  function audit(state, actorId, targetId, action, result = 'success', metadata = {}) {
    const safe = {};
    ['role', 'reason', 'provider', 'migrationId', 'relationshipType', 'permission', 'accountStatus'].forEach(key => {
      if (metadata[key] != null) safe[key] = String(metadata[key]).slice(0, 160);
    });
    const entry = { id: uid('audit'), actorId: actorId || null, targetId: targetId || null, action, result, metadata: safe, createdAt: now() };
    state.auditEvents.unshift(entry);
    state.auditEvents = state.auditEvents.slice(0, 2000);
    return entry;
  }
  function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
  function publicAccount(account) {
    if (!account) return null;
    const { passwordHash, passwordSalt, ...safe } = account;
    return clone(safe);
  }
  async function derivePassword(password, saltBytes) {
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 210000, hash: 'SHA-256' }, key, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }
  function bytesToB64(bytes) { return btoa(String.fromCharCode(...bytes)); }
  function b64ToBytes(value) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
  function validatePassword(password) {
    if (String(password || '').length < CONFIG.minimumPasswordLength) throw authError('weak_password', `Use at least ${CONFIG.minimumPasswordLength} characters.`);
    if (String(password).length > 256) throw authError('weak_password', 'Password is too long.');
  }
  function authError(code, message) { const error = new Error(message); error.code = code; return error; }
  function accountRoles(state, userId) {
    return state.roleAssignments.filter(item => item.userId === userId && item.status === 'active').map(item => item.role);
  }
  function permissionsFor(state, userId) {
    return [...new Set(accountRoles(state, userId).flatMap(role => PERMISSIONS[role] || []))];
  }
  function sessionRecord() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  function clearSessionRecord() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  function currentSession(options = {}) {
    const record = sessionRecord();
    if (!record) return null;
    if (record.guest) return null;
    const state = readState(), session = state.sessions.find(item => item.id === record.sessionId && item.status === 'active');
    if (!session || +new Date(session.expiresAt) <= Date.now()) {
      if (session) { session.status = 'expired'; session.endedAt = now(); audit(state, session.userId, session.userId, 'session.expired'); writeState(state); }
      clearSessionRecord();
      return null;
    }
    const account = state.accounts.find(item => item.id === session.userId);
    if (!account || !['active', 'pending_verification'].includes(account.status)) return null;
    if (!options.noTouch && Date.now() - +new Date(session.lastActivityAt) > 60000) {
      session.lastActivityAt = now(); account.lastActiveAt = session.lastActivityAt; writeState(state);
    }
    return {
      id: session.id, userId: account.id, email: account.email, name: state.profiles.find(item => item.userId === account.id)?.displayName || account.email,
      role: account.primaryRole, roles: accountRoles(state, account.id), permissions: permissionsFor(state, account.id),
      accountStatus: account.status, source: 'local-development', provider: 'local', expiresAt: session.expiresAt,
      developmentOnly: true, guest: false
    };
  }
  function guestSession() {
    const record = sessionRecord();
    if (!record?.guest) return null;
    return { id: record.sessionId, userId: record.userId, name: 'Guest learner', role: 'guest', roles: ['guest'], permissions: PERMISSIONS.guest, accountStatus: 'active', source: 'guest', developmentOnly: true, guest: true };
  }
  function readSession() { return currentSession() || guestSession(); }
  async function signUp(input) {
    if (!CONFIG.registrationEnabled) throw authError('registration_disabled', 'Registration is unavailable.');
    const state = readState(), email = normalizeEmail(input.email), password = String(input.password || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw authError('invalid_input', 'Enter a valid email address.');
    validatePassword(password);
    if (state.accounts.some(item => item.email === email && item.status !== 'deleted')) throw authError('duplicate_account', 'Unable to create this account. Try signing in or use another email.');
    const salt = crypto.getRandomValues(new Uint8Array(16)), createdAt = now(), id = uid('user');
    const account = {
      id, providerId: `local:${id}`, email, emailVerified: false, emailVerificationStatus: 'unavailable_local',
      status: CONFIG.emailVerificationRequired ? 'pending_verification' : 'active', primaryRole: 'student',
      passwordSalt: bytesToB64(salt), passwordHash: await derivePassword(password, salt),
      createdAt, updatedAt: createdAt, lastSignInAt: null, lastActiveAt: createdAt,
      termsAcceptanceVersion: input.termsAccepted ? '2026-07' : null, privacyAcceptanceVersion: input.privacyAccepted ? '2026-07' : null,
      deletionRequestedAt: null, deactivatedAt: null
    };
    state.accounts.push(account);
    state.profiles.push({
      id: uid('profile'), userId: id, displayName: String(input.displayName || '').trim().slice(0, 80) || 'Learner',
      profileImageReference: null, preferredLanguage: 'english', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      countryRegion: '', ageGroup: ['child', 'teen', 'adult', 'unknown'].includes(input.ageGroup) ? input.ageGroup : 'unknown',
      educationLevel: '', learningGoal: '', accessibilityPreferences: {}, themePreference: 'system',
      minorSafety: ['child', 'teen'].includes(input.ageGroup) ? { guardianConsentStatus: 'not_configured', publicInteraction: 'restricted', profileVisibility: 'private' } : null,
      intendedUsage: ['learning', 'creator_interest', 'teacher_interest', 'guardian_interest'].includes(input.intendedUsage) ? input.intendedUsage : 'learning',
      onboardingStatus: 'started', profileCompletionStatus: 'basic', createdAt, updatedAt: createdAt
    });
    state.roleAssignments.push({ id: uid('role'), userId: id, role: 'student', status: 'active', assignedBy: 'public-registration', createdAt });
    if (input.termsAccepted) state.consents.push({ id: uid('consent'), userId: id, type: 'terms', version: '2026-07', granted: true, createdAt });
    if (input.privacyAccepted) state.consents.push({ id: uid('consent'), userId: id, type: 'privacy', version: '2026-07', granted: true, createdAt });
    state.consents.push({ id: uid('consent'), userId: id, type: 'marketing', version: '2026-07', granted: false, createdAt });
    audit(state, id, id, 'account.created', 'success', { role: 'student', provider: 'local' });
    writeState(state);
    return { account: publicAccount(account), profile: clone(state.profiles.at(-1)), message: 'Development account created. Data is stored only on this device.' };
  }
  async function signIn(input) {
    if (navigator.onLine === false && input.requireCloud) throw authError('network_unavailable', 'Cloud sign-in is unavailable while offline.');
    const state = readState(), email = normalizeEmail(input.email), account = state.accounts.find(item => item.email === email && item.status !== 'deleted');
    const generic = () => authError('invalid_credentials', 'Email or password is incorrect.');
    if (!account) { audit(state, null, null, 'sign_in.failed', 'failure', { provider: 'local' }); writeState(state); throw generic(); }
    if (account.status === 'suspended') throw authError('account_suspended', 'This account is restricted. Contact an administrator.');
    if (['deactivated', 'deletion_pending', 'deleted'].includes(account.status)) throw authError('account_unavailable', 'This account is not available.');
    const hash = await derivePassword(String(input.password || ''), b64ToBytes(account.passwordSalt));
    if (hash !== account.passwordHash) { audit(state, account.id, account.id, 'sign_in.failed', 'failure', { provider: 'local' }); writeState(state); throw generic(); }
    const startedAt = now(), session = {
      id: uid('session'), userId: account.id, provider: 'local', status: 'active', createdAt: startedAt,
      lastActivityAt: startedAt, expiresAt: new Date(Date.now() + CONFIG.sessionDurationMinutes * 60000).toISOString(),
      endedAt: null, deviceLabel: 'Current browser'
    };
    state.sessions.push(session); account.lastSignInAt = startedAt; account.lastActiveAt = startedAt; account.updatedAt = startedAt;
    audit(state, account.id, account.id, 'sign_in', 'success', { provider: 'local' }); writeState(state);
    const record = JSON.stringify({ sessionId: session.id, userId: account.id });
    (input.remember ? localStorage : sessionStorage).setItem(SESSION_KEY, record);
    return readSession();
  }
  function signOut(allDevices = false) {
    const current = readSession(), state = readState();
    state.sessions.forEach(session => {
      if ((allDevices && session.userId === current?.userId) || session.id === current?.id) { session.status = 'revoked'; session.endedAt = now(); }
    });
    if (current) audit(state, current.userId, current.userId, allDevices ? 'sign_out.all' : 'sign_out');
    writeState(state); clearSessionRecord();
  }
  function startGuest() {
    if (!CONFIG.guestModeEnabled) throw authError('guest_disabled', 'Guest Mode is unavailable.');
    const id = `guest_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: id, userId: id, guest: true }));
    return guestSession();
  }
  function hasPermission(permission, session = readSession()) { return Boolean(session?.permissions?.includes(permission)); }
  function canAccessStudio(session = readSession()) { return hasPermission('studio.access', session); }
  function routeDecision(permission, session = readSession()) {
    if (!session) return { allowed: false, reason: 'unauthenticated', route: 'auth.html?view=signin' };
    if (['suspended', 'deactivated', 'deletion_pending', 'deleted'].includes(session.accountStatus)) return { allowed: false, reason: 'restricted', route: 'auth.html?view=pending' };
    if (!hasPermission(permission, session)) return { allowed: false, reason: 'permission_denied', route: 'auth.html?view=denied' };
    return { allowed: true, session };
  }
  function requirePermission(permission, options = {}) {
    const decision = routeDecision(permission);
    if (decision.allowed) return decision.session;
    const returnTo = safeReturn(options.returnTo || `${location.pathname.split('/').pop()}${location.search}`, 'index.html');
    if (decision.reason === 'permission_denied') {
      const state = readState(), current = readSession();
      audit(state, current?.userId, current?.userId, 'permission.denied', 'failure', { permission }); writeState(state);
    }
    const separator = decision.route.includes('?') ? '&' : '?';
    location.replace(`${decision.route}${separator}returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }
  function requireStudioAccess(options = {}) {
    const page = String(location.pathname || '').split('/').pop();
    const permission = ['adaptive-dashboard.html', 'learning-memory.html'].includes(page) ? 'progress.read.own' : page === 'curio-runtime.html' ? 'lesson.read' : 'studio.access';
    return requirePermission(permission, options);
  }
  function getCurrentUser() {
    const session = readSession();
    if (!session || session.guest) return session;
    const state = readState();
    return { ...session, account: publicAccount(state.accounts.find(item => item.id === session.userId)), profile: clone(state.profiles.find(item => item.userId === session.userId)) };
  }
  function updateProfile(changes) {
    const session = readSession(); if (!session || session.guest) throw authError('unauthenticated', 'Sign in to update a profile.');
    const state = readState(), profile = state.profiles.find(item => item.userId === session.userId);
    const allowed = ['displayName', 'profileImageReference', 'preferredLanguage', 'timeZone', 'countryRegion', 'ageGroup', 'educationLevel', 'learningGoal', 'accessibilityPreferences', 'themePreference', 'onboardingStatus'];
    allowed.forEach(key => { if (changes[key] !== undefined) profile[key] = typeof changes[key] === 'string' ? changes[key].trim().slice(0, 200) : clone(changes[key]); });
    profile.updatedAt = now(); profile.profileCompletionStatus = profile.displayName && profile.preferredLanguage ? 'complete' : 'basic';
    audit(state, session.userId, session.userId, 'profile.updated'); writeState(state); return clone(profile);
  }
  async function changePassword(currentPassword, nextPassword) {
    const session = readSession(); if (!session || session.guest) throw authError('unauthenticated', 'Sign in again.');
    validatePassword(nextPassword); const state = readState(), account = state.accounts.find(item => item.id === session.userId);
    if (await derivePassword(currentPassword, b64ToBytes(account.passwordSalt)) !== account.passwordHash) throw authError('invalid_credentials', 'Current password is incorrect.');
    const salt = crypto.getRandomValues(new Uint8Array(16)); account.passwordSalt = bytesToB64(salt); account.passwordHash = await derivePassword(nextPassword, salt); account.updatedAt = now();
    state.sessions.forEach(item => { if (item.userId === account.id && item.id !== session.id) item.status = 'revoked'; });
    audit(state, account.id, account.id, 'password.changed'); writeState(state); return true;
  }
  async function changeEmail(currentPassword, nextEmail) {
    const session = readSession(); if (!session || session.guest) throw authError('unauthenticated', 'Sign in again.');
    const email = normalizeEmail(nextEmail); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw authError('invalid_input', 'Enter a valid email address.');
    const state = readState(), account = state.accounts.find(item => item.id === session.userId);
    if (await derivePassword(currentPassword, b64ToBytes(account.passwordSalt)) !== account.passwordHash) throw authError('invalid_credentials', 'Current password is incorrect.');
    if (state.accounts.some(item => item.id !== account.id && item.email === email && item.status !== 'deleted')) throw authError('duplicate_account', 'Unable to use this email address.');
    account.email = email; account.emailVerified = false; account.emailVerificationStatus = 'unavailable_local'; account.updatedAt = now();
    audit(state, account.id, account.id, 'email.changed'); writeState(state); return publicAccount(account);
  }
  function requestPasswordReset() { return { available: false, provider: 'local', message: 'Password reset email is unavailable in local development mode.' }; }
  function verifyEmail() { return { available: false, verified: false, message: 'Email delivery and verification are unavailable in local development mode.' }; }
  function resendVerification() { return verifyEmail(); }
  function refreshSession() {
    const session = readSession(); if (!session || session.guest) return session;
    const state = readState(), item = state.sessions.find(value => value.id === session.id);
    item.expiresAt = new Date(Date.now() + CONFIG.sessionDurationMinutes * 60000).toISOString(); item.lastActivityAt = now(); writeState(state);
    return readSession();
  }
  function findLocalData() {
    try {
      const data = JSON.parse(localStorage.getItem(STUDIO_KEY) || 'null');
      if (!data) return { found: false, counts: {} };
      const keys = ['studentLearningProfiles', 'studentKnowledgeProfiles', 'conceptMemories', 'studentMasteries', 'quizAttempts', 'curioLearningSessions', 'adaptiveRevisionPlans', 'longTermRevisionPlans', 'learningTimeline', 'progressEvents', 'studyGoals'];
      const counts = Object.fromEntries(keys.map(key => [key, (data[key] || []).filter(item => !item.studentId || ['student_placeholder', 'legacy-owner'].includes(item.studentId)).length]));
      return { found: Object.values(counts).some(Boolean), counts };
    } catch { return { found: false, counts: {}, error: 'Local learning data could not be read.' }; }
  }
  function migrateLocalData(action = 'review') {
    const session = readSession(); if (!session || session.guest) throw authError('unauthenticated', 'Sign in before attaching data.');
    const state = readState(), existing = state.migrations.find(item => item.userId === session.userId && item.status === 'completed');
    if (existing) throw authError('duplicate_migration', 'This device data has already been attached to the account.');
    const found = findLocalData();
    if (action === 'review') return found;
    if (action === 'keep_separate' || action === 'skip') {
      state.migrations.push({ id: uid('migration'), userId: session.userId, action, status: 'deferred', counts: found.counts, createdAt: now() });
      audit(state, session.userId, session.userId, 'data_migration.deferred'); writeState(state); return { status: 'deferred' };
    }
    if (action !== 'attach') throw authError('invalid_input', 'Unknown migration action.');
    const raw = localStorage.getItem(STUDIO_KEY); if (!raw) return { status: 'no_data' };
    const data = JSON.parse(raw), backup = btoa(unescape(encodeURIComponent(raw))), migrationId = uid('migration');
    const keys = ['studentLearningProfiles', 'studentKnowledgeProfiles', 'conceptMemories', 'studentMasteries', 'weakTopics', 'quizAttempts', 'curioLearningSessions', 'adaptiveRevisionPlans', 'longTermRevisionPlans', 'learningTimeline', 'progressEvents', 'studyGoals', 'memoryEvents'];
    let changed = 0;
    keys.forEach(key => (data[key] || []).forEach(item => {
      if (!item.studentId || ['student_placeholder', 'legacy-owner'].includes(item.studentId)) { item.studentId = session.userId; item.accountId = session.userId; changed++; }
    }));
    localStorage.setItem(STUDIO_KEY, JSON.stringify(data));
    state.migrations.push({ id: migrationId, userId: session.userId, action: 'attach', status: 'completed', counts: found.counts, changed, recoverySnapshot: backup, createdAt: now(), completedAt: now() });
    audit(state, session.userId, session.userId, 'data_migration.completed', 'success', { migrationId }); writeState(state);
    return { status: 'completed', changed, migrationId };
  }
  function exportAccountData(userId) {
    const session = readSession(); if (!session || (userId && userId !== session.userId && !hasPermission('users.manage', session))) throw authError('permission_denied', 'You cannot export this account.');
    const id = userId || session.userId, state = readState(), studio = (() => { try { return JSON.parse(localStorage.getItem(STUDIO_KEY) || '{}'); } catch { return {}; } })();
    const studentKeys = ['studentLearningProfiles', 'studentKnowledgeProfiles', 'conceptMemories', 'studentMasteries', 'weakTopics', 'quizAttempts', 'curioLearningSessions', 'adaptiveRevisionPlans', 'longTermRevisionPlans', 'learningTimeline', 'progressEvents', 'studyGoals', 'memoryEvents'];
    const learning = {}; studentKeys.forEach(key => learning[key] = (studio[key] || []).filter(item => item.studentId === id));
    const payload = {
      schema: 'rupais-world-account-export/v1', exportedAt: now(), localDevelopmentOnly: true,
      account: publicAccount(state.accounts.find(item => item.id === id)), profile: state.profiles.find(item => item.userId === id),
      roles: accountRoles(state, id), consents: state.consents.filter(item => item.userId === id),
      relationships: state.relationships.filter(item => item.requesterId === id || item.targetId === id),
      migrations: state.migrations.filter(item => item.userId === id).map(({ recoverySnapshot, ...safe }) => safe), learning
    };
    audit(state, session.userId, id, 'data.exported'); writeState(state); return JSON.stringify(payload, null, 2);
  }
  function requestDeletion(confirmation) {
    const session = readSession(); if (!session || session.guest) throw authError('unauthenticated', 'Sign in to request deletion.');
    if (confirmation !== 'DELETE') throw authError('confirmation_required', 'Type DELETE to confirm.');
    const state = readState(), account = state.accounts.find(item => item.id === session.userId);
    account.status = 'deletion_pending'; account.deletionRequestedAt = now(); account.updatedAt = now();
    const request = { id: uid('deletion'), userId: account.id, status: 'pending_local_deletion', requestedAt: now(), cancellationAvailable: true, scope: 'local_device_only' };
    state.deletionRequests.push(request); audit(state, account.id, account.id, 'account.deletion_requested', 'success', { accountStatus: account.status }); writeState(state); signOut();
    return clone(request);
  }
  function cancelDeletion(userId) {
    const session = readSession(); if (!session || (!hasPermission('users.manage', session) && session.userId !== userId)) throw authError('permission_denied', 'Permission denied.');
    const state = readState(), account = state.accounts.find(item => item.id === userId), request = [...state.deletionRequests].reverse().find(item => item.userId === userId && item.status.startsWith('pending'));
    if (!account || !request) throw authError('not_found', 'No pending deletion request.');
    account.status = 'active'; account.deletionRequestedAt = null; request.status = 'cancelled'; request.cancelledAt = now();
    audit(state, session.userId, userId, 'account.deletion_cancelled'); writeState(state); return true;
  }
  function invite(input) {
    const session = readSession(); if (!session || !hasPermission('users.manage', session)) throw authError('permission_denied', 'User management permission is required.');
    const role = String(input.role); if (!['creator', 'teacher', 'parent', 'admin'].includes(role)) throw authError('invalid_role', 'This invitation role is unavailable.');
    if (role === 'admin' && !session.roles.includes('super_admin')) throw authError('permission_denied', 'Only a super administrator can invite an administrator.');
    const state = readState(), token = uid('invite'), invitation = {
      id: uid('invitation'), email: normalizeEmail(input.email), intendedRole: role, invitedBy: session.userId,
      createdAt: now(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), acceptedAt: null, revokedAt: null,
      status: 'created_local', localDevelopmentLink: `auth.html?view=signup&invitation=${encodeURIComponent(token)}`, tokenHash: null
    };
    state.invitations.push(invitation); audit(state, session.userId, null, 'invitation.created', 'success', { role }); writeState(state);
    return { ...clone(invitation), message: 'Local development invitation created. No email was sent.' };
  }
  function listInvitations() {
    const session = readSession(); if (!session || !hasPermission('users.manage', session)) throw authError('permission_denied', 'User management permission is required.');
    const state = readState(), stamp = Date.now(); let changed = false;
    state.invitations.forEach(item => { if (['created_local', 'pending'].includes(item.status) && +new Date(item.expiresAt) <= stamp) { item.status = 'expired'; changed = true; } });
    if (changed) writeState(state);
    return clone(state.invitations);
  }
  function createRelationship(input) {
    const session = readSession(); if (!session) throw authError('unauthenticated', 'Sign in first.');
    const state = readState(), relationship = {
      id: uid('relationship'), requesterId: session.userId, targetId: input.targetId, type: input.type,
      status: 'pending', permissions: clone(input.permissions || []), createdAt: now(), approvedAt: null, revokedAt: null
    };
    state.relationships.push(relationship); audit(state, session.userId, input.targetId, 'relationship.requested', 'success', { relationshipType: input.type }); writeState(state); return clone(relationship);
  }
  function approveRelationship(id) {
    const session = readSession(), state = readState(), item = state.relationships.find(value => value.id === id);
    if (!session || !item || (session.userId !== item.targetId && !hasPermission('users.manage', session))) throw authError('permission_denied', 'Relationship approval requires target consent or administration.');
    item.status = 'active'; item.approvedAt = now(); audit(state, session.userId, item.targetId, 'relationship.approved', 'success', { relationshipType: item.type }); writeState(state); return clone(item);
  }
  function listUsers(query = '') {
    const session = readSession(); if (!session || !hasPermission('users.manage', session)) throw authError('permission_denied', 'User management permission is required.');
    const state = readState(), term = String(query).toLowerCase();
    return state.accounts.filter(item => !term || item.email.includes(term) || state.profiles.find(profile => profile.userId === item.id)?.displayName.toLowerCase().includes(term)).map(account => ({
      ...publicAccount(account), profile: clone(state.profiles.find(item => item.userId === account.id)), roles: accountRoles(state, account.id)
    }));
  }
  function listAuditEvents(limit = 100) {
    const session = readSession(); if (!session || !hasPermission('users.manage', session)) throw authError('permission_denied', 'User management permission is required.');
    return clone(readState().auditEvents.slice(0, Math.max(1, Math.min(500, Number(limit) || 100))));
  }
  function setAccountStatus(userId, status) {
    const session = readSession(); if (!session || !hasPermission('users.manage', session)) throw authError('permission_denied', 'User management permission is required.');
    if (!['active', 'suspended', 'deactivated'].includes(status)) throw authError('invalid_status', 'Invalid account status.');
    const state = readState(), account = state.accounts.find(item => item.id === userId); if (!account) throw authError('not_found', 'Account not found.');
    account.status = status; account.updatedAt = now(); if (status === 'deactivated') account.deactivatedAt = now();
    state.sessions.forEach(item => { if (item.userId === userId && status !== 'active') item.status = 'revoked'; });
    audit(state, session.userId, userId, `account.${status}`, 'success', { accountStatus: status }); writeState(state); return publicAccount(account);
  }
  function assignRole(userId, role) {
    const session = readSession(); if (!session || !hasPermission('roles.manage', session)) throw authError('permission_denied', 'Role management permission is required.');
    if (!PERMISSIONS[role] || role === 'super_admin' || (role === 'admin' && !session.roles.includes('super_admin'))) throw authError('invalid_role', 'This role cannot be assigned by the current account.');
    const state = readState(); if (!state.accounts.some(item => item.id === userId)) throw authError('not_found', 'Account not found.');
    if (!state.roleAssignments.some(item => item.userId === userId && item.role === role && item.status === 'active')) state.roleAssignments.push({ id: uid('role'), userId, role, status: 'active', assignedBy: session.userId, createdAt: now() });
    const account = state.accounts.find(item => item.id === userId); if (account.primaryRole === 'student' && role !== 'student') account.primaryRole = role;
    audit(state, session.userId, userId, 'role.assigned', 'success', { role }); writeState(state); return accountRoles(state, userId);
  }
  function removeRole(userId, role) {
    const session = readSession(); if (!session || !hasPermission('roles.manage', session)) throw authError('permission_denied', 'Role management permission is required.');
    if (role === 'student' || role === 'super_admin') throw authError('invalid_role', 'This protected role cannot be removed here.');
    const state = readState(), assignment = state.roleAssignments.find(item => item.userId === userId && item.role === role && item.status === 'active');
    if (!assignment) return accountRoles(state, userId);
    assignment.status = 'revoked'; assignment.revokedAt = now(); assignment.revokedBy = session.userId;
    const account = state.accounts.find(item => item.id === userId), remaining = accountRoles(state, userId);
    if (!remaining.includes(account.primaryRole)) account.primaryRole = remaining[0] || 'student';
    audit(state, session.userId, userId, 'role.removed', 'success', { role }); writeState(state); return remaining;
  }
  function providerStatus() {
    return { mode: CONFIG.mode, provider: 'Local Development Auth Adapter', productionReady: false, cloudBackup: false, emailDelivery: false, passwordRecovery: false, message: 'Development account — data is stored only on this device.' };
  }
  function unavailableProvider(name) {
    const unavailable = async () => { throw authError('provider_unavailable', `${name} authentication is not configured.`); };
    return { configured:false, name, signUp:unavailable, signIn:unavailable, signOut:unavailable, restoreSession:()=>null, refreshSession:unavailable, requestPasswordReset:unavailable, verifyEmail:unavailable, resendVerification:unavailable, readCurrentUser:()=>null, readAuthenticationState:()=>null, changePassword:unavailable };
  }
  function securityContracts() {
    return {
      serverAuthorizationRequired: true, csrf: { requiredForCookieBackends: true, implementedLocally: false },
      rateLimit: { providerExtensionRequired: true }, bruteForceProtection: { providerExtensionRequired: true },
      secureCookie: { httpOnly: true, secure: true, sameSite: 'Lax', providerExtensionRequired: true },
      sessionRevocation: true, secretsInFrontendAllowed: false, contentSecurityPolicyReviewRequired: true
    };
  }
  function developmentSetupAvailable() { return readState().accounts.length === 0; }
  async function bootstrapDevelopmentOwner(input = {}) {
    const state = readState(); if (state.accounts.length) return null;
    const password = String(input.password || ''); validatePassword(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bootstrapRole = input.role === 'super_admin' ? 'super_admin' : 'creator';
    const id = uid('user'), createdAt = now(), account = {
      id, providerId: `local:${id}`, email: normalizeEmail(input.email || 'owner@local.test'), emailVerified: false,
      emailVerificationStatus: 'unavailable_local', status: 'active', primaryRole: bootstrapRole,
      passwordSalt: bytesToB64(salt), passwordHash: await derivePassword(password, salt), createdAt, updatedAt: createdAt, lastSignInAt: null, lastActiveAt: createdAt,
      termsAcceptanceVersion: 'legacy-local', privacyAcceptanceVersion: 'legacy-local', deletionRequestedAt: null, deactivatedAt: null
    };
    state.accounts.push(account); state.profiles.push({ id: uid('profile'), userId: id, displayName: input.displayName || 'Rupai', preferredLanguage: 'english', timeZone: 'Asia/Calcutta', countryRegion: '', ageGroup: 'adult', educationLevel: '', learningGoal: '', accessibilityPreferences: {}, themePreference: 'system', onboardingStatus: 'legacy', profileCompletionStatus: 'basic', createdAt, updatedAt: createdAt });
    state.roleAssignments.push({ id: uid('role'), userId: id, role: bootstrapRole, status: 'active', assignedBy: 'controlled-development-bootstrap', createdAt });
    audit(state, id, id, 'development_owner.bootstrapped', 'success', { role: bootstrapRole }); writeState(state); return publicAccount(account);
  }
  const localProvider = { signUp, signIn, signOut, restoreSession: readSession, refreshSession, requestPasswordReset, confirmPasswordReset:requestPasswordReset, verifyEmail, resendVerification, readCurrentUser:getCurrentUser, readAuthenticationState:readSession, changePassword, updateEmail:changeEmail, deleteAccount:requestDeletion };
  const futureProviders = { supabase:unavailableProvider('Supabase'), firebase:unavailableProvider('Firebase'), custom:unavailableProvider('Custom backend') };
  window.RupaiAuth = {
    config: CONFIG, permissions: PERMISSIONS, provider: localProvider, providers: { local: localProvider, ...futureProviders },
    readSession, getCurrentUser, canAccessStudio, hasPermission, routeDecision, requirePermission, requireStudioAccess,
    signUp, signIn, signOut, clearSession: signOut, startGuest, refreshSession, requestPasswordReset, verifyEmail, resendVerification,
    updateProfile, changePassword, changeEmail, findLocalData, migrateLocalData, exportAccountData, requestDeletion, cancelDeletion,
    invite, listInvitations, createRelationship, approveRelationship, listUsers, listAuditEvents, setAccountStatus, assignRole, removeRole, providerStatus, securityContracts,
    bootstrapDevelopmentOwner, developmentSetupAvailable, safeReturn,
    setSession() { throw authError('unsupported', 'Direct session injection is disabled. Use an authentication provider.'); }
  };
  document.addEventListener?.('DOMContentLoaded', () => {
    const page = String(location.pathname || '').split('/').pop(), session = readSession();
    if (!session || !['adaptive-dashboard.html', 'learning-memory.html'].includes(page)) return;
    const input = document.querySelector(page === 'adaptive-dashboard.html' ? '#studentId' : '#student');
    if (input) { input.value = session.userId; input.readOnly = true; input.setAttribute('aria-label', 'Signed-in student account ID'); }
    const load = document.querySelector('#load'); if (load) { load.click(); load.hidden = true; }
  });
})();
