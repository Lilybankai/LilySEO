// Stub for react-server-dom-webpack/server.edge
// This stub provides mock implementations of the server-side React Server Components

// Mock for the server module
export function createFromReadableStream() {
  return Promise.resolve({});
}

export function decodeReply() {
  return Promise.resolve({});
}

export function decodeAction() {
  return Promise.resolve(() => {});
}

export function decodeFormState() {
  return [];
}

// Mock any other exports that might be needed
export const registerServerReference = () => {};
export const createServerReference = () => () => {};

// Default export as a fallback
export default {
  createFromReadableStream,
  decodeReply,
  decodeAction,
  decodeFormState,
  registerServerReference,
  createServerReference
}; 