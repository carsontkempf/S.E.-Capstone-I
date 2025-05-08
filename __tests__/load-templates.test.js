async function injectTemplates() {
  const todoContainerHTML = await fetch("/templates/todo-container.html").then((res) =>
    res.text()
  );
  const todoDashboardHTML = await fetch("/templates/todo-dashboard.html").then((res) =>
    res.text()
  );

  document.body.insertAdjacentHTML("beforeend", todoContainerHTML);
  document.body.insertAdjacentHTML("beforeend", todoDashboardHTML);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { injectTemplates };
} else {
  injectTemplates();
}
