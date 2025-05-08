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

const { loadTasks, saveTasks, renderTasks } = require('../scripts/todo.js');

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
