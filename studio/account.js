(function () {
  const A = RupaiAuth, $ = selector => document.querySelector(selector);
  if (!A.readSession()) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  let view = 'profile';
  function toast(text) { const element = $('#accountStatus'); element.textContent = text; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2500); }
  function download(name, text) { const blob = new Blob([text], { type:'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
  function profile() {
    const user = A.getCurrentUser(), p = user.profile;
    $('#accountContent').innerHTML = `<h2>Profile</h2><p class="notice">Development account — these settings are stored only on this device.</p><p><a class="primary" href="sync.html">Open Sync & Devices</a></p><form id="profileForm">
      <label>Display name<input name="displayName" value="${esc(p.displayName)}" required></label><label>Account email<input value="${esc(user.email)}" readonly></label>
      <label>Preferred language<select name="preferredLanguage"><option>english</option><option>hindi</option><option>hinglish</option><option>dual</option></select></label>
      <label>Time zone<input name="timeZone" value="${esc(p.timeZone)}"></label><label>Country or region<input name="countryRegion" value="${esc(p.countryRegion)}"></label>
      <label>Education level<input name="educationLevel" value="${esc(p.educationLevel)}"></label><label>Learning goal<textarea name="learningGoal">${esc(p.learningGoal)}</textarea></label>
      <label>Theme<select name="themePreference"><option>system</option><option>light</option><option>high_contrast</option></select></label><button class="primary">Save profile</button></form>`;
    const form = $('#profileForm'); form.preferredLanguage.value = p.preferredLanguage || 'english'; form.themePreference.value = p.themePreference || 'system';
    form.onsubmit = event => { event.preventDefault(); A.updateProfile(Object.fromEntries(new FormData(form))); toast('Profile saved on this device.'); };
  }
  function security() {
    const user = A.getCurrentUser();
    $('#accountContent').innerHTML = `<h2>Password & Sessions</h2><p class="notice">Session expires ${new Date(user.expiresAt).toLocaleString()}. Local sessions do not represent cloud devices.</p>
      <div class="session"><span>Current browser</span><strong>Active</strong></div>
      <form id="emailForm"><h3>Change email</h3><label>New email<input name="email" type="email" autocomplete="email" required></label><label>Current password<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Update local email</button></form>
      <form id="passwordForm"><h3>Change password</h3><label>Current password<input name="current" type="password" autocomplete="current-password" required></label><label>New password<input name="next" type="password" minlength="${A.config.minimumPasswordLength}" autocomplete="new-password" required></label><button class="primary">Change password</button></form>
      <button class="secondary" id="allOut">Sign out all local sessions</button>`;
    $('#emailForm').onsubmit = async event => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await A.changeEmail(data.get('password'), data.get('email')); toast('Local email updated. Email verification remains unavailable.'); } catch (error) { toast(error.message); } };
    $('#passwordForm').onsubmit = async event => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await A.changePassword(data.get('current'), data.get('next')); toast('Password changed. Other sessions revoked.'); } catch (error) { toast(error.message); } };
    $('#allOut').onclick = () => { A.signOut(true); location.href = 'auth.html?view=signin'; };
  }
  function privacy() {
    const user = A.getCurrentUser();
    $('#accountContent').innerHTML = `<h2>Privacy & Data</h2><p>Export includes this account’s profile and connected learning records. Password hashes, session records, and other users’ data are excluded.</p>
      <button class="primary" id="export">Export my local data</button><section class="danger-zone"><h3>Delete local account</h3><p>This marks the local account for deletion and signs it out. It does not claim to delete any future server account.</p>
      <label>Type DELETE<input id="deleteConfirm"></label><button class="danger" id="delete">Request local deletion</button></section>`;
    $('#export').onclick = () => download(`${user.userId}-account-export.json`, A.exportAccountData());
    $('#delete').onclick = () => { try { A.requestDeletion($('#deleteConfirm').value); location.href = 'auth.html?view=pending'; } catch (error) { toast(error.message); } };
  }
  function migration() {
    const found = A.findLocalData();
    $('#accountContent').innerHTML = `<h2>Local Learning Data</h2><p>${found.found ? 'Unattached learning records were found on this device.' : 'No unattached learning records were found.'}</p>
      <pre>${esc(JSON.stringify(found.counts, null, 2))}</pre><button class="primary" id="attach" ${found.found ? '' : 'disabled'}>Attach to this account</button><button class="secondary" id="backup">Export account backup</button>`;
    $('#attach').onclick = () => { try { const result = A.migrateLocalData('attach'); toast(`${result.changed} records attached.`); migration(); } catch (error) { toast(error.message); } };
    $('#backup').onclick = () => download('rupais-world-local-backup.json', A.exportAccountData());
  }
  function render() { document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view)); ({ profile, security, privacy, migration })[view](); }
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => { view = button.dataset.view; render(); });
  $('#signOut').onclick = () => { A.signOut(); location.href = 'auth.html?view=signin'; };
  render();
})();
