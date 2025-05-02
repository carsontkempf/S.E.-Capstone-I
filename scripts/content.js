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

  const taskInput = container.querySelector('#taskInput');
  const urlInput = container.querySelector('#urlInput');
  const addTaskButton = container.querySelector('#addTaskButton');
  const resizeHandle = container.querySelector('#resize-handle');
  const taskList = container.querySelector('#taskList');
  const toggleButton = container.querySelector('#todo-toggle');
  const todoBox = container.querySelector('#todo');
  const todoBody = container.querySelector('#todo-body');
  const todoHeader = container.querySelector('#todo-header');
  const dashboardButton = container.querySelector('#dashboardButton');
  const dashboardIcon = dashboardButton.querySelector('img');
  dashboardIcon.src = chrome.runtime.getURL('images/stopwatch.png');
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


  // TODO: Dashboard START
  let dashboardLocked = false;
  let dashboardDragging = false;
  let dashOffsetX = 0, dashOffsetY = 0;
  let relativeOffsetX = 0, relativeOffsetY = 0;
  let dashboardOpen = false;

  // Reference elements
  const dashboardPanel = document.createElement('div');
  // style & position dashboard panel
  dashboardPanel.id = 'todo-dashboard';
  dashboardPanel.style.cssText = `
    position: absolute;
    width: 300px;
    max-width: 90%;
    background: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    border-radius: 8px;
    padding: 10px;
    z-index: 10001;
    display: none;
    cursor: move;
  `;
  // Load dashboard template
  const dashboardUrl = chrome.runtime.getURL('scripts/dashboard.html');
  let dashboardHtml = await fetch(dashboardUrl).then(res => res.text());
  // Remove only the opening wrapper tag for id="todo-dashboard" in the fetched template HTML
  dashboardHtml = dashboardHtml.replace(/^<div\s+id=["']todo-dashboard["'][^>]*>/, '');
  dashboardPanel.innerHTML = dashboardHtml;
  document.body.appendChild(dashboardPanel);

  // Reference new controls
  const closeDashboard = dashboardPanel.querySelector('#dashboard-close');
  const lockToggle = dashboardPanel.querySelector('#lockToggle');
  const startTimerBtn = dashboardPanel.querySelector('#start-timer-btn');
  const timerNameInput = dashboardPanel.querySelector('#timer-name');
  const timerMinutesInput = dashboardPanel.querySelector('#timer-minutes');
  const timerList = dashboardPanel.querySelector('#timer-list');

  // Enforce only letters and spaces in timer name
  timerNameInput.setAttribute('maxlength', '50');
  timerNameInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
  });

  // Enforce only numbers in minutes input
  timerMinutesInput.setAttribute('min', '0');
  timerMinutesInput.setAttribute('step', '1');
  timerMinutesInput.addEventListener('input', (e) => {
    // Remove non-digit characters
    e.target.value = e.target.value.replace(/\D+/g, '');
  });

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
    // drag only when clicking on header area
    if (!dashboardLocked && e.target.closest('#dashboard-header')) {
      dashboardDragging = true;
      // use offsetLeft/offsetTop for correct initial position
      dashOffsetX = e.clientX - dashboardPanel.offsetLeft;
      dashOffsetY = e.clientY - dashboardPanel.offsetTop;
      e.preventDefault(); // prevent focus shift/jumping
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

  addTaskButton.addEventListener('click', handleAddButton);

  // Toggle visibility
  let isVisible = DEFAULT_VISIBILITY;
  toggleButton.addEventListener('click', () => {
    // ensure dashboard is closed when toggling todo
    if (dashboardPanel && dashboardPanel.style.display === 'block') {
      dashboardPanel.style.display = 'none';
    }
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
    const dashboardList = dashboardPanel.querySelector('#dashboard-taskList');
    if (!dashboardList) return;
    dashboardList.innerHTML = '';
    const allTasks = await fetchTasks();
    allTasks.forEach((task, idx) => {
      dashboardList.appendChild(createDashboardItem(task, idx));
    });
  }

  // ----- Dashboard open handler -----
  function openDashboard() {
    // Just show the dashboard panel if hidden
    dashboardPanel.style.display = 'block';
    // Optionally hide the todo widget
    todoBox.style.display = 'none';
    // Render dashboard tasks if needed
    // renderDashboardTasks();
  }

  dashboardButton.addEventListener('click', () => {
    // close todo popup when opening dashboard
    todoBox.style.display = 'none';
    openDashboard();
  });
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


  // TIMER LOGIC
  
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
    const name = timerNameInput.value.trim();
    const minutes = parseInt(timerMinutesInput.value.trim());

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

    timerNameInput.value = '';
    timerMinutesInput.value = '';
  });
})();
