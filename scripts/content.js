(async () => {
    // Create container element for the integrated to-do list
    const container = document.createElement('div');
    container.id = 'todo-container';

    // Insert the to-do list HTML structure
    container.innerHTML = `
    <div id="todo-toggle">–</div>
    <div id="todo">
      <h1 style="margin-top: 0;">To-Do List</h1>
      <input type="text" id="taskInput" placeholder="Enter new task" style="width: 100%;" />
      <input type="text" id="urlInput" placeholder="Enter task URL" style="width: 100%; margin-top: 5px; display: none;" />
      <button id="addTaskButton" style="margin-top: 10px;">Add Task</button>
      <ul id="taskList" style="padding-left: 20px;"></ul>
    </div>
  `;
    document.body.appendChild(container);

    const taskInput = container.querySelector('#taskInput');
    const urlInput = container.querySelector('#urlInput');
    const addTaskButton = container.querySelector('#addTaskButton');
    const taskList = container.querySelector('#taskList');
    const toggleButton = container.querySelector('#todo-toggle');
    const todoBox = container.querySelector('#todo');
    let tasks = [];
    let pendingTitle = '';

    // Load tasks from browser storage if available
    const loadTasks = async () => {
        await chrome.storage.local.get('tasks').then(result => {tasks = result.tasks ? JSON.parse(result.tasks) : []});
    };

    // Save tasks to browser storage
    const saveTasks = async () => {
        chrome.storage.local.set({'tasks': JSON.stringify(tasks)});
    };

    // Render tasks to the list with dynamic edit and delete buttons
    const renderTasks = () => {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            // align buttons next to each other
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '0px';
            li.style.justifyContent = 'flex-start';

            // Task text
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
            li.appendChild(textElement);

            // push buttons to the right
            textElement.style.flex = '1';

            // Edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit');
            const editImg = document.createElement('img');
            editImg.src = chrome.runtime.getURL('images/icons8-edit-24.png');
            editImg.alt = 'Edit';
            editButton.appendChild(editImg);
            li.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete');
            const deleteImg = document.createElement('img');
            deleteImg.src = chrome.runtime.getURL('images/icons8-delete-24.png');
            deleteImg.alt = 'Delete';
            deleteButton.appendChild(deleteImg);
            li.appendChild(deleteButton);

            // Delete event
            deleteButton.addEventListener('click', () => {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            });

            // Edit event
            editButton.addEventListener('click', () => {
                if (typeof task === 'object' && task !== null) {
                    const newTitle = prompt('Edit your task title:', task.title);
                    const newUrl = prompt('Edit your task URL:', task.url);
                    if (newTitle !== null && newTitle.trim() !== '' && newUrl !== null && newUrl.trim() !== '') {
                        tasks[index] = { title: newTitle.trim(), url: newUrl.trim() };
                        saveTasks();
                        renderTasks();
                    }
                } else {
                    const newTask = prompt('Edit your task:', task);
                    if (newTask !== null && newTask.trim() !== '') {
                        tasks[index] = newTask.trim();
                        saveTasks();
                        renderTasks();
                    }
                }
            });

            taskList.appendChild(li);
        });
    };

    // Add a new task from the input field
    const addTask = () => {
        const title = taskInput.value.trim();
        if (!pendingTitle) {
            if (!title) return;
            pendingTitle = title;
            // removed clearing title here
            urlInput.style.display = 'block';
            urlInput.focus();
            addTaskButton.textContent = 'Save Task';
        } else {
            const url = urlInput.value.trim();
            tasks.push({ title: pendingTitle, url });
            pendingTitle = '';
            saveTasks();
            renderTasks();
            urlInput.value = '';
            urlInput.style.display = 'none';
            addTaskButton.textContent = 'Add Task';
            taskInput.value = '';
        }
    };

    // Toggle minimize/maximize
    let isVisible = true;
    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;
        todoBox.style.display = isVisible ? 'block' : 'none';
        toggleButton.textContent = isVisible ? '–' : '☰';
    });

    addTaskButton.addEventListener('click', addTask);
    await loadTasks();
    renderTasks();
})();
