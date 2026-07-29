(function () {
  if (!window.__studioSession) return;
  const session = window.__studioSession;
  const store = window.TeachCurioStore;
  const dialog = document.querySelector('#projectDialog');
  const form = document.querySelector('#projectForm');
  const projectsList = document.querySelector('#projectsList');
  const toast = document.querySelector('#toast');
  const statusLabels = {
    material_uploaded: 'Material uploaded', analysing: 'Analysing', structure_ready: 'Structure ready',
    generating: 'Generating', draft: 'Draft', needs_review: 'Needs review',
    needs_verification: 'Needs verification', user_approved: 'Approved',
    published: 'Published', archived: 'Archived'
  };

  document.querySelector('#rolePill').textContent = session.role === 'admin' ? 'Admin' : 'Creator';

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function render() {
    const snapshot = store.read();
    const stats = store.stats(snapshot);
    document.querySelector('#draftCount').textContent = stats.drafts;
    document.querySelector('#verificationCount').textContent = stats.verification;
    document.querySelector('#publishedCount').textContent = stats.published;
    document.querySelector('#incompleteCount').textContent = stats.incomplete;
    const projects = snapshot.projects.filter(project => !project.deletedAt && project.status !== 'archived');
    projectsList.innerHTML = projects.length ? projects.map(project => {
      const hasLessonDraft = snapshot.lessonDrafts?.some(draft => draft.projectId === project.id);
      return `
      <article class="project-card">
        <div class="project-icon">${project.subject ? project.subject.charAt(0) : '✦'}</div>
        <div class="project-copy"><small>${project.subject || 'Subject not chosen'}</small><h3>${escapeHtml(project.title)}</h3><span>Edited ${formatDate(project.updatedAt)}</span></div>
        <span class="status status-${project.status}">${statusLabels[project.status] || project.status}</span>
        <button aria-label="Open ${escapeHtml(project.title)}" data-open-project="${project.id}" data-project-status="${project.status}" data-has-lesson="${hasLessonDraft}">Continue →</button>
      </article>`}).join('') : `
      <div class="empty-state">
        <div class="empty-sparkle">✦</div><h3>Your first lesson starts with your knowledge</h3>
        <p>No sample lessons have been added. Create a real draft and Curio will keep it safely on this device.</p>
        <button class="primary" data-create-project>Create first project</button>
      </div>`;
    const suggestion = stats.verification
      ? ['Review flagged details', `${stats.verification} lesson${stats.verification === 1 ? '' : 's'} need verification before publishing.`]
      : stats.drafts
        ? ['Continue your latest draft', `${stats.recentEdited.title} is ready for its next step.`]
        : ['Begin with trusted source material', 'Create a lesson project, then add your notes before analysis.'];
    document.querySelector('#suggestionTitle').textContent = suggestion[0];
    document.querySelector('#suggestionText').textContent = suggestion[1];
  }
  function escapeHtml(value) {
    const div = document.createElement('div'); div.textContent = value; return div.innerHTML;
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
  }
  function openCreate() {
    form.reset(); dialog.showModal(); setTimeout(() => document.querySelector('#projectTitle').focus(), 50);
  }
  document.querySelector('#newProjectButton').addEventListener('click', openCreate);
  projectsList.addEventListener('click', event => {
    if (event.target.closest('[data-create-project]')) openCreate();
    const opener = event.target.closest('[data-open-project]');
    if (opener) {
      const structureStatuses = new Set(['needs_review', 'needs_verification', 'structure_ready', 'user_approved']);
      const page = opener.dataset.hasLesson === 'true' ? 'lesson.html' : structureStatuses.has(opener.dataset.projectStatus) ? 'structure.html' : 'upload.html';
      window.location.href = `${page}?project=${encodeURIComponent(opener.dataset.openProject)}`;
    }
  });
  form.addEventListener('submit', event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const title = document.querySelector('#projectTitle');
    if (!title.reportValidity()) return;
    store.createProject({ title: title.value, subject: document.querySelector('#projectSubject').value, createdBy: session.id });
    dialog.close(); render(); showToast('Draft project created safely.');
  });
  document.querySelector('#uploadButton').addEventListener('click', () => { window.location.href = 'upload.html'; });
  document.querySelector('[data-action="upload"]').addEventListener('click', () => { window.location.href = 'upload.html'; });
  document.querySelector('[data-action="ai-providers"]').addEventListener('click', () => { window.location.href = 'ai-providers.html'; });
  document.querySelector('[data-action="curio-review"]').addEventListener('click', () => { window.location.href = 'curio-review.html'; });
  document.querySelector('[data-action="visual-intelligence"]').addEventListener('click', () => { window.location.href = 'visual-intelligence.html'; });
  document.querySelector('[data-action="voice-test"]').addEventListener('click', () => { window.location.href = 'voice-test.html'; });
  document.querySelector('[data-action="video-intelligence"]').addEventListener('click', () => { window.location.href = 'video-intelligence.html'; });
  document.querySelectorAll('[data-action="generate"], [data-action="verify"], [data-action="templates"], #projectFilter').forEach(button => button.addEventListener('click', () => showToast('This belongs to a later Studio phase.')));
  window.addEventListener('teach-curio:changed', render);
  render();
})();
