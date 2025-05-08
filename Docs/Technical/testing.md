# Testing Overview


## Tools & Technologies

- **Test runner**: Jest  
- **DOM simulation**: jsdom  
- **E2E testing**: Puppeteer  
- **Transpilation**: Babel (via `babel-jest`)  
- **Coverage**: Istanbul (integrated in Jest)

## Running Tests

- **Unit tests** (fast, headless):
  ```bash
  npm run test:unit
  ```
- **Integration (E2E) tests** (launches Chrome):
  ```bash
  npm run test:integration
  ```

## Unit Tests

### load-templates.test.js

Verifies that HTML templates are correctly injected into the page container.

- **Environment**: jsdom  
- **Key assertions**:
  - `injectTemplates()` adds `#todo-container` and `#todo-dashboard` elements.  
- **Sample output**:
  ```text
  PASS  __tests__/load-templates.test.js
  ```

### dashboard.test.js

Covers timer dashboard logic, including formatting, UI controls, and events.

- **Environment**: jsdom  
- **Imports**:
  ```js
  const { formatTime, initDashboard, renderTimers, tickTimer } = require('../scripts/dashboard.js');
  ```
- **Test cases**:
  - `formatTime(seconds)` → `'Xm Ys'`  
  - **Start button**: adds `<li>` entry with correct name and time  
  - **tickTimer**:
    - counts down and fires `alert` when reaching zero  
    - does nothing when paused  
  - **Multiple timers** + delete button  
  - **Close button**: hides dashboard (`display: none`)  
  - **Lock toggle**: toggles `.moveable` class on dashboard panel  
  - **dashboard-open** event: sets `display: block`  
  - **Volume slider**: adjusts `Audio` volume  
  - **Audio object** instantiation uses correct sound URL  
- **Sample output**:
  ```text
  PASS  __tests__/dashboard.test.js
  ```

### todo.test.js

Validates to-do list module: storage integration, DOM rendering, and user interactions.

- **Environment**: jsdom  
- **Imports**:
  ```js
  const {
    loadTasks, saveTasks, renderTasks,
    createTaskElement, addTask, deleteTask,
    editTask, handleAddButton, toggleVisibility,
    setupDrag, setupResize
  } = require('../scripts/todo.js');
  ```
- **Test suites**:
  1. **chrome.storage integration**  
     - `loadTasks()` calls `chrome.storage.local.get('tasks')`  
     - `saveTasks()` calls `chrome.storage.local.set(...)`  
  2. **renderTasks()**  
     - no tasks → empty list  
     - valid URL → `<a>` element with correct `href`  
  3. **createTaskElement()**  
     - no URL → `<span>` fallback  
     - valid URL → `<a>` fallback  
  4. **addTask / deleteTask**  
     - `addTask()` mutates `tasks` array and updates DOM  
     - `deleteTask()` removes correct entry  
  5. **editTask()**  
     - switches `<li>` into edit inputs  
     - confirms edit updates `tasks`  
  6. **handleAddButton()**  
     - toggles input wrappers and confirmation states  
     - handles empty/URL-only/title-only cases  
  7. **toggleVisibility()**  
     - expands/collapses to-do panel, toggles toggle icon  
  8. **setupDrag / setupResize**  
     - simulates mouse events to change position and size  
- **Sample output**:
  ```text
  PASS  __tests__/todo.test.js
  ```

## Integration (E2E) Test

### integration.test.js

Verifies end-to-end user flow in a real Chrome instance.

- **Environment**: Node + Puppeteer  
- **Setup**:
  - Launch Chrome with the extension loaded via `--load-extension`  
  - Stub `window.chrome` APIs for storage and `getURL`  
  - Navigate to a real webpage (`networkidle2`)  
- **Test flow**:
  1. Inject `load-templates.js` and `todo.js` into the page  
  2. Call `window.injectTemplates()` & `window.initTodo()`  
  3. Click the toggle (`#todo-toggle`) to expand to-do panel  
  4. Click add button, type “Test Task”, click confirm  
  5. Assert `<li>` appears with text `Test Task`  
- **Sample output**:
  ```text
  PASS  __tests__/integration.test.js
  ```

## Coverage Summary

```text
-------------------|---------|----------|---------|---------|------------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s      
-------------------|---------|----------|---------|---------|------------------------
All files          |   70.32 |    55.61 |    52.70|   71.96 |
 dashboard.js      |   70.89 |     50.50|   62.96 |   72.31 |  ...                   
 load-templates.js |   94.73 |     77.77|  100.00 |   94.11 | 28                     
 todo.js           |   68.53 |     60.00|   41.86 |   70.55 |  ...

```

### 71.96% Coverage!

---
