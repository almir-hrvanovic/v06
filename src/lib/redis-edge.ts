/**
 * Edge Runtime compatible Redis client using Upstash REST API
 * This can be used in middleware and edge functions
 */

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

interface UpstashResponse<T = any> {
  result: T;
}

class EdgeRedisClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
      console.warn('[EdgeRedis] Upstash credentials not configured');
    }
    
    this.baseUrl = UPSTASH_REST_URL || '';
    this.headers = {
      Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T = any>(command: string[]): Promise<T | null> {
    if (!this.baseUrl) {
      return null;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        console.error('[EdgeRedis] Request failed:', response.status);
        return null;
      }

      const data: UpstashResponse<T> = await response.json();
      return data.result;
    } catch (error) {
      console.error('[EdgeRedis] Request error:', error);
      return null;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.request<string>(['GET', key]);
  }

  async set(key: string, value: string, exSeconds?: number): Promise<'OK' | null> {
    if (exSeconds) {
      return this.request<'OK'>(['SETEX', key, exSeconds.toString(), value]);
    }
    return this.request<'OK'>(['SET', key, value]);
  }

  async del(key: string): Promise<number | null> {
    return this.request<number>(['DEL', key]);
  }

  async expire(key: string, seconds: number): Promise<number | null> {
    return this.request<number>(['EXPIRE', key, seconds.toString()]);
  }

  async incr(key: string): Promise<number | null> {
    return this.request<number>(['INCR', key]);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.request<number>(['EXISTS', key]);
    return result === 1;
  }

  async ttl(key: string): Promise<number | null> {
    return this.request<number>(['TTL', key]);
  }
}

// Simple cache wrapper for Edge Runtime
export class EdgeCache {
  private client: EdgeRedisClient;

  constructor() {
    this.client = new EdgeRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('[EdgeCache] Get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, ttl);
    } catch (error) {
      console.error('[EdgeCache] Set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('[EdgeCache] Delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('[EdgeCache] Exists error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const edgeCache = new EdgeCache();

// Export client for direct usage
export const edgeRedis = new EdgeRedisClient();