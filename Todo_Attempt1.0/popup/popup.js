// popup.js
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');

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
    taskList.innerHTML = ''; // Clear the list
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

// Add a new task from the input
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

// Initialize extension
loadTasks();
renderTasks();