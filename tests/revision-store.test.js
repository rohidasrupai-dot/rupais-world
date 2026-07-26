const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRevisionStore() {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const window = {
    dispatchEvent() {},
    addEventListener() {}
  };
  const context = {
    console,
    Date,
    Math,
    Map,
    Set,
    Object,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    localStorage,
    window,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    }
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'revision-store.js'), 'utf8');
  vm.runInContext(source, context);
  return { api: context.window.RupaiRevision, localStorage };
}

test('exports and restores only Revision Menu storage keys', () => {
  const { api, localStorage } = loadRevisionStore();
  const revision = api.write({
    tasks: [api.normalizeTask({ id: 'topic-1', title: 'Vedic Age', subject: 'History' })],
    sessions: [{ id: 'session-1', taskId: 'topic-1' }],
    mistakes: [{ id: 'mistake-1', taskId: 'topic-1', question: 'Test?' }],
    goals: [],
    achievements: []
  });
  localStorage.setItem('rupaiDailyGoals:v1', JSON.stringify([{ id: 'goal-1', taskId: 'topic-1' }]));
  localStorage.setItem('rupaiUnrelated:v1', JSON.stringify({ keep: true }));

  const backup = api.exportData();
  assert.equal(backup.format, 'rupais-world-revision-backup');
  assert.deepEqual(Array.from(backup.storageKeys), ['rupaiRevision:v1', 'rupaiDailyGoals:v1']);
  assert.equal(Object.hasOwn(backup.data, 'rupaiUnrelated:v1'), false);
  assert.equal(backup.data['rupaiRevision:v1'].tasks[0].title, 'Vedic Age');

  localStorage.setItem('rupaiRevision:v1', JSON.stringify({ tasks: [], sessions: [], mistakes: [] }));
  localStorage.setItem('rupaiDailyGoals:v1', '[]');
  api.importData(backup);

  assert.equal(api.read().tasks[0].title, revision.tasks[0].title);
  assert.equal(JSON.parse(localStorage.getItem('rupaiDailyGoals:v1'))[0].id, 'goal-1');
  assert.deepEqual(JSON.parse(localStorage.getItem('rupaiUnrelated:v1')), { keep: true });
});

test('rejects invalid backups without changing existing data', () => {
  const { api, localStorage } = loadRevisionStore();
  api.write({ tasks: [], sessions: [], mistakes: [], goals: [], achievements: [] });
  const before = localStorage.getItem('rupaiRevision:v1');

  assert.throws(() => api.importData({ format: 'unknown', version: 1, data: {} }));
  assert.equal(localStorage.getItem('rupaiRevision:v1'), before);
});
