(async () => {
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
  let tasks = [];
  let pendingOpen = false;

  const loadTasks = async () => {
    await chrome.storage.local.get('tasks').then((result) => {
      tasks = result.tasks ? JSON.parse(result.tasks) : [];
    });
  };

  const saveTasks = async () => {
    await chrome.storage.local.set({ tasks: JSON.stringify(tasks) });
  };

  const renderTasks = () => {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      // Structure: text or link
      let textElement;
      let validUrl;
      try {
        new URL(task.url, location.origin);
        validUrl = true;
      } catch {
        validUrl = false;
      }
      if (task.url && validUrl) {
        textElement = document.createElement('a');
        let destination;
        try {
          destination = new URL(task.url);
        } catch {
          destination = /\w\.\w/.test(task.url)
            ? new URL('https://' + task.url)
            : new URL(task.url, location.href);
        }
        textElement.href = destination;
        textElement.target = '_blank';
        textElement.textContent = task.title;
      } else {
        textElement = document.createElement('span');
        textElement.textContent = task.title;
      }
      textElement.style.flex = '1';
      li.appendChild(textElement);

      const editButton = document.createElement('button');
      const editImg = document.createElement('img');
      editImg.src = chrome.runtime.getURL('images/edit.png');
      editImg.alt = 'Edit';
      editButton.appendChild(editImg);
      li.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete');
      const deleteImg = document.createElement('img');
      deleteImg.src = chrome.runtime.getURL('images/delete.png');
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
        saveButton.classList.add('save');
        const saveImg = document.createElement('img');
        saveImg.src = chrome.runtime.getURL('images/checkmark.png');
        saveImg.alt = 'Confirm';
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

  const handleAddButton = () => {
    if (!pendingOpen) {
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
      pendingOpen = true;
    } else {
      const title = taskInput.value.trim();
      const url = urlInput.value.trim();

      if (!title && !url) {
        // If both empty exit
        taskInput.closest('.input-wrapper').classList.add('hidden');
        urlInput.closest('.input-wrapper').classList.add('hidden');

        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (title) {
        // if title is set create task
        tasks.push({ title, url });
        saveTasks();
        renderTasks();

        taskInput.value = '';
        urlInput.value = '';
        taskInput.closest('.input-wrapper').classList.add('hidden');
        urlInput.closest('.input-wrapper').classList.add('hidden');

        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (url) {
        // if url has data but no title return
        return;
      }
      addTaskButton.classList.remove('confirming');
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
        taskInput.closest('.input-wrapper').classList.add('hidden');
        urlInput.closest('.input-wrapper').classList.add('hidden');

        addTaskButton.textContent = '+';
        pendingOpen = false;
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

  toggleButton.addEventListener('click', () => {
    isVisible = !isVisible;

    if (isVisible) {
      todoBox.classList.remove('collapsed');
      todoBody.style.display = 'block';
      addTaskButton.style.display = 'block';
      resizehandle.style.display = 'block';

      if (!savedWidth || !savedHeight) {
        todoBox.classList.add('resizing');
        const rect = todoBox.getBoundingClientRect();
        savedWidth = `${rect.width}px`;
        savedHeight = `${rect.height}px`;
        todoBox.classList.remove('resizing');
      }

      todoBox.style.width = savedWidth;
      todoBox.style.height = savedHeight;
    } else {
      todoBody.style.display = 'none';
      addTaskButton.style.display = 'none';
      resizehandle.style.display = 'none';

      const rect = todoBox.getBoundingClientRect();
      savedWidth = `${rect.width}px`;
      savedHeight = `${rect.height}px`;

      todoBox.style.height = 'auto';
      todoBox.style.width = '';
      todoBox.style.minWidth = '';
      todoBox.style.minHeight = '';
      todoBox.classList.add('collapsed');

      document.dispatchEvent(new CustomEvent('dashboard-close'));
    }

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
    if (isResizing) {
      // Lock new dimensions as minimums
      const rect = todoBox.getBoundingClientRect();
      todoBox.style.minWidth = `${rect.width}px`;
      todoBox.style.minHeight = `${rect.height}px`;
    }
    isResizing = false;
    todoBox.classList.remove('resizing');
  });

  addTaskButton.addEventListener('click', handleAddButton);
  await loadTasks();
  renderTasks();
})();
