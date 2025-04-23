(function () {
    const container = document.createElement('div');
    container.id = 'todo-container';

    container.innerHTML = `
    <div id="todo" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0px 2px 10px rgba(0,0,0,0.2);
        border-radius: 8px;
        width: 300px;
    ">
        <div id="todo-header" style="
            position: relative;
            padding: 10px;
            cursor: move;
            background: #f1f1f1;
            border-bottom: 1px solid #ccc;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        ">
            <div id="todo-toggle" style="
                position: absolute;
                top: 5px;
                left: 5px;
                background-color: #333;
                color: white;
                border: none;
                padding: 5px 10px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                z-index: 10000;
            ">–</div>
            <h1 style="margin: 0; text-align: center; font-size: 18px;">To-Do List</h1>
        </div>
        <div id="todo-body" style="padding: 10px;">
            <input type="text" id="taskInput" placeholder="Enter new task" style="width: 100%;" />
            <button id="addTaskButton" style="margin-top: 10px;">Add Task</button>
            <ul id="taskList" style="padding-left: 20px; margin-top: 10px;"></ul>
        </div>
    </div>
    `;
    document.body.appendChild(container);

    const taskInput = container.querySelector('#taskInput');
    const addTaskButton = container.querySelector('#addTaskButton');
    const taskList = container.querySelector('#taskList');
    const toggleButton = container.querySelector('#todo-toggle');
    const todoBox = container.querySelector('#todo');
    const todoBody = container.querySelector('#todo-body');
    const todoHeader = container.querySelector('#todo-header');
    let tasks = [];

    // Load tasks from localStorage if available
    const loadTasks = () => {
        const storedTasks = localStorage.getItem('tasks');
        tasks = storedTasks ? JSON.parse(storedTasks) : [];
    };

    // Save tasks to localStorage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Render tasks
    const renderTasks = () => {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');

            const span = document.createElement('span');
            span.textContent = task;
            li.appendChild(span);

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
                const newTask = prompt('Edit your task:', task);
                if (newTask !== null && newTask.trim() !== '') {
                    tasks[index] = newTask.trim();
                    saveTasks();
                    renderTasks();
                }
            });

            taskList.appendChild(li);
        });
    };

    const addTask = () => {
        const task = taskInput.value.trim();
        if (task) {
            tasks.push(task);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    };

    let isVisible = true;
    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;
        todoBody.style.display = isVisible ? 'block' : 'none';
        toggleButton.textContent = isVisible ? '–' : '☰';
    });

    // Drag functionality
    let isDragging = false, offsetX = 0, offsetY = 0;

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

    addTaskButton.addEventListener('click', addTask);
    loadTasks();
    renderTasks();
})();
