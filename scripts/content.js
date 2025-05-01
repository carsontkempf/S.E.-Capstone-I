(async () => {
  const DEFAULT_VISIBILITY = false;
  const container = document.createElement('div');
  container.id = 'todo-container';
  const templateUrl = chrome.runtime.getURL('scripts/todo.html');
  const templateHtml = await fetch(templateUrl).then((res) => res.text());
  container.innerHTML = templateHtml;
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
  let resizeHeight = todoBox.style.height;
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
    if (isVisible) todoBox.style.height = resizeHeight;
    else (resizeHeight = todoBox.style.height), (todoBox.style.height = 'auto');
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
})();
