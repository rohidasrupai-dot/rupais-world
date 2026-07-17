const display = document.querySelector('#liveDisplay');
const result = document.querySelector('#result');
const expression = document.querySelector('#expression');
const displayMessage = document.querySelector('#displayMessage');
const historyList = document.querySelector('#historyList');
const clearHistoryButton = document.querySelector('#clearHistory');
const funFactCard = document.querySelector('#funFactCard');
const funFactText = document.querySelector('#funFactText');
const factCountdown = document.querySelector('#factCountdown');
const soundToggle = document.querySelector('#soundToggle');

const HISTORY_STORAGE_KEY = 'rupaisWorld.calculationHistory.v1';
const HISTORY_LIMIT = 20;
const FUN_FACT_INTERVAL = 5 * 60 * 1000;
const FUN_FACT_STORAGE_KEY = 'rupaisWorld.lastMathFactIndex.v1';
const SOUND_STORAGE_KEY = 'rupaisWorld.calculatorSounds.v1';

let current = '0';
let stored = null;
let pendingOperator = null;
let overwrite = false;
let lastAnswer = 0;
let calculationHistory = loadHistory();
let liveHistoryExpression = null;
let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
let audioContext = null;

const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };

function updateSoundControl() {
  if (!soundToggle) return;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? 'Turn calculator sounds off' : 'Turn calculator sounds on');
}

function playTapTone(frequency = 440, duration = .045) {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(.035, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (_) {
    // Audio is an enhancement; calculator input must keep working if it is unavailable.
  }
}

updateSoundControl();

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.expression === 'string' && typeof item.result === 'string').slice(0, HISTORY_LIMIT);
  } catch (_) {
    return [];
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(calculationHistory));
}

function renderHistory() {
  if (!calculationHistory.length) {
    historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
    return;
  }
  historyList.innerHTML = calculationHistory.map((item, index) => `
    <article class="calc-history-entry">
      <div><span>${escapeHtml(item.expression)}</span><strong>= ${escapeHtml(item.result)}</strong></div>
      <button class="copy-history" type="button" data-copy-history="${index}" aria-label="Copy result ${escapeHtml(item.result)}">▣</button>
    </article>
  `).join('');
}

function addHistory(expressionValue, resultValue) {
  if (!expressionValue || !resultValue || resultValue === 'Error') return;
  const entry = { expression: expressionValue, result: resultValue };
  const latest = calculationHistory[0];
  if (latest && latest.expression === entry.expression && latest.result === entry.result) return;
  calculationHistory.unshift(entry);
  calculationHistory = calculationHistory.slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function updateLiveHistory(expressionValue, resultValue) {
  if (!expressionValue || !resultValue || resultValue === 'Error') return;
  const entry = { expression: expressionValue, result: resultValue };
  const latest = calculationHistory[0];

  if (liveHistoryExpression && latest && latest.expression === liveHistoryExpression) {
    calculationHistory[0] = entry;
  } else if (latest && latest.expression === entry.expression && latest.result === entry.result) {
    liveHistoryExpression = entry.expression;
    return;
  } else {
    calculationHistory.unshift(entry);
    calculationHistory = calculationHistory.slice(0, HISTORY_LIMIT);
  }

  liveHistoryExpression = entry.expression;
  saveHistory();
  renderHistory();
}

function format(value) {
  if (!Number.isFinite(value)) return 'Error';
  return String(Math.round((value + Number.EPSILON) * 1e10) / 1e10);
}

function reveal(message) {
  display.hidden = false;
  let calculationLine = '';
  let answerLine = current;
  if (message) {
    calculationLine = message.includes('=') ? message : '';
  } else if (pendingOperator && stored !== null) {
    if (overwrite) {
      calculationLine = `${format(stored)} ${symbols[pendingOperator]}`;
      answerLine = '';
    } else {
      const liveExpression = `${format(stored)} ${symbols[pendingOperator]} ${current}`;
      calculationLine = `${liveExpression} =`;
      answerLine = format(calculate(stored, Number(current), pendingOperator));
      updateLiveHistory(liveExpression, answerLine);
    }
  }
  expression.textContent = calculationLine;
  result.textContent = answerLine;
  displayMessage.textContent = calculationLine.endsWith('=') && answerLine && answerLine !== 'Error'
    ? '✨ Great job! You did it! ✨'
    : 'Type your magical maths ✨';
}

function calculate(left, right, operator) {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '*') return left * right;
  if (operator === '/') return right === 0 ? NaN : left / right;
  if (operator === '^') return left ** right;
  return right;
}

function enterNumber(value) {
  if (current === 'Error' || overwrite) {
    current = value === '.' ? '0.' : value;
    overwrite = false;
  } else if (value === '.') {
    if (!current.includes('.')) current += '.';
  } else {
    current = current === '0' ? value : current + value;
  }
  if (current.replace(/[.\-]/g, '').length > 12) current = current.slice(0, -1);
  reveal();
}

function setOperator(operator) {
  const value = Number(current);
  if (pendingOperator && !overwrite) {
    const completedExpression = `${format(stored)} ${symbols[pendingOperator]} ${format(value)}`;
    current = format(calculate(stored, value, pendingOperator));
    addHistory(completedExpression, current);
    stored = Number(current);
  } else if (stored === null) {
    stored = value;
  }
  if (current === 'Error' || !Number.isFinite(stored)) {
    reset('Please try another calculation');
    return;
  }
  liveHistoryExpression = null;
  pendingOperator = operator;
  overwrite = true;
  reveal();
}

function solve() {
  if (!pendingOperator || stored === null || current === 'Error' || overwrite) return;
  const left = stored;
  const right = Number(current);
  const operator = pendingOperator;
  current = format(calculate(left, right, operator));
  if (current !== 'Error') {
    lastAnswer = Number(current);
    addHistory(`${format(left)} ${symbols[operator]} ${format(right)}`, current);
  }
  liveHistoryExpression = null;
  stored = null;
  pendingOperator = null;
  overwrite = true;
  reveal(current === 'Error' ? 'That calculation is not possible' : `${format(left)} ${symbols[operator]} ${format(right)} =`);
}

function applyPercent() {
  const percentValue = Number(current);
  if (!Number.isFinite(percentValue)) return;

  if (pendingOperator && stored !== null && !overwrite) {
    const left = stored;
    const operator = pendingOperator;
    const right = operator === '+' || operator === '-'
      ? left * percentValue / 100
      : percentValue / 100;
    const percentExpression = `${format(left)} ${symbols[operator]} ${format(percentValue)}%`;
    current = format(calculate(left, right, operator));
    if (current !== 'Error') {
      lastAnswer = Number(current);
      addHistory(percentExpression, current);
    }
    liveHistoryExpression = null;
    stored = null;
    pendingOperator = null;
    overwrite = true;
    reveal(current === 'Error' ? 'That calculation is not possible' : `${percentExpression} =`);
    return;
  }

  const percentExpression = `${format(percentValue)}%`;
  current = format(percentValue / 100);
  if (current !== 'Error') {
    lastAnswer = Number(current);
    addHistory(percentExpression, current);
  }
  overwrite = true;
  reveal(`${percentExpression} =`);
}

function reset(message = 'Fresh start ✨') {
  liveHistoryExpression = null;
  current = '0';
  stored = null;
  pendingOperator = null;
  overwrite = false;
  reveal(message);
}

function unary(action) {
  const value = Number(current);
  let answer = value;
  let label = action;
  if (action === 'percent') { answer = value / 100; label = `${format(value)}%`; }
  if (action === 'sign') { answer = -value; label = 'Change sign'; }
  if (action === 'square') { answer = value ** 2; label = `${format(value)}²`; }
  if (action === 'cube') { answer = value ** 3; label = `${format(value)}³`; }
  if (action === 'sqrt') { answer = value < 0 ? NaN : Math.sqrt(value); label = `√${format(value)}`; }
  if (action === 'cbrt') { answer = Math.cbrt(value); label = `∛${format(value)}`; }
  if (action === 'reciprocal') { answer = value === 0 ? NaN : 1 / value; label = `1 ÷ ${format(value)}`; }
  if (action === 'sin') { answer = Math.sin(value * Math.PI / 180); label = `sin(${format(value)}°)`; }
  if (action === 'cos') { answer = Math.cos(value * Math.PI / 180); label = `cos(${format(value)}°)`; }
  if (action === 'tan') { answer = Math.tan(value * Math.PI / 180); label = `tan(${format(value)}°)`; }
  if (action === 'log') { answer = value > 0 ? Math.log10(value) : NaN; label = `log(${format(value)})`; }
  if (action === 'ln') { answer = value > 0 ? Math.log(value) : NaN; label = `ln(${format(value)})`; }
  if (action === 'exp') { answer = Math.exp(value); label = `EXP(${format(value)})`; }
  if (action === 'ten-power') { answer = 10 ** value; label = `10^${format(value)}`; }
  if (action === 'factorial') {
    if (value < 0 || !Number.isInteger(value) || value > 170) answer = NaN;
    else { answer = 1; for (let number = 2; number <= value; number += 1) answer *= number; }
    label = `${format(value)}!`;
  }
  current = format(answer);
  if (current !== 'Error') {
    lastAnswer = Number(current);
    addHistory(label, current);
  }
  overwrite = true;
  reveal(current === 'Error' ? 'Try a different number ✨' : `${label} =`);
}

function runAction(action) {
  if (action === 'clear') reset();
  else if (action === 'backspace') {
    if (!overwrite && current !== 'Error') current = current.length > 1 ? current.slice(0, -1) : '0';
    reveal();
  } else if (action === 'equals') solve();
  else if (action === 'percent') applyPercent();
  else if (action === 'power') setOperator('^');
  else if (action === 'pi') { current = format(Math.PI); overwrite = true; reveal('π'); }
  else if (action === 'answer') { current = format(lastAnswer); overwrite = true; reveal('Previous answer'); }
  else if (action === 'parentheses') reveal('Parentheses are ready');
  else unary(action);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.number !== undefined) enterNumber(button.dataset.number);
  else if (button.dataset.operator) setOperator(button.dataset.operator);
  else if (button.dataset.action) runAction(button.dataset.action);
  else return;
  playTapTone(button.dataset.action === 'equals' ? 620 : 440);
  button.classList.add('pressed');
  window.setTimeout(() => button.classList.remove('pressed'), 110);
});

soundToggle?.addEventListener('click', () => {
  if (soundEnabled) playTapTone(520, .06);
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? 'on' : 'off');
  updateSoundControl();
  soundToggle.classList.add('pressed');
  window.setTimeout(() => soundToggle.classList.remove('pressed'), 130);
});

document.addEventListener('keydown', (event) => {
  let selector = '';
  if (/^[0-9.]$/.test(event.key)) selector = `[data-number="${event.key}"]`;
  else if ('+-*/'.includes(event.key)) selector = `[data-operator="${event.key}"]`;
  else if (event.key === 'Enter' || event.key === '=') selector = '[data-action="equals"]';
  else if (event.key === 'Escape') selector = '[data-action="clear"]';
  else if (event.key === 'Backspace') selector = '[data-action="backspace"]';
  const button = selector ? document.querySelector(selector) : null;
  if (!button) return;
  event.preventDefault();
  button.click();
});

clearHistoryButton.addEventListener('click', () => {
  calculationHistory = [];
  liveHistoryExpression = null;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  renderHistory();
});

historyList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy-history]');
  if (!button) return;
  const item = calculationHistory[Number(button.dataset.copyHistory)];
  if (!item) return;
  try {
    await navigator.clipboard.writeText(item.result);
    button.textContent = '✓';
    button.classList.add('copied');
    window.setTimeout(() => { button.textContent = '▣'; button.classList.remove('copied'); }, 900);
  } catch (_) {
    const field = document.createElement('textarea');
    field.value = item.result;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
});

renderHistory();

let currentFactIndex = -1;
let funFactTimer;
let countdownTimer;
let nextFactAt = 0;

function pickFactIndex() {
  const facts = window.MATH_FUN_FACTS || [];
  if (!facts.length) return -1;
  const savedIndex = Number(localStorage.getItem(FUN_FACT_STORAGE_KEY));
  const blocked = new Set([currentFactIndex]);
  if (currentFactIndex === -1 && Number.isInteger(savedIndex)) blocked.add(savedIndex);
  const choices = facts.map((_, index) => index).filter((index) => !blocked.has(index));
  return choices[Math.floor(Math.random() * choices.length)] ?? 0;
}

function showNextFunFact(animate = true) {
  const facts = window.MATH_FUN_FACTS || [];
  const nextIndex = pickFactIndex();
  if (nextIndex < 0) return;
  const applyFact = () => {
    currentFactIndex = nextIndex;
    funFactText.textContent = facts[nextIndex];
    localStorage.setItem(FUN_FACT_STORAGE_KEY, String(nextIndex));
    funFactCard.classList.remove('changing');
  };
  if (!animate) { applyFact(); return; }
  funFactCard.classList.add('changing');
  window.setTimeout(applyFact, 360);
}

function restartFunFactTimer() {
  window.clearInterval(funFactTimer);
  window.clearInterval(countdownTimer);
  nextFactAt = Date.now() + FUN_FACT_INTERVAL;
  updateFactCountdown();
  funFactTimer = window.setInterval(() => {
    showNextFunFact(true);
    nextFactAt = Date.now() + FUN_FACT_INTERVAL;
    updateFactCountdown();
  }, FUN_FACT_INTERVAL);
  countdownTimer = window.setInterval(updateFactCountdown, 1000);
}

function updateFactCountdown() {
  const remaining = Math.max(0, nextFactAt - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  factCountdown.textContent = `New fact in ${minutes}:${seconds}`;
}

funFactCard.addEventListener('click', () => {
  showNextFunFact(true);
  restartFunFactTimer();
});

showNextFunFact(false);
restartFunFactTimer();
