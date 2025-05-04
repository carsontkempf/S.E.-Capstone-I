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
  document.body.appendChild(container);

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

  // Render tasks to the list with dynamic edit and delete buttons
  const renderTasks = () => {
      taskList.innerHTML = '';
      tasks.forEach((task, index) => {
          const li = document.createElement('li');

          // Task text
          const span = document.createElement('span');
          span.textContent = task;
          li.appendChild(span);

          // Edit button
          const editButton = document.createElement('button');
          editButton.classList.add('edit');
          const editImg = document.createElement('img');
          // Use chrome.runtime.getURL() to correctly load the icon from the extension directory
          editImg.src = chrome.runtime.getURL('images/icons8-edit-24.png');
          editImg.alt = 'Edit';
          editButton.appendChild(editImg);
          li.appendChild(editButton);

          // Delete button
          const deleteButton = document.createElement('button');
          deleteButton.classList.add('delete');
          const deleteImg = document.createElement('img');
          // Use chrome.runtime.getURL() to correctly load the icon from the extension directory
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
  loadTasks();
  renderTasks();
})();