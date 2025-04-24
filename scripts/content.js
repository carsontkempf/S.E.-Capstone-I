(async () => {
    const DEFAULT_VISIBILITY = false;
    const container = document.createElement('div');
    container.id = 'todo-container';

  container.innerHTML = `
    <div id="todo">
        <div id="todo-header">
        <div id="todo-toggle">☰</div>
            <h1 style="margin: 0; text-align: center; font-size: 18px;">To-Do List</h1>
        </div>
        <div id="todo-body" style="padding: 10px; padding-bottom: 40px;">
            <input type="text" id="taskInput" placeholder="Enter task name" style="width: 100%; display: none;" />
            <input type="text" id="urlInput" placeholder="Enter task URL" style="width: 100%; margin-top: 5px; display: none;" />
            <ul id="taskList" style="padding-left: 20px; margin-top: 10px;"></ul>
        </div>
        <button id="addTaskButton" title="Add Task" style="
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            background-color: #333;
            color: white;
            font-size: 22px;
            line-height: 0;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        ">+</button>
    </div>
    `;
  document.body.appendChild(container);

  const taskInput = container.querySelector('#taskInput');
  const urlInput = container.querySelector('#urlInput');
  const addTaskButton = container.querySelector('#addTaskButton');
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

      let textElement;
      if (task.url) {
        textElement = document.createElement('a');
        textElement.href = task.url;
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

      if (!title && !url) { // If both empty exit
        taskInput.style.display = 'none';
        urlInput.style.display = 'none';
        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (title) { // if title is set create task
        tasks.push({ title, url });
        saveTasks();
        renderTasks();

        taskInput.value = '';
        urlInput.value = '';
        taskInput.style.display = 'none';
        urlInput.style.display = 'none';
        addTaskButton.textContent = '+';
        pendingOpen = false;
      } else if (url) { // if url has data but no title return
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
        toggleButton.textContent = '–';
    }
    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;
        todoBody.style.display = isVisible ? 'block' : 'none';
        toggleButton.textContent = isVisible ? '☰' : '–';
    });

  // Drag functionality
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

  addTaskButton.addEventListener('click', handleAddButton);
  await loadTasks();
  renderTasks();
})();
