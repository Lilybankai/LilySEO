// Stub file for axios
const axios = {
  get: () => Promise.resolve({ data: {}, status: 200 }),
  post: () => Promise.resolve({ data: {}, status: 200 }),
  put: () => Promise.resolve({ data: {}, status: 200 }),
  delete: () => Promise.resolve({ data: {}, status: 200 }),
  patch: () => Promise.resolve({ data: {}, status: 200 }),
  create: (config) => axios,
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: () => 0,
      eject: () => {},
    },
    response: {
      use: () => 0,
      eject: () => {},
    },
  },
};

export default axios; 