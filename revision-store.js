(function () {
  'use strict';
  const KEY = 'rupaiRevision:v1';
  const DAY = 86400000;
  const listeners = new Set();

  const emptyState = () => ({
    version: 1,
    tasks: [],
    sessions: [],
    mistakes: [],
    goals: [],
    achievements: [],
    filters: { query: '', subject: 'All', status: 'All', mode: 'All', sort: 'Priority' },
    notifications: { enabled: false, time: '18:00' },
    updatedAt: new Date().toISOString()
  });

  function read() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      return stored && Array.isArray(stored.tasks) ? { ...emptyState(), ...stored } : emptyState();
    } catch { return emptyState(); }
  }

  function write(next) {
    const state = { ...emptyState(), ...next, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => fn(state));
    window.dispatchEvent(new CustomEvent('rupai:revision-changed', { detail: state }));
    return state;
  }

  function isoDate(value = new Date()) {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
  }

  function addDays(value, days) {
    return isoDate(new Date(new Date(value).getTime() + days * DAY));
  }

  function normalizeTask(item) {
    const now = new Date();
    return {
      id: String(item.id || `revision-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      sourceContentId: String(item.sourceContentId || item.id || ''),
      sourceType: item.sourceType || item.type || 'Topic',
      sourceRoute: item.sourceRoute || item.route || 'index.html',
      title: item.title || 'Untitled topic', subject: item.subject || 'General',
      chapter: item.chapter || item.subject || 'General', topic: item.topic || item.title || '',
      thumbnail: item.thumbnail || '', revisionMode: item.revisionMode || 'Quick Recall',
      estimatedMinutes: Number(item.estimatedMinutes || 10), status: item.status || 'upcoming',
      priority: Number(item.priority || 3), progress: Number(item.progress || 0),
      accuracy: Number(item.accuracy || 0), firstStudiedAt: item.firstStudiedAt || now.toISOString(),
      lastRevisedAt: item.lastRevisedAt || null, nextRevisionAt: item.nextRevisionAt || isoDate(now),
      revisionCount: Number(item.revisionCount || 0), incorrectCount: Number(item.incorrectCount || 0),
      masteryLevel: Number(item.masteryLevel || 0), selfRating: item.selfRating || null,
      streak: Number(item.streak || 0), isBookmarked: Boolean(item.isBookmarked),
      isCompleted: Boolean(item.isCompleted), addedToGoal: Boolean(item.addedToGoal),
      prompts: Array.isArray(item.prompts) && item.prompts.length ? item.prompts : [
        { question: `What are the most important ideas in ${item.title || 'this topic'}?`, answer: item.description || 'Open the original content and recall its key facts, dates, people and connections.' },
        { question: `How would you explain ${item.title || 'this topic'} in your own words?`, answer: 'Use a short summary, one example and one memory clue.' }
      ]
    };
  }

  function addTask(item, schedule = 'today') {
    const state = read();
    const existing = state.tasks.find(task => task.sourceContentId === String(item.sourceContentId || item.id || '') && task.sourceType === (item.sourceType || item.type || 'Topic'));
    const dates = { today: 0, tomorrow: 1, smart: item.accuracy && item.accuracy > 80 ? 3 : 0 };
    const nextRevisionAt = schedule instanceof Date ? isoDate(schedule) : addDays(new Date(), dates[schedule] ?? 0);
    if (existing) {
      existing.nextRevisionAt = nextRevisionAt;
      existing.isCompleted = false;
      existing.status = schedule === 'today' ? 'due' : 'upcoming';
      return { state: write(state), task: existing, added: false };
    }
    const task = normalizeTask({ ...item, nextRevisionAt, status: schedule === 'today' ? 'due' : 'upcoming' });
    state.tasks.unshift(task);
    return { state: write(state), task, added: true };
  }

  function updateTask(id, changes) {
    const state = read();
    state.tasks = state.tasks.map(task => task.id === String(id) ? { ...task, ...changes } : task);
    return write(state);
  }

  function removeTask(id) {
    const state = read();
    state.tasks = state.tasks.filter(task => task.id !== String(id));
    state.goals = state.goals.filter(goal => goal.taskId !== String(id));
    return write(state);
  }

  function intervalFor(rating, revisionCount) {
    const base = { Forgot: 0, Difficult: 1, Almost: 3, Easy: 7, Again: 0, Hard: 1, Good: 3 }[rating] ?? 1;
    if (!base) return 0;
    return Math.min(60, Math.round(base * Math.max(1, 1 + revisionCount * .65)));
  }

  function completeSession(taskId, result) {
    const state = read();
    const task = state.tasks.find(item => item.id === String(taskId));
    if (!task) return state;
    const now = new Date();
    const total = Number(result.totalQuestions || 1);
    const correct = Number(result.correctAnswers || 0);
    const incorrect = Math.max(0, Number(result.incorrectAnswers ?? total - correct));
    const accuracy = Math.round((correct / total) * 100);
    const rating = result.selfRating || (accuracy >= 85 ? 'Easy' : accuracy >= 60 ? 'Almost' : 'Difficult');
    const nextRevisionAt = addDays(now, intervalFor(rating, task.revisionCount));
    const session = {
      id: `session-${Date.now()}`, taskId: task.id, startedAt: result.startedAt || now.toISOString(),
      completedAt: now.toISOString(), duration: Number(result.duration || task.estimatedMinutes * 60),
      totalQuestions: total, correctAnswers: correct, incorrectAnswers: incorrect, accuracy,
      selfRating: rating, starsEarned: Math.max(1, Math.round(accuracy / 25)), nextRevisionAt
    };
    state.sessions.unshift(session);
    Object.assign(task, {
      lastRevisedAt: now.toISOString(), nextRevisionAt, revisionCount: task.revisionCount + 1,
      accuracy, incorrectCount: task.incorrectCount + incorrect, progress: 100,
      masteryLevel: Math.min(5, Math.max(0, task.masteryLevel + (rating === 'Easy' ? 2 : rating === 'Forgot' ? -1 : 1))),
      selfRating: rating, status: 'completed', isCompleted: true, streak: task.streak + 1
    });
    state.goals = state.goals.map(goal => goal.taskId === task.id ? { ...goal, completed: true } : goal);
    if (!state.achievements.includes('First Revision')) state.achievements.push('First Revision');
    if (state.sessions.length >= 50 && !state.achievements.includes('50 Topics Revised')) state.achievements.push('50 Topics Revised');
    return write(state);
  }

  function addMistake(item) {
    const state = read();
    const existing = state.mistakes.find(mistake => mistake.question === item.question && mistake.taskId === item.taskId);
    if (existing) Object.assign(existing, { ...item, wrongCount: existing.wrongCount + 1, attemptedAt: new Date().toISOString(), masteryStatus: 'needs-review' });
    else state.mistakes.unshift({ id: `mistake-${Date.now()}`, attemptedAt: new Date().toISOString(), wrongCount: 1, correctReviewCount: 0, masteryStatus: 'needs-review', ...item });
    return write(state);
  }

  function reviewMistake(id, correct) {
    const state = read();
    state.mistakes = state.mistakes.map(item => item.id === id ? {
      ...item, correctReviewCount: item.correctReviewCount + (correct ? 1 : 0),
      wrongCount: item.wrongCount + (correct ? 0 : 1),
      masteryStatus: correct && item.correctReviewCount + 1 >= 2 ? 'mastered' : 'needs-review'
    } : item);
    return write(state);
  }

  function addGoal(taskId) {
    const state = read();
    const task = state.tasks.find(item => item.id === taskId);
    if (!task || state.goals.some(goal => goal.taskId === taskId)) return state;
    task.addedToGoal = true;
    state.goals.push({ id: `goal-${Date.now()}`, taskId, title: `Revise ${task.title}`, completed: false, date: isoDate() });
    localStorage.setItem('rupaiDailyGoals:v1', JSON.stringify(state.goals));
    return write(state);
  }

  function setFilters(filters) { const state = read(); state.filters = { ...state.filters, ...filters }; return write(state); }
  function setNotifications(changes) { const state = read(); state.notifications = { ...state.notifications, ...changes }; return write(state); }

  window.RupaiRevision = { read, write, addTask, updateTask, removeTask, completeSession, addMistake, reviewMistake, addGoal, setFilters, setNotifications, normalizeTask, isoDate, addDays, intervalFor, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})();
