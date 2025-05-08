// Helper to fallback when chrome.runtime is undefined (e.g. in Jest)
const getUrl = (path) =>
  typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL(path)
    : path;

async function injectTemplates() {
  const container = document.createElement('div');
  container.id = 'todo-container';
  const templateUrl = getUrl('templates/todo.html');
  const templateHtml = await fetch(templateUrl).then((res) => res.text());
  container.innerHTML = templateHtml;

  document.body.appendChild(container);

  // Load dashboard template
  const dashboardUrl = getUrl('templates/dashboard.html');
  const dashboardPanel = document.createElement('div');
  dashboardPanel.id = 'todo-dashboard';
  const dashboardHtml = await fetch(dashboardUrl).then((res) => res.text());
  dashboardPanel.innerHTML = dashboardHtml;
  document.body.appendChild(dashboardPanel);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { injectTemplates };
} else {
  injectTemplates();
}
