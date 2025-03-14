// content.js
(function() {
    // Create container element for the integrated to-do list
    const container = document.createElement('div');
    container.id = 'todo-container';

    // Insert the to-do list HTML structure
    container.innerHTML = `
    <div id="todo">
      <h1>To-Do List</h1>
      <input type="text" id="taskInput" placeholder="Enter new task" />
      <button id="addTaskButton">Add Task</button>
      <ul id="taskList"></ul>
    </div>
  `;

    // Append the container to the body of the webpage
    document.body.appendChild(container);

    // Get references to the UI elements
    const taskInput = container.querySelector('#taskInput');
    const addTaskButton = container.querySelector('#addTaskButton');
    const taskList = container.querySelector('#taskList');

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

    // Render tasks to the list
    const renderTasks = () => {
        taskList.innerHTML = ''; // Clear the current list
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.textContent = task;
            // Click on a task to remove it
            li.addEventListener('click', () => {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            });
            taskList.appendChild(li);
        });
    };

    // Add a new task from the input field
    const addTask = () => {
        const task = taskInput.value.trim();
        if (task) {
            tasks.push(task);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    };

    addTaskButton.addEventListener('click', addTask);

    // Initialize the to-do list
    loadTasks();
    renderTasks();
})();