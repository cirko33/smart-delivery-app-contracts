interface Entry {
  data: any;
  timestamp: number;
}

class Cache {
  private cache = new Map<string, Entry>();
  private ttlMs = 60 * 60 * 1000; // 1 hour

  async get(key: string, fetcher: () => Promise<any>): Promise<any> {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    if (entry && (now - entry.timestamp) < this.ttlMs) {
      console.log('cache hit for', key);
      return entry.data;
    }
    
    console.log('cache miss for', key, entry ? 'expired' : 'not found');
    const data = await fetcher();
    
    this.cache.set(key, {
      data,
      timestamp: now
    });
    
    console.log('cached data for', key);
    return data;
  }

  clear(): void {
    console.log('clearing cache');
    this.cache.clear();
  }
}

export const cache = new Cache();