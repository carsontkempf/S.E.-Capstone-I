(async () => {
  // Load dashboard template
  const dashboardUrl = chrome.runtime.getURL('templates/dashboard.html');
  const dashboardPanel = document.createElement('div');
  dashboardPanel.id = 'todo-dashboard';
  const dashboardHtml = await fetch(dashboardUrl).then((res) => res.text());
  dashboardPanel.innerHTML = dashboardHtml;
  document.body.appendChild(dashboardPanel);

  // sound to play when a timer completes
  const chime = new Audio(chrome.runtime.getURL('sounds/slot_machine_payout.wav'));

  // TIMER LOGIC
  const startTimerBtn = document.getElementById('start-timer-btn');
  const timerList = document.getElementById('timer-list');
  let timers = [];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderTimers = () => {
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
  };

  const tickTimer = (timer) => {
    if (timer.paused) return;
    timer.remaining--;
    if (timer.remaining <= 0) {
      clearInterval(timer.interval);

      // attempt to play alarm, then show alert
      chime.currentTime = 0;
      chime.loop = true;
      const playPromise = chime.play();

      const showAlert = () => {
        alert(`"${timer.name}" has completed!`);
        // stop alarm
        chime.pause();
        chime.currentTime = 0;
        chime.loop = false;

        // reset timer
        timer.remaining = timer.initialDuration;
        timer.paused = true;
        renderTimers();
      };

      if (playPromise !== undefined) {
        playPromise
          .catch(() => {})   // ignore autoplay failures
          .finally(showAlert);
      } else {
        showAlert();
      }
      return;
    }
    renderTimers();
  };

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

  // initialize timers view
  renderTimers();

  // Element references
  const closeDashboard = document.getElementById('closeDashboard');
  const lockToggle = document.getElementById('lockToggle');
  const todoBox = document.getElementById('todo');

  // Lock icon setup
  const lockImg = document.createElement('img');
  lockImg.src = chrome.runtime.getURL('images/lock.png');
  lockImg.alt = 'Lock Toggle';
  lockImg.style.width = '16px';
  lockImg.style.height = '16px';
  lockToggle.innerHTML = '';
  lockToggle.appendChild(lockImg);

  // Open dashboard on custom event
  document.addEventListener('dashboard-open', () => {
    const todoRect = todoBox.getBoundingClientRect();
    dashboardPanel.style.left = `${todoRect.right + 10}px`;
    dashboardPanel.style.top = `${todoRect.top}px`;
    dashboardPanel.style.display = 'block';
    dashboardLocked = true;
    lockImg.src = chrome.runtime.getURL('images/lock.png');
    dashboardPanel.classList.remove('moveable');
    relativeOffsetX =
      dashboardPanel.getBoundingClientRect().left - todoRect.left;
    relativeOffsetY = dashboardPanel.getBoundingClientRect().top - todoRect.top;
  });

  // State variables
  let dashboardLocked = true;
  let dashboardDragging = false;
  let dashOffsetX = 0,
    dashOffsetY = 0;
  let relativeOffsetX = 0,
    relativeOffsetY = 0;

  // Close Dashboard
  closeDashboard.addEventListener('click', () => {
    dashboardPanel.style.display = 'none';
  });

  // Lock/Unlock Dashboard movement
  lockToggle.addEventListener('click', () => {
    dashboardLocked = !dashboardLocked;
    lockImg.src = chrome.runtime.getURL(
      dashboardLocked ? 'images/lock.png' : 'images/unlock.png'
    );
    dashboardPanel.classList.toggle('moveable', !dashboardLocked);

    if (dashboardLocked) {
      const todoRect = todoBox.getBoundingClientRect();
      const dashRect = dashboardPanel.getBoundingClientRect();
      relativeOffsetX = dashRect.left - todoRect.left;
      relativeOffsetY = dashRect.top - todoRect.top;
    }
  });

  // Sync position when todo moves (if locked)
  new MutationObserver(() => {
    if (dashboardLocked && dashboardPanel.style.display !== 'none') {
      const todoRect = todoBox.getBoundingClientRect();
      dashboardPanel.style.left = `${todoRect.left + relativeOffsetX}px`;
      dashboardPanel.style.top = `${todoRect.top + relativeOffsetY}px`;
    }
  }).observe(todoBox, { attributes: true, attributeFilter: ['style'] });

  // Drag dashboard when unlocked
  dashboardPanel.addEventListener('mousedown', (e) => {
    if (!dashboardLocked && e.target.tagName !== 'BUTTON') {
      dashboardDragging = true;
      dashOffsetX = e.clientX - dashboardPanel.getBoundingClientRect().left;
      dashOffsetY = e.clientY - dashboardPanel.getBoundingClientRect().top;
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (dashboardDragging) {
      dashboardPanel.style.left = `${e.clientX - dashOffsetX}px`;
      dashboardPanel.style.top = `${e.clientY - dashOffsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    dashboardDragging = false;
  });
})();
