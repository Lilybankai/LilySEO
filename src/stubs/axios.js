// Stub implementation for axios

function createResponse(data = {}, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
    request: {}
  };
}

// Main axios function
const axios = function(config) {
  console.log(`[STUB] Axios request to: ${config.url || 'unknown'}`);
  return Promise.resolve(createResponse());
};

// Axios methods
axios.get = (url, config = {}) => {
  console.log(`[STUB] Axios GET: ${url}`);
  return Promise.resolve(createResponse());
};

axios.post = (url, data, config = {}) => {
  console.log(`[STUB] Axios POST: ${url}`);
  return Promise.resolve(createResponse());
};

axios.put = (url, data, config = {}) => {
  console.log(`[STUB] Axios PUT: ${url}`);
  return Promise.resolve(createResponse());
};

axios.delete = (url, config = {}) => {
  console.log(`[STUB] Axios DELETE: ${url}`);
  return Promise.resolve(createResponse());
};

axios.patch = (url, data, config = {}) => {
  console.log(`[STUB] Axios PATCH: ${url}`);
  return Promise.resolve(createResponse());
};

axios.head = (url, config = {}) => {
  console.log(`[STUB] Axios HEAD: ${url}`);
  return Promise.resolve(createResponse());
};

axios.options = (url, config = {}) => {
  console.log(`[STUB] Axios OPTIONS: ${url}`);
  return Promise.resolve(createResponse());
};

// Axios instance creation
axios.create = (config = {}) => {
  console.log(`[STUB] Axios instance created with baseURL: ${config.baseURL || 'none'}`);
  return axios;
};

// Interceptors
axios.interceptors = {
  request: {
    use: () => 0,
    eject: () => {}
  },
  response: {
    use: () => 0,
    eject: () => {}
  }
};

// Other axios properties and methods
axios.defaults = {
  headers: {
    common: {},
    get: {},
    post: {},
    put: {},
    delete: {},
    patch: {}
  },
  timeout: 0,
  withCredentials: false
};

axios.CancelToken = {
  source: () => ({
    token: {},
    cancel: () => {}
  })
};

axios.isCancel = () => false;

axios.all = (promises) => Promise.all(promises);

axios.spread = (callback) => (arr) => callback.apply(null, arr);

export default axios; 