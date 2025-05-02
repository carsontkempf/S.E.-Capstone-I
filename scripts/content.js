// scripts/content.js
(async () => {
  const DEFAULT_VISIBILITY = false;

  // Create container
  const container = document.createElement('div');
  container.id = 'todo-container';

  // Load main template
  const templateUrl = chrome.runtime.getURL('scripts/todo.html');
  const templateHtml = await fetch(templateUrl).then(res => res.text());
  container.innerHTML = templateHtml;
  document.body.appendChild(container);

<<<<<<< HEAD
  // Initialize elements
  const taskInput       = container.querySelector('#taskInput');
  const urlInput        = container.querySelector('#urlInput');
  const addTaskButton   = container.querySelector('#addTaskButton');
  const resizeHandle    = container.querySelector('#resize-handle');
  const taskList        = container.querySelector('#taskList');
  const toggleButton    = container.querySelector('#todo-toggle');
  const dashboardButton = container.querySelector('#dashboardButton');
  const todoBox         = container.querySelector('#todo');
  const todoBody        = container.querySelector('#todo-body');
  const todoHeader      = container.querySelector('#todo-header');

  // Set stopwatch icon src
  const dashboardIcon = dashboardButton.querySelector('img');
  dashboardIcon.src = chrome.runtime.getURL('images/stopwatch.png');

  // Storage-backed tasks
=======
  const taskInput = container.querySelector('#taskInput');
  const urlInput = container.querySelector('#urlInput');
  const addTaskButton = container.querySelector('#addTaskButton');
  const resizehandle = container.querySelector('#resize-handle');
  const taskList = container.querySelector('#taskList');
  const toggleButton = container.querySelector('#todo-toggle');
  const todoBox = container.querySelector('#todo');
  const todoBody = container.querySelector('#todo-body');
  const todoHeader = container.querySelector('#todo-header');
  const dashboardButton = container.querySelector('#dashboardButton');
>>>>>>> 015cd3a1ee4e9ddecc7165b5d7ef9b09d7e80cd8
  let tasks = [];

  async function loadTasks() {
    const result = await chrome.storage.local.get('tasks');
    tasks = result.tasks ? JSON.parse(result.tasks) : [];
  }

  async function saveTasks() {
    await chrome.storage.local.set({ tasks: JSON.stringify(tasks) });
  }

  function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.justifyContent = 'space-between';

      // title or link
      let textEl, valid;
      try {
        new URL(task.url, location.origin);
        valid = true;
      } catch {
        valid = false;
      }
      if (task.url && valid) {
        textEl = document.createElement('a');
        textEl.href = task.url.startsWith('http') ? task.url : 'https://' + task.url;
        textEl.target = '_blank';
        textEl.textContent = task.title;
      } else {
        textEl = document.createElement('span');
        textEl.textContent = task.title;
      }
      li.appendChild(textEl);

      // edit button
      const editBtn = document.createElement('button');
      editBtn.innerHTML = `<img src="${chrome.runtime.getURL('images/icons8-edit-24.png')}" alt="Edit">`;
      editBtn.addEventListener('click', () => editTask(index));
      li.appendChild(editBtn);

      // delete button
      const delBtn = document.createElement('button');
      delBtn.innerHTML = `<img src="${chrome.runtime.getURL('images/icons8-delete-24.png')}" alt="Delete">`;
      delBtn.addEventListener('click', () => {
        tasks.splice(index, 1);
        saveTasks().then(renderTasks);
      });
      li.appendChild(delBtn);

      taskList.appendChild(li);
    });
  }

<<<<<<< HEAD
  function editTask(idx) {
    const task = tasks[idx];
    const newTitle = prompt('Edit title', task.title);
    const newUrl   = prompt('Edit URL', task.url);
    if (newTitle !== null) tasks[idx].title = newTitle.trim() || task.title;
    if (newUrl   !== null) tasks[idx].url   = newUrl.trim();
    saveTasks().then(renderTasks);
  }

  function handleAdd() {
    if (!taskInput.style.display || taskInput.style.display === 'none') {
      taskInput.style.display     = 'block';
      urlInput.style.display      = 'block';
      addTaskButton.textContent   = '✔';
=======

  // TODO: Dashboard START
  let dashboardLocked = true;
  let dashboardDragging = false;
  let dashOffsetX = 0, dashOffsetY = 0;
  let relativeOffsetX = 0, relativeOffsetY = 0;
  let dashboardOpen = false;

  // Reference elements
  const dashboardPanel = document.createElement('div');

  // Style & create the dashboard
  dashboardPanel.id = 'todo-dashboard';
  dashboardPanel.style.cssText = `
    position: absolute;
    width: 300px;
    height: 300px;
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0px 2px 10px rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 10px;
    z-index: 9999;
    display: none;
    cursor: move;
  `;

  dashboardPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0;">Dashboard</h3>
      <div style="display: flex; gap: 5px;">
        <button id="lockToggle" title="Lock Position" style="font-size: 14px;">🔒</button>
        <button id="closeDashboard" style="font-size: 14px;">✖️</button>
      </div>
    </div>
    <div id="dashboard-content" style="margin-top: 10px; display: flex; flex-direction: column; gap: 15px;">
      <!-- Timer Panel -->
      <div id="timer-panel" style="border: 1px solid #ccc; padding: 10px; border-radius: 6px;">
        <h4 style="margin-top: 0;">Timers</h4>
        <input id="timer-name" type="text" placeholder="Timer Name" style="width: 100%; margin-bottom: 5px;" />
        <input id="timer-minutes" type="number" placeholder="Minutes" min="1" style="width: 100%; margin-bottom: 5px;" />
        <button id="start-timer-btn" style="width: 100%; margin-bottom: 10px;">Start Timer</button>
        <ul id="timer-list" style="list-style: none; padding-left: 0;"></ul>
      </div>
    </div>
  `;
  document.body.appendChild(dashboardPanel);

  // Opens dashboard
  dashboardButton.addEventListener('click', () => {
    const buttonRect = dashboardButton.getBoundingClientRect();
    dashboardPanel.style.left = `${buttonRect.right + 10}px`;
    dashboardPanel.style.top = `${buttonRect.top}px`;
    dashboardPanel.style.display = 'block';
  });
  
  // Close Dashboard
  closeDashboard.addEventListener('click', () => {
    dashboardPanel.style.display = 'none';
  });
  
  lockToggle.addEventListener('click', () => {
    dashboardLocked = !dashboardLocked;
    lockToggle.textContent = dashboardLocked ? '🔒' : '🔓';
    dashboardPanel.classList.toggle('moveable', !dashboardLocked);
  
    if (dashboardLocked) {
      const todoRect = todoBox.getBoundingClientRect();
      const dashRect = dashboardPanel.getBoundingClientRect();
      relativeOffsetX = dashRect.left - todoRect.left;
      relativeOffsetY = dashRect.top - todoRect.top;
    }
  });

  // Move dashboard with todo box only if locked
  new MutationObserver(() => {
    if (dashboardLocked && dashboardPanel.style.display !== 'none') {
      const todoBoxRect = todoBox.getBoundingClientRect();
      dashboardPanel.style.left = `${todoBoxRect.left + relativeOffsetX}px`;
      dashboardPanel.style.top = `${todoBoxRect.top + relativeOffsetY}px`;
    }
  }).observe(todoBox, { attributes: true, attributeFilter: ['style'] });


  // Dashboard drag behavior when unlocked
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
  // TODO: Dashboard END

  const handleAddButton = () => {
    if (!pendingOpen) {
      taskInput.style.display = 'block';
      urlInput.style.display = 'block';
      addTaskButton.textContent = '✔';
>>>>>>> 015cd3a1ee4e9ddecc7165b5d7ef9b09d7e80cd8
      taskInput.focus();
    } else {
      const title = taskInput.value.trim();
      const url   = urlInput.value.trim();
      if (title) {
        tasks.push({ title, url });
        saveTasks().then(renderTasks);
      }
      taskInput.value              = '';
      urlInput.value               = '';
      taskInput.style.display      = 'none';
      urlInput.style.display       = 'none';
      addTaskButton.textContent    = '+';
    }
  }

  addTaskButton.addEventListener('click', handleAdd);

  // Toggle visibility
  let isVisible = DEFAULT_VISIBILITY;
  toggleButton.addEventListener('click', () => {
    isVisible = !isVisible;
    todoBody.style.display      = isVisible ? 'block' : 'none';
    addTaskButton.style.display = isVisible ? 'block' : 'none';
    resizeHandle.style.display  = isVisible ? 'block' : 'none';
    toggleButton.textContent    = isVisible ? '☰' : '–';
  });

  // Drag & resize
  let dragging = false, resizing = false, offsetX = 0, offsetY = 0;
  todoHeader.addEventListener('mousedown', e => {
    dragging = true;
    offsetX = e.clientX - todoBox.offsetLeft;
    offsetY = e.clientY - todoBox.offsetTop;
  });
  resizeHandle.addEventListener('mousedown', e => { resizing = true; e.stopPropagation(); });
  document.addEventListener('mousemove', e => {
    if (dragging) {
      todoBox.style.left   = `${e.clientX - offsetX}px`;
      todoBox.style.top    = `${e.clientY - offsetY}px`;
      todoBox.style.bottom = 'auto';
      todoBox.style.right  = 'auto';
    }
    if (resizing) {
      todoBox.style.width  = `${e.clientX - todoBox.getBoundingClientRect().left}px`;
      todoBox.style.height = `${e.clientY - todoBox.getBoundingClientRect().top}px`;
    }
  });
  document.addEventListener('mouseup', () => { dragging = false; resizing = false; });

  // -------- Dashboard Module --------
  async function fetchTasks() {
    const result = await chrome.storage.local.get('tasks');
    return result.tasks ? JSON.parse(result.tasks) : [];
  }

  function createDashboardItem(task, index) {
    const li = document.createElement('li');
    li.className = 'dashboard-item';

    // Title or link
    const titleEl = task.url && task.url.trim()
      ? Object.assign(document.createElement('a'), {
          href: task.url.startsWith('http') ? task.url : `https://${task.url}`,
          target: '_blank',
          textContent: task.title,
          className: 'dashboard-title'
        })
      : Object.assign(document.createElement('span'), {
          textContent: task.title,
          className: 'dashboard-title'
        });
    li.appendChild(titleEl);

    // Timer input
    const timerInput = Object.assign(document.createElement('input'), {
      type: 'time',
      className: 'dashboard-timer-input',
      value: '00:00'
    });
    li.appendChild(timerInput);

    // Start timer button
    const startBtn = Object.assign(document.createElement('button'), {
      textContent: 'Start Timer',
      className: 'dashboard-start-btn'
    });
    li.appendChild(startBtn);

    // Edit button
    const editBtn = Object.assign(document.createElement('button'), {
      innerHTML: `<img src="${chrome.runtime.getURL('images/icons8-edit-24.png')}" alt="Edit">`,
      className: 'dashboard-edit-btn'
    });
    li.appendChild(editBtn);

    // Delete button
    const deleteBtn = Object.assign(document.createElement('button'), {
      innerHTML: `<img src="${chrome.runtime.getURL('images/icons8-delete-24.png')}" alt="Delete">`,
      className: 'dashboard-delete-btn'
    });
    li.appendChild(deleteBtn);

    // Timer logic
    let intervalId;
    startBtn.addEventListener('click', () => {
      if (intervalId) clearInterval(intervalId);
      let [h, m] = timerInput.value.split(':').map(Number);
      let totalSeconds = h * 3600 + m * 60;
      intervalId = setInterval(() => {
        if (totalSeconds <= 0) {
          clearInterval(intervalId);
          alert(`Timer finished for "${task.title}"`);
        } else {
          totalSeconds--;
          const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
          const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
          timerInput.value = `${hh}:${mm}`;
        }
      }, 1000);
    });

    // Edit functionality
    editBtn.onclick = () => {
      const newTitle = prompt('Edit title', task.title);
      const newUrl   = prompt('Edit URL', task.url);
      if (newTitle !== null) tasks[index].title = newTitle.trim() || task.title;
      if (newUrl   !== null) tasks[index].url   = newUrl.trim();
      saveTasks().then(() => { renderDashboardTasks(); renderTasks(); });
    };

    // Delete functionality
    deleteBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks().then(() => { renderDashboardTasks(); renderTasks(); });
    };

    return li;
  }

  async function renderDashboardTasks() {
    const dashboardList = document.querySelector('#dashboard-taskList');
    dashboardList.innerHTML = '';
    const allTasks = await fetchTasks();
    allTasks.forEach((task, idx) => {
      dashboardList.appendChild(createDashboardItem(task, idx));
    });
  }

  // ----- Dashboard open handler -----
  function openDashboard() {
    // avoid duplicates
    if (document.getElementById('todo-dashboard')) return;

    // hide base widget
    todoBox.style.display = 'none';

    // build dashboard overlay
    const dash = document.createElement('div');
    dash.id = 'todo-dashboard';
    dash.innerHTML = `
      <div id="dashboard-header">
        <button id="dashboard-close">✕</button>
        <h1 style="margin:0;text-align:center;font-size:18px;">To‑Do Dashboard</h1>
      </div>
      <div id="dashboard-body" style="padding:10px;padding-bottom:40px;">
        <ul id="dashboard-taskList" style="padding-left:0;margin-top:10px;"></ul>
      </div>`;
    document.body.appendChild(dash);

    // make dashboard draggable
    const dashHeader = dash.querySelector('#dashboard-header');
    let dDragging = false, dOffX = 0, dOffY = 0;
    dashHeader.addEventListener('mousedown', (e) => {
      dDragging = true;
      const rect = dash.getBoundingClientRect();
      dOffX = e.clientX - rect.left;
      dOffY = e.clientY - rect.top;
      dash.style.transform = 'none'; // disable centering transform once moved
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (dDragging) {
        dash.style.left = `${e.clientX - dOffX}px`;
        dash.style.top  = `${e.clientY - dOffY}px`;
      }
    });
    document.addEventListener('mouseup', () => { dDragging = false; });

    // populate tasks
    renderDashboardTasks();
  }

  dashboardButton.addEventListener('click', openDashboard);
  // ----- end handler -----

  // Close dashboard handler
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'dashboard-close') {
      document.getElementById('todo-dashboard')?.remove();
      todoBox.style.display = 'block'; // re‑show base widget
    }
  });
  // -------- End Dashboard Module --------

  // Initial load
  await loadTasks();
  renderTasks();
<<<<<<< HEAD
})();
=======


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
      pauseBtn.textContent = timer.paused ? '▶ Resume' : '⏸ Pause';
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
      cancelBtn.textContent = '✖ Cancel';
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
      timer.remaining = 0;
      alert(`"${timer.name}" has completed!`);
    }
    renderTimers();
  };
  
  startTimerBtn.addEventListener('click', () => {
    const name = document.getElementById('timer-name').value.trim();
    const minutes = parseInt(document.getElementById('timer-minutes').value.trim());
  
    if (!name || isNaN(minutes) || minutes <= 0) {
      alert('Enter a valid timer name and duration.');
      return;
    }
  
    const totalSeconds = minutes * 60;
    const timer = {
      name,
      remaining: totalSeconds,
      paused: false,
      interval: null,
    };
  
    timer.interval = setInterval(() => tickTimer(timer), 1000);
    timers.push(timer);
    renderTimers();
  
    document.getElementById('timer-name').value = '';
    document.getElementById('timer-minutes').value = '';
  });
})();
>>>>>>> 015cd3a1ee4e9ddecc7165b5d7ef9b09d7e80cd8
