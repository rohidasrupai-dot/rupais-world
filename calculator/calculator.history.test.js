const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {

class MockElement {
  constructor() {
    this.hidden = false;
    this.textContent = '';
    this.innerHTML = '';
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.classList = { add() {}, remove() {} };
  }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  closest() { return null; }
  setAttribute() {}
  select() {}
  remove() {}
  appendChild() {}
}

const elements = {
  '#liveDisplay': new MockElement(),
  '#result': new MockElement(),
  '#expression': new MockElement(),
  '#displayMessage': new MockElement(),
  '#historyList': new MockElement(),
  '#clearHistory': new MockElement(),
  '#funFactCard': new MockElement(),
  '#funFactText': new MockElement(),
  '#factCountdown': new MockElement()
};

const saved = new Map();
const localStorage = {
  getItem(key) { return saved.has(key) ? saved.get(key) : null; },
  setItem(key, value) { saved.set(key, value); },
  removeItem(key) { saved.delete(key); }
};

let copiedValue = '';
const intervalDelays = [];
const document = {
  querySelector(selector) { return elements[selector] || null; },
  addEventListener() {},
  createElement() { return new MockElement(); },
  execCommand() { return true; },
  body: new MockElement()
};

const context = vm.createContext({
  document,
  localStorage,
  navigator: { clipboard: { async writeText(value) { copiedValue = value; } } },
  window: {
    setTimeout(callback) { callback(); },
    setInterval(callback, delay) { intervalDelays.push(delay); return intervalDelays.length; },
    clearInterval() {}
  },
  console,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  RegExp,
  Error,
  Date,
  setTimeout(callback) { callback(); }
});

vm.runInContext(fs.readFileSync(__dirname + '/math-facts.js', 'utf8'), context);
vm.runInContext(fs.readFileSync(__dirname + '/calculator.js', 'utf8'), context);

const facts = context.window.MATH_FUN_FACTS;
assert.ok(facts.length >= 200, 'At least 200 facts are required');
assert.equal(new Set(facts).size, facts.length, 'Every math fact must be unique');
assert.ok(facts.every((fact) => typeof fact === 'string' && fact.length > 10 && fact.length < 180), 'Facts must be short readable strings');
assert.ok(intervalDelays.includes(300000), 'Fun facts must rotate every five minutes');
assert.ok(intervalDelays.includes(1000), 'The visual countdown must update every second');

const initialFactIndex = localStorage.getItem('rupaisWorld.lastMathFactIndex.v1');
context.showNextFunFact(false);
const nextFactIndex = localStorage.getItem('rupaisWorld.lastMathFactIndex.v1');
assert.notEqual(nextFactIndex, initialFactIndex, 'Consecutive fun facts must not repeat');

context.reset();
context.enterNumber('5');
context.enterNumber('5');
context.setOperator('*');
context.enterNumber('6');
assert.equal(elements['#expression'].textContent, '55 × 6 =', 'Calculation must appear on the first line');
assert.equal(elements['#result'].textContent, '330', 'Live answer must appear on the second line');
assert.deepEqual(
  JSON.parse(localStorage.getItem('rupaisWorld.calculationHistory.v1'))[0],
  { expression: '55 × 6', result: '330' },
  'A valid live answer must enter history without pressing equals'
);

context.enterNumber('0');
assert.deepEqual(
  JSON.parse(localStorage.getItem('rupaisWorld.calculationHistory.v1')),
  [{ expression: '55 × 60', result: '3300' }],
  'Typing another digit must update the active live history row instead of adding stale rows'
);
context.solve();
assert.equal(
  JSON.parse(localStorage.getItem('rupaisWorld.calculationHistory.v1')).length,
  1,
  'Pressing equals after a live result must not duplicate it'
);
elements['#clearHistory'].listeners.click();

context.reset();
context.enterNumber('2');
context.enterNumber('5');
context.enterNumber('0');
context.setOperator('*');
context.enterNumber('1');
context.enterNumber('5');
context.runAction('percent');
assert.equal(elements['#expression'].textContent, '250 × 15% =', 'Percentage expression must remain readable');
assert.equal(elements['#result'].textContent, '37.5', 'Multiplication percentage must behave like a phone calculator');
assert.deepEqual(
  JSON.parse(localStorage.getItem('rupaisWorld.calculationHistory.v1'))[0],
  { expression: '250 × 15%', result: '37.5' },
  'A completed percentage calculation must enter history'
);

context.reset();
context.enterNumber('2');
context.enterNumber('0');
context.enterNumber('0');
context.setOperator('+');
context.enterNumber('1');
context.enterNumber('0');
context.runAction('percent');
assert.equal(elements['#result'].textContent, '220', 'Addition percentage must use the left value as its base');
elements['#clearHistory'].listeners.click();

function typeNumber(value) {
  for (const digit of String(value)) context.enterNumber(digit);
}

function calculate(left, operator, right) {
  context.reset();
  typeNumber(left);
  context.setOperator(operator);
  typeNumber(right);
  context.solve();
}

function readHistory() {
  return JSON.parse(localStorage.getItem('rupaisWorld.calculationHistory.v1') || '[]');
}

calculate(86, '*', 4);
assert.deepEqual(readHistory()[0], { expression: '86 × 4', result: '344' });

context.solve();
assert.equal(readHistory().length, 1, 'Repeated equals must not duplicate the latest entry');

context.reset();
typeNumber(9);
context.setOperator('+');
context.solve();
assert.equal(readHistory().length, 1, 'An incomplete expression must not enter history');

calculate(125, '/', 5);
calculate(56, '*', 8);
calculate(144, '+', 12);
calculate(99, '-', 42);
assert.deepEqual(readHistory().slice(0, 5), [
  { expression: '99 − 42', result: '57' },
  { expression: '144 + 12', result: '156' },
  { expression: '56 × 8', result: '448' },
  { expression: '125 ÷ 5', result: '25' },
  { expression: '86 × 4', result: '344' }
]);
assert.deepEqual(context.loadHistory(), readHistory(), 'Saved history must reload from localStorage');

for (let number = 1; number <= 25; number += 1) calculate(number, '+', 1);
assert.equal(readHistory().length, 20, 'History must be capped at 20 entries');
assert.deepEqual(readHistory()[0], { expression: '25 + 1', result: '26' });

const copyButton = new MockElement();
copyButton.dataset.copyHistory = '0';
await elements['#historyList'].listeners.click({ target: { closest() { return copyButton; } } });
assert.equal(copiedValue, '26', 'Copy must write only the result');

elements['#clearHistory'].listeners.click();
assert.equal(localStorage.getItem('rupaisWorld.calculationHistory.v1'), null);
assert.match(elements['#historyList'].innerHTML, /No calculations yet/);

console.log('Calculator tests passed: 5+ history calculations, ordering, persistence, copy, Clear All, 20-item limit, and 220 rotating fun facts.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
