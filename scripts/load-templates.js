(async () => {
  const container = document.createElement('div');
  container.id = 'todo-container';
  const templateUrl = chrome.runtime.getURL('templates/todo.html');
  const templateHtml = await fetch(templateUrl).then((res) => res.text());
  container.innerHTML = templateHtml;

  document.body.appendChild(container);

  // Load dashboard template
  const dashboardUrl = chrome.runtime.getURL('templates/dashboard.html');
  const dashboardPanel = document.createElement('div');
  dashboardPanel.id = 'todo-dashboard';
  const dashboardHtml = await fetch(dashboardUrl).then((res) => res.text());
  dashboardPanel.innerHTML = dashboardHtml;
  document.body.appendChild(dashboardPanel);
})();
