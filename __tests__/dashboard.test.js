/**
 * @jest-environment jsdom
 */
const { formatTime, initDashboard, renderTimers, tickTimer } = require('../scripts/dashboard.js');

beforeEach(() => {
  document.body.innerHTML = `
    <div id="todo-dashboard">
      <input id="timer-name" value="T1"/>
      <input id="timer-hours"  value="0"/>
      <input id="timer-minutes" value="0"/>
      <input id="timer-seconds" value="2"/>
      <button id="start-timer-btn"></button>
      <ul id="timer-list"></ul>
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
});