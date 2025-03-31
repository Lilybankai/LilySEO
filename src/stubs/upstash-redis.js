// Stub file for @upstash/redis
export const Redis = class {
  constructor() {
    return {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(null),
      del: () => Promise.resolve(null),
      hget: () => Promise.resolve(null),
      hset: () => Promise.resolve(null),
      hdel: () => Promise.resolve(null),
      exists: () => Promise.resolve(0),
      zrange: () => Promise.resolve([]),
      zadd: () => Promise.resolve(0),
    };
  }
};

export default { Redis }; 