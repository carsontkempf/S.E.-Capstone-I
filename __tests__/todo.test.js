// jest setup for Chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({ tasks: JSON.stringify([]) }),
      set: jest.fn().mockResolvedValue(),
    },
  },
  runtime: {
    getURL: jest.fn((path) => path),
  },
};

const {
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
} = require('../scripts/todo.js');

beforeEach(() => {
  document.body.innerHTML = '<ul id="taskList"></ul>';
  jest.clearAllMocks();
});

describe('chrome.storage integration', () => {
  test('loadTasks reads from storage', async () => {
    await loadTasks();
    expect(chrome.storage.local.get).toHaveBeenCalledWith('tasks');
  });

  test('saveTasks writes to storage', async () => {
    const sample = [{ title: 'Sample', url: '' }];
    // load sample into module state via loadTasks
    chrome.storage.local.get.mockResolvedValue({ tasks: JSON.stringify(sample) });
    await loadTasks();
    await saveTasks();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ tasks: JSON.stringify(sample) });
  });
});

describe('renderTasks()', () => {
  test('renders no tasks when storage is empty', async () => {
    chrome.storage.local.get.mockResolvedValue({ tasks: null });
    await loadTasks();
    renderTasks();
    expect(document.getElementById('taskList').children.length).toBe(0);
  });

  test('renders one task with valid URL', async () => {
    chrome.storage.local.get.mockResolvedValue({
      tasks: JSON.stringify([{ title: 'Task1', url: 'https://x' }]),
    });
    await loadTasks();
    renderTasks();
    const link = document.querySelector('#taskList li a');
    expect(link).toBeTruthy();
    expect(link.textContent).toBe('Task1');
    expect(link.href).toBe('https://x/');
  });
});

describe('createTaskElement()', () => {
  beforeEach(() => {
    tasks = []; // reset module state if needed
    document.body.innerHTML = '<ul id="taskList"></ul>';
  });
  test('creates <li> with <span> for no URL', () => {
    const li = createTaskElement({ title: 'T', url: '' }, 0);
    expect(li.tagName).toBe('LI');
    expect(li.querySelector('span').textContent).toBe('T');
  });
  test('creates <li> with <a> for valid URL', () => {
    const li = createTaskElement({ title: 'L', url: 'https://x' }, 0);
    const a = li.querySelector('a');
    expect(a).toBeTruthy();
    expect(a.href).toBe('https://x/');
    expect(a.textContent).toBe('L');
  });
});

describe('addTask and deleteTask', () => {
  beforeEach(() => {
    tasks = [];
    document.body.innerHTML = '<ul id="taskList"></ul>';
  });
  test('addTask pushes to tasks and updates DOM', () => {
    addTask('A', '');
    expect(tasks).toEqual([{ title: 'A', url: '' }]);
    expect(document.querySelectorAll('#taskList li').length).toBe(1);
  });
  test('deleteTask removes from tasks and updates DOM', () => {
    tasks = [{ title: 'B', url: '' }, { title: 'C', url: '' }];
    renderTasks();
    deleteTask(0);
    expect(tasks).toEqual([{ title: 'C', url: '' }]);
    expect(document.querySelectorAll('#taskList li').length).toBe(1);
  });
});

describe('editTask()', () => {
  beforeEach(() => {
    tasks = [{ title: 'Old', url: '' }];
    document.body.innerHTML = '<ul id="taskList"></ul>';
    renderTasks();
  });
  test('editTask replaces li content with inputs', () => {
    const li = document.querySelector('#taskList li');
    editTask(0, li);
    expect(li.querySelector('input[type="text"]').value).toBe('Old');
  });
  test('confirm edit updates title', () => {
    const li = document.querySelector('#taskList li');
    editTask(0, li);
    const input = li.querySelector('input[type="text"]');
    input.value = 'New';
    li.querySelector('button.save').click();
    expect(tasks[0].title).toBe('New');
  });
});

describe('handleAddButton()', () => {
  let taskInput, urlInput, btn;
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="input-wrapper hidden"><input id="taskInput"></div>
      <div class="input-wrapper hidden"><input id="urlInput"></div>
      <button id="addTaskButton">+</button>
      <ul id="taskList"></ul>
    `;
    taskInput = document.getElementById('taskInput');
    urlInput = document.getElementById('urlInput');
    btn = document.getElementById('addTaskButton');
    handleAddButton.pendingOpen = false;
    tasks = [];
  });
  test('first click shows inputs', () => {
    handleAddButton(taskInput, urlInput, btn);
    expect(btn.classList).toContain('confirming');
    expect(taskInput.closest('.input-wrapper').classList).not.toContain('hidden');
  });
  test('second click with title adds task', () => {
    handleAddButton(taskInput, urlInput, btn);
    taskInput.value = 'Z';
    handleAddButton(taskInput, urlInput, btn);
    expect(tasks).toEqual([{ title: 'Z', url: '' }]);
    expect(document.querySelectorAll('#taskList li').length).toBe(1);
  });
});

describe('toggleVisibility()', () => {
  let box, body, btn, resize, toggle;
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="todo" class="collapsed"><div id="todo-body"></div></div>
      <button id="addTaskButton"></button>
      <div id="resize-handle"></div>
      <button id="todo-toggle"></button>
    `;
    box = document.getElementById('todo');
    body = document.getElementById('todo-body');
    btn = document.getElementById('addTaskButton');
    resize = document.getElementById('resize-handle');
    toggle = document.getElementById('todo-toggle');
    toggleVisibility.isVisible = false;
  });
  test('toggles open and closed', () => {
    toggleVisibility(box, body, btn, resize, toggle);
    expect(toggle.textContent).toBe('☰');
    toggleVisibility(box, body, btn, resize, toggle);
    expect(toggle.textContent).toBe('–');
  });
});

describe('setupDrag and setupResize', () => {
  let box, header, resize;
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="todo" style="position:absolute;"><div id="todo-header"></div></div>
      <div id="resize-handle"></div>
    `;
    box = document.getElementById('todo');
    header = document.getElementById('todo-header');
    resize = document.getElementById('resize-handle');
    setupDrag(box, header);
    setupResize(box, resize);
  });
  test('drag changes position', () => {
    const mousedown = new MouseEvent('mousedown', { clientX: 50, clientY: 60 });
    header.dispatchEvent(mousedown);
    const move = new MouseEvent('mousemove', { clientX: 70, clientY: 80 });
    document.dispatchEvent(move);
    expect(box.style.left).toBe('20px');
    expect(box.style.top).toBe('20px');
  });
  test('resize changes size', () => {
    const down = new MouseEvent('mousedown', { clientX: 0, clientY: 0 });
    resize.dispatchEvent(down);
    const move = new MouseEvent('mousemove', { clientX: 100, clientY: 150 });
    document.dispatchEvent(move);
    expect(parseInt(box.style.width)).toBeGreaterThan(0);
    expect(parseInt(box.style.height)).toBeGreaterThan(0);
  });
});
