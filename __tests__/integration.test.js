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