// jest.setup.js
global.chrome = {
    storage: {
      local: {
        // Return a promise resolving { tasks: '[]' }
        get: jest.fn((key) =>
          Promise.resolve({ tasks: JSON.stringify([]) })
        ),
        // Return a promise that resolves immediately
        set: jest.fn((items) => Promise.resolve())
      }
    },
    runtime: {
      getURL: jest.fn((path) => path)
    }
  };