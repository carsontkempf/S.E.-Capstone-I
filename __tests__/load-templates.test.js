const { injectTemplates } = require('../scripts/load-templates.js');

describe('injectTemplates', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.fetch = jest.fn((url) =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            url.endsWith('todo.html')
              ? '<div id="todo-container"></div>'
              : '<div id="todo-dashboard"></div>'
          ),
      })
    );
  });

  test('inserts #todo-container and #todo-dashboard into document body', async () => {
    await injectTemplates();
    expect(document.getElementById('todo-container')).not.toBeNull();
    expect(document.getElementById('todo-dashboard')).not.toBeNull();
  });
});
