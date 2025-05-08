// manual chrome.storage mock instead of jest-chrome
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};
const { loadTasks, saveTasks, renderTasks }  = require("../scripts/todo.js");

// mock DOM
document.body.innerHTML = `
  <div id="todo-container">
    <ul id="taskList"></ul>
  </div>
`;

describe("chrome.storage integration", () => {
  beforeEach(() => jest.resetAllMocks());

  test("loadTasks reads from storage", async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ tasks: JSON.stringify([{title:"A",url:""}]) }));
    await loadTasks();
    expect(chrome.storage.local.get).toHaveBeenCalledWith("tasks", expect.any(Function));
  });

  test("saveTasks writes to storage", async () => {
    const tasks = [{title:"B",url:"u"}];
    await saveTasks(tasks);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ tasks: JSON.stringify(tasks) });
  });
});

describe("renderTasks()", () => {
  beforeEach(() => {
    // reset DOM
    document.getElementById("taskList").innerHTML = "";
  });

  test("renders no tasks when storage is empty", async () => {
    // simulate no tasks
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ tasks: null }));
    await loadTasks();
    renderTasks();
    expect(document.getElementById("taskList").children.length).toBe(0);
  });

  test("renders one task with valid URL", async () => {
    chrome.storage.local.get.mockImplementation((key, cb) =>
      cb({ tasks: JSON.stringify([{ title: "Task1", url: "https://x" }]) })
    );
    await loadTasks();
    renderTasks();
    const item = document.querySelector("#taskList li a");
    expect(item).toBeTruthy();
    expect(item.textContent).toBe("Task1");
    expect(item.href).toBe("https://x/");
  });
});