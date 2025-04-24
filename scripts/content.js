(async () => {
  const DEFAULT_VISIBILITY = false;
  const container = document.createElement('div');
  container.id = 'todo-container';
  const templateUrl = chrome.runtime.getURL('templates/todo.html');
  const templateHtml = await fetch(templateUrl).then((res) => res.text());
  container.innerHTML = templateHtml;
<<<<<<< HEAD
=======
  
>>>>>>> e7fb3c3 (Changed emojis to icons)
  document.body.appendChild(container);

  const taskInput = container.querySelector('#taskInput');
  const urlInput = container.querySelector('#urlInput');
  const addTaskButton = container.querySelector('#addTaskButton');
  const resizehandle = container.querySelector('#resize-handle');
  const taskList = container.querySelector('#taskList');
  const toggleButton = container.querySelector('#todo-toggle');
  const todoBox = container.querySelector('#todo');
  const todoBody = container.querySelector('#todo-body');
  const todoHeader = container.querySelector('#todo-header');
<<<<<<< HEAD
=======
  const dashboardBtnIcon = document.createElement('img');
  dashboardBtnIcon.src = chrome.runtime.getURL('images/clock.png');
  dashboardBtnIcon.alt = 'Dashboard';
  dashboardBtnIcon.style.width = '24px';
  dashboardBtnIcon.style.height = '24px';

  const dashboardButton = document.getElementById('dashboardButton');
  dashboardButton.innerHTML = '';
  dashboardButton.appendChild(dashboardBtnIcon);

<<<<<<< Updated upstream
  const dashboardUrl = chrome.runtime.getURL('templates/dashboard.html');

>>>>>>> 2118579 (Re-organized files to have separate responsibilities)
=======
>>>>>>> e7fb3c3 (Changed emojis to icons)
>>>>>>> Stashed changes
  let tasks = [];
  let pendingOpen = false;

  const loadTasks = async () => {
    await chrome.storage.local.get('tasks').then((result) => {
      tasks = result.tasks ? JSON.parse(result.tasks) : [];
    });
  };

  const saveTasks = async () => {
    chrome.storage.local.set({ tasks: JSON.stringify(tasks) });
  };

  const renderTasks = () => {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '0px';
      li.style.justifyContent = 'flex-start';

      let textElement, destination, validUrl;

      // Validate URLs
      try {
        new URL(task.url, location.origin);
        validUrl = true;
      } catch (e) {
        validUrl = false;
      }

      if (task.url && validUrl) {
        textElement = document.createElement('a');

        // Parse a particular URL entry
        try {
          destination = new URL(task.url);
        } catch (e) {
          if (/\w\.\w/.test(task.url))
            destination = new URL('https://' + task.url);
          else destination = new URL(task.url, location.href);
        }
        textElement.href = destination;
        textElement.target = '_blank';
        textElement.textContent = task.title;
        textElement.style.textDecoration = 'none';
        textElement.style.color = 'inherit';
      } else {
        textElement = document.createElement('span');
        textElement.textContent = task.title;
      }
      textElement.style.flex = '1';
      li.appendChild(textElement);

      const editButton = document.createElement('button');
      const editImg = document.createElement('img');
      editImg.src = chrome.runtime.getURL('images/icons8-edit-24.png');
      editImg.alt = 'Edit';
      editButton.appendChild(editImg);
      li.appendChild(editButton);

      const deleteButton = document.createElement('button');
      const deleteImg = document.createElement('img');
      deleteImg.src = chrome.runtime.getURL('images/icons8-delete-24.png');
      deleteImg.alt = 'Delete';
      deleteButton.appendChild(deleteImg);
      li.appendChild(deleteButton);

      deleteButton.addEventListener('click', () => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
      });

      editButton.addEventListener('click', () => {
        const inputTitle = document.createElement('input');
        inputTitle.type = 'text';
        inputTitle.value = task.title;
        inputTitle.style.marginRight = '8px';

        const inputUrl = document.createElement('input');
        inputUrl.type = 'text';
        inputUrl.value = task.url || '';
        inputUrl.style.marginRight = '8px';

        li.innerHTML = '';
        li.appendChild(inputTitle);
        li.appendChild(inputUrl);

        const saveButton = document.createElement('button');
        const saveImg = document.createElement('img');
        saveImg.src = chrome.runtime.getURL('images/save_icon.png');
        saveImg.alt = 'Save';
        saveButton.appendChild(saveImg);
        li.appendChild(saveButton);

        const saveEdit = () => {
          const newTitle = inputTitle.value.trim();
          const newUrl = inputUrl.value.trim();
          if (newTitle === '') {
            tasks.splice(index, 1);
          } else {
            tasks[index] = { title: newTitle, url: newUrl };
          }
          saveTasks();
          renderTasks();
        };

        saveButton.addEventListener('click', saveEdit);
        inputTitle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') renderTasks();
        });
        inputUrl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') renderTasks();
        });

        inputTitle.focus();
      });

      taskList.appendChild(li);
    });
  };

<<<<<<< HEAD
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
<<<<<<< Updated upstream


  // load external dashboard template
  const dashboardHtml = await fetch(dashboardUrl).then(res => res.text());
  dashboardPanel.innerHTML = dashboardHtml;
=======
  dashboardPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 340px;
    width: 300px;
    height: 300px;
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0px 2px 10px rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 10px;
    z-index: 9999;
    display: none;
    overflow: auto;
    resize: both;
    min-width: 180px;
    min-height: 100px;
    max-height: 90vh;
  `;


  dashboardPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0;">Dashboard</h3>
      <div style="display: flex; gap: 5px;">
        <button id="lockToggle" title="Lock Position" style="font-size: 14px;"></button>
        <button id="closeDashboard" style="font-size: 14px;">X</button>
      </div>
    </div>
    <div id="dashboard-content" style="margin-top: 10px; display: flex; flex-direction: column; gap: 15px;">
      <!-- Timer Panel -->
      <div id="timer-panel" style="border: 1px solid #ccc; padding: 10px; border-radius: 6px;">
        <h4 style="margin-top: 0;">Timers</h4>
        <input id="timer-name" type="text" placeholder="Timer Name" style="width: 100%; margin-bottom: 5px;" />
        <div style="display: flex; justify-content: space-between; gap: 5px; margin-bottom: 5px;">
          <div style="flex: 1;">
            <label style="font-size: 12px;">Hours</label>
            <div style="display: flex;">
              <input id="timer-hours" type="number" value="0" min="0" style="flex: 1;" />
            </div>
          </div>
          <div style="flex: 1;">
            <label style="font-size: 12px;">Minutes</label>
            <div style="display: flex;">
              <input id="timer-minutes" type="number" value="0" min="0" max="59" style="flex: 1;" />
            </div>
          </div>
          <div style="flex: 1;">
            <label style="font-size: 12px;">Seconds</label>
            <div style="display: flex;">
              <input id="timer-seconds" type="number" value="0" min="0" max="59" style="flex: 1;" />
            </div>
          </div>
        </div>
        <button id="start-timer-btn" style="width: 100%; margin-bottom: 10px;">Start Timer</button>

        <ul id="timer-list" style="list-style: none; padding-left: 0;"></ul>
      </div>
    </div>
  `;
>>>>>>> Stashed changes
  document.body.appendChild(dashboardPanel);

  // Opens dashboard
  dashboardButton.addEventListener('click', () => {
    const todoRect = todoBox.getBoundingClientRect();
    dashboardPanel.style.left = `${todoRect.right + 10}px`;
    dashboardPanel.style.top = `${todoRect.top}px`;
    dashboardPanel.style.display = 'block';

    // Force-lock and set icon
    dashboardLocked = true;
    lockImg.src = chrome.runtime.getURL('images/lock.png');
    dashboardPanel.classList.remove('moveable');

    relativeOffsetX = dashboardPanel.getBoundingClientRect().left - todoRect.left;
    relativeOffsetY = dashboardPanel.getBoundingClientRect().top - todoRect.top;
  });

  // Close Dashboard
  closeDashboard.addEventListener('click', () => {
    dashboardPanel.style.display = 'none';
    dashboardOpen = false;
  });

  // Lock/Unlock icon logic
  const lockImg = document.createElement('img');
  lockImg.src = chrome.runtime.getURL('images/lock.png');
  lockImg.alt = 'Lock Toggle';
  lockImg.style.width = '16px';
  lockImg.style.height = '16px';
  lockToggle.innerHTML = '';
  lockToggle.appendChild(lockImg);

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

<<<<<<< Updated upstream
>>>>>>> 2118579 (Re-organized files to have separate responsibilities)
=======
>>>>>>> e7fb3c3 (Changed emojis to icons)
>>>>>>> Stashed changes
  const handleAddButton = () => {
    if (!pendingOpen) {
        taskInput.style.display = 'block';
        urlInput.style.display = 'block';
        addTaskButton.textContent = '✔';
        taskInput.focus();
        pendingOpen = true;
    } else {
      const title = taskInput.value.trim();
      const url = urlInput.value.trim();

      if (!title && !url) {
        // If both empty exit
        taskInput.style.display = 'none';
        urlInput.style.display = 'none';
        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (title) {
        // if title is set create task
        tasks.push({ title, url });
        saveTasks();
        renderTasks();

        taskInput.value = '';
        urlInput.value = '';
        taskInput.style.display = 'none';
        urlInput.style.display = 'none';
        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (url) {
        // if url has data but no title return
        return;
      }
    }
  };

  // Enter/Escape key handling
  [taskInput, urlInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddButton();
      } else if (e.key === 'Escape') {
        taskInput.value = '';
        urlInput.value = '';
        taskInput.style.display = 'none';
        urlInput.style.display = 'none';
        addTaskButton.textContent = '+';
        pendingOpen = false;
      }
    });
  });

    let isVisible = DEFAULT_VISIBILITY;
    if (!isVisible) {
        todoBody.style.display = 'none';
        addTaskButton.style.display = 'none';
        resizehandle.style.display = 'none';
        toggleButton.textContent = '–';
    }
    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;
        todoBody.style.display = isVisible ? 'block' : 'none';
        addTaskButton.style.display = isVisible ? 'block' : 'none';
        resizehandle.style.display = isVisible ? 'block' : 'none';
        toggleButton.textContent = isVisible ? '☰' : '–';
    });

  // Drag functionality
  let isDragging = false,
    offsetX = 0,
    offsetY = 0;

  const resizeHandle = container.querySelector('#resize-handle');
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
    e.stopPropagation();
  });

  todoHeader.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = todoBox.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      todoBox.style.left = `${e.clientX - offsetX}px`;
      todoBox.style.top = `${e.clientY - offsetY}px`;
      todoBox.style.bottom = 'auto';
      todoBox.style.right = 'auto';
    }
    if (isResizing) {
      todoBox.style.width = `${e.clientX - todoBox.getBoundingClientRect().left}px`;
      todoBox.style.height = `${e.clientY - todoBox.getBoundingClientRect().top}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });

  addTaskButton.addEventListener('click', handleAddButton);
  await loadTasks();
  renderTasks();
<<<<<<< HEAD
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
<<<<<<< Updated upstream
=======
  
  // startTimerBtn.addEventListener('click', () => {
  //   const name = document.getElementById('timer-name').value.trim();
  //   const minutes = parseInt(document.getElementById('timer-minutes').value.trim());
  
  //   if (!name || isNaN(minutes) || minutes <= 0) {
  //     alert('Enter a valid timer name and duration.');
  //     return;
  //   }
  
  //   const totalSeconds = minutes * 60;
  //   const timer = {
  //     name,
  //     remaining: totalSeconds,
  //     paused: false,
  //     interval: null,
  //   };
  
  //   timer.interval = setInterval(() => tickTimer(timer), 1000);
  //   timers.push(timer);
  //   renderTimers();
  
  //   document.getElementById('timer-name').value = '';
  //   document.getElementById('timer-minutes').value = '';
  // });
>>>>>>> Stashed changes

  startTimerBtn.addEventListener('click', () => {
    const name = document.getElementById('timer-name').value.trim();
    const hours = parseInt(document.getElementById('timer-hours').value.trim()) || 0;
    const minutes = parseInt(document.getElementById('timer-minutes').value.trim()) || 0;
    const seconds = parseInt(document.getElementById('timer-seconds').value.trim()) || 0;
  
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
    if (!name || totalSeconds <= 0) {
      alert('Enter a valid timer name and duration.');
      return;
    }
  
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
    document.getElementById('timer-hours').value = 0;
    document.getElementById('timer-minutes').value = 0;
    document.getElementById('timer-seconds').value = 0;
  });
  
<<<<<<< Updated upstream
>>>>>>> 2118579 (Re-organized files to have separate responsibilities)
=======
>>>>>>> e7fb3c3 (Changed emojis to icons)
>>>>>>> Stashed changes
})();
