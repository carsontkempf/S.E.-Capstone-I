// Fallback stub for chrome API in non-browser environments (e.g., Jest)
if (typeof chrome === 'undefined') {
  global.chrome = {
    storage: {
      local: {
        get: (key) => Promise.resolve({ tasks: null }),
        set: (obj) => Promise.resolve()
      }
    },
    runtime: {
      getURL: (path) => path
    }
  };
}

// Use window.tasks for shared state so tests can manipulate it
if (typeof window.tasks === 'undefined') {
  window.tasks = [];
}

// Creates and returns a <li> element for a given task
function createTaskElement(task, index) {
  const li = document.createElement('li');
  let textElement;
  let validUrl = true;
  try {
    new URL(task.url, location.origin);
  } catch {
    validUrl = false;
  }
  if (task.url && validUrl) {
    textElement = document.createElement('a');
    let dest;
    try { dest = new URL(task.url); }
    catch {
      dest = /\w\.\w/.test(task.url)
        ? new URL('https://' + task.url)
        : new URL(task.url, location.href);
    }
    textElement.href = dest;
    textElement.target = '_blank';
    textElement.textContent = task.title;
  } else {
    textElement = document.createElement('span');
    textElement.textContent = task.title;
  }
  textElement.style.flex = '1';
  li.appendChild(textElement);

  const editBtn = document.createElement('button');
  const editImg = document.createElement('img');
  editImg.src = chrome.runtime.getURL('images/edit.png');
  editImg.alt = 'Edit';
  editBtn.appendChild(editImg);
  li.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete');
  const deleteImg = document.createElement('img');
  deleteImg.src = chrome.runtime.getURL('images/delete.png');
  deleteImg.alt = 'Delete';
  deleteBtn.appendChild(deleteImg);
  li.appendChild(deleteBtn);

  // Hook up delete
  deleteBtn.addEventListener('click', () => deleteTask(index));

  // Hook up edit
  editBtn.addEventListener('click', () => editTask(index, li));

  return li;
}

// Adds a new task and re-renders
function addTask(title, url) {
  window.tasks.push({ title, url });
  saveTasks();
  renderTasks();
}

// Deletes a task at index and re-renders
function deleteTask(index) {
  window.tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

// Edits a task: switches the list item into edit mode, then on confirm updates
function editTask(index, li) {
  const task = window.tasks[index];
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
  const saveBtn = document.createElement('button');
  saveBtn.classList.add('save');
  const saveImg = document.createElement('img');
  saveImg.src = chrome.runtime.getURL('images/checkmark.png');
  saveImg.alt = 'Confirm';
  saveBtn.appendChild(saveImg);
  li.appendChild(saveBtn);
  function confirmEdit() {
    const newTitle = inputTitle.value.trim();
    const newUrl = inputUrl.value.trim();
    if (!newTitle) window.tasks.splice(index, 1);
    else window.tasks[index] = { title: newTitle, url: newUrl };
    saveTasks();
    renderTasks();
  }
  saveBtn.addEventListener('click', confirmEdit);
  inputTitle.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') renderTasks();
  });
  inputUrl.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') renderTasks();
  });
  inputTitle.focus();
}

async function loadTasks() {
  const result = await chrome.storage.local.get('tasks');
  window.tasks = result.tasks ? JSON.parse(result.tasks) : [];
}

async function saveTasks() {
  await chrome.storage.local.set({ tasks: JSON.stringify(window.tasks) });
}

function renderTasks() {
  const taskListEl = document.getElementById('taskList');
  if (!taskListEl) return;
  taskListEl.innerHTML = '';
  window.tasks.forEach((task, index) => {
    const li = createTaskElement(task, index);
    taskListEl.appendChild(li);
  });
}

function handleAddButton(taskInput, urlInput, addTaskButton) {
  if (!handleAddButton.pendingOpen) {
    taskInput.closest('.input-wrapper').classList.remove('hidden');
    urlInput.closest('.input-wrapper').classList.remove('hidden');
    addTaskButton.innerHTML = '';

    const checkIcon = document.createElement('img');
    checkIcon.src = chrome.runtime.getURL('images/checkmark.png');
    checkIcon.alt = 'Confirm';
    checkIcon.style.width = '26px';
    checkIcon.style.height = '26px';
    addTaskButton.appendChild(checkIcon);

    addTaskButton.classList.add('confirming');
    taskInput.focus();
    handleAddButton.pendingOpen = true;
  } else {
    const title = taskInput.value.trim();
    const url = urlInput.value.trim();

    if (!title && !url) {
      // If both empty exit
      taskInput.closest('.input-wrapper').classList.add('hidden');
      urlInput.closest('.input-wrapper').classList.add('hidden');

      addTaskButton.textContent = '+';
      handleAddButton.pendingOpen = false;
    } else if (title) {
      // if title is set create task
      addTask(title, url);

      taskInput.value = '';
      urlInput.value = '';
      taskInput.closest('.input-wrapper').classList.add('hidden');
      urlInput.closest('.input-wrapper').classList.add('hidden');

      addTaskButton.textContent = '+';
      handleAddButton.pendingOpen = false;
    } else if (url) {
      // if url has data but no title return
      return;
    }
    addTaskButton.classList.remove('confirming');
  }
}
handleAddButton.pendingOpen = false;

function toggleVisibility(todoBox, todoBody, addTaskButton, resizehandle, toggleButton) {
  toggleVisibility.isVisible = !toggleVisibility.isVisible;

  if (toggleVisibility.isVisible) {
    todoBox.classList.remove('collapsed');
    todoBody.style.display = 'block';
    addTaskButton.style.display = 'block';
    resizehandle.style.display = 'block';

    if (!toggleVisibility.savedWidth || !toggleVisibility.savedHeight) {
      todoBox.classList.add('resizing');
      const rect = todoBox.getBoundingClientRect();
      toggleVisibility.savedWidth = `${rect.width}px`;
      toggleVisibility.savedHeight = `${rect.height}px`;
      todoBox.classList.remove('resizing');
    }

    todoBox.style.width = toggleVisibility.savedWidth;
    todoBox.style.height = toggleVisibility.savedHeight;
  } else {
    todoBody.style.display = 'none';
    addTaskButton.style.display = 'none';
    resizehandle.style.display = 'none';

    const rect = todoBox.getBoundingClientRect();
    toggleVisibility.savedWidth = `${rect.width}px`;
    toggleVisibility.savedHeight = `${rect.height}px`;

    todoBox.style.height = 'auto';
    todoBox.style.width = '';
    todoBox.style.minWidth = '';
    todoBox.style.minHeight = '';
    todoBox.classList.add('collapsed');

    document.dispatchEvent(new CustomEvent('dashboard-close'));
  }

  toggleButton.textContent = toggleVisibility.isVisible ? '☰' : '–';
}
toggleVisibility.isVisible = false;
toggleVisibility.savedWidth = '';
toggleVisibility.savedHeight = '';

function setupDrag(todoBox, todoHeader) {
  let isDragging = false,
    offsetX = 0,
    offsetY = 0;

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
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function setupResize(todoBox, resizeHandle) {
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    // clear any previously‑locked minimums so the box can shrink again
    todoBox.style.minWidth = '';
    todoBox.style.minHeight = '';
    todoBox.classList.add('resizing');
    // lock position for resize: fix current location
    const rect = todoBox.getBoundingClientRect();
    todoBox.style.left = `${rect.left}px`;
    todoBox.style.top = `${rect.top}px`;
    todoBox.style.bottom = 'auto';
    todoBox.style.right = 'auto';
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      todoBox.style.width = `${e.clientX - todoBox.getBoundingClientRect().left}px`;
      todoBox.style.height = `${e.clientY - todoBox.getBoundingClientRect().top}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      // Lock new dimensions as minimums
      const rect = todoBox.getBoundingClientRect();
      todoBox.style.minWidth = `${rect.width}px`;
      todoBox.style.minHeight = `${rect.height}px`;
    }
    isResizing = false;
    todoBox.classList.remove('resizing');
  });
}

// Injects the todo and dashboard templates into the container
async function injectTemplates() {
  const container = document.getElementById('todo-container');
  // Fetch and append the todo HTML
  const todoHTML = await fetch(chrome.runtime.getURL('templates/todo.html'))
    .then(response => response.text());
  container.innerHTML += todoHTML;
  // Fetch and append the dashboard HTML
  const dashHTML = await fetch(chrome.runtime.getURL('templates/dashboard.html'))
    .then(response => response.text());
  container.innerHTML += dashHTML;
}

async function initTodo() {
  const waitForDocumentLoad = async () =>
    new Promise((resolve) => {
      let container = document.getElementById('todo-container');
      if (container !== null) resolve(container);
      else
        setTimeout(
          () => waitForDocumentLoad().then((result) => resolve(result)),
          100
        );
    });
  const container = await waitForDocumentLoad();

  const DEFAULT_VISIBILITY = false;

  const taskInput = container.querySelector('#taskInput');
  const urlInput = container.querySelector('#urlInput');
  const addTaskButton = container.querySelector('#addTaskButton');
  const resizehandle = container.querySelector('#resize-handle');
  const taskList = container.querySelector('#taskList');
  const toggleButton = container.querySelector('#todo-toggle');
  const todoBox = container.querySelector('#todo');
  const todoBody = container.querySelector('#todo-body');
  const todoHeader = container.querySelector('#todo-header');
  // Restore dashboardButton setup
  // Task data and rendering

  // Dashboard open dispatcher
  const dashboardButton = container.querySelector('#dashboardButton');
  const dashboardBtnIcon = document.createElement('img');
  dashboardBtnIcon.src = chrome.runtime.getURL('images/clock.png');
  dashboardBtnIcon.alt = 'Dashboard';
  dashboardBtnIcon.style.width = '24px';
  dashboardBtnIcon.style.height = '24px';
  dashboardButton.innerHTML = '';
  dashboardButton.appendChild(dashboardBtnIcon);

  dashboardButton.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('dashboard-open'));
  });

  // wait until an element matching selector exists in DOM
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

  // Enter/Escape key handling
  [taskInput, urlInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddButton(taskInput, urlInput, addTaskButton);
      } else if (e.key === 'Escape') {
        taskInput.value = '';
        urlInput.value = '';
        taskInput.closest('.input-wrapper').classList.add('hidden');
        urlInput.closest('.input-wrapper').classList.add('hidden');

        addTaskButton.textContent = '+';
        handleAddButton.pendingOpen = false;
        addTaskButton.classList.remove('confirming');
      }
    });
  });

  let isVisible = DEFAULT_VISIBILITY;
  let resizeHeight = todoBox.style.height;
  let resizeWidth = todoBox.style.width;
  let savedWidth = '';
  let savedHeight = '';
  if (!isVisible) {
    todoBody.style.display = 'none';
    addTaskButton.style.display = 'none';
    resizehandle.style.display = 'none';
    toggleButton.textContent = '–';
  }

  addTaskButton.addEventListener('click', () =>
    handleAddButton(taskInput, urlInput, addTaskButton)
  );
  toggleButton.addEventListener('click', () =>
    toggleVisibility(todoBox, todoBody, addTaskButton, resizehandle, toggleButton)
  );

  setupDrag(todoBox, todoHeader);
  setupResize(todoBox, resizehandle);

  await loadTasks();
  renderTasks();
  addTaskButton.scrollIntoView();
}

// Only run initialization in browser environments, not in Jest tests
if (typeof module === 'undefined' || typeof module.exports !== 'object') {
  initTodo();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tasks: window.tasks,
    loadTasks,
    saveTasks,
    renderTasks,
    createTaskElement,
    addTask,
    deleteTask,
    editTask,
    handleAddButton,
    toggleVisibility,
    setupDrag,
    setupResize
  };
}
