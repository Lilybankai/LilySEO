// Stub for react-server-dom-webpack/client.edge
// This stub provides mock implementations of the client-side React Server Components

// Mock for createFromFetch
export function createFromFetch() {
  return Promise.resolve({});
}

// Mock for encodeReply
export function encodeReply() {
  return Promise.resolve("");
}

// Client-specific methods
export function createClientModuleProxy() {
  return {};
}

export function createClientReferenceProxy() {
  return {};
}

// Mock any other exports that might be needed
export function startTransition(scope) {
  if (typeof scope === 'function') {
    scope();
  }
  return Promise.resolve();
}

// Default export as a fallback
export default {
  createFromFetch,
  encodeReply,
  createClientModuleProxy,
  createClientReferenceProxy,
  startTransition
}; 