/**
 * @jest-environment node
 */
const path = require("path");
const puppeteer = require('puppeteer');
let browser, page;

describe("Extension E2E", () => {
  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, "../");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
    page = await browser.newPage();
    await page.goto("chrome://extensions");
  });

  test("opens to-do panel and adds a task", async () => {
    // navigate to a dummy page where extension runs
    await page.goto("http://google.com");
    // inject extension UI on the page if not automatically loaded
    await page.evaluate(() => {
      if (typeof window.injectTemplates === 'function') {
        window.injectTemplates();
      }
    });
    // wait for the to-do toggle button to appear
    await page.waitForSelector('#todo-toggle', { timeout: 10000 });
    // click toggle to show to-do
    await page.click("#todo-toggle");
    await page.click("#addTaskButton");
    await page.type("#taskInput", "Test Task");
    await page.keyboard.press("Enter");
    const liText = await page.$eval("#taskList li span", el => el.textContent);
    expect(liText).toBe("Test Task");
  });

  afterAll(async () => {
    await browser.close();
  });
});