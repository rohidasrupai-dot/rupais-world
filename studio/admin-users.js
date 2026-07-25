(function () {
  const A = RupaiAuth, $ = selector => document.querySelector(selector);
  if (!A.readSession()) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  let view = 'users';
  function toast(text) { const element = $('#accountStatus'); element.textContent = text; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2200); }
  function cards(list) {
    return list.map(user => {
      const creator = user.roles.includes('creator');
      return `<article class="session" data-user="${user.id}"><div><strong>${esc(user.profile?.displayName || user.email)}</strong><br><small>${esc(user.email)} · ${esc(user.status)} · ${esc(user.roles.join(', '))}</small></div>
        <div><button data-status="${user.status === 'suspended' ? 'active' : 'suspended'}">${user.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
        <button data-role="${creator ? 'remove' : 'add'}">${creator ? 'Remove Creator' : 'Add Creator'}</button></div></article>`;
    }).join('') || '<p>No users found.</p>';
  }
  function wireUsers() {
    document.querySelectorAll('[data-status]').forEach(button => button.onclick = () => {
      try { A.setAccountStatus(button.closest('[data-user]').dataset.user, button.dataset.status); users(); } catch (error) { toast(error.message); }
    });
    document.querySelectorAll('[data-role]').forEach(button => button.onclick = () => {
      const userId = button.closest('[data-user]').dataset.user;
      try { button.dataset.role === 'add' ? A.assignRole(userId, 'creator') : A.removeRole(userId, 'creator'); users(); } catch (error) { toast(error.message); }
    });
  }
  function users() {
    const list = A.listUsers();
    $('#adminContent').innerHTML = `<h2>Users</h2><label>Search<input id="search" placeholder="Email or display name"></label><div id="userList">${cards(list)}</div>`;
    $('#search').oninput = event => { $('#userList').innerHTML = cards(A.listUsers(event.target.value)); wireUsers(); };
    wireUsers();
  }
  function invitation() {
    const session = A.readSession();
    $('#adminContent').innerHTML = `<h2>Create invitation</h2><p class="notice">Development-only invitation. No email will be sent.</p><form id="inviteForm">
      <label>Email<input name="email" type="email" required></label><label>Role<select name="role"><option>creator</option><option>teacher</option><option>parent</option>${session.roles.includes('super_admin') ? '<option>admin</option>' : ''}</select></label>
      <button class="primary">Create local invitation</button></form><pre id="inviteResult"></pre>`;
    $('#inviteForm').onsubmit = event => {
      event.preventDefault();
      try { const result = A.invite(Object.fromEntries(new FormData(event.currentTarget))); $('#inviteResult').textContent = `${result.message}\n${result.localDevelopmentLink}`; } catch (error) { toast(error.message); }
    };
  }
  function audit() {
    const events = A.listAuditEvents(100);
    $('#adminContent').innerHTML = `<h2>Safe Audit History</h2>${events.map(item => `<div class="session"><span>${esc(item.action)}<br><small>${esc(item.actorId || 'anonymous')} → ${esc(item.targetId || 'none')}</small></span><time>${new Date(item.createdAt).toLocaleString()}</time></div>`).join('') || '<p>No audit events.</p>'}`;
  }
  function render() {
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    ({ users, invite:invitation, audit })[view]();
  }
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => { view = button.dataset.view; render(); });
  render();
})();
