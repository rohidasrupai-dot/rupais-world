const subjectNames = ['History','Geography','Polity','Economy','Science','Environment','Reasoning','Maths','English','Current Affairs'];
const subjectDialog = document.querySelector('#subjectDialog');
const searchDialog = document.querySelector('#searchDialog');
const searchInput = document.querySelector('#subjectQuery');
const searchResults = document.querySelector('#searchResults');
const favorites = new Set(JSON.parse(localStorage.getItem('rupaiSubjectFavorites') || '[]'));
const subjectIcons = {History:'🏛️',Geography:'🌍',Polity:'⚖️',Economy:'📈',Science:'🔬',Environment:'🌿',Reasoning:'🧩',Maths:'➗',English:'📖','Current Affairs':'📰'};

function showMessage(title, message) {
  subjectDialog.querySelector('h2').textContent = title;
  subjectDialog.querySelector('p').textContent = message;
  subjectDialog.showModal();
}

function openSubject(name) {
  localStorage.setItem('rupaiLastSubject', name);
  if (name === 'History') {
    window.location.href = 'history.html';
    return;
  }
  showMessage(name, `${name} is coming soon to Rupai's World.`);
}

function renderSearch(value = '') {
  const needle = value.trim().toLowerCase();
  const matches = subjectNames.filter(name => name.toLowerCase().includes(needle));
  searchResults.innerHTML = matches.map(name => `<button type="button" data-search-subject="${name}">${name}</button>`).join('');
}

document.addEventListener('click', event => {
  const subject = event.target.closest('[data-subject]');
  if (subject) openSubject(subject.dataset.subject);

  const favorite = event.target.closest('[data-favorite]');
  if (favorite) {
    const name = favorite.dataset.favorite;
    favorites.has(name) ? favorites.delete(name) : favorites.add(name);
    localStorage.setItem('rupaiSubjectFavorites', JSON.stringify([...favorites]));
    const item = {id:`subject-${name.toLowerCase().replace(/\s+/g,'-')}`,title:name,description:`Explore ${name} lessons, chapters and learning treasures.`,type:'Subject',subject:name,icon:subjectIcons[name],route:name==='History'?'history.html':'subjects.html',meta:'Subject'};
    favorites.has(name) ? RupaiFavorites.add(item) : RupaiFavorites.remove(item.id);
    favorite.setAttribute('aria-pressed', favorites.has(name));
  }

  const coming = event.target.closest('[data-coming]');
  if (coming) showMessage(coming.dataset.coming, `${coming.dataset.coming} is coming soon to Rupai's World.`);

  const searchSubject = event.target.closest('[data-search-subject]');
  if (searchSubject) {
    searchDialog.close();
    openSubject(searchSubject.dataset.searchSubject);
  }
});
document.querySelectorAll('[data-favorite]').forEach(button => button.setAttribute('aria-pressed', favorites.has(button.dataset.favorite)));

document.querySelector('#openSearch').addEventListener('click', () => {
  renderSearch();
  searchDialog.showModal();
  searchInput.focus();
});
document.querySelector('#subjectSearch').addEventListener('submit', event => { event.preventDefault(); renderSearch(searchInput.value); });
searchInput.addEventListener('input', () => renderSearch(searchInput.value));
document.querySelectorAll('.dialog-x').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
subjectDialog.querySelector('.dialog-ok').addEventListener('click', () => subjectDialog.close());
[subjectDialog, searchDialog].forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
