// Stub implementation for @upstash/redis package

class Redis {
  constructor() {
    console.log('Redis client initialized for caching');
  }

  // Basic Redis operations
  async get(key) {
    console.log(`[STUB] Redis GET: ${key}`);
    return null;
  }

  async set(key, value, options) {
    console.log(`[STUB] Redis SET: ${key}`);
    return { result: 'OK' };
  }

  async del(key) {
    console.log(`[STUB] Redis DEL: ${key}`);
    return 1;
  }

  async incr(key) {
    console.log(`[STUB] Redis INCR: ${key}`);
    return 1;
  }

  async decr(key) {
    console.log(`[STUB] Redis DECR: ${key}`);
    return 0;
  }

  async expire(key, seconds) {
    console.log(`[STUB] Redis EXPIRE: ${key} ${seconds}s`);
    return 1;
  }

  async ttl(key) {
    console.log(`[STUB] Redis TTL: ${key}`);
    return 0;
  }

  // Hash operations
  async hget(key, field) {
    console.log(`[STUB] Redis HGET: ${key} ${field}`);
    return null;
  }

  async hset(key, field, value) {
    console.log(`[STUB] Redis HSET: ${key} ${field}`);
    return 1;
  }

  async hdel(key, field) {
    console.log(`[STUB] Redis HDEL: ${key} ${field}`);
    return 1;
  }

  async hgetall(key) {
    console.log(`[STUB] Redis HGETALL: ${key}`);
    return {};
  }

  // List operations
  async lpush(key, value) {
    console.log(`[STUB] Redis LPUSH: ${key}`);
    return 1;
  }

  async rpush(key, value) {
    console.log(`[STUB] Redis RPUSH: ${key}`);
    return 1;
  }

  async lpop(key) {
    console.log(`[STUB] Redis LPOP: ${key}`);
    return null;
  }

  async rpop(key) {
    console.log(`[STUB] Redis RPOP: ${key}`);
    return null;
  }

  async lrange(key, start, end) {
    console.log(`[STUB] Redis LRANGE: ${key} ${start} ${end}`);
    return [];
  }

  // Set operations
  async sadd(key, member) {
    console.log(`[STUB] Redis SADD: ${key}`);
    return 1;
  }

  async srem(key, member) {
    console.log(`[STUB] Redis SREM: ${key}`);
    return 1;
  }

  async smembers(key) {
    console.log(`[STUB] Redis SMEMBERS: ${key}`);
    return [];
  }

  async sismember(key, member) {
    console.log(`[STUB] Redis SISMEMBER: ${key}`);
    return 0;
  }

  // Pipeline
  pipeline() {
    return {
      get: () => this,
      set: () => this,
      del: () => this,
      exec: async () => []
    };
  }
}

export { Redis };
export default { Redis }; 