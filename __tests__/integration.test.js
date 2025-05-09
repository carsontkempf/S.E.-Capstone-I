/**
 * @jest-environment node
*/
jest.setTimeout(15000);
const path = require("path");
const puppeteer = require("puppeteer");
let browser, page;

describe("Extension E2E", () => {
  let extensionPath;

  beforeAll(async () => {
    extensionPath = path.resolve(__dirname, "../");

    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    page = await browser.newPage();

    // Wait up to 10 seconds for any navigation
    page.setDefaultNavigationTimeout(15000);

    await page.evaluateOnNewDocument(() => {
      window.global = window;
      window.chrome = {
        runtime: {
          getURL: (p) => p
        },
        storage: {
          local: {
            get: (keys) => Promise.resolve({ tasks: JSON.stringify([]) }),
            set: (items)    => Promise.resolve()
          }
        }
      };
    });

    // Navigate and wait until network is idle (no more than 2 connections), up to 10s
    await page.goto("https://en.wikipedia.org/wiki/Google", { waitUntil: 'networkidle2', timeout: 10000 });
  }, 15000);

  afterAll(async () => {
    await browser.close();
  });

  test("opens to-do panel and adds a task", async () => {
    // 1) Inject your extension’s content scripts
    // ensure mount point exists
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'todo-container';
      document.body.appendChild(container);
    });
    await page.addScriptTag({ path: path.resolve(extensionPath, "scripts/load-templates.js") });
    await page.addScriptTag({ path: path.resolve(extensionPath, "scripts/todo.js") });

    // 2) Kick off your init flow
    await page.evaluate(`
      (async function() {
        await window.injectTemplates();
        await window.initTodo();
      })();
    `);

    // 3) Wait for and click the toggle button
    await page.waitForSelector('#todo-toggle', { visible: true });
    await page.$eval('#todo-toggle', el=>el.click());

    // 4) Open the add-task input
    await page.waitForSelector('#addTaskButton', { visible: true });
    await page.click('#addTaskButton');

    // 5) Enter the task title
    await page.waitForSelector('#taskInput', { visible: true });
    await page.type('#taskInput', 'Test Task');

    // 6) Confirm add
    await page.click('#addTaskButton');

    // 7) Assert it showed up
    const liText = await page.$eval('#taskList li span', el => el.textContent);
    expect(liText).toBe('Test Task');
  });
});