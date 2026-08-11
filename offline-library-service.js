(function () {
  'use strict';
  const LIBRARY_KEY = 'rupaiOfflineLibrary:v1';
  const FORMAT = 'rupais-world-student-backup';
  const VERSION = 1;
  const SAFE_KEY = /^(rupai(?:Student|Memory|Curio|Revision|DailyGoals|Achievements|Favorites|AncientHistory|MedievalHistory|ModernHistory)|rupaisWorld\.)/;
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  function blankLibrary() { return { version: VERSION, packages: [], updatedAt: null }; }
  function readLibrary() {
    try {
      const value = JSON.parse(localStorage.getItem(LIBRARY_KEY) || 'null');
      if (value?.version === VERSION && Array.isArray(value.packages)) return { ...blankLibrary(), ...value };
    } catch (_) {}
    return blankLibrary();
  }
  function writeLibrary(value) {
    const next = { ...blankLibrary(), ...clone(value), version: VERSION, updatedAt: now() };
    if (!Array.isArray(next.packages)) throw new Error('Offline library data is invalid.');
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    return clone(next);
  }
  function lessonUrls(lesson) {
    const urls = [`student-reader.html?lesson=${encodeURIComponent(lesson.id)}`];
    (lesson.blocks || []).filter(block => block.type === 'image' && block.src).forEach(block => urls.push(String(block.src)));
    return [...new Set(urls)];
  }
  function catalog() {
    const packages = readLibrary().packages;
    const lessons = window.RupaiStudentReader?.availableLessons?.() || window.RupaiStudentReader?.lessons?.() || [];
    return lessons.map(lesson => {
      const saved = packages.find(row => row.lessonId === lesson.id);
      return { id: lesson.id, title: lesson.title, subject: lesson.subject, chapter: lesson.chapter, sections: lesson.sections.length, assetCount: (lesson.blocks || []).filter(x => x.type === 'image').length, urls: lessonUrls(lesson), saved: Boolean(saved), savedAt: saved?.savedAt || null };
    });
  }
  function swRequest(type, payload = {}) {
    return new Promise(resolve => {
      if (!navigator.serviceWorker?.controller) return resolve({ ok: false, reason: 'Service Worker is not controlling this page yet.' });
      const channel = new MessageChannel();
      const timer = setTimeout(() => resolve({ ok: false, reason: 'Offline storage did not respond.' }), 8000);
      channel.port1.onmessage = event => { clearTimeout(timer); resolve(event.data || { ok: false }); };
      navigator.serviceWorker.controller.postMessage({ type, ...payload }, [channel.port2]);
    });
  }
  async function saveLesson(lessonId) {
    const lesson = catalog().find(row => row.id === lessonId);
    if (!lesson) throw new Error('Lesson not found.');
    const result = await swRequest('CACHE_URLS', { urls: lesson.urls });
    if (!result.ok) throw new Error(result.reason || 'The lesson could not be saved offline.');
    const db = readLibrary();
    const row = { lessonId, urls: lesson.urls, savedAt: now(), cached: result.cached || [] };
    db.packages = [row, ...db.packages.filter(x => x.lessonId !== lessonId)];
    writeLibrary(db);
    return clone(row);
  }
  async function removeLesson(lessonId) {
    const db = readLibrary(), row = db.packages.find(x => x.lessonId === lessonId);
    if (!row) return false;
    const retained = new Set(db.packages.filter(x => x.lessonId !== lessonId).flatMap(x => x.urls || []));
    const removable = (row.urls || []).filter(url => !retained.has(url));
    await swRequest('REMOVE_URLS', { urls: removable });
    db.packages = db.packages.filter(x => x.lessonId !== lessonId);
    writeLibrary(db);
    return true;
  }
  async function cacheStatus() { return swRequest('CACHE_SUMMARY'); }
  async function verifyPackages() {
    const packages = readLibrary().packages, urls = [...new Set(packages.flatMap(row => row.urls || []))];
    const status = await swRequest('CHECK_URLS', { urls });
    if (!status.ok) return { ok: false, packages: [], reason: status.reason };
    const found = new Map((status.results || []).map(row => [row.url, row.cached]));
    return { ok: true, packages: packages.map(row => ({ lessonId: row.lessonId, available: (row.urls || []).length > 0 && (row.urls || []).every(url => found.get(url) === true), missing: (row.urls || []).filter(url => found.get(url) !== true) })) };
  }

  function backupKeys() {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key !== LIBRARY_KEY && SAFE_KEY.test(key) && !/identity|auth|credential|secret|token/i.test(key)) keys.push(key);
    }
    return keys.sort();
  }
  function exportBackup() {
    const data = {};
    backupKeys().forEach(key => {
      const raw = localStorage.getItem(key);
      try { data[key] = JSON.parse(raw); } catch (_) { data[key] = raw; }
    });
    return { format: FORMAT, version: VERSION, createdAt: now(), source: 'local-device', data };
  }
  function validateBackup(value) {
    if (!value || value.format !== FORMAT) throw new Error('This is not a valid Rupai’s World student backup.');
    if (value.version !== VERSION) throw new Error(`Backup version ${String(value.version ?? 'unknown')} is unsupported. No safe migration is available.`);
    if (!value.data || typeof value.data !== 'object' || Array.isArray(value.data)) throw new Error('This is not a valid Rupai’s World student backup.');
    const keys = Object.keys(value.data);
    if (!keys.length) throw new Error('The backup does not contain student learning data.');
    if (keys.some(key => !SAFE_KEY.test(key) || /identity|auth|credential|secret|token/i.test(key))) throw new Error('The backup contains an unsupported or sensitive data key.');
    keys.forEach(key => {
      const item = value.data[key];
      if (item === undefined || typeof item === 'function') throw new Error(`Backup entry ${key} is invalid.`);
      JSON.stringify(item);
    });
    return { valid: true, keys, conflicts: keys.filter(key => localStorage.getItem(key) !== null) };
  }
  function restoreBackup(value) {
    const report = validateBackup(value), previous = new Map(report.keys.map(key => [key, localStorage.getItem(key)]));
    try {
      report.keys.forEach(key => localStorage.setItem(key, typeof value.data[key] === 'string' ? value.data[key] : JSON.stringify(value.data[key])));
    } catch (error) {
      previous.forEach((old, key) => old === null ? localStorage.removeItem(key) : localStorage.setItem(key, old));
      throw new Error(`Restore was rolled back safely: ${error.message}`);
    }
    return { restored: report.keys.length, conflicts: report.conflicts.length };
  }
  function localDataSummary() {
    return backupKeys().map(key => ({ key, bytes: new Blob([localStorage.getItem(key) || '']).size }));
  }
  async function storageEstimate() {
    const localBytes = localDataSummary().reduce((sum, row) => sum + row.bytes, 0);
    if (!navigator.storage?.estimate) return { supported: false, localBytes, usage: null, quota: null };
    const estimate = await navigator.storage.estimate();
    return { supported: true, localBytes, usage: Number(estimate.usage || 0), quota: Number(estimate.quota || 0) };
  }
  async function clearOfflineCopies() {
    const result = await swRequest('CLEAR_OFFLINE_CONTENT');
    if (!result.ok) throw new Error(result.reason || 'Offline copies could not be removed.');
    writeLibrary(blankLibrary());
    return true;
  }
  window.RupaiOfflineLibrary = { LIBRARY_KEY, FORMAT, VERSION, readLibrary, catalog, saveLesson, removeLesson, cacheStatus, verifyPackages, exportBackup, validateBackup, restoreBackup, localDataSummary, storageEstimate, clearOfflineCopies, _writeLibrary: writeLibrary };
}());
