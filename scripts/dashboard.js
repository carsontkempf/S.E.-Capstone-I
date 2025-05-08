// Timer formatting helper
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// In-memory timers list for dashboard
let timers = [];

// Renders timers into the #timer-list element
function renderTimers() {
  const timerList = document.getElementById('timer-list');
  if (!timerList) return;
  timerList.innerHTML = '';
  timers.forEach((timer, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.flexDirection = 'column';
    li.style.marginBottom = '10px';
    li.style.border = '1px solid #ccc';
    li.style.borderRadius = '5px';
    li.style.padding = '5px';

    const label = document.createElement('div');
    label.textContent = `${timer.name}: ${formatTime(timer.remaining)}`;
    label.style.fontWeight = 'bold';
    li.appendChild(label);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    controls.style.marginTop = '5px';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent =
      timer.paused && timer.remaining === timer.initialDuration
        ? '▶ Start'
        : timer.paused
          ? '▶ Resume'
          : '⏸ Pause';
    pauseBtn.addEventListener('click', () => {
      if (timer.paused) {
        timer.paused = false;
        timer.interval = setInterval(() => tickTimer(timer), 1000);
      } else {
        timer.paused = true;
        clearInterval(timer.interval);
      }
      renderTimers();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖ Delete';
    cancelBtn.addEventListener('click', () => {
      clearInterval(timer.interval);
      timers.splice(index, 1);
      renderTimers();
    });

    controls.appendChild(pauseBtn);
    controls.appendChild(cancelBtn);

    li.appendChild(controls);
    timerList.appendChild(li);
  });
}

// Advances a single timer by one second
function tickTimer(timer) {
  if (timer.paused) return;
  timer.remaining--;
  if (timer.remaining <= 0) {
    clearInterval(timer.interval);
    alert(`"${timer.name}" has completed!`);
    timer.remaining = timer.initialDuration;
    timer.paused = true;
    renderTimers();
    return;
  }
  renderTimers();
}

async function initDashboard() {
  const waitForDocumentLoad = async () =>
    new Promise((resolve) => {
      let dashboardPanel = document.getElementById('todo-dashboard');
      if (dashboardPanel !== null) resolve(dashboardPanel);
      else
        setTimeout(
          () => waitForDocumentLoad().then((result) => resolve(result)),
          100
        );
    });
  const dashboardPanel = await waitForDocumentLoad();

  // sound to play when a timer completes
  const chime = new Audio(
    chrome.runtime.getURL('sounds/slot_machine_payout.wav')
  );

  // TIMER LOGIC
  const startTimerBtn = document.getElementById('start-timer-btn');
  const timerList = document.getElementById('timer-list');

  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      const name = document.getElementById('timer-name').value.trim();
      const hours =
        parseInt(document.getElementById('timer-hours').value.trim()) || 0;
      const minutes =
        parseInt(document.getElementById('timer-minutes').value.trim()) || 0;
      const seconds =
        parseInt(document.getElementById('timer-seconds').value.trim()) || 0;

      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      if (!name || totalSeconds <= 0) {
        alert('Enter a valid timer name and duration.');
        return;
      }

      const timer = {
        name,
        remaining: totalSeconds,
        initialDuration: totalSeconds,
        paused: false,
        interval: null,
      };

      timer.interval = setInterval(() => tickTimer(timer), 1000);
      timers.push(timer);
      renderTimers();

      document.getElementById('timer-name').value = '';
      document.getElementById('timer-hours').value = 0;
      document.getElementById('timer-minutes').value = 0;
      document.getElementById('timer-seconds').value = 0;
    });
  }

  // initialize timers view
  renderTimers();

  // Element references
  const closeDashboard = document.getElementById('closeDashboard');
  if (closeDashboard) {
    closeDashboard.addEventListener('click', () => {
      if (!dashboardPanel) return;
      // Save current size
      const dashRect = dashboardPanel.getBoundingClientRect();
      savedDashWidth = `${dashRect.width}px`;
      savedDashHeight = `${dashRect.height}px`;

      dashboardPanel.style.display = 'none';
    });
  }

  const lockToggle = document.getElementById('lockToggle');
  if (lockToggle) {
    // Lock icon setup
    const lockImg = document.createElement('img');
    lockImg.src = chrome.runtime.getURL('images/lock_white.png');
    lockImg.alt = 'Lock Toggle';
    lockImg.style.width = '16px';
    lockImg.style.height = '16px';
    lockToggle.innerHTML = '';
    lockToggle.appendChild(lockImg);

    // Lock/Unlock Dashboard movement
    lockToggle.addEventListener('click', () => {
      dashboardLocked = !dashboardLocked;
      lockImg.src = chrome.runtime.getURL(
        dashboardLocked ? 'images/lock_white.png' : 'images/unlock_white.png'
      );
      if (dashboardPanel) {
        dashboardPanel.classList.toggle('moveable', !dashboardLocked);
      }

      if (dashboardLocked) {
        waitForElement('#todo').then((todoBox) => {
          if (!todoBox || !dashboardPanel) return;
          const todoRect = todoBox.getBoundingClientRect();
          const dashRect = dashboardPanel.getBoundingClientRect();
          relativeOffsetX = dashRect.left - todoRect.left;
          relativeOffsetY = dashRect.top - todoRect.top;
        });
      }
    });
  }

  // Open dashboard on custom event
  if (dashboardPanel) {
    document.addEventListener('dashboard-open', () => {
      const todoBox = document.getElementById('todo');
      if (!todoBox) return;
      const todoRect = todoBox.getBoundingClientRect();
      dashboardPanel.style.left = `${todoRect.right + 10}px`;
      dashboardPanel.style.top = `${todoRect.top}px`;
      dashboardPanel.style.display = 'block';
      dashboardLocked = true;
      if (lockToggle) {
        const lockImg = lockToggle.querySelector('img');
        if (lockImg) {
          lockImg.src = chrome.runtime.getURL('images/lock_white.png');
        }
      }
      dashboardPanel.classList.remove('moveable');
      relativeOffsetX =
        dashboardPanel.getBoundingClientRect().left - todoRect.left;
      relativeOffsetY = dashboardPanel.getBoundingClientRect().top - todoRect.top;
    });
  }

  // State variables
  let dashboardLocked = true;
  let dashboardDragging = false;
  let dashOffsetX = 0,
    dashOffsetY = 0;
  let relativeOffsetX = 0,
    relativeOffsetY = 0;

  async function waitForElement(selector) {
    const existing = document.querySelector(selector);
    if (existing) return existing;
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Sync position when todo moves (if locked) — only in real browser
  if (typeof module === 'undefined' || !module.exports) {
    waitForElement('#todo').then((todoBox) => {
      if (!todoBox || !dashboardPanel) return;
      const observer = new MutationObserver(() => {
        if (dashboardLocked && todoBox && dashboardPanel) {
          const todoRect = todoBox.getBoundingClientRect();
          dashboardPanel.style.left = `${todoRect.left + relativeOffsetX}px`;
          dashboardPanel.style.top = `${todoRect.top + relativeOffsetY}px`;
        }
      });
      observer.observe(todoBox, { attributes: true, attributeFilter: ['style'] });
    });
  }

  // Volume control
  if (dashboardPanel) {
    const volumeSlider = dashboardPanel.querySelector('#volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        chime.volume = parseFloat(volumeSlider.value);
      });
    }
  }

  // Drag dashboard when unlocked
  if (dashboardPanel) {
    dashboardPanel.addEventListener('mousedown', (e) => {
      if (!dashboardLocked && e.target.tagName !== 'BUTTON') {
        dashboardDragging = true;
        dashOffsetX = e.clientX - dashboardPanel.getBoundingClientRect().left;
        dashOffsetY = e.clientY - dashboardPanel.getBoundingClientRect().top;
        e.preventDefault();
      }
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (dashboardDragging && dashboardPanel) {
      dashboardPanel.style.left = `${e.clientX - dashOffsetX}px`;
      dashboardPanel.style.top = `${e.clientY - dashOffsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    dashboardDragging = false;
  });
}


// Auto-init in browser, but not in tests
if (typeof module === 'undefined' || !module.exports) {
  initDashboard();
}

// Export for Jest tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatTime, initDashboard, renderTimers, tickTimer };
}