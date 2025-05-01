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
})();