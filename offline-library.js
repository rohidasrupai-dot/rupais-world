(function () {
  'use strict';
  const Library = window.RupaiOfflineLibrary;
  let pendingBackup = null;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const size = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
  function network() { $('networkSummary').innerHTML = `<span class="status">${navigator.onLine ? 'Online · offline copies ready when needed' : 'Offline · showing device content only'}</span>`; }
  async function render() {
    const lessons = Library.catalog();
    $('lessonLibrary').innerHTML = lessons.length ? lessons.map(row => `<article class="lesson"><div><h3>${escape(row.title)}</h3><p class="lesson-meta">${escape(row.subject)} · ${row.sections} sections · ${row.assetCount} approved images</p></div><p class="availability ${row.saved ? 'saved' : ''}">${row.saved ? '✓ Available offline' : 'Not downloaded/cached yet'}</p><button type="button" data-offline-id="${escape(row.id)}" data-action="${row.saved ? 'remove' : 'save'}">${row.saved ? 'Remove offline copy' : 'Save for offline'}</button></article>`).join('') : '<p>No approved local lessons are available yet.</p>';
    $('lessonLibrary').querySelectorAll('button').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        if (button.dataset.action === 'save') await Library.saveLesson(button.dataset.offlineId);
        else await Library.removeLesson(button.dataset.offlineId);
      } catch (error) { $('backupStatus').textContent = error.message; }
      await render();
    }));
    const estimate = await Library.storageEstimate(), summary = await Library.cacheStatus(), groups = Library.localDataSummary();
    if (summary.version) document.documentElement.dataset.pwaCacheVersion = summary.version;
    $('storageOverview').innerHTML = `<div class="metric"><strong>${lessons.filter(x => x.saved).length}</strong><span>Offline lessons</span></div><div class="metric"><strong>${size(estimate.localBytes)}</strong><span>Student data</span></div><div class="metric"><strong>${summary.entries || 0}</strong><span>Cached resources</span></div><div class="metric"><strong>${estimate.supported && estimate.quota ? Math.round(estimate.usage / estimate.quota * 100) + '%' : 'Not available'}</strong><span>Browser storage used</span></div>`;
    $('dataGroups').innerHTML = `<p>${groups.length} protected local learning records are eligible for backup.</p>`;
  }
  function download(value) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    link.download = `rupais-world-student-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  $('exportBackup').addEventListener('click', () => { download(Library.exportBackup()); $('backupStatus').textContent = 'Backup exported locally. Nothing was uploaded.'; });
  $('importBackup').addEventListener('change', async event => {
    pendingBackup = null; $('confirmRestore').hidden = true; $('restoreReview').hidden = true;
    try {
      const parsed = JSON.parse(await event.target.files[0].text()), report = Library.validateBackup(parsed);
      pendingBackup = parsed; $('restoreReview').hidden = false; $('restoreReview').textContent = `Valid version ${parsed.version} backup: ${report.keys.length} records, ${report.conflicts.length} existing records would be replaced.`; $('confirmRestore').hidden = false; $('backupStatus').textContent = 'Review the conflict count before restoring.';
    } catch (error) { $('backupStatus').textContent = `Restore rejected: ${error.message}`; }
  });
  $('confirmRestore').addEventListener('click', () => {
    if (!pendingBackup || !confirm('Replace conflicting local learning records with this validated backup? Current values will be changed.')) return;
    try { const result = Library.restoreBackup(pendingBackup); $('backupStatus').textContent = `Restore complete: ${result.restored} records restored safely.`; pendingBackup = null; $('confirmRestore').hidden = true; $('restoreReview').hidden = true; render(); } catch (error) { $('backupStatus').textContent = error.message; }
  });
  $('clearOffline').addEventListener('click', async () => {
    if (!confirm('Remove all offline lesson copies? Your progress, notes, bookmarks, highlights and quiz history will remain.')) return;
    try { await Library.clearOfflineCopies(); $('backupStatus').textContent = 'Offline lesson copies removed. Student learning data was preserved.'; await render(); } catch (error) { $('backupStatus').textContent = error.message; }
  });
  $('refreshLibrary').addEventListener('click', render);
  $('verifyLibrary').addEventListener('click', async () => {
    const result = await Library.verifyPackages();
    if (!result.ok) { $('verificationStatus').textContent = 'Offline copies could not be checked right now.'; return; }
    const broken = result.packages.filter(row => !row.available);
    $('verificationStatus').textContent = broken.length ? `${broken.length} offline lesson ${broken.length === 1 ? 'copy needs' : 'copies need'} to be saved again.` : result.packages.length ? 'All saved offline lesson copies are complete.' : 'No offline lesson copies have been prepared yet.';
  });
  window.addEventListener('online', network); window.addEventListener('offline', network);
  network(); render();
}());
