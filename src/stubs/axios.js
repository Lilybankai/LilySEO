// Stub for axios
const axios = {
  get: async () => Promise.resolve({ data: {} }),
  post: async () => Promise.resolve({ data: {} }),
  put: async () => Promise.resolve({ data: {} }),
  delete: async () => Promise.resolve({ data: {} }),
  patch: async () => Promise.resolve({ data: {} }),
  create: (config) => axios,
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      delete: {},
      patch: {}
    },
    baseURL: '',
    timeout: 0
  },
  interceptors: {
    request: {
      use: () => 0,
      eject: () => {}
    },
    response: {
      use: () => 0,
      eject: () => {}
    }
  }
};

export default axios; 