/**
 * @jest-environment jsdom
 */
const { formatTime, initDashboard, renderTimers, tickTimer } = require('../scripts/dashboard.js');

beforeEach(() => {
  global.Audio = jest.fn().mockImplementation((src) => ({ src, volume: null, play: jest.fn() }));
  document.body.innerHTML = `
    <div id="todo-dashboard">
      <div class="dashboard-header">
        <button id="lockToggle"></button>
        <button id="closeDashboard"></button>
      </div>
      <div id="dashboard-content">
        <input id="timer-name" value="T1"/>
        <input id="timer-hours"  value="0"/>
        <input id="timer-minutes" value="0"/>
        <input id="timer-seconds" value="2"/>
        <button id="start-timer-btn"></button>
        <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="0.5"/>
        <ul id="timer-list"></ul>
      </div>
    </div>
  `;
  initDashboard();  // wire up button handlers
});

describe('formatTime()', () => {
  test('formats seconds to Xm Ys', () => {
    expect(formatTime(90)).toBe('1m 30s');
  });
});

describe('Timer UI', () => {
  test('Start button adds a timer entry', () => {
    document.getElementById('start-timer-btn').click();
    expect(document.querySelectorAll('#timer-list li').length).toBe(1);
    const label = document.querySelector('#timer-list li div').textContent;
    expect(label).toMatch(/^T1: 0m [0-2]s$/);
  });

  test('tickTimer counts down and fires finish', () => {
    const timers = [{ name: 'X', remaining: 1, initialDuration: 1, paused: false, interval: null }];
    // spy on alert to avoid actual dialogs
    global.alert = jest.fn();
    renderTimers();  // ensure container
    tickTimer(timers[0]);
    expect(global.alert).toHaveBeenCalledWith('"X" has completed!');
  });

  test('tickTimer does nothing when paused', () => {
    // Timer paused should not decrement remaining nor fire alert
    global.alert = jest.fn();
    const timer = { name: 'P', remaining: 5, initialDuration: 5, paused: true, interval: null };
    tickTimer(timer);
    expect(timer.remaining).toBe(5);
    expect(global.alert).not.toHaveBeenCalled();
  });

  test('start multiple timers and delete one', () => {
    const startBtn = document.getElementById('start-timer-btn');
    // click twice to add two timers
    startBtn.click();
    startBtn.click();
    const itemsBefore = document.querySelectorAll('#timer-list li').length;
    expect(itemsBefore).toBe(2);
    // delete the first timer
    const deleteBtn = document.querySelector('#timer-list li button:nth-child(2)');
    deleteBtn.click();
    const itemsAfter = document.querySelectorAll('#timer-list li').length;
    expect(itemsAfter).toBe(1);
  });
});

test('close button hides dashboard', () => {
  document.getElementById('closeDashboard').click();
  expect(document.getElementById('todo-dashboard').style.display).toBe('none');
});

test('lockToggle toggles moveable class', () => {
  const panel = document.getElementById('todo-dashboard');
  const lock = document.getElementById('lockToggle');
  // initial click unlocks (moves to moveable)
  lock.click();
  expect(panel.classList.contains('moveable')).toBe(true);
  // second click locks (removes moveable)
  lock.click();
  expect(panel.classList.contains('moveable')).toBe(false);
});

test('dashboard-open event shows dashboard', () => {
  const panel = document.getElementById('todo-dashboard');
  panel.style.display = 'none';
  document.dispatchEvent(new CustomEvent('dashboard-open'));
  expect(panel.style.display).toBe('block');
});

test('volume-slider adjusts chime volume', () => {
  const vol = document.getElementById('volume-slider');
  vol.value = '0.2';
  vol.dispatchEvent(new Event('input'));
  // Audio called and its instance volume set
  const chimeInst = Audio.mock.results[0].value;
  expect(chimeInst.volume).toBeCloseTo(0.2);
});

test('Audio object created with correct sound URL', () => {
  expect(global.Audio).toHaveBeenCalledWith(expect.stringContaining('sounds/slot_machine_payout.wav'));
});
