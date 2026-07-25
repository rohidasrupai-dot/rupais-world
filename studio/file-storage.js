(function () {
  const DB = 'teachCurioFiles';
  const STORE = 'blobs';
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function transact(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }
  window.TeachCurioFileStorage = {
    async save(id, file) { await transact('readwrite', store => store.put(file, id)); return true; },
    async get(id) { return transact('readonly', store => store.get(id)); },
    async remove(id) { return transact('readwrite', store => store.delete(id)); },
    available: 'indexedDB' in window
  };
})();

